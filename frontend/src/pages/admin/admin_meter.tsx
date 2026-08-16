import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

import { 
  Building2, 
  Gauge, 
  Plus, 
  RefreshCw, 
  Save, 
  Search, 
  X, 
  Settings, 
  Zap,
  Key,
  Pencil,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLoader from '@/lib/loader';

type RawVendor = {
  id?: string;
  _id?: string;
  business_name?: string;
  address?: string;
  account_id?: string;
  paybill?: string;
  status?: string;
};

type Vendor = {
  id: string;
  business_name: string;
  address?: string;
  account_id?: string;
  paybill?: string;
  status?: string;
};

type RawMeter = {
  id?: string;
  _id?: string;
  meter_number?: string;
  type?: string;
  initial_reading?: number;
  price_per_unit?: number;
  status?: 'active' | 'inactive' | 'maintenance' | string;
  vendor_id?: string | null;
  vendor?: { id?: string; _id?: string; business_name?: string };
};

type Meter = {
  id: string;
  meter_number: string;
  type: string;
  initial_reading: number;
  price_per_unit: number;
  status: 'active' | 'inactive' | 'maintenance' | string;
  vendor_id: string | null;
  sgc?: number;
  krn?: number;
  ti?: number;
  ea?: number;
  ken?: number;
};

interface UserContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roles?: string[];
  };
}

function normalizeVendor(v: RawVendor): Vendor | null {
  const id = String(v?.id ?? v?._id ?? '').trim();
  if (!id) return null;
  return {
    id,
    business_name: String(v?.business_name ?? '').trim(),
    address: v?.address ? String(v.address) : undefined,
    account_id: v?.account_id ? String(v.account_id) : undefined,
    paybill: v?.paybill ? String(v.paybill) : undefined,
    status: v?.status ? String(v.status) : undefined,
  };
}

function normalizeMeter(m: RawMeter): Meter | null {
  const id = String(m?.id ?? m?._id ?? '').trim();
  if (!id) return null;

  const vendorId =
    (m?.vendor_id ? String(m.vendor_id) : '') ||
    String(m?.vendor?.id ?? m?.vendor?._id ?? '').trim() ||
    null;

  return {
    id,
    meter_number: String(m?.meter_number ?? '').trim(),
    type: String(m?.type ?? '').trim() || 'electricity',
    initial_reading: Number(m?.initial_reading ?? 0),
    price_per_unit: Number(m?.price_per_unit ?? 0),
    status: (m?.status ?? 'active') as Meter['status'],
    vendor_id: vendorId && vendorId.length > 0 ? vendorId : null,
  };
}

function isVendorOnly(user: UserContext['user'] | null | undefined): boolean {
  if (!user) return false;
  const role = (user.role ?? '').toLowerCase().trim();
  const roles = (user.roles ?? []).map((r: string) => String(r).toLowerCase().trim());
  if (role === 'vendor') return true;
  if (roles.length > 0 && roles.includes('vendor') && !roles.some((r) => ['admin', 'system_admin', 'administrator', 'super_admin', 'superadmin'].includes(r))) return true;
  return false;
}

