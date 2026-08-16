import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Building2, 
  User, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Search, 
  RefreshCw,
  X,
  MapPin,
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from '@/lib/loader';
import Swal from 'sweetalert2';

interface PendingVendor {
    id: string;
    user_id: string;
    business_name: string;
    address: string;
    account_id: string;
    bank_name: string;
    vendor_type: string;
    created_at: string;
    user?: {
        name: string;
        email: string;
        phone: string;
    };
}

const VendorApprovals = () => {
    const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVendor, setSelectedVendor] = useState<PendingVendor | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchPendingVendors();
    }, []);

    const fetchPendingVendors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/pending-vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingVendors(response.data.data);
        } catch (error) {
            console.error('Failed to fetch pending vendors', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        const result = await Swal.fire({
            title: `${action === 'approve' ? 'Approve' : 'Reject'} Vendor?`,
            text: `Confirm you want to ${action} this vendor registration.`,
            icon: action === 'approve' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
            confirmButtonText: action === 'approve' ? 'Yes, Approve' : 'Yes, Reject',
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/admin/vendors/${id}/${action}`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                Swal.fire({
                    icon: 'success',
                    title: 'Done',
                    text: `Vendor ${action}d successfully`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                
                setIsDetailOpen(false);
                fetchPendingVendors();
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: error.response?.data?.message || 'Operation failed'
                });
            }
        }
    };

    const filteredVendors = pendingVendors.filter(v => 
        v.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && pendingVendors.length === 0) {
        return <DashboardLoader title="Checking Pending Approvals..." subtitle="Reviewing new provider registrations" />;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 p-6 font-inter">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-800">
                            <ShieldAlert className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-white tracking-tight">Account Approvals</h1>
                            <p className="text-sm text-gray-500">Manage pending vendor & landlord registrations</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Search applicants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm w-64"
                            />
                        </div>
                        <button 
                            onClick={fetchPendingVendors}
                            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 hover:text-blue-600 transition-colors shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Applicant / Business</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800">
                                                {vendor.vendor_type === 'Company' ? <Building2 size={20} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm dark:text-white capitalize">{vendor.business_name}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                                                    <Clock size={10} /> Joined {new Date(vendor.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                            vendor.vendor_type === 'Company' 
                                                ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {vendor.vendor_type === 'Company' ? 'Business Account' : 'Individual'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">{vendor.user?.email}</p>
                                            <p className="text-gray-500">{vendor.user?.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setSelectedVendor(vendor); setIsDetailOpen(true); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(vendor.id, 'approve')}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleAction(vendor.id, 'reject')}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <p className="text-gray-400 text-sm">No pending registrations found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
                {isDetailOpen && selectedVendor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <h2 className="text-lg font-bold dark:text-white">Applicant Profile</h2>
                                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>
                            
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Trading Name</label>
                                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Building2 size={14} className="text-blue-500" /> {selectedVendor.business_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Type</label>
                                        <p className="font-bold text-slate-900 dark:text-white">{selectedVendor.vendor_type}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Person</label>
                                        <p className="font-medium dark:text-slate-200">{selectedVendor.user?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone Number</label>
                                        <p className="font-medium dark:text-slate-200">{selectedVendor.user?.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <MapPin size={18} className="text-slate-400" />
                                        <div className="text-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Address</p>
                                            <p className="font-medium dark:text-white">{selectedVendor.address}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <CreditCard size={18} className="text-slate-400" />
                                        <div className="text-sm">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Settlement [{selectedVendor.bank_name}]</p>
                                            <p className="font-medium dark:text-white">{selectedVendor.account_id}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        onClick={() => handleAction(selectedVendor.id, 'approve')}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                                    >
                                        <CheckCircle size={18}/> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(selectedVendor.id, 'reject')}
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
                                    >
                                        <XCircle size={18}/> Reject
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VendorApprovals;
