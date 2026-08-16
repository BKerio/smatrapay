import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Plus,
    Search,
    MapPin,
    Building2,
    Users,
    AlertTriangle,
    RefreshCw,
    Edit2,
    Trash2,
    Eye,
    Layers,
} from 'lucide-react';
import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';
import api from '@/lib/api';

interface Property {
    id: string;
    landlord_id: string;
    owner: string;
    name: string;
    property_type: 'Apartment' | 'Zone';
    no_of_units: number;
    location: string;
    status: string;
}

const MyProperties: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        property_type: 'Apartment' as 'Apartment' | 'Zone',
        no_of_units: 1,
        location: '',
    });

    const fetchProperties = async (searchQuery = '') => {
        try {
            setLoading(true);
            const res = await api.get(`/landlord/properties?search=${searchQuery}`);
            if (res.data.status === 200) {
                setProperties(res.data.properties);
            }
        } catch (error) {
            console.error('Failed to load properties', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProperties(search);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleOpenModal = (property?: Property) => {
        if (property) {
            setEditingId(property.id);
            setFormData({
                name: property.name,
                property_type: property.property_type,
                no_of_units: property.no_of_units,
                location: property.location,
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                property_type: 'Apartment',
                no_of_units: 1,
                location: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/landlord/properties/${editingId}`, formData);
                Swal.fire({ icon: 'success', title: 'Updated', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            } else {
                await api.post('/landlord/properties', formData);
                Swal.fire({ icon: 'success', title: 'Added', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
            }
            setShowModal(false);
            fetchProperties(search);
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to save property', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        Swal.fire({
            title: 'Delete Property?',
            text: `Are you sure you want to delete ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Yes, delete it',
            reverseButtons: true
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/landlord/properties/${id}`);
                    Swal.fire({ icon: 'success', title: 'Deleted!', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
                    fetchProperties(search);
                } catch (error: any) {
                    Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to delete' });
                }
            }
        });
    };

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Home className="text-blue-600 dark:text-blue-400" size={28} />
                        My Properties
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage your apartments, zones, and tracking units.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-[#0A1F44] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Plus size={18} />
                    Add Property
                </button>
                <Link
                    to="/dashboard/location-hierarchy"
                    className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <Layers size={18} />
                    Manage Zones & Units
                </Link>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                
                {/* Search */}
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search properties by name or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => fetchProperties()}
                        className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors shrink-0"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex-1 sm:flex-none flex items-center justify-center px-4 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-full">
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                            {properties.length} Properties
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading && properties.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-8 flex justify-center">
                    <DashboardLoader title="Loading Properties..." subtitle="Fetching your property portfolio" />
                </div>
            ) : properties.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No properties found</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                        {search ? "We couldn't find any properties matching your search." : "You haven't added any properties yet."}
                    </p>
                    {!search && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-5 py-2.5 bg-[#0A1F44] hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-500/20 inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Your First Property
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700/50">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Property Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type & Units</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                                <AnimatePresence mode="popLayout">
                                    {properties.map((prop, index) => (
                                        <motion.tr
                                            key={prop.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ delay: Math.min(index * 0.03, 0.2) }}
                                            className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100/50 dark:border-blue-800/50 group-hover:scale-105 transition-transform text-blue-600 dark:text-blue-400">
                                                            {prop.property_type === 'Apartment' ? <Building2 size={20} /> : <Home size={20} />}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${prop.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                                                            {prop.name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                                            Owner: {prop.owner}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                        prop.property_type === 'Apartment'
                                                            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
                                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
                                                    }`}>
                                                        {prop.property_type}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                                        <Users size={12} className="opacity-70" />
                                                        {prop.no_of_units} Units
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-start gap-2 max-w-[200px]">
                                                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 break-words leading-snug">
                                                        {prop.location}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                                                    prop.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${prop.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                    {prop.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setViewingProperty(prop)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(prop)}
                                                        className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                        title="Edit Property"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(prop.id, prop.name)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                        title="Delete Property"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Property' : 'Add Property'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition text-slate-700 dark:text-slate-300"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            
                            {/* Property Type Toggle */}
                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, property_type: 'Apartment' })}
                                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                        formData.property_type === 'Apartment' 
                                            ? 'bg-white dark:bg-slate-700 text-[#0A1F44] dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Apartment
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, property_type: 'Zone' })}
                                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                        formData.property_type === 'Zone' 
                                            ? 'bg-white dark:bg-slate-700 text-[#0A1F44] dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    Zone
                                </button>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Property Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                    placeholder="e.g. Sunset Apartments"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Number of Units</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.no_of_units}
                                    onChange={(e) => setFormData({ ...formData, no_of_units: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Location Details</label>
                                <textarea
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors resize-none h-24"
                                    placeholder="Enter physical address or map location description..."
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-3 bg-[#0A1F44] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : editingId ? 'Update Property' : 'Add Property'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* View Property Details Modal */}
            <AnimatePresence>
                {viewingProperty && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setViewingProperty(null)}
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {viewingProperty.property_type === 'Apartment' ? <Building2 size={20} className="text-blue-500" /> : <Home size={20} className="text-blue-500" />}
                                        {viewingProperty.name}
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                                        Property Details
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewingProperty(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 transition text-slate-700 dark:text-slate-300"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Owner & Status Card */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#0A1F44] flex items-center justify-center text-white font-bold shadow-sm">
                                            {viewingProperty.owner.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium mb-0.5">Property Owner</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{viewingProperty.owner}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                                        viewingProperty.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50'
                                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${viewingProperty.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        {viewingProperty.status}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 size={14} /> Type
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {viewingProperty.property_type}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Users size={14} /> Units
                                        </p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {viewingProperty.no_of_units} Registered
                                        </p>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <MapPin size={14} /> Location Address
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {viewingProperty.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Actions */}
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setViewingProperty(null)}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setViewingProperty(null);
                                        handleOpenModal(viewingProperty);
                                    }}
                                    className="px-5 py-2.5 bg-[#0A1F44] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all flex items-center gap-2"
                                >
                                    <Edit2 size={16} /> Edit Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyProperties;
