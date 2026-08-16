import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Zap, Send, ShieldAlert, Gauge, User, Building2, Home, Copy, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import DashboardLoader from '@/lib/loader';

type UserContext = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type LookupMeter = {
  id: string;
  meter_number: string;
  meter_type: string;
  price_per_unit?: number;
  status?: string;
  vendor?: { id: string; name: string } | null;
  landlord?: { id: string; name: string } | null;
  customer?: { id: string; name: string; phone?: string; address?: string } | null;
  location?: {
    property?: string | null;
    zone?: string | null;
    route?: string | null;
    street?: string | null;
    unit?: string | null;
    address?: string | null;
  } | null;
};

type TokenType = 'credit' | 'clear_tamper' | 'clear_credit' | 'set_max_overdraft';
type VendMode = 'unit' | 'value';

const TOKEN_OPTIONS: Array<{ value: TokenType; label: string; help: string }> = [
  { value: 'credit', label: 'Issue Credit', help: 'Vend by unit or by value and record transaction details.' },
  { value: 'clear_tamper', label: 'Clear Tamper', help: 'Generate a control token to clear tamper state.' },
  { value: 'clear_credit', label: 'Clear Credit', help: 'Generate a control token to clear stored credit.' },
  { value: 'set_max_overdraft', label: 'Set Max Overdraft', help: 'Generate a control token to set overdraft value.' },
];

