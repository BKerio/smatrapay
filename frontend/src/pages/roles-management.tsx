import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  LayoutGrid,
  Users,
  DollarSign,
  Settings,
  Bell,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from "lucide-react";
import DashboardLoader from "@/lib/loader";

interface Permission {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_system_role: boolean;
  hierarchy_level: number;
  permissions?: Permission[];
}

interface PaginatedResponse<T> {
  roles: {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const CATEGORIES = [
  { id: 'members', name: 'Members', icon: Users, pattern: /member/ },
  { id: 'contributions', name: 'Contributions', icon: DollarSign, pattern: /contribution/ },
  { id: 'financial', name: 'Financial', icon: FileText, pattern: /financial/ },
  { id: 'system', name: 'System', icon: Settings, pattern: /(role|permission|system|user|congregation|audit)/ },
  { id: 'communication', name: 'Communication', icon: Bell, pattern: /(notification|communication|message)/ },
];

const RolesManagement = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['members']);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    hierarchy_level: 0,
    permissions: [] as string[]
  });

  const token = useMemo(() => localStorage.getItem("token"), []);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get<PaginatedResponse<Role>>(
        `${API_URL}/admin/roles?search=${encodeURIComponent(query)}&page=${page}`,
        { headers }
      );
      setRoles(res.data.roles.data);
      setTotal(res.data.roles.total);
    } catch (error) {
      console.error("Error fetching roles:", error);
      Swal.fire("Error", "Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get<{ permissions: any }>(
        `${API_URL}/admin/permissions?per_page=100`,
        { headers }
      );
      const permissionsData = res.data.permissions.data || res.data.permissions;
      setAllPermissions(Array.isArray(permissionsData) ? permissionsData : []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => fetchRoles(), 300);
    return () => clearTimeout(handler);
  }, [query, page]);

  // Categorization Logic
  const categorizedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = { others: [] };
    CATEGORIES.forEach(cat => groups[cat.id] = []);

    allPermissions.forEach(p => {
      let matched = false;
      for (const cat of CATEGORIES) {
        if (cat.pattern.test(p.slug)) {
          groups[cat.id].push(p);
          matched = true;
          break;
        }
      }
      if (!matched) groups.others.push(p);
    });

    return groups;
  }, [allPermissions]);

  const handleOpenModal = (role: Role | null = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        slug: role.slug,
        description: role.description || "",
        hierarchy_level: role.hierarchy_level,
        permissions: role.permissions?.map(p => p.slug) || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        slug: "",
        description: "",
        hierarchy_level: 0,
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingRole) {
        await axios.put(`${API_URL}/admin/roles/${editingRole.slug}`, formData, { headers });
        Swal.fire({ icon: "success", title: "Role Updated", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
      } else {
        await axios.post(`${API_URL}/admin/roles`, formData, { headers });
        Swal.fire({ icon: "success", title: "Role Created", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.message || "Operation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (role.is_system_role) {
      Swal.fire("Protected", "System roles cannot be deleted", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "Delete Role?",
      text: `This will permanently delete "${role.name}". Users with this role will lose these permissions.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/admin/roles/${role.slug}`, { headers });
        Swal.fire("Deleted", "Role has been deleted", "success");
        fetchRoles();
      } catch (error: any) {
        Swal.fire("Error", error.response?.data?.message || "Failed to delete role", "error");
      }
    }
  };

  const togglePermission = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(slug)
        ? prev.permissions.filter(p => p !== slug)
        : [...prev.permissions, slug]
    }));
  };

  const toggleCategory = (categoryId: string) => {
    const categoryPermissions = categorizedPermissions[categoryId].map(p => p.slug);
    const allSelected = categoryPermissions.every(slug => formData.permissions.includes(slug));

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(slug => !categoryPermissions.includes(slug))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: Array.from(new Set([...prev.permissions, ...categoryPermissions]))
      }));
    }
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getCategoryStatus = (categoryId: string) => {
    const items = categorizedPermissions[categoryId] || [];
    if (items.length === 0) return 'empty';
    const selectedCount = items.filter(p => formData.permissions.includes(p.slug)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === items.length) return 'all';
    return 'partial';
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage access roles and permission assignments</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="h-96 flex items-center justify-center bg-white rounded-lg border border-gray-200">
            <DashboardLoader title="Loading roles..." />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200 border-dashed">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No roles found</h3>
            <p className="text-sm text-gray-500">Create your first role to get started</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-700">Role</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Level</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Permissions</th>
                  <th className="px-6 py-4 font-medium text-gray-700">Type</th>
                  <th className="px-6 py-4 font-medium text-gray-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${role.is_system_role ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {role.is_system_role ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 capitalize">{role.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{role.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Level {role.hierarchy_level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {role.permissions?.length || 0} permissions
                        </span>
                        {role.permissions && role.permissions.length > 0 && (
                          <div className="flex -space-x-1">
                            {role.permissions.slice(0, 3).map((p) => (
                              <div key={p.id} className="w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center" title={p.name}>
                                <span className="text-[8px] font-bold text-blue-600">{p.name.charAt(0).toUpperCase()}</span>
                              </div>
                            ))}
                            {role.permissions.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                                <span className="text-[8px] font-medium text-gray-600">+{role.permissions.length - 3}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {role.is_system_role ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                          <Lock className="w-3 h-3" />
                          System
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <ShieldCheck className="w-3 h-3" />
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(role)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit role"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!role.is_system_role && (
                          <button
                            onClick={() => handleDelete(role)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {total > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-900">{roles.length}</span> of <span className="font-medium text-gray-900">{total}</span> roles
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-center">
                    {page}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={roles.length < 20}
                    className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />

            <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-md">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-none">
                      {editingRole ? "Edit Role" : "Create New Role"}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {editingRole ? "Configure hierarchy & permissions" : "Register a new access entity"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5">
                <form id="roleForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left Column - Basic Info */}
                    <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Role Name
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Finance Officer"
                            disabled={editingRole?.is_system_role}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Slug
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            placeholder="finance_officer"
                            disabled={editingRole !== null}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Briefly state responsibilities..."
                            rows={3}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-12">
                      <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Authority Level: <span className="text-blue-600">{formData.hierarchy_level}</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formData.hierarchy_level}
                            onChange={e => setFormData({ ...formData, hierarchy_level: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        {editingRole?.is_system_role && (
                          <div className="flex items-center gap-2 text-[10px] text-amber-700 font-bold bg-amber-100/50 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" /> System Role (Metadata Locked)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Matrix Section */}
                    <div className="lg:col-span-12 mt-2">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Permission Matrix</h4>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {formData.permissions.length} Activated
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CATEGORIES.map(category => {
                          const items = categorizedPermissions[category.id] || [];
                          const status = getCategoryStatus(category.id);
                          const isExpanded = expandedCategories.includes(category.id);

                          if (items.length === 0) return null;

                          return (
                            <div key={category.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                              <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                                <div
                                  className="flex items-center gap-2 cursor-pointer select-none"
                                  onClick={() => toggleCategoryExpand(category.id)}
                                >
                                  <category.icon className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-bold text-xs text-gray-700">{category.name}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(category.id)}
                                  className={`text-[9px] font-black px-2 py-1 rounded transition-all ${status === 'all'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                >
                                  {status === 'all' ? 'DESELECT' : 'SELECT ALL'}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="p-2 bg-white grid grid-cols-1 gap-1">
                                  {items.map(permission => {
                                    const isSelected = formData.permissions.includes(permission.slug);
                                    return (
                                      <label
                                        key={permission.id}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-blue-50/30 border-blue-100' : 'bg-transparent border-transparent hover:bg-gray-50'
                                          }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => togglePermission(permission.slug)}
                                          className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className={`text-[12px] font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {permission.name}
                                          </div>
                                          <p className="text-[9px] text-gray-400 font-mono truncate">{permission.slug}</p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Uncategorized */}
                        {categorizedPermissions.others.length > 0 && (
                          <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                            <div
                              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => toggleCategoryExpand('others')}
                            >
                              <div className="flex items-center gap-3">
                                <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-bold text-xs text-gray-700">Others</span>
                              </div>
                              {expandedCategories.includes('others') ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                            </div>

                            {expandedCategories.includes('others') && (
                              <div className="p-2 bg-white space-y-1">
                                {categorizedPermissions.others.map(permission => {
                                  const isSelected = formData.permissions.includes(permission.slug);
                                  return (
                                    <label key={permission.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => togglePermission(permission.slug)}
                                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-0"
                                      />
                                      <div className="flex-1">
                                        <div className="text-[12px] font-bold text-gray-700">{permission.name}</div>
                                        <div className="text-[9px] text-gray-400 font-mono">{permission.slug}</div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-[12px] font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="roleForm"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-1.5 bg-blue-600 text-white text-[12px] font-black rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editingRole ? "SAVE CHANGES" : "CREATE ROLE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesManagement;