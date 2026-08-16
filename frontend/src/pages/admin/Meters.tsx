import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
    Gauge, 
    Plus, 
    Search, 
    Filter, 
    Edit2, 
    Trash2, 
    X, 
    Save, 
    Building2, 
    DollarSign, 
    AlertCircle, 
    Activity, 
    ChevronRight, 
    ArrowUpRight,
    Zap,
    Key,
    RefreshCw,
    Settings,
    Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';
import { useOutletContext } from 'react-router-dom';

interface Vendor {
    id: string;
    business_name: string;
}

interface LandlordOption {
    id: string;
    full_name: string;
    user?: { email?: string };
}

/** Normalize API vendor to { id, business_name } (MongoDB may return _id) */
function normalizeVendor(v: { id?: string; _id?: string; business_name?: string }): Vendor {
    return {
        id: String(v?.id ?? v?._id ?? ''),
        business_name: String(v?.business_name ?? ''),
    };
}

interface Meter {
    id: string;
    meter_number: string;
    type: string;
    initial_reading: number;
    price_per_unit: number;
    status: 'active' | 'inactive' | 'maintenance';
    vendor_id: string | null;
    landlord_id?: string | null;
    vendor?: Vendor;
    landlord?: LandlordOption;
}

interface User {
    id: string;
    name: string;
    role: string;
}

