import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { Mail, Lock, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import React from "react";
import SmatraPayLogo from "@/components/SmatraPayLogo";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Staff / vendor / landlord login (email or account ID + password)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isStaffLoading, setIsStaffLoading] = useState(false);

  // Customer login (phone OTP or Google)
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

  const errorShownRef = React.useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const userData = searchParams.get("user");
    const errorParam = searchParams.get("error");

    if (errorParam && !errorShownRef.current) {
      errorShownRef.current = true;
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: decodeURIComponent(errorParam),
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
      // Remove query parameters to clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        login(user, token);
        Swal.fire({
          icon: "success",
          title: "Login Successful",
          text: `Welcome back, ${user.name}!`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        navigate("/dashboard/customer");
      } catch (e) {
        console.error("Failed to parse user data from URL", e);
      }
    }
  }, [searchParams, login, navigate]);

  const handleGoogleLogin = () => {
    // Redirect to backend google auth route
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google/redirect`;
  };

  const handleSendOtp = async () => {
    if (!phone) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter your phone number",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsCustomerLoading(true);
    try {
      const response = await api.post("/customer/send-otp", { phone });

      if (response.status === 200) {
        setIsOtpSent(true);
        Swal.fire({
          icon: "success",
          title: "OTP Sent",
          text: "A 6-digit verification code has been sent to your phone.",
          timer: 3000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Failed to send OTP",
        text: err.response?.data?.message || "An error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOtpSent) {
      await handleSendOtp();
      return;
    }

    if (!otp || otp.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a valid 6-digit OTP",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsCustomerLoading(true);
    try {
      const response = await api.post("/customer/login-otp", { phone, otp });

      if (response.data.status === 200 && response.data.token) {
        Swal.fire({
          icon: "success",
          title: "Login successful!",
          timer: 1500,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });

        // Customers only ever land on the customer dashboard.
        login(response.data.user, response.data.token);
        navigate("/dashboard/customer");
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: err.response?.data?.message || "Invalid OTP",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsCustomerLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter both credentials",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsStaffLoading(true);

    try {
      const response = await api.post("/admin/login", { identifier, password });

      if (response.data.status === 200 && response.data.token) {
        Swal.fire({
          icon: "success",
          title: "Login successful!",
          timer: 1500,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });

        login(response.data.user, response.data.token);

        // Redirect based on the authenticated user's privilege/role.
        if (response.data.user.role === "vendor") {
          if (response.data.user.vendor_type === "Company") {
            navigate("/dashboard/company");
          } else if (response.data.user.vendor_type === "Individual") {
            navigate("/dashboard/individual");
          } else {
            navigate("/dashboard");
          }
        } else if (response.data.user.role === "landlord") {
          navigate("/dashboard/landlord");
        } else if (response.data.user.role === "customer") {
          navigate("/dashboard/customer");
        } else {
          navigate("/dashboard");
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Authentication Failed",
          text: response.data.message || "Authentication failed",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || err.message || "An error occurred during login",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsStaffLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F4FD] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-400/20 blur-[120px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full" />

      {/* Main container */}
      <div className="w-full max-w-[380px] relative">

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800">

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="h-16 w-auto">
              <SmatraPayLogo className="h-full w-auto" />
            </div>
          </motion.div>

          {/* Staff / Vendor / Landlord login */}
          <form onSubmit={handleStaffLogin} className="space-y-3.5">
            <p className="text-[11px] font-semibold text-slate-500 text-center uppercase tracking-wide">
              Sign in to your account
            </p>

            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Email or Account ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isStaffLoading}
              className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-gray-900 shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {isStaffLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Login to dashboard"
              )}
            </button>

            <div className="text-center pt-1">
              <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-blue-600">
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Login</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Customer login (phone OTP) */}
          <form onSubmit={handleCustomerLogin} className="space-y-3.5">
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter your phone number"
                value={phone}
                disabled={isOtpSent && isCustomerLoading}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400"
              />
            </div>

            <AnimatePresence>
              {isOtpSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="relative"
                >
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition text-[13px] placeholder:text-slate-400 tracking-[0.5em] font-bold text-center"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isCustomerLoading}
              className="w-full py-2.5 rounded-xl text-white text-[13px] font-bold bg-[#0A1F44] hover:bg-gray-900 shadow-lg shadow-blue-500/20 disabled:opacity-60"
            >
              {isCustomerLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {isOtpSent ? "Verifying..." : "Sending OTP..."}
                </span>
              ) : isOtpSent ? (
                "Verify & Login"
              ) : (
                "Send OTP"
              )}
            </button>

            {isOtpSent && !isCustomerLoading && (
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpSent(false);
                    setOtp("");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                >
                  Change number
                </button>
              </div>
            )}
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition font-bold text-slate-700 dark:text-slate-200 shadow-sm"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </motion.button>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Create Provider Account
            </Link>
          </p>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} SmatraPay . All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
