import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Users,
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    X,
    Save,
    Phone,
    Mail,
    MapPin,
    Gauge,
    UserCircle,
    Building2,
    Activity,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';
import { useOutletContext } from 'react-router-dom';

interface Meter {
    id: string;
    meter_number: string;
}

interface Vendor {
    id: string;
    business_name: string;
}

interface Customer {
    id: string;
    vendor_id: string;
    meter_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    status: 'active' | 'inactive';
    vendor?: Vendor;
    meter?: Meter;
}

interface User {
    id: string;
    name: string;
    role: string;
}

const Customers = () => {
    const { user } = useOutletContext<{ user: User }>();
    const isAdmin = user.role === 'admin' || user.role === 'system_admin';

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        meter_id: '',
        status: 'active'
    });

    const API_URL = import.meta.env.VITE_API_URL;

    const fetchCustomers = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/customers?search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCustomers(response.data.data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load customers',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    }, [API_URL, searchTerm]);

    const fetchMeters = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/meters?per_page=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableMeters(response.data.data);
        } catch (error) {
            console.error('Failed to fetch meters', error);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchCustomers();
        fetchMeters();
    }, [fetchCustomers, fetchMeters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (editingCustomer) {
                await axios.put(`${API_URL}/admin/customers/${editingCustomer.id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Customer updated successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                await axios.post(`${API_URL}/admin/customers`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Customer registered successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
            setShowModal(false);
            fetchCustomers();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Action failed',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    };

    const handleDelete = async (id: string) => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const result = await Swal.fire({
            title: 'Unregister Customer?',
            text: "This will remove the customer and their link to the meter.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, remove',
            background: isDarkMode ? '#0f172a' : '#fff',
            color: isDarkMode ? '#fff' : '#000'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/admin/customers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Removed',
                    text: 'Customer removed',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                fetchCustomers();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Deletion failed',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        }
    };

    const openModal = (customer: Customer | null = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
                meter_id: customer.meter_id,
                status: customer.status
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                meter_id: '',
                status: 'active'
            });
        }
        setShowModal(true);
    };

    if (loading) return <DashboardLoader title="Loading Contacts" subtitle="Preparing customer directory..." />;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-2 text-indigo-600 dark:text-indigo-400">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <Users size={24} />
                        </div>
                        <span className="font-bold tracking-widest uppercase text-xs">CRM</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Customer <span className="text-indigo-600 dark:text-indigo-400">Directory</span>
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl">
                        {isAdmin ? 'Complete system-wide customer registry across all vendor networks.' : 'Manage your business clients and their meter connections.'}
                    </p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openModal()}
                    className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all font-sans"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    Register Client
                </motion.button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center gap-2">
                            <Filter size={18} />
                            All Roles
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 px-8">
                                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Client Info</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Equipment</th>
                                {isAdmin && <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Affiliation</th>}
                                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Status</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {customers.map((customer, idx) => (
                                <motion.tr
                                    key={customer.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform font-bold text-lg">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{customer.name}</p>
                                                <div className="flex items-center gap-3 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1"><Phone size={12} className="text-slate-300" /> {customer.phone}</span>
                                                    {customer.email && <span className="flex items-center gap-1 opacity-60"><Mail size={12} /> {customer.email}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-center">
                                        {customer.meter ? (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">
                                                <Gauge size={14} className="text-indigo-500" />
                                                SN: {customer.meter.meter_number}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">No Meter Linked</span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Building2 size={16} className="text-slate-400" />
                                                <span className="font-bold text-sm">{customer.vendor?.business_name || 'System Owned'}</span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="py-6 px-8 text-center">
                                        <span className={`
inline - flex items - center gap - 1.5 px - 3 py - 1.5 rounded - full text - [10px] font - black uppercase tracking - tighter
                                            ${customer.status === 'active'
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                                            }
`}>
                                            <div className={`w - 1.5 h - 1.5 rounded - full ${customer.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'} `} />
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openModal(customer)}
                                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {customers.length === 0 && (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Activity className="text-slate-200 dark:text-slate-700" size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Clear Registry</h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No customers found matching your current search parameters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                                        <UserCircle size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                            {editingCustomer ? 'Update Identity' : 'Client Registration'}
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium">Capture essential contact and location data</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-red-500 shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Legal Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 px-6 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Line</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                required
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="+254..."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address (Optional)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                placeholder="email@provider.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assigned Equipment (Meter)</label>
                                        <div className="relative">
                                            <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select
                                                required
                                                value={formData.meter_id}
                                                onChange={(e) => setFormData({ ...formData, meter_id: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none font-bold"
                                            >
                                                <option value="">Select a meter SN...</option>
                                                {availableMeters.map(m => (
                                                    <option key={m.id} value={m.id}>SN: {m.meter_number}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Physical Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-[1.1rem] text-slate-400" size={18} />
                                            <textarea
                                                rows={2}
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                                placeholder="Building, Street, Area..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all uppercase text-xs tracking-widest"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-widest"
                                    >
                                        <Save size={18} />
                                        {editingCustomer ? 'Update Profile' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Customers;
