import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { Mail, Lock, Eye, EyeOff, Phone, ArrowLeft, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import React from "react";
import SmatraPayLogo from "@/components/SmatraPayLogo";

type Step = "identifier" | "otp" | "reset";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const maskIdentifier = (value: string) => {
  if (value.includes("@")) {
    // Email masking
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}****@${domain}`;
  } else {
    // Phone masking
    return `${value.slice(0, 2)}****${value.slice(-3)}`;
  }
};
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter your email or phone number",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/admin/forgot-password/send-otp", {
        identifier,
      });

      if (response.status === 200) {
        setStep("otp");
        Swal.fire({
          icon: "success",
          title: "Code Sent",
          text: "A 6-digit verification code has been sent.",
          timer: 3000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to send code",
        text: err.response?.data?.message || "An error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a valid 6-digit code",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/admin/forgot-password/verify-otp", {
        identifier,
        otp,
      });

      if (response.data.status === 200) {
        setStep("reset");
        Swal.fire({
          icon: "success",
          title: "Verified",
          text: "Code verified successfully.",
          timer: 2000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.response?.data?.message || "Invalid code",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== passwordConfirmation) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: password ? "Passwords do not match" : "Please enter a new password",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (password.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Password must be at least 8 characters",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/admin/forgot-password/reset", {
        identifier,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (response.data.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Password reset successfully. Please login with your new password.",
          confirmButtonColor: "#0A1F44",
        }).then(() => {
          navigate("/login");
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Reset Failed",
        text: err.response?.data?.message || "An error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEmail = identifier.includes("@");

  return (
    <div className="min-h-screen bg-[#E8F4FD] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full" />

      {/* Main container */}
      <div className="w-full max-w-[380px] relative">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              <div className="h-16 w-auto">
                <SmatraPayLogo size="xl" />
              </div>
            </motion.div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reset Password</h2>
            <p className="text-[11px] text-slate-400 mt-1 text-center font-medium">
              {step === "identifier" && "Enter your email or phone to receive a code"}
              {step === "otp" && `Verification code sent to ${maskIdentifier(identifier)}`}
              {step === "reset" && "Create a secure new password for your account"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "identifier" && (
              <motion.form
                key="identifier"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOtp}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {isEmail ? <Mail size={15} /> : <Phone size={15} />}
                  </div>
                  <input
                    type="text"
                    placeholder="Email or Phone Number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-gray-900 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Request Code</>
                  )}
                </button>
              </motion.form>
            )}

            {step === "otp" && (
              <motion.form
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-4"
              >
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit Code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400 tracking-[0.5em] font-bold text-center"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-gray-900 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Verify Code <ShieldCheck size={14} /></>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("identifier")}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={12} /> Use different contact
                </button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword}
                className="space-y-3.5"
              >
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-gray-900 shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} SmatraPay . All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