const Meters = () => {
    const context = useOutletContext<{ user: User }>();
    const user = context?.user;
    
    if (!user) return <DashboardLoader />;
    
    const isAdmin = user.role === 'admin' || user.role === 'system_admin';

    const [meters, setMeters] = useState<Meter[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [landlords, setLandlords] = useState<LandlordOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [metersFetchError, setMetersFetchError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingMeter, setEditingMeter] = useState<Meter | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        meter_number: '',
        type: 'electricity',
        initial_reading: '0',
        price_per_unit: '0',
        vendor_id: '',
        landlord_id: '',
        status: 'active',
        sgc: '201457',
        krn: '1',
        ti: '1',
        ea: '7',
        ken: '255'
    });

    const API_URL = import.meta.env.VITE_API_URL;

    const fetchMeters = useCallback(async () => {
        setMetersFetchError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            setMetersFetchError('Not signed in');
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_URL}/admin/meters?search=${searchTerm}&per_page=100`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const list = response.data?.data ?? (Array.isArray(response.data) ? response.data : []);
            setMeters(Array.isArray(list) ? list : []);
        } catch (error: unknown) {
            console.error('Failed to fetch meters', error);
            const message = axios.isAxiosError(error)
                ? (error.response?.data?.message || error.message || 'Failed to load meters')
                : 'Failed to load meters';
            setMetersFetchError(message);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load meters',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    }, [API_URL, searchTerm]);

    const fetchVendors = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await axios.get(`${API_URL}/admin/vendors?per_page=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Laravel paginator: { data: [...], current_page, ... }; fallback to raw array
            const raw =
                response.data?.data ??
                (Array.isArray(response.data) ? response.data : []);
            const list = Array.isArray(raw)
                ? raw.map(normalizeVendor).filter((v) => v.id)
                : [];
            setVendors(list);
        } catch (error) {
            console.error('Failed to fetch vendors', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load vendors list',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            setVendors([]);
        }
    }, [API_URL]);

    const fetchLandlords = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await axios.get(`${API_URL}/admin/landlords?per_page=200`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const raw = response.data?.data ?? [];
            setLandlords(Array.isArray(raw) ? raw.map((l: any) => ({
                id: String(l.id ?? l._id ?? ''),
                full_name: l.full_name || l.user?.name || 'Landlord',
                user: l.user,
            })).filter((l: LandlordOption) => l.id) : []);
        } catch (error) {
            console.error('Failed to fetch landlords', error);
            setLandlords([]);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchMeters();
    }, [fetchMeters]);

    useEffect(() => {
        fetchVendors();
        if (isAdmin) fetchLandlords();
    }, [fetchVendors, fetchLandlords, isAdmin]);

    // When admin opens the modal, refetch vendors/landlords so dropdowns are current
    useEffect(() => {
        if (isAdmin && showModal) {
            fetchVendors();
            fetchLandlords();
        }
    }, [isAdmin, showModal, fetchVendors, fetchLandlords]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload: Record<string, unknown> = {
                meter_number: formData.meter_number,
                type: formData.type,
                initial_reading: parseFloat(formData.initial_reading),
                vendor_id: formData.vendor_id || null,
                landlord_id: formData.landlord_id || null,
                status: formData.status,
                sgc: parseInt(formData.sgc || '201457', 10),
                krn: parseInt(formData.krn || '1', 10),
                ti: parseInt(formData.ti || '1', 10),
                ea: parseInt(formData.ea || '7', 10),
                ken: parseInt(formData.ken || '255', 10)
            };
            // Only vendors can set pricing; admin must not send price_per_unit
            if (!isAdmin) {
                payload.price_per_unit = parseFloat(formData.price_per_unit);
            }

            if (editingMeter) {
                await axios.put(`${API_URL}/admin/meters/${editingMeter.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Meter updated successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            } else {
                await axios.post(`${API_URL}/admin/meters`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Meter created successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
            setShowModal(false);
            fetchMeters();
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
            title: 'Delete Meter?',
            text: "This will permanently remove this meter and its history.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it',
            background: isDarkMode ? '#0f172a' : '#fff',
            color: isDarkMode ? '#fff' : '#000'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/admin/meters/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted',
                    text: 'Meter deleted',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                fetchMeters();
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to delete meter',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        }
    };

    const openModal = (meter: Meter | null = null) => {
        if (meter) {
            setEditingMeter(meter);
            setFormData({
                meter_number: meter.meter_number,
                type: meter.type,
                initial_reading: meter.initial_reading.toString(),
                price_per_unit: meter.price_per_unit.toString(),
                vendor_id: meter.vendor_id || '',
                landlord_id: meter.landlord_id || '',
                status: meter.status,
                sgc: (meter as any).sgc?.toString() || '201457',
                krn: (meter as any).krn?.toString() || '1',
                ti: (meter as any).ti?.toString() || '1',
                ea: (meter as any).ea?.toString() || '7',
                ken: (meter as any).ken?.toString() || '255'
            });
        } else {
            setEditingMeter(null);
            setFormData({
                meter_number: '',
                type: 'electricity',
                initial_reading: '0',
                price_per_unit: '0',
                vendor_id: '',
                landlord_id: '',
                status: 'active',
                sgc: '201457',
                krn: '1',
                ti: '1',
                ea: '7',
                ken: '255'
            });
        }
        setShowModal(true);
    };

    if (loading) return <DashboardLoader title="Loading Equipment" subtitle="Syncing meter data..." />;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/80 dark:to-indigo-900/30 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl shrink-0 shadow-sm">
                            <Gauge className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
                            {isAdmin ? 'Infrastructure Directory' : 'Hardware Asset Registry'}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isAdmin ? 'Meter Infrastructure' : 'My Assigned Meters'}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xl font-medium">
                        {isAdmin
                            ? 'Monitor, assign, and manage vending equipment across your vendor network.'
                            : 'Monitor your assigned hardware units and manage unit pricing for end-users.'}
                    </p>
                </motion.div>

                {isAdmin && (
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openModal()}
                        className="
                            group flex items-center gap-2
                            bg-gray-900 dark:bg-white text-white dark:text-gray-900
                            px-6 py-3
                            rounded-2xl
                            font-black text-xs uppercase tracking-widest
                            shadow-xl shadow-gray-200 dark:shadow-none
                            transition-all duration-300
                            hover:shadow-indigo-500/10
                        "
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>Provision Hardware</span>
                    </motion.button>
                )}
            </div>

            {/* Controls Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                <div className="lg:col-span-3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search system by meter serial number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-12 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
                    />
                </div>
                <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 px-4 font-black text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button onClick={fetchMeters} className="p-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm">
                        <Activity size={18} />
                    </button>
                </div>
            </div>

            {/* Error state: fetch failed */}
            {metersFetchError && !loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-3xl p-16 text-center backdrop-blur-sm"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white dark:bg-red-900/30 flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Systems Interrupted</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
                        {metersFetchError}
                    </p>
                    <button
                        type="button"
                        onClick={() => fetchMeters()}
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none transition-all active:scale-[0.98]"
                    >
                        <RefreshCw size={14} />
                        Re-initialize Sync
                    </button>
                </motion.div>
            )}

            {/* Empty state for vendors with no assigned meters */}
            {!isAdmin && meters.length === 0 && !loading && !metersFetchError && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] p-16 text-center shadow-sm"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                        <Gauge className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">No Assets Detected</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
                        Your account has no assigned hardware units. Contact the system administrator to provision assets to your directory.
                    </p>
                    <button
                        type="button"
                        onClick={() => fetchMeters()}
                        className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-750 transition-all"
                    >
                        <RefreshCw size={14} />
                        Check for Assignments
                    </button>
                </motion.div>
            )}

            {/* Empty state for admin with no meters */}
            {isAdmin && meters.length === 0 && !loading && !metersFetchError && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="col-span-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] p-16 text-center shadow-xl shadow-gray-200/50 dark:shadow-none"
                >
                    <div className="w-24 h-24 mx-auto mb-8 rounded-[32px] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Gauge className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Infrastructure Empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-10 font-medium">
                        You haven't provisioned any hardware units to the network yet. Create your first meter to begin distribution.
                    </p>
                    <button
                        type="button"
                        onClick={() => openModal()}
                        className="group inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[10px] uppercase tracking-[0.2em] px-10 py-4 rounded-[20px] shadow-2xl shadow-indigo-500/20 transition-all hover:translate-y-[-2px]"
                    >
                        <Plus size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        Provision Initial Unit
                    </button>
                </motion.div>
            )}

            {/* Meter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {meters.map((meter, index) => (
                        <motion.div
                            key={meter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: Math.min(index * 0.05, 0.3) }}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Gauge className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" size={20} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openModal(meter)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(meter.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 mb-4 relative z-10">
                                <div>
                                    <p className="text-[13px] font-black text-[#0A1F44] dark:text-[#0A1F44] tracking-widest mb-1">
                                       Meter Number: {meter.meter_number}
                                     </p>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white normal tracking-tighter">
                                        Hardware Unit
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            meter.status === 'active' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                        }`}>
                                            {meter.status}
                                        </span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-700">
                                            {meter.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">System Rate</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white flex items-baseline gap-1">
                                            <span className="text-[10px] text-gray-400">KES</span>
                                            {meter.price_per_unit || '0'}
                                        </p>
                                    </div>
                                    <div className="min-w-0 text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Index Dial</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                                            {meter.initial_reading}
                                            <span className="text-[10px] text-gray-400 ml-1">U</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 dark:border-gray-800 relative z-10 space-y-2">
                                {meter.vendor ? (
                                    <div className="flex items-center justify-between group/vendor cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/30 transition-colors group-hover/vendor:bg-indigo-600 group-hover/vendor:text-white">
                                                <Building2 size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Vendor</p>
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                    {meter.vendor.business_name}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover/vendor:translate-x-1 group-hover/vendor:text-indigo-500 transition-all" />
                                    </div>
                                ) : null}
                                {meter.landlord ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800/30">
                                            <Home size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Landlord</p>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                {meter.landlord.full_name}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}
                                {!meter.vendor && !meter.landlord && (
                                    <div className="flex items-center justify-between py-2 bg-amber-50/30 dark:bg-amber-900/10 px-4 rounded-2xl border border-dashed border-amber-200/50 dark:border-amber-800/30">
                                        <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">Unassigned Asset</p>
                                        <ArrowUpRight size={14} className="text-amber-400" />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 min-h-screen">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !loading && setShowModal(false)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden border border-white dark:border-slate-800"
                        >
                            <div className="px-6 py-5 border-b border-gray-100/50 dark:border-slate-800/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 dark:bg-white rounded-xl shadow-lg shadow-gray-200 dark:shadow-none">
                                        <Zap className="w-4 h-4 text-white dark:text-gray-900" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                                            {editingMeter ? 'Update Hardware' : 'Provision Hardware'}
                                        </h2>
                                        <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 normal tracking-widest leading-none mt-0.5">
                                            {editingMeter ? `Unit Index: ${editingMeter.meter_number}` : 'Network Asset Provisioning Engine'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 normal tracking-widest ml-0.5">DRN/PAN(Meter Number)</label>
                                            <div className="relative group/input">
                                                <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                                                <input
                                                    type="text"
                                                    required
                                                    disabled={!isAdmin && editingMeter !== null}
                                                    placeholder="e.g. SN-900XZ"
                                                    value={formData.meter_number}
                                                    onChange={(e) => setFormData({ ...formData, meter_number: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm placeholder:font-medium placeholder:text-gray-300 disabled:opacity-50"
                                                />
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Assign to Vendor</label>
                                                <div className="relative group/input">
                                                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                                                    <select
                                                        value={formData.vendor_id}
                                                        onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                                                        className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Unassigned vendor</option>
                                                        {vendors.map((v) => (
                                                            <option key={v.id} value={v.id}>{v.business_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                                                <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Assign to Landlord</label>
                                                <div className="relative group/input">
                                                    <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                                                    <select
                                                        value={formData.landlord_id}
                                                        onChange={(e) => setFormData({ ...formData, landlord_id: e.target.value })}
                                                        className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Unassigned landlord</option>
                                                        {landlords.map((l) => (
                                                            <option key={l.id} value={l.id}>
                                                                {l.full_name}{l.user?.email ? ` (${l.user.email})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Asset Category</label>
                                            <div className="relative group/input">
                                                <Settings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                                                <select
                                                    value={formData.type}
                                                    disabled={!isAdmin}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="electricity">Electricity (KWh)</option>
                                                    <option value="water">Water (m³)</option>
                                                    <option value="gas">Gas (U)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Operational Status</label>
                                            <select
                                                value={formData.status}
                                                disabled={!isAdmin}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
                                            >
                                                <option value="active">Active (Production)</option>
                                                <option value="inactive">Inactive (Offline)</option>
                                                <option value="maintenance">Maintenance (Repair)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Current Index Dial</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                disabled={!isAdmin && editingMeter !== null}
                                                value={formData.initial_reading}
                                                onChange={(e) => setFormData({ ...formData, initial_reading: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm disabled:opacity-50"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Rate per Unit (KES)</label>
                                            <div className="relative group/input">
                                                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    disabled={isAdmin}
                                                    value={formData.price_per_unit}
                                                    onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-750"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-2 bg-gray-900 dark:bg-white rounded-xl shadow-lg shadow-gray-200 dark:shadow-none">
                                            <Key className="w-4 h-4 text-white dark:text-gray-900" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-[0.15em]">STS Security Protocol</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">SGC Code</label>
                                            <input
                                                type="number"
                                                value={formData.sgc}
                                                onChange={(e) => setFormData({ ...formData, sgc: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-gray-900/50 transition-all font-bold text-[11px]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2.5">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">KRN</label>
                                                <input
                                                    type="number"
                                                    value={formData.krn}
                                                    onChange={(e) => setFormData({ ...formData, krn: e.target.value })}
                                                    className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-gray-900/50 text-center transition-all font-bold text-[11px]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">TI</label>
                                                <input
                                                    type="number"
                                                    value={formData.ti}
                                                    onChange={(e) => setFormData({ ...formData, ti: e.target.value })}
                                                    className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-gray-900/50 text-center transition-all font-bold text-[11px]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">EA</label>
                                                <input
                                                    type="number"
                                                    value={formData.ea}
                                                    onChange={(e) => setFormData({ ...formData, ea: e.target.value })}
                                                    className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-gray-900/50 text-center transition-all font-bold text-[11px]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">KEN</label>
                                                <input
                                                    type="number"
                                                    value={formData.ken}
                                                    onChange={(e) => setFormData({ ...formData, ken: e.target.value })}
                                                    className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-gray-900/50 text-center transition-all font-bold text-[11px]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3 bg-white/50 dark:bg-slate-900/50 -mx-6 -mb-6 p-6 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -1 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs px-8 py-2.5 rounded-xl transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed group/save"
                                    >
                                        <Save className="w-3.5 h-3.5 group-hover/save:scale-110 transition-transform" />
                                        <span>{editingMeter ? 'Save Changes' : 'Confirm Provisioning'}</span>
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Meters;
