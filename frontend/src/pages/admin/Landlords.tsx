import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2, Home, Phone, CreditCard, User, Mail, AtSign, ShieldCheck, Loader2, X, Filter, RefreshCw, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from '@/lib/loader';
import Swal from 'sweetalert2';

interface LandlordData {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    payment_account: string;
    status: string;
    user?: {
        name: string;
        email: string;
        username: string;
    };
}

interface MeterOption {
    id: string;
    meter_number: string;
    landlord_id?: string | null;
}

const Landlords = () => {
    const [landlords, setLandlords] = useState<LandlordData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLandlord, setEditingLandlord] = useState<LandlordData | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [meterModalLandlord, setMeterModalLandlord] = useState<LandlordData | null>(null);
    const [allMeters, setAllMeters] = useState<MeterOption[]>([]);
    const [selectedMeterIds, setSelectedMeterIds] = useState<string[]>([]);
    const [loadingMeters, setLoadingMeters] = useState(false);
    const [savingMeters, setSavingMeters] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        payment_account: '',
    });

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchLandlords();
    }, []);

    const fetchLandlords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/landlords?search=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLandlords(response.data.data);
        } catch (error) {
            console.error('Failed to fetch landlords', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load landlords',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (landlord: LandlordData | null = null) => {
        if (landlord) {
            setEditingLandlord(landlord);
            setFormData({
                name: landlord.user?.name || landlord.full_name || '',
                email: landlord.user?.email || '',
                username: landlord.user?.username || '',
                password: '',
                phone: landlord.phone,
                payment_account: landlord.payment_account,
            });
        } else {
            setEditingLandlord(null);
            setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                phone: '',
                payment_account: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingLandlord) {
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password;
                await axios.put(`${API_URL}/admin/landlords/${editingLandlord.id}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({ icon: 'success', title: 'Success', text: 'Landlord updated successfully', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            } else {
                await axios.post(`${API_URL}/admin/landlords`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({ icon: 'success', title: 'Success', text: 'Landlord registered successfully', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
            setIsModalOpen(false);
            fetchLandlords();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Operation failed',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (landlord: LandlordData) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to remove landlord "${landlord.full_name || landlord.user?.name}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, remove!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/admin/landlords/${landlord.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({ icon: 'success', title: 'Removed', text: 'Landlord removed successfully', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                fetchLandlords();
            } catch {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove landlord', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
        }
    };

    const openMeterModal = async (landlord: LandlordData) => {
        setMeterModalLandlord(landlord);
        setLoadingMeters(true);
        try {
            const token = localStorage.getItem('token');
            const [metersRes, assignedRes] = await Promise.all([
                axios.get(`${API_URL}/admin/meters?per_page=500`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/admin/landlords/${landlord.id}/meters`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const list = metersRes.data?.data ?? [];
            const normalized: MeterOption[] = Array.isArray(list)
                ? list.map((m: any) => ({
                    id: String(m.id ?? m._id ?? ''),
                    meter_number: m.meter_number,
                    landlord_id: m.landlord_id ?? null,
                })).filter((m) => m.id)
                : [];
            setAllMeters(normalized);
            const assigned = assignedRes.data?.meters ?? [];
            setSelectedMeterIds(
                Array.isArray(assigned)
                    ? assigned.map((m: any) => String(m.id ?? m._id ?? '')).filter(Boolean)
                    : []
            );
        } catch (error) {
            console.error('Failed to load meters', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load meters', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        } finally {
            setLoadingMeters(false);
        }
    };

    const toggleMeterSelection = (meterId: string) => {
        setSelectedMeterIds((prev) =>
            prev.includes(meterId) ? prev.filter((id) => id !== meterId) : [...prev, meterId]
        );
    };

    const handleSaveMeterAssignments = async () => {
        if (!meterModalLandlord) return;
        setSavingMeters(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_URL}/admin/landlords/${meterModalLandlord.id}/meters`,
                { meter_ids: selectedMeterIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Swal.fire({ icon: 'success', title: 'Meters assigned', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            setMeterModalLandlord(null);
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to assign meters', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        } finally {
            setSavingMeters(false);
        }
    };

    if (loading && landlords.length === 0) {
        return <DashboardLoader title="Loading Landlords..." subtitle="Fetching property owner accounts" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3.5 bg-gray-100 to-emerald-50 dark:from-emerald-900/80 dark:to-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl shrink-0 shadow-sm">
                                <Home className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                                    Landlord / Property Owner Management
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    Onboard and manage property owners and their payment accounts
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenModal()}
                                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all"
                            >
                                <Plus size={18} />
                                <span>Register Landlord</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filters Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-3 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchLandlords()}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-emerald-600 transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                        <button
                            onClick={() => fetchLandlords()}
                            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-emerald-600 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30 rounded-2xl">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-400 whitespace-nowrap">
                                {landlords.length} Total
                            </span>
                        </div>
                    </div>
                </div>

                {/* Landlords Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">Owner</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">Payment Account</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                                <AnimatePresence mode="popLayout">
                                    {landlords.map((landlord, index) => (
                                        <motion.tr
                                            key={landlord.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: Math.min(index * 0.03, 0.2) }}
                                            className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 group-hover:scale-105 transition-transform">
                                                            <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${landlord.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {landlord.full_name || landlord.user?.name}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Property Owner
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        <Mail size={12} className="opacity-70" />
                                                        {landlord.user?.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <Phone size={12} className="opacity-70" />
                                                        {landlord.phone}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                                        <CreditCard size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-tight">
                                                        {landlord.payment_account}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                                                    landlord.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${landlord.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {landlord.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openMeterModal(landlord)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="Assign meters"
                                                    >
                                                        <Gauge size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(landlord)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(landlord)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {!loading && landlords.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
                                                    <Home className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-bold">No Landlords Found</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Register a new property owner to begin</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {editingLandlord ? 'Edit Landlord Account' : 'Register New Landlord'}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Configure owner details and payment account
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Owner Identity */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-3 bg-gray-600 rounded-full" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Owner Identity</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Full Name */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Jane Wanjiku"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            {/* Email */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                    <input
                                                        type="email"
                                                        placeholder="e.g. owner@example.com"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            {/* Phone */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone Number</label>
                                                <div className="relative group">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                    <input
                                                        type="tel"
                                                        placeholder="e.g. 0712345678"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Credentials & Payment */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-3 bg-gray-600 rounded-full" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Account & Payment</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Payment Account */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Payment Account</label>
                                                <div className="relative group">
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. M-Pesa / Bank Acc No."
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.payment_account}
                                                        onChange={(e) => setFormData({ ...formData, payment_account: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Credentials — only on create */}
                                            {!editingLandlord && (
                                                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">System Username</label>
                                                        <div className="relative group">
                                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                            <input
                                                                type="text"
                                                                placeholder="Choose a username"
                                                                required
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                                value={formData.username}
                                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Access Password</label>
                                                        <div className="relative group">
                                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                                            <input
                                                                type="password"
                                                                placeholder="Enter secure password"
                                                                required
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                                value={formData.password}
                                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-0 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-70"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}
                                        <span>{editingLandlord ? 'Save Changes' : 'Complete Registration'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Assign Meters Modal */}
            <AnimatePresence>
                {meterModalLandlord && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                            onClick={() => setMeterModalLandlord(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assign Meters</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {meterModalLandlord.full_name || meterModalLandlord.user?.name}
                                    </p>
                                </div>
                                <button onClick={() => setMeterModalLandlord(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 max-h-[50vh] overflow-y-auto">
                                {loadingMeters ? (
                                    <div className="flex justify-center py-10">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                    </div>
                                ) : allMeters.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-8">No meters in the system yet. Create meters under Meter Management first.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {allMeters.map((meter) => {
                                            const assignedElsewhere = meter.landlord_id && meter.landlord_id !== meterModalLandlord.id;
                                            return (
                                                <label
                                                    key={meter.id}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                        selectedMeterIds.includes(meter.id)
                                                            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                                                            : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMeterIds.includes(meter.id)}
                                                        onChange={() => toggleMeterSelection(meter.id)}
                                                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{meter.meter_number}</p>
                                                        {assignedElsewhere && (
                                                            <p className="text-[10px] text-amber-600">Currently assigned to another landlord — will reassign</p>
                                                        )}
                                                    </div>
                                                    <Gauge size={16} className="text-gray-400 shrink-0" />
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMeterModalLandlord(null)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveMeterAssignments}
                                    disabled={savingMeters || loadingMeters}
                                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center gap-2"
                                >
                                    {savingMeters && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Assignments
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Landlords;
