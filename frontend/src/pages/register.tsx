import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Phone, 
  Building2, 
  MapPin, 
  CreditCard,
  UserCheck,
  Building
} from "lucide-react";
import api from "@/lib/api";
import React from "react";
import SmatraPayLogo from "@/components/SmatraPayLogo";

type VendorType = "Individual" | "Company";

interface TypeOption {
  value: VendorType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const typeOptions: TypeOption[] = [
  {
    value: "Individual",
    label: "Landlord / Personal",
    description: "Ideal for individual property owners",
    icon: <User className="w-5 h-5" />,
  },
  {
    value: "Company",
    label: "Business Account",
    description: "For agencies and organizations",
    icon: <Building2 className="w-5 h-5" />,
  },
];

const Register = () => {
  const navigate = useNavigate();
  const [vendorType, setVendorType] = useState<VendorType>("Individual");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    password_confirmation: "",
    business_name: "",
    address: "",
    bank_name: "",
    account_id: "",
    paybill: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirmation) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/register/vendor", {
        ...formData,
        vendor_type: vendorType,
      });

      if (response.data.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Registration Submitted",
          text: response.data.message,
          confirmButtonColor: "#0A1F44",
        }).then(() => {
          navigate("/login");
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: err.response?.data?.message || "An error occurred during registration",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-inter">
      {/* Background decorations */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-[480px] relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-4"
            >
              <div className="h-16 w-auto">
                <SmatraPayLogo className="h-full w-auto" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Create Provider Account
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Join the SmatraPay Ecosystem Today
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Account Type Selector */}
            <div className="relative">
              <label className="text-[11px] font-bold text-slate-400 normal tracking-widest mb-2 block ml-1">
                Account Type
              </label>
              <button
                type="button"
                onClick={() => setShowTypeSelector(!showTypeSelector)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-blue-600">
                    {typeOptions.find((opt) => opt.value === vendorType)?.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                      {typeOptions.find((opt) => opt.value === vendorType)?.label}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      {typeOptions.find((opt) => opt.value === vendorType)?.description}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showTypeSelector ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showTypeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute z-20 top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                  >
                    {typeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setVendorType(option.value);
                          setShowTypeSelector(false);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                          vendorType === option.value
                            ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${vendorType === option.value ? "text-blue-600" : "text-slate-400"}`}>
                          {option.icon}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${vendorType === option.value ? "text-blue-600" : "text-slate-700 dark:text-white"}`}>
                            {option.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{option.description}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-4">
              {/* Type-specific Fields */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={vendorType}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {vendorType === "Company" && (
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="business_name"
                        placeholder="Organization / Business Name"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.business_name}
                        onChange={handleChange}
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="name"
                      placeholder={vendorType === "Company" ? "Contact Person Full Name" : "Your Full Legal Name"}
                      required
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone No"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="address"
                        placeholder="Primary Address"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="relative group text-sm">
                      <select
                        name="bank_name"
                        required
                        className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none font-medium text-slate-600 dark:text-slate-300 appearance-none"
                        value={formData.bank_name}
                        onChange={handleChange}
                      >
                        <option value="">Select Settlement Bank</option>
                        <option value="Equity Bank">Equity Bank</option>
                        <option value="NCBA Bank">NCBA Bank</option>
                        <option value="KCB Bank">KCB Bank</option>
                        <option value="Co-op Bank">Co-op Bank</option>
                        <option value="Family Bank">Family Bank</option>
                        <option value="Safaricom (M-Pesa)">Safaricom (M-Pesa)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="account_id"
                        placeholder="Settlement Account"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.account_id}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="paybill"
                        placeholder="M-Pesa Paybill (Optional)"
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.paybill}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="h-4" /> {/* Spacer */}
                  
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-1 h-3 bg-gray-500 rounded-full" />
                    <h3 className="text-[11px] font-bold text-slate-400 normal tracking-widest">Login Credentials</h3>
                  </div>

                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      name="username"
                      placeholder="Choose Username"
                      required
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        required
                        className="w-full pl-11 pr-11 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password_confirmation"
                        placeholder="Confirm"
                        required
                        className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none text-sm font-medium"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 rounded-2xl text-white text-sm font-bold bg-[#0A1F44] hover:bg-slate-900 shadow-xl shadow-blue-500/10 transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4 overflow-hidden relative group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="relative z-10">Submit Registration</span>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-white/10 to-blue-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
