import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Save,
    Phone,
    Mail,
    MapPin,
    Gauge,
    UserCircle,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';
import PhoneInput from '@/components/ui/PhoneInput';
import { CountryCode, parseInternational, toInternational } from '@/lib/phone';

interface Meter {
    id: string;
    meter_number: string;
    price_per_unit?: number;
}

interface Customer {
    id: string;
    vendor_id: string;
    meter_id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    county_id: number | string;
    constituency_id: number | string;
    ward_id: number | string;
    status: 'active' | 'inactive';
    meter?: Meter;
}

interface LocationItem {
    id: number;
    description: string;
}


const CustomerManagement = () => {
    const navigate = useNavigate();

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
    const [counties, setCounties] = useState<LocationItem[]>([]);
    const [constituencies, setConstituencies] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Vending state
    const [vendingCustomer, setVendingCustomer] = useState<Customer | null>(null);
    const [vendAmount, setVendAmount] = useState('');
    const [isVending, setIsVending] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        meter_id: '',
        county_id: '',
        constituency_id: '',
        ward_id: '',
        status: 'active'
    });
    const [phoneCountry, setPhoneCountry] = useState<CountryCode>('KE');
    const [phoneLocal, setPhoneLocal] = useState('');

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

    const fetchCounties = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/locations/counties`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCounties(response.data);
        } catch (error) {
            console.error('Failed to fetch counties', error);
        }
    }, [API_URL]);

    const fetchConstituencies = async (countyId: string | number) => {
        if (!countyId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/locations/constituencies?county_id=${countyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConstituencies(response.data);
            setWards([]); // Reset wards
        } catch (error) {
            console.error('Failed to fetch constituencies', error);
        }
    };

    const fetchWards = async (constituencyId: string | number) => {
        if (!constituencyId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/locations/wards?constituency_id=${constituencyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWards(response.data);
        } catch (error) {
            console.error('Failed to fetch wards', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchMeters();
        fetchCounties();
    }, [fetchCustomers, fetchMeters, fetchCounties]);

    const handleCountyChange = (countyId: string) => {
        setFormData(prev => ({ ...prev, county_id: countyId, constituency_id: '', ward_id: '' }));
        fetchConstituencies(countyId);
    };

    const handleConstituencyChange = (constituencyId: string) => {
        setFormData(prev => ({ ...prev, constituency_id: constituencyId, ward_id: '' }));
        fetchWards(constituencyId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneLocal.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Phone number is required',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                phone: toInternational(phoneLocal, phoneCountry),
            };
            if (editingCustomer) {
                await axios.put(`${API_URL}/admin/customers/${editingCustomer.id}`, payload, {
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
                await axios.post(`${API_URL}/admin/customers`, payload, {
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
            title: 'Delete Customer?',
            text: "This will remove the customer and their link to the meter.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete',
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
                    title: 'Deleted',
                    text: 'Customer deleted',
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

    const handleVendToken = (customer: Customer) => {
        if (!customer.meter) {
            Swal.fire({
                icon: 'warning',
                title: 'No Meter Linked',
                text: 'This customer must be linked to a meter before vending.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }
        navigate(`/dashboard/token-management?meter=${encodeURIComponent(customer.meter.meter_number)}`);
    };

    const submitVendToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendingCustomer || !vendingCustomer.meter) return;

        setIsVending(true);
        const isDarkMode = document.documentElement.classList.contains('dark');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/tokens/generate`, {
                meter_id: vendingCustomer.meter.id,
                amount: parseFloat(vendAmount) // Use correct numeric amount
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setVendingCustomer(null);

            // Format token display
            const generatedTokens = response.data.tokens || [];
            if (generatedTokens.length === 0) throw new Error("No tokens generated");

            const rawToken = typeof generatedTokens[0] === 'string'
                ? generatedTokens[0].replace(/\s/g, '')
                : String(generatedTokens[0]);

            const displayToken = rawToken.match(/.{1,4}/g)?.join('-') || rawToken;

            // Calculations
            const amountVal = parseFloat(vendAmount);
            const price = vendingCustomer.meter.price_per_unit && vendingCustomer.meter.price_per_unit > 0
                ? vendingCustomer.meter.price_per_unit
                : 1; // Fallback to 1 if not set to avoid infinity
            const units = (amountVal / price).toFixed(1);

            // Date formatting
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd} ${hh}:${min}`;

            Swal.fire({
                icon: 'success',
                title: 'Token generated successfully!',
                width: 'auto',
                customClass: {
                    popup: 'mx-4 rounded-3xl'
                },
                html: `
                    <div class="mt-2 p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-left font-mono text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 shadow-sm tracking-tight leading-relaxed max-w-[340px] md:max-w-full mx-auto">
                        <div class="mb-1 text-slate-900 dark:text-white font-bold text-[14px] sm:text-[15px] break-all leading-snug">Token:${displayToken}</div>
                        <div class="mb-1 mt-2">Mtr:${vendingCustomer.meter.meter_number}</div>
                        <div class="mb-1">Date:${dateStr}</div>
                        <div class="mb-1">Units:${units}</div>
                        <div class="mb-1">Amt:${amountVal.toFixed(2)}</div>
                        <div class="mb-1">TknAmt:${amountVal.toFixed(2)}</div>
                        <div class="mb-1">OtherCharges:0.00</div>
                    </div>
                `,
                background: isDarkMode ? '#0f172a' : '#fff',
                color: isDarkMode ? '#fff' : '#000',
                confirmButtonColor: '#1f2127',
                confirmButtonText: 'Copy to Clipboard',
                allowOutsideClick: false
            }).then((result) => {
                if (result.isConfirmed) {
                    try {
                        if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(displayToken);
                        } else {
                            // Textarea fallback
                            const textArea = document.createElement("textarea");
                            textArea.value = displayToken;

                            // Prevent scrolling to bottom of page in Microsoft Edge
                            textArea.style.position = 'fixed';
                            textArea.style.top = '0';
                            textArea.style.left = '0';
                            textArea.style.opacity = '0';

                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();

                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                        }

                        Swal.fire({
                            icon: 'success',
                            title: 'Copied!',
                            text: 'Token copied to clipboard',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 2000
                        });
                    } catch (err) {
                        console.error('Failed to copy text: ', err);
                        Swal.fire({
                            icon: 'warning',
                            title: 'Manual Copy Needed',
                            text: 'Could not auto-copy. Please select and copy the token manually.',
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                }
            });

        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Vending Failed',
                text: error.response?.data?.error_details || error.response?.data?.message || 'A network error occurred contacting the vending server',
                background: isDarkMode ? '#0f172a' : '#fff',
                color: isDarkMode ? '#fff' : '#000',
                confirmButtonColor: '#2563eb'
            });
        } finally {
            setIsVending(false);
        }
    };

    const openModal = async (customer: Customer | null = null) => {
        if (customer) {
            const parsedPhone = parseInternational(customer.phone);
            setEditingCustomer(customer);
            setPhoneCountry(parsedPhone.country);
            setPhoneLocal(parsedPhone.local);
            setFormData({
                name: customer.name,
                phone: customer.phone,
                email: customer.email || '',
                address: customer.address || '',
                meter_id: customer.meter_id,
                county_id: customer.county_id.toString(),
                constituency_id: customer.constituency_id.toString(),
                ward_id: customer.ward_id.toString(),
                status: customer.status
            });
            // Fetch child locations for editing
            await fetchConstituencies(customer.county_id);
            await fetchWards(customer.constituency_id);
        } else {
            setEditingCustomer(null);
            setPhoneCountry('KE');
            setPhoneLocal('');
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                meter_id: '',
                county_id: '',
                constituency_id: '',
                ward_id: '',
                status: 'active'
            });
            setConstituencies([]);
            setWards([]);
        }
        setShowModal(true);
    };

    if (loading) return <DashboardLoader title="Loading CRM" subtitle="Preparing customer management..." />;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-400">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                            <Users size={24} />
                        </div>
                        <span className="font-bold tracking-widest uppercase text-xs">Vendor Portal</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        <span className="text-[#0A1F44]/90 dark:text-white">Customer Overview</span>
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xl">
                        Manage your clients, link meters, and specify installation locations.
                    </p>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => openModal()}
                    className="
                            group flex items-center gap-2
                            bg-[#0A1F44] text-white
                            px-5 py-2.5
                            rounded-xl
                            font-medium text-sm
                            shadow-md
                            transition-all duration-200
                            hover:bg-[#0A1F44]/90
                            focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30
                        "
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-200" />
                    <span>New Customer</span>
                </motion.button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20 px-8">
                                <th className="py-5 px-8 text-xs font-black text-slate-400 normal tracking-widest border-b border-slate-100 dark:border-slate-800">Customer</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 normal tracking-widest border-b border-slate-100 dark:border-slate-800">Meter Number(DRN/PAN)</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 normal tracking-widest border-b border-slate-100 dark:border-slate-800">Location</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 normal tracking-widest border-b border-slate-100 dark:border-slate-800 text-center">Status</th>
                                <th className="py-5 px-8 text-xs font-black text-slate-400 normal tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
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
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{customer.name}</p>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Phone size={10} /> {customer.phone}
                                                    </p>
                                                    {customer.email && (
                                                        <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                            <Mail size={10} /> {customer.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                            <Gauge size={14} className="text-blue-500" />
                                            {customer.meter?.meter_number || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                            <MapPin size={14} className="text-slate-300" />
                                            <span className="truncate max-w-[150px]">{customer.address || 'No address set'}</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-8 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${customer.status === 'active'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800/50'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
                                            }`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleVendToken(customer)}
                                                className="p-2 text-slate-400 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-lg transition-all"
                                                title="Vend Token"
                                            >
                                                <Zap size={16} />
                                            </button>
                                            <button
                                                onClick={() => openModal(customer)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800 my-auto"
                        >
                            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                        <UserCircle size={20} />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-red-500">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Personal Info */}
                                    <div className="md:col-span-2 space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Primary Identity</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="e.g. Samuel Kiptoo"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Mobile Phone</label>
                                                <PhoneInput
                                                    country={phoneCountry}
                                                    value={phoneLocal}
                                                    onCountryChange={setPhoneCountry}
                                                    onChange={setPhoneLocal}
                                                    placeholder="0717000440"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                        placeholder="customer@example.com"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Info */}
                                    <div className="md:col-span-2 space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Installation Location</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">County</label>
                                                <select
                                                    required
                                                    value={formData.county_id}
                                                    onChange={(e) => handleCountyChange(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">Select County</option>
                                                    {counties.map(c => (
                                                        <option key={c.id} value={c.id}>{c.description}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Constituency</label>
                                                <select
                                                    required
                                                    disabled={!formData.county_id}
                                                    value={formData.constituency_id}
                                                    onChange={(e) => handleConstituencyChange(e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                                >
                                                    <option value="">Select Constituency</option>
                                                    {constituencies.map(c => (
                                                        <option key={c.id} value={c.id}>{c.description}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Ward</label>
                                                <select
                                                    required
                                                    disabled={!formData.constituency_id}
                                                    value={formData.ward_id}
                                                    onChange={(e) => setFormData({ ...formData, ward_id: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                                                >
                                                    <option value="">Select Ward</option>
                                                    {wards.map(w => (
                                                        <option key={w.id} value={w.id}>{w.description}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hardware Assignment */}
                                    <div className="md:col-span-2 space-y-3">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">Hardware Assignment</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Linked Meter</label>
                                                <select
                                                    required
                                                    value={formData.meter_id}
                                                    onChange={(e) => setFormData({ ...formData, meter_id: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                >
                                                    <option value="">Choose Meter...</option>
                                                    {availableMeters.map(m => (
                                                        <option key={m.id} value={m.id}>SN: {m.meter_number}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Specific Address</label>
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                                    placeholder="Building, House No..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-[#0A1F44] rounded-xl hover:bg-[#0A1F44]/90 transition-colors shadow-md flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        <span>{editingCustomer ? 'Update Records' : 'Save Customer'}</span>
                                    </motion.button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Vending Modal */}
            <AnimatePresence>
                {vendingCustomer && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isVending && setVendingCustomer(null)}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl relative z-10 overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 border-b-slate-100/50 dark:bg-slate-900/10 dark:border-b-slate-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg text-slate-600 dark:text-slate-400">
                                        <Zap size={20} className={isVending ? 'animate-pulse' : ''} />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                        Vending Power
                                    </h2>
                                </div>
                                {!isVending && (
                                    <button onClick={() => setVendingCustomer(null)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-red-500">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={submitVendToken} className="p-5">
                                <div className="mb-5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{vendingCustomer.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meter SN</span>
                                        <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{vendingCustomer.meter?.meter_number}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">Purchase Amount (KES)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Ksh</span>
                                            <input
                                                type="number"
                                                min="25"
                                                step="0.01"
                                                required
                                                disabled={isVending}
                                                value={vendAmount}
                                                onChange={(e) => setVendAmount(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-12 pr-4 text-lg font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none transition-all disabled:opacity-50"
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        disabled={isVending}
                                        onClick={() => setVendingCustomer(null)}
                                        className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={!(isVending || !vendAmount || parseFloat(vendAmount) < 25) ? { scale: 1.02 } : {}}
                                        whileTap={!(isVending || !vendAmount || parseFloat(vendAmount) < 25) ? { scale: 0.98 } : {}}
                                        type="submit"
                                        disabled={isVending || !vendAmount || parseFloat(vendAmount) < 25}
                                        className="px-5 py-2 text-sm font-medium text-white bg-[#0A1F44] rounded-xl hover:bg-[#0A1F44]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center gap-2"
                                    >
                                        {isVending ? (
                                            <>
                                                <Zap className="animate-spin" size={16} />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={16} />
                                                <span>Generate Token</span>
                                            </>
                                        )}
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

export default CustomerManagement;
