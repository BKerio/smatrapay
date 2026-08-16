import { useState, useEffect } from 'react';
import axios from 'axios';

import { Plus, Search, Edit2, Trash2, Building2, MapPin, CreditCard, User, Mail, AtSign, ShieldCheck, Loader2, X, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from '@/lib/loader';
import Swal from 'sweetalert2';

interface VendorData {
    id: string;
    user_id: string;
    business_name: string;
    address: string;
    account_id: string;
    paybill: string;
    vendor_type: string;
    bank_name: string;
    status: string;
    user?: {
        name: string;
        email: string;
        username: string;
    };
}

const Vendors = () => {
    const [vendors, setVendors] = useState<VendorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<VendorData | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        business_name: '',
        address: '',
        account_id: '',
        paybill: '',
        vendor_type: '',
        bank_name: '',
    });

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/vendors?search=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVendors(response.data.data);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load vendors',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (vendor: VendorData | null = null) => {
        if (vendor) {
            setEditingVendor(vendor);
            setFormData({
                name: vendor.user?.name || '',
                email: vendor.user?.email || '',
                username: vendor.user?.username || '',
                password: '',
                business_name: vendor.business_name,
                address: vendor.address,
                account_id: vendor.account_id,
                paybill: vendor.paybill,
                vendor_type: vendor.vendor_type || '',
                bank_name: vendor.bank_name || '',
            });
        } else {
            setEditingVendor(null);
            setFormData({
                name: '',
                email: '',
                username: '',
                password: '',
                business_name: '',
                address: '',
                account_id: '',
                paybill: '',
                vendor_type: '',
                bank_name: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingVendor) {
                // Filter out empty password or fields that shouldn't be sent if empty
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password;

                // For updates, we might want to be even more selective if fields are hidden
                // but for now, just sending everything as intended by the form state.

                await axios.put(`${API_URL}/admin/vendors/${editingVendor.id}`, updateData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Vendor updated successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                await axios.post(`${API_URL}/admin/vendors`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Vendor created successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
            setIsModalOpen(false);
            fetchVendors();
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

    const handleDelete = async (vendor: VendorData) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete vendor "${vendor.business_name}". This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/admin/vendors/${vendor.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Vendor deleted successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                fetchVendors();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete vendor',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        }
    };

    if (loading && vendors.length === 0) {
        return <DashboardLoader title="Loading Vendors..." subtitle="Fetching business accounts" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3.5 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/80 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl shrink-0 shadow-sm">
                                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                                    Vendor Management
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    Configure business accounts and access credentials
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
                                <span>Register Vendor</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Search and Filters Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    <div className="lg:col-span-3 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search by business name, account ID, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                        <button 
                            onClick={() => fetchVendors()}
                            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <div className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-2xl">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                                {vendors.length} Total
                            </span>
                        </div>
                    </div>
                </div>

                {/* Vendors Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider">Business Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider">Framework</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider">Settlement</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 normal tracking-wider text-right">Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/30">
                                <AnimatePresence mode="popLayout">
                                    {vendors.map((vendor, index) => (
                                        <motion.tr
                                            key={vendor.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: Math.min(index * 0.03, 0.2) }}
                                            className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100/50 dark:border-blue-800/50 group-hover:scale-105 transition-transform">
                                                            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 ${vendor.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                                            {vendor.business_name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                            <MapPin size={10} className="text-gray-400" />
                                                            {vendor.address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                        {vendor.user?.name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <Mail size={12} className="opacity-70" />
                                                        {vendor.user?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-2">
                                                    <div className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                        vendor.vendor_type === 'Company'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
                                                            : 'bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                    }`}>
                                                        {vendor.vendor_type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                                        <Building2 size={12} className="opacity-70" />
                                                        {vendor.bank_name || 'System Standard'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                            <CreditCard size={14} />
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 tracking-tight">{vendor.account_id}</span>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50 inline-block tracking-wider">
                                                        PB: {vendor.paybill}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                                                    vendor.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${vendor.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {vendor.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-1 transition-all">
                                                    <button
                                                        onClick={() => handleOpenModal(vendor)}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Edit Profile"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(vendor)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                        title="Decommission"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {!loading && vendors.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-700">
                                                    <Building2 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 dark:text-white font-bold">No Vendors Found</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Initialize a new vendor account to begin</p>
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
                                        {editingVendor ? 'Edit Vendor Account' : 'Register New Vendor'}
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Configure business credentials and settlement details
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
                                    {/* Personal Identity */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Principal Identity</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Full Legal Name</label>
                                                <div className="relative group">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. John Doe"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email Address</label>
                                                <div className="relative group">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                    <input
                                                        type="email"
                                                        placeholder="e.g. john@example.com"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            {!editingVendor && (
                                                <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">System Username</label>
                                                        <div className="relative group">
                                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                            <input
                                                                type="text"
                                                                placeholder="Choose a username"
                                                                required
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                                value={formData.username}
                                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Access Password</label>
                                                        <div className="relative group">
                                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                            <input
                                                                type="password"
                                                                placeholder="Enter secure password"
                                                                required
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                                value={formData.password}
                                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Business Architecture */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1 h-3 bg-blue-600 rounded-full" />
                                            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Business Details</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Trading Name</label>
                                                <div className="relative group">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Acme Corp"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.business_name}
                                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Office Address</label>
                                                <div className="relative group">
                                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 123 Tech Street"
                                                        required
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Vendor Type</label>
                                                    <select
                                                        required
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                                        value={formData.vendor_type}
                                                        onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value })}
                                                    >
                                                        <option value="">Select Type</option>
                                                        <option value="Individual">Individual</option>
                                                        <option value="Company">Company</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Settlement Bank</label>
                                                    <select
                                                        required
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                                        value={formData.bank_name}
                                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                                    >
                                                        <option value="">Select Bank</option>
                                                        <option value="Equity Bank">Equity Bank</option>
                                                        <option value="NCBA Bank">NCBA Bank</option>
                                                        <option value="KCB Bank">KCB Bank</option>
                                                        <option value="Co-op Bank">Co-op Bank</option>
                                                        <option value="Family Bank">Family Bank</option>
                                                        <option value="Stanbic Bank">Stanbic Bank</option>
                                                        <option value="Absa Bank">Absa Bank</option>
                                                        <option value="Other">Other Integration</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Account Number</label>
                                                    <div className="relative group">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                        <input
                                                            type="text"
                                                            placeholder="Acc No."
                                                            required
                                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                            value={formData.account_id}
                                                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">M-Pesa PayBill</label>
                                                    <div className="relative group">
                                                        <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                                        <input
                                                            type="text"
                                                            placeholder="PayBill No."
                                                            required
                                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all text-sm text-gray-900 dark:text-white"
                                                            value={formData.paybill}
                                                            onChange={(e) => setFormData({ ...formData, paybill: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Discard Changes
                                    </button>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-800 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-70"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="w-4 h-4" />
                                            )}
                                            <span>{editingVendor ? 'Save Changes' : 'Complete Registration'}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Vendors;