function AdminMeter() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const outletContext = useOutletContext<UserContext>();
  const user = outletContext?.user;
  const isVendor = isVendorOnly(user);
  const canAccess = !isVendor;

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [meters, setMeters] = useState<Meter[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningVendor, setAssigningVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [meterForm, setMeterForm] = useState({
    meter_number: '',
    type: 'electricity',
    initial_reading: '0',
    status: 'active',
    sgc: '201457',
    krn: '1',
    ti: '1',
    ea: '7',
    ken: '255'
  });
  const [editingMeter, setEditingMeter] = useState<Meter | null>(null);

  const openAssignModal = (vendor: Vendor) => {
    setAssigningVendor(vendor);
    setEditingMeter(null);
    setMeterForm({
      meter_number: '',
      type: 'electricity',
      initial_reading: '0',
      status: 'active',
      sgc: '201457',
      krn: '1',
      ti: '1',
      ea: '7',
      ken: '255'
    });
    setAssignModalOpen(true);
  };

  const handleEditMeter = (m: Meter) => {
    const vendor = vendors.find(v => v.id === m.vendor_id);
    if (!vendor) return;
    
    setAssigningVendor(vendor);
    setEditingMeter(m);
    setMeterForm({
      meter_number: m.meter_number,
      type: m.type,
      initial_reading: m.initial_reading?.toString() || '0',
      status: m.status,
      sgc: (m as any).sgc?.toString() || '201457',
      krn: (m as any).krn?.toString() || '1',
      ti: (m as any).ti?.toString() || '1',
      ea: (m as any).ea?.toString() || '7',
      ken: (m as any).ken?.toString() || '255'
    });
    setAssignModalOpen(true);
  };

  const handleDeleteMeter = async (id: string) => {
    const result = await Swal.fire({
      title: 'Remove Meter?',
      text: 'This operation will unbind this meter from the system. Proceed?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#111827',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      customClass: {
        title: 'text-xl font-black tracking-tight',
        popup: 'rounded-[24px]'
      }
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      try {
        await axios.delete(`${API_URL}/admin/meters/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Meter has been removed.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
        fetchMeters();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to delete meter',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    }
  };

  const fetchMeters = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/admin/meters?per_page=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawList = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      const list = Array.isArray(rawList)
        ? (rawList as RawMeter[])
          .map(normalizeMeter)
          .filter((m): m is Meter => m !== null && Boolean(m.meter_number))
        : [];
      setMeters(list);
    } catch (e: unknown) {
      console.error('Failed to load meters:', e);
    }
  }, [API_URL]);

  const fetchVendors = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/admin/vendors?per_page=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawList = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      const list = Array.isArray(rawList)
        ? (rawList as RawVendor[])
          .map(normalizeVendor)
          .filter((v): v is Vendor => Boolean(v))
        : [];
      setVendors(list);
    } catch (e: unknown) {
      console.error('Failed to load vendors:', e);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchVendors(), fetchMeters()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (user && isVendor) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (canAccess && user) {
      fetchVendors();
      fetchMeters();
    }
  }, [user, isVendor, canAccess, fetchVendors, fetchMeters, navigate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => v.business_name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
  }, [vendors, search]);

  const metersByVendor = useMemo(() => {
    const map = new Map<string, Meter[]>();
    for (const m of meters) {
      if (!m.vendor_id) continue;
      const list = map.get(m.vendor_id) ?? [];
      list.push(m);
      map.set(m.vendor_id, list);
    }
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => a.meter_number.localeCompare(b.meter_number));
      map.set(k, list);
    }
    return map;
  }, [meters]);

  const submitMeterAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningVendor) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      if (editingMeter) {
        await axios.put(
          `${API_URL}/admin/meters/${editingMeter.id}`,
          {
            meter_number: meterForm.meter_number.trim(),
            vendor_id: assigningVendor.id,
            type: meterForm.type,
            initial_reading: parseFloat(meterForm.initial_reading || '0'),
            status: meterForm.status,
            sgc: parseInt(meterForm.sgc || '201457', 10),
            krn: parseInt(meterForm.krn || '1', 10),
            ti: parseInt(meterForm.ti || '1', 10),
            ea: parseInt(meterForm.ea || '7', 10),
            ken: parseInt(meterForm.ken || '255', 10)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${API_URL}/admin/meters`,
          {
            meter_number: meterForm.meter_number.trim(),
            vendor_id: assigningVendor.id,
            type: meterForm.type,
            initial_reading: parseFloat(meterForm.initial_reading || '0'),
            status: meterForm.status,
            sgc: parseInt(meterForm.sgc || '201457', 10),
            krn: parseInt(meterForm.krn || '1', 10),
            ti: parseInt(meterForm.ti || '1', 10),
            ea: parseInt(meterForm.ea || '7', 10),
            ken: parseInt(meterForm.ken || '255', 10)
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: editingMeter ? 'Meter updated successfully' : 'Meter assigned to vendor',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      setAssignModalOpen(false);
      setEditingMeter(null);
      fetchMeters();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to assign meter',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) return <DashboardLoader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header - Matching SystemConfig pattern */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3.5 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/80 dark:to-indigo-900/30 border border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl shrink-0 shadow-sm">
                <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                  Vendor Directory
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage vendors and meter assignments across the network
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name or ID..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center justify-center lg:justify-end px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-2xl">
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                {filtered.length} Vendors Found
             </span>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((v, idx) => (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group"
              >
                {/* Card Top Section */}
                <div className="p-4 border-b border-gray-50 dark:border-gray-700/50">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <Building2 className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                      v.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' 
                        : 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                    }`}>
                      {v.status || 'Offline'}
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-gray-900 dark:text-white truncate tracking-tight mb-0.5">
                    {v.business_name || 'Unnamed Business'}
                  </h3>
                 
                </div>

                {/* Card Stats/Details Section */}
                <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 grid grid-cols-2 gap-2">
                   <div className="min-w-0">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Account</span>
                      <span className="block text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{v.account_id || '—'}</span>
                   </div>
                   <div className="min-w-0 text-right">
                      <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">Paybill</span>
                      <span className="block text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{v.paybill || '—'}</span>
                   </div>
                </div>

                {/* Meters List Section */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[9px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                        Meters
                      </span>
                    </div>
                    <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-black">
                      {metersByVendor.get(v.id)?.length || 0}
                    </span>
                  </div>

                  {metersByVendor.get(v.id)?.length ? (
                    <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1 flex-1 custom-scrollbar">
                      {metersByVendor.get(v.id)!.map((m) => (
                        <div key={m.id} className="p-2 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-50 dark:border-gray-700 flex items-center justify-between group/meter hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors shadow-sm">
                          <div className="min-w-0">
                            <div className="text-xs font-black text-gray-800 dark:text-white truncate tracking-tight">{m.meter_number}</div>
                            <div className="text-[8px] font-bold text-gray-400 uppercase">
                              {m.status}
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                             <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                                {m.price_per_unit || '0'}
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover/meter:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditMeter(m)}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMeter(m.id)}
                                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl opacity-50">
                      <Settings className="w-5 h-5 text-gray-200 mb-1" />
                      <span className="text-[8px] font-bold text-gray-400 uppercase italic">Empty</span>
                    </div>
                  )}

                  {/* Action Footer - Consistent Button Style */}
                  <div className="mt-4">
                    <button
                      onClick={() => openAssignModal(v)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl hover:translate-y-[-1px] active:scale-[0.98] transition-all shadow-md group/btn"
                    >
                      <Plus className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform duration-300" />
                      <span>Assign Meter</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[40px] flex items-center justify-center mb-6 shadow-inner">
               <Building2 className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-2">No results found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              We couldn't find any vendors matching your search criteria. Try a different keyword or refresh the page.
            </p>
          </motion.div>
        )}

      </div>

      {/* Assign Meter Modal - Matching Main Button Style (gray-900/white) */}
      <AnimatePresence>
        {assignModalOpen && assigningVendor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => !submitting && setAssignModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] shadow-2xl relative z-10 overflow-hidden border border-white dark:border-slate-800"
            >
              <div className="px-6 py-5 border-b border-gray-100/50 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-gray-900 dark:bg-white rounded-xl shadow-lg shadow-gray-200 dark:shadow-none">
                      <Zap className="w-4 h-4 text-white dark:text-gray-900" />
                   </div>
                   <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight">
                      {editingMeter ? 'Update Hardware' : 'Assignment Engine'}
                    </h2>
                    <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 normal tracking-widest leading-none mt-0.5">
                      {editingMeter ? `Device: ${editingMeter.meter_number}` : `Target: ${assigningVendor?.business_name}`}
                    </p>
                   </div>
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAssignModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={submitMeterAssignment} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar relative">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Dealer Reference Number</label>
                      <div className="relative group/input">
                        <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                        <input
                          type="text"
                          required
                          value={meterForm.meter_number}
                          onChange={(e) => setMeterForm({ ...meterForm, meter_number: e.target.value })}
                          placeholder="e.g. MTR-X9002"
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm placeholder:font-medium placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Usage Category</label>
                      <div className="relative group/input">
                        <Settings className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within/input:text-gray-900 dark:group-focus-within/input:text-white transition-colors" />
                        <select
                          value={meterForm.type}
                          onChange={(e) => setMeterForm({ ...meterForm, type: e.target.value })}
                          className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                          <option value="electricity">Electricity (KWh)</option>
                          <option value="water">Water (m³)</option>
                          <option value="gas">Gas (U)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Initial Read</label>
                      <input
                        type="number"
                        step="0.01"
                        value={meterForm.initial_reading}
                        onChange={(e) => setMeterForm({ ...meterForm, initial_reading: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-0.5">Status</label>
                      <select
                        value={meterForm.status}
                        onChange={(e) => setMeterForm({ ...meterForm, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-4 focus:ring-gray-500/10 focus:border-gray-900/50 transition-all font-bold text-sm appearance-none cursor-pointer text-emerald-600 dark:text-emerald-400"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
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
                          value={meterForm.sgc}
                          onChange={(e) => setMeterForm({ ...meterForm, sgc: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-amber-500/50 transition-all font-bold text-[11px]"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">KRN</label>
                          <input
                            type="number"
                            value={meterForm.krn}
                            onChange={(e) => setMeterForm({ ...meterForm, krn: e.target.value })}
                            className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-amber-500/50 text-center transition-all font-bold text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">TI</label>
                          <input
                            type="number"
                            value={meterForm.ti}
                            onChange={(e) => setMeterForm({ ...meterForm, ti: e.target.value })}
                            className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-amber-500/50 text-center transition-all font-bold text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">EA</label>
                          <input
                            type="number"
                            value={meterForm.ea}
                            onChange={(e) => setMeterForm({ ...meterForm, ea: e.target.value })}
                            className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-amber-500/50 text-center transition-all font-bold text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-gray-400 uppercase ml-0.5">KEN</label>
                          <input
                            type="number"
                            value={meterForm.ken}
                            onChange={(e) => setMeterForm({ ...meterForm, ken: e.target.value })}
                            className="w-full px-1 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:border-amber-500/50 text-center transition-all font-bold text-[11px]"
                          />
                        </div>
                      </div>
                   </div>
                </div>

                {/* Modal Footer Buttons - Matching Main "Assign Meter" Button Style */}
                <div className="pt-6 flex justify-end gap-3 bg-white/50 dark:bg-slate-900/50 -mx-6 -mb-6 p-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setAssignModalOpen(false)}
                    className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Discard
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs px-8 py-2.5 rounded-xl transition-all shadow-xl shadow-gray-200 dark:shadow-none disabled:bg-gray-300 disabled:cursor-not-allowed group/save"
                  >
                    {submitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 group-hover/save:scale-110 transition-transform" />
                    )}
                    <span>{submitting ? (editingMeter ? 'Updating...' : 'Assigning...') : (editingMeter ? 'Save Changes' : 'Confirm Assignment')}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminMeter;