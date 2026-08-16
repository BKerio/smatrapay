import { useState, useEffect, useRef, FormEvent } from "react";
import api from "@/lib/api";
import {
  Gauge,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  CreditCard,
  Zap,
  Building2,
  Hash,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  CountryCode,
  isValidLocalPhone,
  parseInternational,
  toMpesaFormat,
} from "@/lib/phone";

type PaymentStatus = "idle" | "sending" | "waiting" | "confirmed" | "failed" | "timeout";
type PaymentMethod = "stk" | "paybill";

interface PaymentResult {
  status: PaymentStatus;
  amount?: number;
  mpesaReceipt?: string;
  failureReason?: string;
  tokens?: string[];
  meterNumber?: string;
}

const NCBA_BUSINESS_NUMBER = "880100";

const LipaTokenNaMpesa = () => {
  const { user } = useAuth();
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("KE");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [meterNumber, setMeterNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [minAmount, setMinAmount] = useState<number>(1);
  const [validationErrors, setValidationErrors] = useState<{
    phone?: string;
    amount?: string;
    meterNumber?: string;
    [key: string]: any;
  }>({});
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stk");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [paymentResult, setPaymentResult] = useState<PaymentResult>({ status: "idle" });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingStoppedRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      api
        .get("/admin/me")
        .then((res) => {
          const meter = res.data.user?.meter;
          if (meter && meter.meter_number) {
            setMeterNumber(meter.meter_number);
          }
          const vendor = res.data.user?.vendor;
          if (vendor?.account_id) {
            setTillNumber(String(vendor.account_id));
          }
          if (meter && meter.price_per_unit && Number(meter.price_per_unit) > 0) {
            setMinAmount(Number(meter.price_per_unit));
          }
          if (res.data.user?.phone) {
            const parsedPhone = parseInternational(res.data.user.phone);
            setPhoneCountry(parsedPhone.country);
            setPhone(parsedPhone.local);
          }
        })
        .catch((err) => console.error("Failed to fetch customer details", err));
    }
  }, [user]);

  const validateInputs = () => {
    const errors: { phone?: string; amount?: string; meterNumber?: string } = {};
    if (!isValidLocalPhone(phone, phoneCountry)) {
      errors.phone = "Enter a valid phone number (e.g. 717000480 or 0717000480)";
    }
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.amount = "Enter valid amount";
    } else if (numericAmount < minAmount) {
      errors.amount = `Minimum purchase amount is KES ${minAmount}`;
    }
    if (!meterNumber || meterNumber.trim().length < 5) {
      errors.meterNumber = "Enter a valid meter number";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const copyField = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const startPolling = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 10;

    pollingStoppedRef.current = false;
    setPaymentResult({ status: "waiting", meterNumber });
    setPollingError(null);

    const poll = async () => {
      if (pollingStoppedRef.current || attempts >= maxAttempts) {
        if (attempts >= maxAttempts && !pollingStoppedRef.current) {
          setPaymentResult({ status: "timeout", meterNumber });
          setLoading(false);
        }
        return;
      }
      attempts++;
      try {
        const response = await api.get(`/mpesa/query/${checkoutRequestId}?wait=1`);
        const { status, amount: paidAmount, mpesa_receipt, failure_reason, result_desc, tokens } =
          response.data;
        if (pollingStoppedRef.current) return;
        if (status === "confirmed" && tokens && tokens.length > 0) {
          pollingStoppedRef.current = true;
          setPaymentResult({
            status: "confirmed",
            amount: paidAmount,
            mpesaReceipt: mpesa_receipt,
            tokens,
            meterNumber,
          });
          setLoading(false);
        } else if (status === "failed") {
          pollingStoppedRef.current = true;
          setPaymentResult({
            status: "failed",
            failureReason: failure_reason || result_desc || "Transaction failed",
            meterNumber,
          });
          setLoading(false);
        } else {
          poll();
        }
      } catch (error: any) {
        console.error("Polling error", error);
        const msg = error.response?.data?.message || error.message || "Connection issue";
        setPollingError(`Retrying... (${msg})`);
        if (!pollingStoppedRef.current) {
          setTimeout(poll, 2000);
        }
      }
    };

    setTimeout(() => {
      poll();
    }, 2000);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidationErrors({});
    if (!validateInputs()) return;
    setLoading(true);
    setPaymentResult({ status: "sending" });
    try {
      const formattedPhone = toMpesaFormat(phone, phoneCountry);
      const numericAmount = Number(amount);
      const response = await api.post("/mpesa/stkpush", {
        phone: formattedPhone,
        amount: numericAmount,
        reference: meterNumber,
      });
      const { CheckoutRequestID } = response.data || {};
      if (CheckoutRequestID) {
        startPolling(CheckoutRequestID);
      } else {
        throw new Error("Missing CheckoutRequestID");
      }
    } catch (error: any) {
      console.error(error);
      const backendData = error.response?.data;
      const errorMessage =
        backendData?.message ||
        backendData?.response?.errorMessage ||
        backendData?.response?.customerMessage ||
        "Unable to initiate payment. Please try again later.";
      if (error.response?.status === 422 && backendData.errors) {
        setValidationErrors(backendData.errors);
      }
      setPaymentResult({ status: "failed", failureReason: errorMessage });
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentResult({ status: "idle" });
    setAmount("");
    setCopiedToken(null);
  };

  const paybillAccountRef =
    tillNumber && meterNumber ? `${tillNumber}#${meterNumber}` : meterNumber;

  const paybillSteps = [
    { icon: "1", label: "Open M-Pesa", desc: "Go to M-Pesa on your phone" },
    { icon: "2", label: "Lipa na M-Pesa", desc: "Select 'Lipa na M-Pesa'" },
    { icon: "3", label: "Select Paybill", desc: "Choose 'Paybill' option" },
    {
      icon: "4",
      label: "Business Number",
      desc: (
        <span>
          Enter <span className="font-bold text-[#0A1F44] dark:text-blue-300">{NCBA_BUSINESS_NUMBER}</span>
        </span>
      ),
    },
    {
      icon: "5",
      label: "Account Number",
      desc: (
        <span>
          Enter{" "}
          <span className="font-bold text-[#0A1F44] dark:text-blue-300">
            {paybillAccountRef || "TillNumber#MeterNumber"}
          </span>
          {tillNumber && meterNumber && (
            <span className="block text-[11px] text-slate-400 mt-0.5">
              Format: Till Number #{meterNumber ? "Meter Number" : "..."}
            </span>
          )}
        </span>
      ),
    },
    { icon: "6", label: "Enter Amount & PIN", desc: "Enter the amount and confirm with your M-Pesa PIN" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 transition">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#0A1F44] dark:text-white">Buy Tokens with M-Pesa</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Choose your preferred payment method
          </p>
        </div>

        {/* Method Tabs */}
        <div className="flex gap-2 mb-5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setPaymentMethod("stk"); resetPayment(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              paymentMethod === "stk"
                ? "bg-[#0A1F44] text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            STK Push
          </button>
          <button
            onClick={() => { setPaymentMethod("paybill"); resetPayment(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              paymentMethod === "paybill"
                ? "bg-[#0A1F44] text-white shadow-md"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Paybill (NCBA)
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STK PUSH PANEL ── */}
          {paymentMethod === "stk" && (
            <motion.div
              key="stk"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-[#0A1F44]/10 rounded-xl">
                  <Zap className="w-5 h-5 text-[#0A1F44] dark:text-blue-300" />
                </div>
                <div>
                  <p className="font-bold text-[#0A1F44] dark:text-white text-sm">Instant STK Push</p>
                  <p className="text-xs text-slate-400">Receive prompt on your phone automatically</p>
                </div>
              </div>

              {/* Status Panel */}
              <AnimatePresence mode="wait">
                {paymentResult.status !== "idle" && (
                  <motion.div
                    key={paymentResult.status}
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6"
                  >
                    {paymentResult.status === "sending" && (
                      <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/80 dark:bg-blue-950/40 p-5">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Sending M-Pesa Prompt</p>
                            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">Connecting to Safaricom...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentResult.status === "waiting" && (
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 p-5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                          </div>
                          <div>
                            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Waiting for Payment</p>
                            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Check your phone and enter M-Pesa PIN</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-center gap-1.5">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"
                              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                        {pollingError && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-white/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/20 flex items-center justify-center gap-2"
                          >
                            <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">{pollingError}</span>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {paymentResult.status === "confirmed" && (
                      <div className="rounded-2xl border border-[#0A1F44]/20 dark:border-[#0A1F44]/50 bg-[#0A1F44]/5 dark:bg-[#0A1F44]/20 p-5 space-y-4">
                        <div className="flex items-center gap-3">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                            <CheckCircle2 className="w-7 h-7 text-[#0A1F44] dark:text-blue-300" />
                          </motion.div>
                          <div>
                            <p className="font-bold text-[#0A1F44] dark:text-blue-200 text-sm">Payment Successful</p>
                            <p className="text-xs text-[#0A1F44]/70 dark:text-blue-300/70 mt-0.5">KES {paymentResult.amount} received</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          {paymentResult.mpesaReceipt && (
                            <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#0A1F44]/8 dark:bg-[#0A1F44]/20">
                              <span className="text-[#0A1F44] dark:text-blue-300 font-medium">M-Pesa Receipt</span>
                              <span className="font-mono font-bold text-[#0A1F44] dark:text-blue-100">{paymentResult.mpesaReceipt}</span>
                            </div>
                          )}
                          {paymentResult.meterNumber && (
                            <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#0A1F44]/8 dark:bg-[#0A1F44]/20">
                              <span className="text-[#0A1F44] dark:text-blue-300 font-medium">Meter (DRN/PAN)</span>
                              <span className="font-mono font-bold text-[#0A1F44] dark:text-blue-100">{paymentResult.meterNumber}</span>
                            </div>
                          )}
                        </div>
                        {paymentResult.tokens && paymentResult.tokens.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#0A1F44] dark:text-blue-300 uppercase tracking-wider">Your Token(s)</p>
                            {paymentResult.tokens.map((token, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0A1F44]/8 dark:bg-[#0A1F44]/30 border border-[#0A1F44]/20 dark:border-[#0A1F44]/40"
                              >
                                <span className="font-mono text-sm font-bold text-[#0A1F44] dark:text-blue-100 tracking-wider break-all">
                                  {token.replace(/(.{4})/g, "$1-").replace(/-$/, "")}
                                </span>
                                <button onClick={() => copyToken(token)} className="shrink-0 p-1.5 rounded-lg hover:bg-[#0A1F44]/15 dark:hover:bg-[#0A1F44]/40 transition-colors" title="Copy token">
                                  {copiedToken === token ? <Check className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" /> : <Copy className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" />}
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                        <button onClick={resetPayment} className="w-full mt-2 py-2.5 text-sm font-semibold text-white bg-[#0A1F44] hover:bg-[#081735] rounded-xl border border-[#0A1F44] transition-colors">
                          Make Another Purchase
                        </button>
                      </div>
                    )}

                    {paymentResult.status === "failed" && (
                      <div className="rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50/80 dark:bg-red-950/30 p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
                            <XCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
                          </motion.div>
                          <div>
                            <p className="font-bold text-red-800 dark:text-red-300 text-sm">Payment Failed</p>
                            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">{paymentResult.failureReason}</p>
                          </div>
                        </div>
                        <button onClick={resetPayment} className="w-full py-2.5 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl border border-red-200 dark:border-red-800/50 transition-colors">
                          Try Again
                        </button>
                      </div>
                    )}

                    {paymentResult.status === "timeout" && (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Payment Pending</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">We haven't received confirmation yet. Check your M-Pesa SMS shortly.</p>
                          </div>
                        </div>
                        <button onClick={resetPayment} className="w-full py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                          Try Again
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* STK Form */}
              {paymentResult.status !== "confirmed" && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">M-Pesa Phone to receive prompt</label>
                    <PhoneInput
                      country={phoneCountry}
                      value={phone}
                      onCountryChange={setPhoneCountry}
                      onChange={setPhone}
                      disabled={loading}
                      error={!!validationErrors.phone}
                      placeholder="717000480"
                    />
                    {validationErrors.phone && <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Meter Number</label>
                    <div className="relative">
                      <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="14123456789"
                        value={meterNumber}
                        onChange={(e) => setMeterNumber(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition focus:ring-2 focus:ring-[#0A1F44] ${validationErrors.meterNumber ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}
                        readOnly={true}
                        disabled={loading}
                      />
                    </div>
                    {validationErrors.meterNumber && <p className="text-xs text-red-500 mt-1">{validationErrors.meterNumber}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Amount (KES)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">KSh</span>
                      <input
                        type="number"
                        placeholder={`${minAmount}`}
                        min={minAmount}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 dark:text-white transition focus:ring-2 focus:ring-[#0A1F44] ${validationErrors.amount ? "border-red-400" : "border-slate-300 dark:border-slate-700"}`}
                        disabled={loading}
                      />
                    </div>
                    {validationErrors.amount ? (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.amount}</p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Minimum purchase: KES {minAmount}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3 font-semibold text-white bg-[#0A1F44] hover:bg-[#081735] rounded-xl transition disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay KES ${Number(amount) || 0}`
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* ── NCBA PAYBILL PANEL ── */}
          {paymentMethod === "paybill" && (
            <motion.div
              key="paybill"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

                {/* NCBA Header */}
                <div className="bg-gradient-to-r from-[#0A1F44] to-[#1a3a6b] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">NCBA Paybill Payment</p>
                      <p className="text-xs text-blue-200/80 mt-0.5">Pay on your phone — your token is sent by SMS automatically</p>
                    </div>
                  </div>
                </div>

                {/* Paybill Details Cards */}
                <div className="p-5 space-y-3">
                  {/* Business Number */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0A1F44]/10 dark:bg-blue-900/30 rounded-xl">
                        <Building2 className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Business Number</p>
                        <p className="text-xl font-bold text-[#0A1F44] dark:text-white font-mono tracking-widest">{NCBA_BUSINESS_NUMBER}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => copyField(NCBA_BUSINESS_NUMBER, "business")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1F44] hover:bg-[#081735] text-white text-xs font-semibold transition-colors"
                    >
                      {copiedField === "business" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === "business" ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {/* Account Number: TillNumber#MeterNumber */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-[#0A1F44]/10 dark:bg-blue-900/30 rounded-xl shrink-0">
                        <Hash className="w-4 h-4 text-[#0A1F44] dark:text-blue-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Account Number</p>
                        <p className="text-lg sm:text-xl font-bold text-[#0A1F44] dark:text-white font-mono tracking-wide break-all">
                          {paybillAccountRef || <span className="text-slate-400 text-sm">Loading...</span>}
                        </p>
                        {tillNumber && meterNumber && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Till {tillNumber} · Meter {meterNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {paybillAccountRef && (
                      <button
                        onClick={() => copyField(paybillAccountRef, "account")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A1F44] hover:bg-[#081735] text-white text-xs font-semibold transition-colors shrink-0 ml-2"
                      >
                        {copiedField === "account" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedField === "account" ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Steps */}
                <div className="px-5 pb-5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">How to Pay</p>
                  <div className="space-y-2">
                    {paybillSteps.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#0A1F44] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {step.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{step.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>


                {/* Security note */}
                <div className="mx-5 mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Payments are securely processed by <span className="font-semibold">NCBA Bank</span> through the M-Pesa Paybill platform.
                  </p>
                </div>
              </div>

              {/* Flow summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Payment Flow</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {["You Pay", "NCBA Confirms", "Token Generated", "SMS Delivered"].map((label, i, arr) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-xs font-medium text-[#0A1F44] dark:text-blue-300 bg-[#0A1F44]/8 dark:bg-blue-900/30 px-2 py-1 rounded-lg">{label}</span>
                      {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default LipaTokenNaMpesa;