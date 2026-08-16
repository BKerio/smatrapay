import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '@/lib/api';
import { getVendorLogoUrl } from '@/lib/utils';
import { Building2, Upload, Save, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';

interface UserContext {
  user: { id: string; name: string; email: string; role?: string };
}

interface VendorProfile {
  id: string;
  business_name?: string;
  logo_url?: string | null;
  dashboard_settings?: {
    primary_color?: string;
    tagline?: string;
    show_logo_in_sidebar?: boolean;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const Branding = () => {
  const { user, setVendorProfile } = useOutletContext<UserContext & { setVendorProfile?: (p: { logo_url?: string | null; business_name?: string; dashboard_settings?: Record<string, unknown> } | null) => void }>();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [showLogoInSidebar, setShowLogoInSidebar] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role !== 'vendor') return;
    const fetchProfile = async () => {
      try {
        const res = await api.get<{ status: number; vendor: VendorProfile }>('/vendor/profile');
        if (res.data.status === 200 && res.data.vendor) {
          setProfile(res.data.vendor);
          setTagline(res.data.vendor.dashboard_settings?.tagline ?? '');
          setPrimaryColor(res.data.vendor.dashboard_settings?.primary_color || '#2563eb');
          setShowLogoInSidebar(res.data.vendor.dashboard_settings?.show_logo_in_sidebar ?? true);
        }
      } catch {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load profile',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.role]);

  const logoUrl = getVendorLogoUrl(profile?.logo_url ?? null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an image file (PNG, JPG, etc.)',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Image must be under 2MB',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await api.post<{ status: number; logo_url: string }>('/vendor/logo', { logo: dataUrl });
        if (res.data.status === 200) {
          const newUrl = res.data.logo_url;
          setProfile((p) => (p ? { ...p, logo_url: newUrl } : null));
          setVendorProfile?.((p) => (p ? { ...p, logo_url: newUrl } : { logo_url: newUrl }));
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Logo updated',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
        }
      };
      reader.readAsDataURL(file);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to upload logo',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/vendor/profile', {
        dashboard_settings: {
          tagline: tagline.trim() || undefined,
          primary_color: primaryColor,
          show_logo_in_sidebar: showLogoInSidebar,
        },
      });
      const newSettings = {
        tagline: tagline.trim() || undefined,
        primary_color: primaryColor,
        show_logo_in_sidebar: showLogoInSidebar,
      };
      setProfile((p) =>
        p
          ? { ...p, dashboard_settings: { ...p.dashboard_settings, ...newSettings } }
          : null
      );
      setVendorProfile?.((p) => (p ? { ...p, dashboard_settings: { ...p.dashboard_settings, ...newSettings } } : null));
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Settings saved',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save settings',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'vendor') {
    return (
      <div className="p-8 text-center text-slate-500">
        This page is for vendors only.
      </div>
    );
  }

  if (loading) {
    return <DashboardLoader title="Loading branding..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Palette className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard branding</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Upload your logo and customize how your dashboard looks.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Logo
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Used in the sidebar and dashboard. Recommended: square image, at least 128×128px.</p>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Vendor logo" className="w-24 h-24 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                  No logo
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload logo'}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5" /> Dashboard settings
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Optional tagline and accent color for your dashboard.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Your trusted utility partner"
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="show-logo"
                checked={showLogoInSidebar}
                onChange={(e) => setShowLogoInSidebar(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="show-logo" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Show logo in sidebar
              </label>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Branding;
