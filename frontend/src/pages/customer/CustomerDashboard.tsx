import { motion } from 'framer-motion';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  User, Smartphone, Mail, CreditCard, Activity, 
  CalendarClock, Zap, Copy, Check, AlertCircle,
  Power, Clock, Building2,
  GaugeCircleIcon
} from 'lucide-react';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';

const CustomerDashboard = () => {
  const { user } = useOutletContext<any>();
  const navigate = useNavigate();
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  
  const meter = user?.meter;
  const vendor = user?.vendor;
  const recentTransactions = user?.recent_transactions || [];
  
  // Find the latest successful transaction that has tokens
  const latestTokenTx = recentTransactions.find((tx: any) => 
    tx.tokens && tx.tokens.length > 0 && tx.status === 'success'
  );
  
  // Helper to abbreviate organization names
  const abbreviateOrg = (name: string): string => {
    if (!name) return '';
    // Split by spaces and take first letter of each word, max 2 letters
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Get avatar URL - uses ui-avatars for customers, abbreviated org for vendors
  const avatarUrl = useMemo(() => {
  if (user?.profile_image) return user.profile_image;

  if (user?.name) {
    const name = encodeURIComponent(user.name);
    return `https://ui-avatars.com/api/?name=${name}&background=0a1f44&color=ffffff&bold=true&size=128`;
  }

  return "";
}, [user?.profile_image, user?.name]);


// Vendor abbreviation
const vendorAbbr = useMemo(() => {
  if (!vendor?.business_name) return "";

  return abbreviateOrg(vendor.business_name).toUpperCase();
}, [vendor?.business_name]);
  
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token.replace(/-/g, ''));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const formatToken = (token: string) => {
    return token.match(/.{1,4}/g)?.join('-') || token;
  };

  // Calculate quick stats - prioritize backend total_spent if available
  const totalSpent = user?.total_spent ?? recentTransactions
    .filter((tx: any) => tx.status === 'success')
    .reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0);
    
  const successfulTxCount = recentTransactions.filter((tx: any) => 
    tx.status === 'success'
  ).length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A0F1C] p-4 md:p-6 lg:p-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header - Clean, authoritative utility style */}
        <motion.header 
          variants={itemVariants}
          className="bg-white dark:bg-[#0A1F44] border border-slate-200 dark:border-[#1E3A5F] rounded-2xl p-6 md:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar - Uses ui-avatars API */}
              {/* Avatar */}
                   <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                   
                     {avatarUrl ? (
                       <img
                         src={avatarUrl}
                         alt={user?.name || "User avatar"}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-[#0A1F44] text-white">
                         <User size={26} />
                       </div>
                     )}
                   
                   </div>
              <div>
                
               <div className="flex flex-col">
                 <p className="text-2xl text-black dark:text-white tracking-wider font-semibold">
                   My Assigned Meter:
                 </p>
               
                 <p className="text-base font-mono font-bold text-[#0A1F44] dark:text-blue-300 tracking-wide">
                   {meter ? meter.meter_number : "No meter assigned"}
                 </p>
               </div>
                {vendor && (
                  <div className="flex items-center gap-2 mt-2">
                
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Total Spent</span>
                <span className="text-xl font-bold text-[#0A1F44] dark:text-white">Ksh {totalSpent.toLocaleString()}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard/lipa-mpesa')}
                className="flex items-center gap-2 px-6 py-3 bg-[#0A1F44] hover:bg-[#0A1F44]/90 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-[#0A1F44] rounded-xl font-bold transition-colors shadow-lg shadow-[#0A1F44]/10 dark:shadow-none"
              >
                <Zap size={18} fill="currentColor" />
                <span>Purchase Token</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Quick Stats Row */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { 
              label: 'Meter Status', 
              value: meter?.status === 'active' ? 'Active' : 'Inactive',
              icon: Power,
              color: meter?.status === 'active' ? 'text-[#0A1F44]' : 'text-amber-600',
              bg: meter?.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
            },
            { 
              label: 'Transactions', 
              value: successfulTxCount.toString(),
              icon: CreditCard,
              color: 'text-[#0A1F44]',
              bg: 'bg-blue-50 dark:bg-blue-900/20'
            },
            { 
              label: 'Last Purchase', 
              value: latestTokenTx ? dayjs(latestTokenTx.created_at).format('MMM D') : 'Never',
              icon: Clock,
              color: 'text-slate-600',
              bg: 'bg-slate-100 dark:bg-slate-800'
            },
            { 
              label: 'Provider(Vendor)', 
              value: vendor ? vendor.business_name : 'N/A',
              icon: Building2,
              color: 'text-[#0A1F44]',
              bg: 'bg-blue-50 dark:bg-blue-900/20'
            }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-[#0A1F44] dark:text-slate-500 font-bold normal tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

       {/* Main Grid */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Profile Card */}
  <motion.div
    variants={itemVariants}
    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-[#0A1F44] flex items-center justify-center">
        <User size={16} className="text-white"/>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Contact Information
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Registered details
        </p>
      </div>
    </div>

    <div className="space-y-3">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <Mail size={15} className="text-slate-400 mt-1"/>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
            Email
          </p>
          <p className="text-sm text-slate-900 dark:text-white break-all">
            {user?.email || "N/A"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
        <Smartphone size={15} className="text-slate-400 mt-1"/>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
            Phone
          </p>
          <p className="text-sm text-slate-900 dark:text-white">
            {user?.phone || "N/A"}
          </p>
        </div>
      </div>

      {vendor && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <Building2 size={15} className="text-slate-400 mt-1"/>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">
              Provider
            </p>
            <div className="flex items-center gap-2">

               <span className="w-6 h-6 flex items-center justify-center text-[9px] rounded-full bg-[#0A1F44] text-white font-bold">
                 {vendorAbbr}
               </span>
             
               <span className="text-sm text-slate-900 dark:text-white">
                 {vendor.business_name}
               </span>
             
             </div>
          </div>
        </div>
      )}
    </div>
  </motion.div>


  {/* Meter Card */}
  <motion.div
    variants={itemVariants}
    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-[#0A1F44] flex items-center justify-center">
        <GaugeCircleIcon size={16} className="text-white"/>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Meter Information
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Equipment details
        </p>
      </div>
    </div>

    {meter ? (
      <div className="space-y-4">
        {/* Meter Number Display - DARK ACCENT */}
        <div className="p-3 rounded-lg bg-[#0A1F44] text-white shadow-inner">
          <p className="text-[10px] tracking-wider text-blue-200 font-semibold">
            Meter Number(PAN/DRN)
          </p>
          <p className="text-lg font-mono tracking-widest mt-1 text-white">
            {meter.meter_number}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${
                meter.status === "active"
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}/>
              <span className="text-sm text-slate-900 dark:text-white capitalize">
                {meter.status}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              Type
            </p>
            <p className="text-sm text-slate-900 dark:text-white mt-1">
              Prepaid
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
        <AlertCircle size={24} className="text-slate-400 mb-2"/>
        <p className="text-sm text-slate-500">
          No meter assigned
        </p>
      </div>
    )}
  </motion.div>


  {/* Latest Token Card */}
  <motion.div
    variants={itemVariants}
    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-[#0A1F44] flex items-center justify-center">
        <Zap size={16} className="text-white"/>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Latest Token
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Most recent purchase
        </p>
      </div>
    </div>

    {latestTokenTx ? (
      <div className="space-y-4">
        {/* Token Code Display - DARK ACCENT */}
        <div className="p-3 bg-[#0A1F44] border border-[#1E3A5F] rounded-lg text-white shadow-inner">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] text-blue-200 uppercase font-semibold">
                 Token Code
               </span>
               <button
                 onClick={() => handleCopyToken(latestTokenTx.tokens[0])}
                 className="text-[10px] flex items-center gap-1 text-blue-200 hover:text-white transition-colors"
               >
                 {copiedToken === latestTokenTx.tokens[0] ? (
                   <>
                     <Check size={12} className="text-emerald-400" />
                     <span className="text-emerald-400">Copied</span>
                   </>
                 ) : (
                   <>
                     <Copy size={12}/> Copy
                   </>
                 )}
               </button>
             </div>
             <p className="text-sm font-mono tracking-widest break-all text-white">
               {formatToken(latestTokenTx.tokens[0])}
             </p>
           </div>

        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400">
            {dayjs(latestTokenTx.created_at).format("MMM D YYYY")}
          </span>
          <span className="text-[#0A1F44] dark:text-blue-300 font-bold">
            Ksh {latestTokenTx.amount?.toLocaleString()}
          </span>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
        <Zap size={24} className="mb-2 text-slate-400 opacity-60"/>
        <p className="text-sm text-slate-500">
          No tokens yet
        </p>
        <button
          onClick={() => navigate("/dashboard/lipa-mpesa")}
          className="mt-3 px-4 py-2 text-xs font-bold rounded-lg bg-[#0A1F44] text-white hover:bg-[#0A1F44]/90 transition-colors shadow-md"
        >
          Buy Token
        </button>
      </div>
    )}
  </motion.div>

</div>

        {/* Transactions Section - Condensed Summary */}
        <motion.section 
          variants={itemVariants}
          className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A1F44] dark:bg-[#1E3A5F] flex items-center justify-center">
                <CreditCard size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Brief summary of your latest activity</p>
              </div>
            </div>
            <motion.button
              whileHover={{ x: 3 }}
              onClick={() => navigate('/dashboard/purchase-history')}
              className="text-sm font-bold text-[#0A1F44] dark:text-blue-400 flex items-center gap-1 group"
            >
              <span>View History</span>
              <CalendarClock size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </div>

          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.slice(0, 3).map((tx: any) => (
                <div 
                  key={tx._id || tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.status === 'success' ? 'bg-[#0A1F44] text-white' : 'bg-red-100 text-red-600'
                    }`}>
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Ksh {tx.amount?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {dayjs(tx.created_at).format('MMM D, YYYY • HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      tx.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {tx.status}
                    </span>
                    {tx.tokens && tx.tokens.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-400 mt-1">
                        {tx.tokens[0].substring(0, 4)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
               <Activity size={24} className="mb-2 opacity-30" />
               <p className="text-xs font-bold">No recent activity</p>
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
};

export default CustomerDashboard;