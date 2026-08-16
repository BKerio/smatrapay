import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Search, 
  Eye, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Zap, 
  Clock, 
  X, 
  CheckCircle, 
  Filter, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from '@/lib/loader';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

interface EnquiryData {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    city: string;
    premises_type: string;
    residence_type: string;
    meter_type: string[];
    main_meter_type: string;
    message: string;
    status: 'pending' | 'reviewed' | 'archived';
    created_at: string;
}

const Inquery = () => {
    const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchEnquiries();
    }, []);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/enquiries');
            setEnquiries(response.data);
        } catch (error) {
            console.error('Failed to fetch enquiries', error);
            Swal.fire({
                icon: 'error',
                title: 'Data Sync Failed',
                text: 'Unable to retrieve latest lead enquiries.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, currentStatus: string) => {
        const statuses: EnquiryData['status'][] = ['pending', 'reviewed', 'archived'];
        const nextStatus = statuses[(statuses.indexOf(currentStatus as any) + 1) % statuses.length];
        
        setUpdatingId(id);
        try {
            await api.put(`/admin/enquiries/${id}`, { status: nextStatus });
            setEnquiries(prev => prev.map(e => e._id === id ? { ...e, status: nextStatus } : e));
            
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Enquiry marked as ${nextStatus}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        } catch (error) {
            console.error('Update failed', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (enquiry: EnquiryData) => {
        const result = await Swal.fire({
            title: 'Purge Enquiry?',
            text: `You are about to remove the enquiry from ${enquiry.first_name}. This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/admin/enquiries/${enquiry._id}`);
                setEnquiries(prev => prev.filter(e => e._id !== enquiry._id));
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Lead enquiry has been purged.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete record.' });
            }
        }
    };

    const filteredEnquiries = enquiries.filter(e => 
        e.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status: EnquiryData['status']) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            case 'reviewed': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'archived': return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    if (loading && enquiries.length === 0) {
        return <DashboardLoader title="Syncing Leads..." subtitle="Retrieving website enquiries" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-inter transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/80 dark:to-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-2xl shrink-0 shadow-sm">
                                <MessageSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Public Enquiries</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage and respond to website leads</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {enquiries.filter(e => e.status === 'pending').length} Pending Leads
                                </span>
                             </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-3 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-sm text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500 hover:text-red-600 transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                        <button onClick={fetchEnquiries} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-500 hover:text-red-600 transition-all shadow-sm">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Grid/Table Layout */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Prospect</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inquiry Info</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                <AnimatePresence mode="popLayout">
                                    {filteredEnquiries.map((enquiry) => (
                                        <motion.tr key={enquiry._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center font-bold text-red-600 text-xs">
                                                        {enquiry.first_name[0]}{enquiry.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">{enquiry.first_name} {enquiry.last_name}</div>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                                            <MapPin size={10} /> {enquiry.city}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                        <Building2 size={12} className="text-red-500" /> {enquiry.premises_type}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {enquiry.meter_type.map(m => (
                                                            <span key={m} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[9px] font-black uppercase text-gray-500">
                                                                {m}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <button 
                                                    disabled={!!updatingId}
                                                    onClick={() => handleUpdateStatus(enquiry._id, enquiry.status)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 ${getStatusColor(enquiry.status)}`}
                                                >
                                                    {updatingId === enquiry._id ? <Loader2 size={10} className="animate-spin" /> : <Clock size={10} />}
                                                    {enquiry.status}
                                                </button>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="inline-flex gap-2">
                                                    <button onClick={() => { setSelectedEnquiry(enquiry); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(enquiry)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {!loading && filteredEnquiries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <MessageSquare size={48} />
                                                <p className="text-sm font-bold">No enquiries found matching your search</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Inquiry Details Modal */}
            <AnimatePresence>
                {isModalOpen && selectedEnquiry && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white dark:bg-gray-900 w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <div className="p-8 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl font-black">
                                            {selectedEnquiry.first_name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                                                Lead: {selectedEnquiry.first_name} {selectedEnquiry.last_name}
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold tracking-widest uppercase">Submitted {dayjs(selectedEnquiry.created_at).format('MMM D, YYYY')}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2 text-red-600 mb-2 font-black text-[10px] uppercase tracking-widest">
                                            <Mail size={12} /> Email Contact
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedEnquiry.email}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2 text-red-600 mb-2 font-black text-[10px] uppercase tracking-widest">
                                            <Phone size={12} /> Phone Contact
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedEnquiry.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
                                            <Building2 size={14} /> {selectedEnquiry.premises_type}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase border border-purple-100 dark:border-purple-900/50 flex items-center gap-2">
                                            <Zap size={14} /> {selectedEnquiry.main_meter_type} Supply
                                        </span>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-100 dark:border-gray-800">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Enquiry Message</p>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic">
                                            "{selectedEnquiry.message}"
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleUpdateStatus(selectedEnquiry._id, selectedEnquiry.status)}
                                    className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black uppercase tracking-[0.2em] text-xs hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    Cycle Progress Status <CheckCircle size={16} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Inquery;