const TokenManagement = () => {
  const { user } = useOutletContext<UserContext>();
  const [searchParams] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL;

  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState(searchParams.get('meter') || '');
  const [results, setResults] = useState<LookupMeter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState('');
  const [tokenType, setTokenType] = useState<TokenType>('credit');
  const [vendMode, setVendMode] = useState<VendMode>('value');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [phone, setPhone] = useState('');
  const [resultTokens, setResultTokens] = useState<string[]>([]);

  const selectedMeter = useMemo(
    () => results.find((item) => item.id === selectedMeterId) || null,
    [results, selectedMeterId]
  );

  useEffect(() => {
    if (query.trim()) {
      void handleSearch(query.trim());
    }
  }, []);

  useEffect(() => {
    if (selectedMeter?.customer?.phone) {
      setPhone(selectedMeter.customer.phone);
    }
  }, [selectedMeter?.customer?.phone]);

  const handleSearch = async (forcedQuery?: string) => {
    const searchValue = (forcedQuery ?? query).trim();
    if (!searchValue) return;

    try {
      setSearching(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/tokens/meter-lookup?q=${encodeURIComponent(searchValue)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const items: LookupMeter[] = response.data.data || [];
      setResults(items);
      setSelectedMeterId(items[0]?.id || '');
      if (items[0]?.customer?.phone) {
        setPhone(items[0].customer.phone);
      }
    } catch (error: any) {
      setResults([]);
      setSelectedMeterId('');
      Swal.fire({
        icon: 'error',
        title: 'Search failed',
        text: error.response?.data?.message || 'Meter lookup failed',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) {
      Swal.fire({
        icon: 'warning',
        title: 'Select meter',
        text: 'Search and select a meter first.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const payload: Record<string, unknown> = {
      meter_id: selectedMeter.id,
      token_type: tokenType,
      send_sms: sendSms,
      phone: phone.trim() || undefined,
    };

    if (tokenType === 'credit') {
      if (!amount || Number(amount) <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Amount required',
          text: vendMode === 'unit' ? 'Enter units to vend.' : 'Enter amount in KES.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }
      payload.vend_mode = vendMode;
      payload.amount = Number(amount);
      payload.transaction_id = transactionId || undefined;
      payload.transaction_time = transactionTime || undefined;
    } else if (tokenType === 'set_max_overdraft') {
      if (!amount || Number(amount) < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Overdraft required',
          text: 'Enter the max overdraft value.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }
      payload.control_value = Number(amount);
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/tokens/generate`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResultTokens(response.data.tokens || []);
      Swal.fire({
        icon: 'success',
        title: 'Token generated',
        text: response.data.sms_sent ? 'Token generated and SMS sent.' : 'Token generated successfully.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
      });
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Generation failed',
        text: error.response?.data?.message || error.response?.data?.error_details || 'Failed to generate token',
        confirmButtonColor: '#0A1F44',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyTokens = async () => {
    const formatted = resultTokens
      .map((token) => token.replace(/\s/g, '').match(/.{1,4}/g)?.join('-') || token)
      .join('\n');

    await navigator.clipboard.writeText(formatted);
    Swal.fire({
      icon: 'success',
      title: 'Copied',
      text: 'Generated token(s) copied to clipboard.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
    });
  };

  if (!user) {
    return <DashboardLoader title="Loading Token Management" subtitle="Preparing meter and token tools..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em]">
              {user.role === 'admin' || user.role === 'system_admin' ? 'Administrator Portal' : user.role === 'vendor' ? 'Vendor Portal' : 'Landlord Portal'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Token Management</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
            Search a meter, review owner and customer details, then issue credit or control tokens. Every transaction is recorded against the meter owner account.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meter Search</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter MeterNo, customer phone, or customer name"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  onClick={() => void handleSearch()}
                  disabled={searching || !query.trim()}
                  className="px-5 py-3 rounded-2xl bg-[#0A1F44] text-white font-semibold disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {results.length > 0 && (
                <div className="mt-5 grid gap-3">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMeterId(item.id)}
                      className={`text-left rounded-2xl border p-4 transition ${
                        selectedMeterId === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.meter_number}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {item.customer?.name || 'No customer linked'} • {item.meter_type}
                          </p>
                        </div>
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{item.status || 'active'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedMeter && (
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Meter Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <Info label="Meter Number" value={selectedMeter.meter_number} />
                  <Info label="Meter Type" value={selectedMeter.meter_type} />
                  <Info label="Vendor" value={selectedMeter.vendor?.name || 'Not assigned'} icon={<Building2 className="w-4 h-4" />} />
                  <Info label="Landlord" value={selectedMeter.landlord?.name || 'Not assigned'} icon={<Home className="w-4 h-4" />} />
                  <Info label="Customer" value={selectedMeter.customer?.name || 'No customer linked'} icon={<User className="w-4 h-4" />} />
                  <Info label="Price Per Unit" value={selectedMeter.price_per_unit != null ? `KES ${selectedMeter.price_per_unit}` : 'Not set'} />
                  <Info label="Property / Zone" value={[selectedMeter.location?.property, selectedMeter.location?.zone].filter(Boolean).join(' / ') || 'Not linked'} />
                  <Info label="Location" value={[selectedMeter.location?.route, selectedMeter.location?.street, selectedMeter.location?.unit, selectedMeter.location?.address].filter(Boolean).join(' / ') || 'Not available'} />
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Token Action</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Token Option</label>
                  <select
                    value={tokenType}
                    onChange={(e) => {
                      setTokenType(e.target.value as TokenType);
                      setAmount('');
                    }}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {TOKEN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {TOKEN_OPTIONS.find((option) => option.value === tokenType)?.help}
                  </p>
                </div>

                {tokenType === 'credit' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Issue Credit By</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setVendMode('unit')}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${vendMode === 'unit' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Vend by Unit
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendMode('value')}
                          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${vendMode === 'value' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                        >
                          Vend by Value
                        </button>
                      </div>
                    </div>

                    <Field
                      label={vendMode === 'unit' ? 'Amount (m³ / units)' : 'Amount (KES)'}
                      type="number"
                      value={amount}
                      onChange={setAmount}
                      placeholder={vendMode === 'unit' ? 'Enter units' : 'Enter amount in KES'}
                    />
                    <Field label="Transaction ID" value={transactionId} onChange={setTransactionId} placeholder="Enter transaction ID" />
                    <Field label="Transaction Time" type="datetime-local" value={transactionTime} onChange={setTransactionTime} />
                  </>
                )}

                {tokenType === 'set_max_overdraft' && (
                  <Field
                    label="Max Overdraft Value"
                    type="number"
                    value={amount}
                    onChange={setAmount}
                    placeholder="Enter overdraft value"
                  />
                )}

                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Send SMS
                  </label>
                  <Field
                    label="SMS Phone Number"
                    value={phone}
                    onChange={setPhone}
                    placeholder="2547XXXXXXXX"
                    disabled={!sendSms}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !selectedMeter}
                  className="w-full px-5 py-3 rounded-2xl bg-[#0A1F44] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Send className="w-4 h-4 animate-pulse" /> : <Zap className="w-4 h-4" />}
                  {submitting ? 'Generating...' : 'Generate and Display Token'}
                </button>
              </form>
            </section>

            {resultTokens.length > 0 && (
              <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generated Token</h2>
                  </div>
                  <button onClick={() => void copyTokens()} className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="space-y-3">
                  {resultTokens.map((token) => (
                    <div key={token} className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">
                      {token.replace(/\s/g, '').match(/.{1,4}/g)?.join('-') || token}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
      />
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
      <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2">{label}</p>
      <div className="flex items-start gap-2 text-slate-900 dark:text-white">
        {icon}
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

export default TokenManagement;
