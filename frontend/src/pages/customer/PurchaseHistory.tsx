import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { 
  CreditCard, Activity, ArrowLeft
} from 'lucide-react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

const PurchaseHistory = () => {
    const { user } = useOutletContext<any>();
    const recentTransactions = user?.recent_transactions || [];

    const formatToken = (token: string) => {
        return token.match(/.{1,4}/g)?.join('-') || token;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/dashboard/customer" 
                            className="p-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-[#0A1F44] dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase History</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">View all your electricity token transactions</p>
                        </div>
                    </div>
                </div>

                <motion.section 
                    variants={itemVariants}
                    className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                >
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0A1F44] dark:bg-[#1E3A5F] flex items-center justify-center">
                            <CreditCard size={14} className="text-white" />
                        </div>
                        <h2 className="font-bold text-slate-900 dark:text-white">All Transactions</h2>
                    </div>
                    
                    {recentTransactions && recentTransactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Token Generated</th>
                                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {recentTransactions.map((tx: any) => (
                                        <tr 
                                            key={tx._id || tx.id} 
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {dayjs(tx.created_at).format('MMM D, YYYY')}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        {dayjs(tx.created_at).format('HH:mm')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold text-[#0A1F44] dark:text-white">
                                                    Ksh {tx.amount?.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {tx.tokens && tx.tokens.length > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                                            {formatToken(tx.tokens[0])}
                                                        </code>
                                                        {tx.tokens.length > 1 && (
                                                            <span className="text-xs text-slate-400">+{tx.tokens.length - 1} more</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No token</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${
                                                    tx.status === 'success' 
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
                                                        : tx.status === 'failed'
                                                        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                                        : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        tx.status === 'success' ? 'bg-emerald-500' : 
                                                        tx.status === 'failed' ? 'bg-red-500' : 'bg-slate-400'
                                                    }`} />
                                                    {tx.status || 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-6">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Activity size={24} className="text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No transaction history</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
                                When you purchase tokens, they will be listed here for your records.
                            </p>
                        </div>
                    )}
                </motion.section>
            </motion.div>
        </div>
    );
};

export default PurchaseHistory;
