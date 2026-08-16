import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Plus,
    ChevronRight,
    ChevronDown,
    Layers,
    Route,
    Home,
    Building2,
    Users,
    Trash2,
    UserPlus,
    RefreshCw,
    ArrowLeft,
    Gauge,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '@/lib/api';
import DashboardLoader from '@/lib/loader';

interface Property {
    id: string;
    name: string;
    location: string;
    no_of_units?: number;
}

interface PropertyUnitRow {
    id: string;
    name: string;
    unit_number?: string;
    status: string;
    parent_type: string;
    parent_id: string;
    location_path: string;
    meter_id?: string | null;
    meter_number?: string | null;
}

interface ParentOption {
    id: string;
    type: 'zone' | 'route' | 'street';
    label: string;
}

interface Tenant {
    id: string;
    name: string;
    phone: string;
    email?: string;
    status: string;
    node_type: string;
    node_id: string;
}

interface AssignedMeter {
    id: string;
    meter_number: string;
    status: string;
}

interface UnitNode {
    id: string;
    name: string;
    unit_number?: string;
    status: string;
    type: 'unit';
    parent_type: string;
    parent_id: string;
    meter_id?: string | null;
    meter_number?: string | null;
}

interface StreetNode {
    id: string;
    name: string;
    status: string;
    type: 'street';
    units: UnitNode[];
    tenants: Tenant[];
}

interface RouteNode {
    id: string;
    name: string;
    status: string;
    type: 'route';
    streets: StreetNode[];
    units: UnitNode[];
    tenants: Tenant[];
}

interface ZoneNode {
    id: string;
    name: string;
    status: string;
    type: 'zone';
    routes: RouteNode[];
    units: UnitNode[];
    tenants: Tenant[];
}

type NodeType = 'zone' | 'route' | 'street' | 'unit';
type AddType = 'zone' | 'route' | 'street' | 'unit' | 'tenant';

interface SelectedNode {
    type: NodeType;
    id: string;
    name: string;
    propertyId: string;
    parentType?: 'zone' | 'route' | 'street';
    parentId?: string;
    meter_id?: string | null;
    meter_number?: string | null;
}

const LocationHierarchy: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [tree, setTree] = useState<ZoneNode[]>([]);
    const [allUnits, setAllUnits] = useState<PropertyUnitRow[]>([]);
    const [allTenants, setAllTenants] = useState<Tenant[]>([]);
    const [assignedMeters, setAssignedMeters] = useState<AssignedMeter[]>([]);
    const [meterDrafts, setMeterDrafts] = useState<Record<string, string>>({});
    const [selectedMeterId, setSelectedMeterId] = useState('');
    const [assigningMeter, setAssigningMeter] = useState(false);
    const [savingAllMeters, setSavingAllMeters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingTree, setLoadingTree] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

    const [modal, setModal] = useState<{
        type: AddType;
        parentId?: string;
        parentType?: 'zone' | 'route' | 'street';
        editId?: string;
        initialName?: string;
        initialUnitNumber?: string;
    } | null>(null);
    const [formName, setFormName] = useState('');
    const [formUnitNumber, setFormUnitNumber] = useState('');
    const [formMeterId, setFormMeterId] = useState('');
    const [tenantForm, setTenantForm] = useState({ name: '', phone: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [bulkForm, setBulkForm] = useState({
        parentKey: '',
        count: 10,
        namePrefix: 'Unit',
        startNumber: 1,
    });
    const [bulkSaving, setBulkSaving] = useState(false);

    const fetchProperties = async () => {
        const res = await api.get('/landlord/properties');
        if (res.data.status === 200) {
            const list: Property[] = res.data.properties;
            setProperties(list);
            if (!selectedPropertyId && list.length > 0) {
                setSelectedPropertyId(list[0].id);
            }
        }
    };

    const fetchHierarchy = async (propertyId: string) => {
        if (!propertyId) return;
        setLoadingTree(true);
        try {
            const res = await api.get(`/landlord/properties/${propertyId}/hierarchy`);
            if (res.data.status === 200) {
                const units: PropertyUnitRow[] = res.data.all_units ?? [];
                setTree(res.data.tree ?? []);
                setAllUnits(units);
                setAllTenants(res.data.tenants ?? []);
                setAssignedMeters(res.data.assigned_meters ?? []);
                setMeterDrafts(
                    units.reduce<Record<string, string>>((acc, unit) => {
                        acc[unit.id] = unit.meter_id ?? '';
                        return acc;
                    }, {})
                );
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to load hierarchy',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
        } finally {
            setLoadingTree(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchProperties();
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedPropertyId) {
            fetchHierarchy(selectedPropertyId);
            setSelectedNode(null);
        }
    }, [selectedPropertyId]);

    const toggleExpand = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const openAddModal = (type: AddType, parentId?: string, parentType?: 'zone' | 'route' | 'street') => {
        setFormName('');
        setFormUnitNumber('');
        setFormMeterId('');
        setTenantForm({ name: '', phone: '', email: '' });
        setModal({ type, parentId, parentType });
    };

    const buildParentOptions = (zones: ZoneNode[]): ParentOption[] => {
        const options: ParentOption[] = [];
        for (const zone of zones) {
            options.push({ id: zone.id, type: 'zone', label: `Zone: ${zone.name}` });
            for (const route of zone.routes) {
                options.push({ id: route.id, type: 'route', label: `Zone ${zone.name} → Route: ${route.name}` });
                for (const street of route.streets) {
                    options.push({
                        id: street.id,
                        type: 'street',
                        label: `Zone ${zone.name} → ${route.name} → Street: ${street.name}`,
                    });
                }
            }
        }
        return options;
    };

    const parseParentKey = (key: string): { parentType: 'zone' | 'route' | 'street'; parentId: string } | null => {
        if (!key.includes(':')) return null;
        const [parentType, parentId] = key.split(':');
        if (parentType !== 'zone' && parentType !== 'route' && parentType !== 'street') return null;
        return { parentType, parentId };
    };

    const parentOptions = buildParentOptions(tree);

    const openBulkModal = () => {
        const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
        const defaultParent = parentOptions[0];
        setBulkForm({
            parentKey: defaultParent ? `${defaultParent.type}:${defaultParent.id}` : '',
            count: selectedProperty?.no_of_units && selectedProperty.no_of_units > 0 ? selectedProperty.no_of_units : 10,
            namePrefix: 'Unit',
            startNumber: 1,
        });
        setBulkModalOpen(true);
    };

    const handleBulkAddUnits = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPropertyId) return;
        const parent = parseParentKey(bulkForm.parentKey);
        if (!parent) {
            Swal.fire({ icon: 'warning', title: 'Select a location', text: 'Choose where the units should be added.' });
            return;
        }

        setBulkSaving(true);
        try {
            const res = await api.post(`/landlord/properties/${selectedPropertyId}/units/bulk`, {
                parent_type: parent.parentType,
                parent_id: parent.parentId,
                count: bulkForm.count,
                name_prefix: bulkForm.namePrefix,
                start_number: bulkForm.startNumber,
            });
            setBulkModalOpen(false);
            await fetchHierarchy(selectedPropertyId);
            Swal.fire({
                icon: 'success',
                title: res.data.message || 'Units created',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
            });
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create units',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
        } finally {
            setBulkSaving(false);
        }
    };

    const updateMeterDraft = (unitId: string, meterId: string) => {
        setMeterDrafts((prev) => ({ ...prev, [unitId]: meterId }));
    };

    const metersUsedInDrafts = (excludeUnitId?: string) => {
        const used = new Set<string>();
        for (const [unitId, meterId] of Object.entries(meterDrafts)) {
            if (meterId && unitId !== excludeUnitId) used.add(meterId);
        }
        return used;
    };

    const hasMeterDraftChanges = allUnits.some((unit) => (meterDrafts[unit.id] ?? '') !== (unit.meter_id ?? ''));

    const handleSaveAllMeters = async () => {
        if (!selectedPropertyId || allUnits.length === 0) return;

        const used = new Set<string>();
        for (const unit of allUnits) {
            const meterId = meterDrafts[unit.id] ?? '';
            if (!meterId) continue;
            if (used.has(meterId)) {
                Swal.fire({ icon: 'error', title: 'Duplicate meter', text: 'Each meter can only be assigned to one unit.' });
                return;
            }
            used.add(meterId);
        }

        setSavingAllMeters(true);
        try {
            const assignments = allUnits.map((unit) => ({
                unit_id: unit.id,
                meter_id: meterDrafts[unit.id] || null,
            }));
            const res = await api.put(`/landlord/properties/${selectedPropertyId}/unit-meters`, { assignments });
            await fetchHierarchy(selectedPropertyId);
            Swal.fire({
                icon: 'success',
                title: res.data.message || 'Meters saved',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2500,
            });
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to save meter assignments',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
        } finally {
            setSavingAllMeters(false);
        }
    };

    const handleSaveEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!modal || !selectedPropertyId) return;
        setSaving(true);
        try {
            if (modal.type === 'zone') {
                await api.post(`/landlord/properties/${selectedPropertyId}/zones`, { name: formName });
            } else if (modal.type === 'route' && modal.parentId) {
                await api.post(`/landlord/zones/${modal.parentId}/routes`, { name: formName });
            } else if (modal.type === 'street' && modal.parentId) {
                await api.post(`/landlord/routes/${modal.parentId}/streets`, { name: formName });
            } else if (modal.type === 'unit' && modal.parentId && modal.parentType) {
                await api.post('/landlord/units', {
                    property_id: selectedPropertyId,
                    parent_type: modal.parentType,
                    parent_id: modal.parentId,
                    name: formName,
                    unit_number: formUnitNumber || undefined,
                    meter_id: formMeterId || undefined,
                });
            } else if (modal.type === 'tenant' && selectedNode) {
                await api.post('/landlord/tenants', {
                    property_id: selectedPropertyId,
                    name: tenantForm.name,
                    phone: tenantForm.phone,
                    email: tenantForm.email || undefined,
                    node_type: selectedNode.type,
                    node_id: selectedNode.id,
                });
            }
            setModal(null);
            await fetchHierarchy(selectedPropertyId);
            Swal.fire({ icon: 'success', title: 'Saved', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Save failed', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (type: NodeType, id: string, label: string) => {
        const result = await Swal.fire({
            title: `Delete ${type}?`,
            text: `Remove "${label}" and its children?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
        });
        if (!result.isConfirmed) return;

        const endpoints: Record<NodeType, string> = {
            zone: `/landlord/zones/${id}`,
            route: `/landlord/routes/${id}`,
            street: `/landlord/streets/${id}`,
            unit: `/landlord/units/${id}`,
        };

        try {
            await api.delete(endpoints[type]);
            if (selectedNode?.id === id) setSelectedNode(null);
            await fetchHierarchy(selectedPropertyId);
        } catch (error: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Delete failed' });
        }
    };

    const handleDeleteTenant = async (tenant: Tenant) => {
        const result = await Swal.fire({ title: 'Remove tenant?', text: tenant.name, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
        if (!result.isConfirmed) return;
        await api.delete(`/landlord/tenants/${tenant.id}`);
        await fetchHierarchy(selectedPropertyId);
    };

    const selectNode = (node: SelectedNode) => {
        setSelectedNode(node);
        if (node.type === 'unit') {
            setSelectedMeterId(node.meter_id ?? '');
        } else {
            setSelectedMeterId('');
        }
    };

    const collectUnitsFromTree = (zones: ZoneNode[]): UnitNode[] => {
        const units: UnitNode[] = [];
        for (const zone of zones) {
            units.push(...zone.units);
            for (const route of zone.routes) {
                units.push(...route.units);
                for (const street of route.streets) {
                    units.push(...street.units);
                }
            }
        }
        return units;
    };

    const meterLinkedToOtherUnit = (meterId: string, currentUnitId: string) => {
        const units = collectUnitsFromTree(tree);
        return units.some((u) => u.meter_id === meterId && u.id !== currentUnitId);
    };

    const handleAssignMeter = async () => {
        if (!selectedNode || selectedNode.type !== 'unit') return;
        setAssigningMeter(true);
        try {
            const res = await api.put(`/landlord/units/${selectedNode.id}/meter`, {
                meter_id: selectedMeterId || null,
            });
            if (res.data.status === 200) {
                const meterNumber = res.data.unit?.meter_number ?? null;
                const meterId = res.data.unit?.meter_id ?? null;
                setSelectedNode({
                    ...selectedNode,
                    meter_id: meterId,
                    meter_number: meterNumber,
                });
                await fetchHierarchy(selectedPropertyId);
                Swal.fire({
                    icon: 'success',
                    title: res.data.message || 'Meter updated',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2500,
                });
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to assign meter',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
            });
        } finally {
            setAssigningMeter(false);
        }
    };

    const renderUnits = (units: UnitNode[], parentType: 'zone' | 'route' | 'street', parentId: string, parentName: string) => (
        <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
            {units.map((unit) => (
                <div
                    key={unit.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${
                        selectedNode?.id === unit.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => selectNode({
                        type: 'unit',
                        id: unit.id,
                        name: unit.name,
                        propertyId: selectedPropertyId,
                        meter_id: unit.meter_id,
                        meter_number: unit.meter_number,
                    })}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Home size={14} className="text-emerald-500 shrink-0" />
                        <span className="font-medium truncate">{unit.name}</span>
                        {unit.unit_number && <span className="text-xs text-slate-400">#{unit.unit_number}</span>}
                        {unit.meter_number && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100 dark:border-amber-800 flex items-center gap-0.5 shrink-0">
                                <Gauge size={10} /> {unit.meter_number}
                            </span>
                        )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete('unit', unit.id, unit.name); }} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
            <button
                onClick={() => openAddModal('unit', parentId, parentType)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 py-1"
            >
                <Plus size={12} /> Add unit under {parentName}
            </button>
        </div>
    );

    const renderTenantsInline = (tenants: Tenant[]) => {
        if (!tenants.length) return null;
        return (
            <div className="ml-6 mt-1 flex flex-wrap gap-1">
                {tenants.map((t) => (
                    <span key={t.id} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-100 dark:border-violet-800">
                        {t.name}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return <DashboardLoader title="Loading Location Hierarchy" subtitle="Preparing your property structure..." />;
    }

    const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
    const nodeTenants = selectedNode
        ? allTenants.filter((t) => t.node_type === selectedNode.type && t.node_id === selectedNode.id)
        : [];

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/dashboard/landlord" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2">
                        <ArrowLeft size={14} /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" size={28} />
                        Zone & Location Hierarchy
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Zones → Routes → Streets → Units. Assign meters to units and customers to any level.
                    </p>
                </div>
                <button onClick={() => fetchHierarchy(selectedPropertyId)} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <RefreshCw size={18} className={loadingTree ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Property</label>
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => setSelectedPropertyId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                        >
                            {properties.length === 0 && <option value="">No properties - add one first</option>}
                            {properties.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} - {p.location}</option>
                            ))}
                        </select>
                        {selectedProperty && (
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <MapPin size={12} /> Managing: <strong className="text-slate-700 dark:text-slate-300">{selectedProperty.name}</strong>
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <h2 className="font-bold text-slate-900 dark:text-white">Location Tree</h2>
                            {selectedPropertyId && (
                                <button
                                    onClick={() => openAddModal('zone')}
                                    className="px-3 py-1.5 bg-[#0A1F44] text-white text-xs font-bold rounded-lg flex items-center gap-1"
                                >
                                    <Plus size={14} /> Add Zone
                                </button>
                            )}
                        </div>

                        <div className="p-4 min-h-[320px] relative">
                            {loadingTree && (
                                <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center z-10">
                                    <RefreshCw className="animate-spin text-blue-600" />
                                </div>
                            )}

                            {!selectedPropertyId ? (
                                <p className="text-sm text-slate-500 text-center py-12">Add a property to start building your hierarchy.</p>
                            ) : tree.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 className="mx-auto text-slate-300 mb-3" size={40} />
                                    <p className="text-sm text-slate-500">No zones yet. Add your first zone for this property.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tree.map((zone) => {
                                        const zoneKey = `zone-${zone.id}`;
                                        const zoneOpen = expanded[zoneKey] ?? true;
                                        return (
                                            <div key={zone.id} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                                <div
                                                    className={`flex items-center justify-between p-3 cursor-pointer ${selectedNode?.id === zone.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50/80 dark:bg-slate-800/40'}`}
                                                    onClick={() => selectNode({ type: 'zone', id: zone.id, name: zone.name, propertyId: selectedPropertyId })}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(zoneKey); }} className="p-0.5">
                                                            {zoneOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </button>
                                                        <Layers size={16} className="text-indigo-500" />
                                                        <span className="font-bold text-sm truncate">{zone.name}</span>
                                                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Zone</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); openAddModal('route', zone.id); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Add route"><Plus size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); openAddModal('unit', zone.id, 'zone'); }} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Add unit"><Home size={14} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete('zone', zone.id, zone.name); }} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                {renderTenantsInline(zone.tenants)}
                                                {zoneOpen && (
                                                    <div className="p-3 space-y-2">
                                                        {renderUnits(zone.units, 'zone', zone.id, zone.name)}
                                                        {zone.routes.map((route) => {
                                                            const routeKey = `route-${route.id}`;
                                                            const routeOpen = expanded[routeKey] ?? true;
                                                            return (
                                                                <div key={route.id} className="ml-4 border-l-2 border-indigo-100 dark:border-indigo-900 pl-3">
                                                                    <div
                                                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${selectedNode?.id === route.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                                        onClick={() => selectNode({ type: 'route', id: route.id, name: route.name, propertyId: selectedPropertyId })}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(routeKey); }} className="p-0.5">
                                                                                {routeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                            </button>
                                                                            <Route size={14} className="text-blue-500" />
                                                                            <span className="font-semibold text-sm truncate">{route.name}</span>
                                                                            <span className="text-[10px] uppercase font-bold text-blue-600">Route</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <button onClick={(e) => { e.stopPropagation(); openAddModal('street', route.id); }} className="p-1 text-blue-600 rounded"><Plus size={14} /></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); openAddModal('unit', route.id, 'route'); }} className="p-1 text-emerald-600 rounded"><Home size={14} /></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete('route', route.id, route.name); }} className="p-1 text-rose-500 rounded"><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </div>
                                                                    {renderTenantsInline(route.tenants)}
                                                                    {routeOpen && (
                                                                        <div className="space-y-2 mt-1">
                                                                            {renderUnits(route.units, 'route', route.id, route.name)}
                                                                            {route.streets.map((street) => (
                                                                                <div key={street.id} className="ml-4 border-l-2 border-blue-100 dark:border-blue-900 pl-3">
                                                                                    <div
                                                                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${selectedNode?.id === street.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                                                                        onClick={() => selectNode({ type: 'street', id: street.id, name: street.name, propertyId: selectedPropertyId })}
                                                                                    >
                                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                                            <MapPin size={14} className="text-amber-500" />
                                                                                            <span className="font-medium text-sm truncate">{street.name}</span>
                                                                                            <span className="text-[10px] uppercase font-bold text-amber-600">Street</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1">
                                                                                            <button onClick={(e) => { e.stopPropagation(); openAddModal('unit', street.id, 'street'); }} className="p-1 text-emerald-600 rounded"><Home size={14} /></button>
                                                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete('street', street.id, street.name); }} className="p-1 text-rose-500 rounded"><Trash2 size={14} /></button>
                                                                                        </div>
                                                                                    </div>
                                                                                    {renderTenantsInline(street.tenants)}
                                                                                    {renderUnits(street.units, 'street', street.id, street.name)}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {selectedNode?.type === 'unit' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                <Gauge size={18} className="text-amber-500" />
                                Meter Assignment
                            </h3>
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 mb-4">
                                <p className="text-xs text-amber-600 font-bold uppercase mb-1">Unit</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedNode.name}</p>
                                {selectedNode.meter_number && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        Current meter: <strong>{selectedNode.meter_number}</strong>
                                    </p>
                                )}
                            </div>
                            {assignedMeters.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-4">
                                    No meters assigned to your account yet. Ask an admin to assign meters to you.
                                </p>
                            ) : (
                                <>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select meter</label>
                                    <select
                                        value={selectedMeterId}
                                        onChange={(e) => setSelectedMeterId(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm mb-3"
                                    >
                                        <option value="">No meter linked</option>
                                        {assignedMeters.map((m) => {
                                            const linkedElsewhere = meterLinkedToOtherUnit(m.id, selectedNode.id);
                                            return (
                                                <option key={m.id} value={m.id} disabled={linkedElsewhere && m.id !== selectedMeterId}>
                                                    {m.meter_number}
                                                    {linkedElsewhere && m.id !== selectedMeterId ? ' (linked to another unit)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        onClick={handleAssignMeter}
                                        disabled={assigningMeter}
                                        className="w-full py-2.5 bg-blue-900 hover:bg-amber-700 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                                    >
                                        {assigningMeter ? 'Saving...' : selectedMeterId ? 'Link Meter to Unit' : 'Remove Meter from Unit'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                            <Users size={18} className="text-black" />
                            Customer Assignment
                        </h3>
                        {selectedNode ? (
                            <>
                                <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 mb-4">
                                    <p className="text-xs text-black font-bold uppercase mb-1">Selected node</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedNode.name}</p>
                                    <p className="text-xs text-slate-500 capitalize mt-0.5">{selectedNode.type}</p>
                                </div>
                                <button
                                    onClick={() => openAddModal('tenant')}
                                    className="w-full py-2.5 mb-4 bg-blue-900 hover:bg-blue-900 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={16} /> Assign Customer Here
                                </button>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {nodeTenants.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">No customers assigned to this node yet.</p>
                                    ) : (
                                        nodeTenants.map((t) => (
                                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                                <div>
                                                    <p className="text-sm font-bold">{t.name}</p>
                                                    <p className="text-xs text-slate-500">{t.phone}</p>
                                                </div>
                                                <button onClick={() => handleDeleteTenant(t)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-slate-500">Select a zone, route, street, or unit in the tree to assign customers.</p>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-4 text-xs text-blue-800 dark:text-blue-200 space-y-1">
                        <p className="font-bold">Hierarchy rules</p>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90">
                            <li>Zones split into multiple routes</li>
                            <li>Routes split into multiple streets</li>
                            <li>Units can be added under zone, route, or street</li>
                            <li>Link admin-assigned meters to individual units</li>
                            <li>Customers must map to a specific node</li>
                        </ul>
                    </div>
                </div>
            </div>

            {selectedPropertyId && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                        <div>
                            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Gauge size={20} className="text-amber-500" />
                                Units & Meters
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                Add all units for this property and assign a meter number to each one.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={openBulkModal}
                                disabled={parentOptions.length === 0}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                            >
                                <Plus size={14} /> Bulk Add Units
                            </button>
                            <button
                                onClick={handleSaveAllMeters}
                                disabled={savingAllMeters || !hasMeterDraftChanges || allUnits.length === 0}
                                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
                            >
                                {savingAllMeters ? 'Saving...' : 'Save All Meter Assignments'}
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {parentOptions.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Add at least one zone (or route/street) in the tree above before creating units.
                            </p>
                        ) : allUnits.length === 0 ? (
                            <div className="text-center py-10">
                                <Home className="mx-auto text-slate-300 mb-3" size={36} />
                                <p className="text-sm text-slate-500 mb-3">No units yet for this property.</p>
                                <button
                                    onClick={openBulkModal}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl"
                                >
                                    Add {properties.find((p) => p.id === selectedPropertyId)?.no_of_units || 10} Units
                                </button>
                            </div>
                        ) : assignedMeters.length === 0 ? (
                            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3 mb-4">
                                You have {allUnits.length} unit{allUnits.length !== 1 ? 's' : ''} but no meters assigned to your account yet. Ask an admin to assign meters, then link them below.
                            </p>
                        ) : null}

                        {allUnits.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-3 pr-4 font-bold">Unit</th>
                                            <th className="py-3 pr-4 font-bold">Location</th>
                                            <th className="py-3 font-bold">Meter Number</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUnits.map((unit) => {
                                            const draftMeterId = meterDrafts[unit.id] ?? '';
                                            const usedElsewhere = metersUsedInDrafts(unit.id);
                                            return (
                                                <tr key={unit.id} className="border-b border-slate-50 dark:border-slate-800/80">
                                                    <td className="py-3 pr-4">
                                                        <p className="font-semibold text-slate-900 dark:text-white">{unit.name}</p>
                                                        {unit.unit_number && (
                                                            <p className="text-xs text-slate-400">#{unit.unit_number}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4 text-xs text-slate-500">{unit.location_path}</td>
                                                    <td className="py-3">
                                                        <select
                                                            value={draftMeterId}
                                                            onChange={(e) => updateMeterDraft(unit.id, e.target.value)}
                                                            className="w-full min-w-[160px] px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                                        >
                                                            <option value="">No meter</option>
                                                            {assignedMeters.map((m) => (
                                                                <option
                                                                    key={m.id}
                                                                    value={m.id}
                                                                    disabled={usedElsewhere.has(m.id) && m.id !== draftMeterId}
                                                                >
                                                                    {m.meter_number}
                                                                    {usedElsewhere.has(m.id) && m.id !== draftMeterId ? ' (in use)' : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {modal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModal(null)} />
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSaveEntity}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
                        >
                            <h3 className="font-bold text-lg capitalize">
                                {modal.type === 'tenant' ? 'Assign Customer' : `Add ${modal.type}`}
                            </h3>
                            {modal.type === 'tenant' ? (
                                <>
                                    <input required placeholder="Customer name" value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                    <input required placeholder="Phone" value={tenantForm.phone} onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                    <input placeholder="Email (optional)" value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                    {selectedNode && (
                                        <p className="text-xs text-slate-500">Assigning to: <strong>{selectedNode.name}</strong> ({selectedNode.type})</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <input required placeholder={`${modal.type} name`} value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                    {modal.type === 'unit' && (
                                        <>
                                            <input placeholder="Unit number (optional)" value={formUnitNumber} onChange={(e) => setFormUnitNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                            {assignedMeters.length > 0 && (
                                                <select
                                                    value={formMeterId}
                                                    onChange={(e) => setFormMeterId(e.target.value)}
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                                >
                                                    <option value="">No meter (assign later)</option>
                                                    {assignedMeters.map((m) => (
                                                        <option key={m.id} value={m.id}>{m.meter_number}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                            <button type="submit" disabled={saving} className="w-full py-3 bg-[#0A1F44] text-white font-bold rounded-xl disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {bulkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setBulkModalOpen(false)}
                        />
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleBulkAddUnits}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
                        >
                            <h3 className="font-bold text-lg">Bulk Add Units</h3>
                            <p className="text-xs text-slate-500">
                                Create multiple units at once (e.g. Unit 1 through Unit 10), then assign meters in the table below.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Add under</label>
                                <select
                                    required
                                    value={bulkForm.parentKey}
                                    onChange={(e) => setBulkForm({ ...bulkForm, parentKey: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                >
                                    {parentOptions.map((opt) => (
                                        <option key={`${opt.type}:${opt.id}`} value={`${opt.type}:${opt.id}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">How many</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        required
                                        value={bulkForm.count}
                                        onChange={(e) => setBulkForm({ ...bulkForm, count: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Start at</label>
                                    <input
                                        type="number"
                                        min={1}
                                        required
                                        value={bulkForm.startNumber}
                                        onChange={(e) => setBulkForm({ ...bulkForm, startNumber: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Name prefix</label>
                                <input
                                    required
                                    placeholder="Unit"
                                    value={bulkForm.namePrefix}
                                    onChange={(e) => setBulkForm({ ...bulkForm, namePrefix: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Preview: {bulkForm.namePrefix} {bulkForm.startNumber} … {bulkForm.namePrefix} {bulkForm.startNumber + Math.max(bulkForm.count - 1, 0)}
                                </p>
                            </div>
                            <button type="submit" disabled={bulkSaving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50">
                                {bulkSaving ? 'Creating...' : `Create ${bulkForm.count} Units`}
                            </button>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LocationHierarchy;
