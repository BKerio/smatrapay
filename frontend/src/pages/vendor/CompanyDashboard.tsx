import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '@/lib/api';
import { getVendorLogoUrl } from '@/lib/utils';
import {
  Building2,
  AlertTriangle,
  Activity,
  ChevronRight,
  Gauge,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardLoader from '@/lib/loader';
import {
  StatCard,
  DashboardHeader,
  QuickActionGrid,
  PieBarStatistics,
  BarChartCard,
  VerticalBarChart,
  DashboardFooter,
  toBarData,
  getInitials,
  type StatCardData,
  type QuickActionData,
} from '@/lib/dashboard-ui';

interface OutletContextType {
  user: {
    id: string;
    name: string;
    vendor_type?: string;
  };
}

interface VendorProfile {
  id: string;
  business_name: string;
  address?: string;
  vendor_type?: string;
  bank_name?: string;
  status?: string;
  logo_url?: string | null;
  dashboard_settings?: { tagline?: string };
}

const CompanyDashboard: React.FC = () => {
  useOutletContext<OutletContextType>();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<{ total_meters: number; active_meters: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await api.get<{
          status: number;
          vendor: VendorProfile;
          stats: { total_meters: number; active_meters: number };
        }>('/vendor/profile');
        if (res.data.status === 200) {
          setProfile(res.data.vendor);
          setStats(res.data.stats ?? { total_meters: 0, active_meters: 0 });
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || 'Failed to load profile');
        setStats({ total_meters: 0, active_meters: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const inactiveMeters = (stats?.total_meters ?? 0) - (stats?.active_meters ?? 0);

  const pieData = useMemo(
    () =>
      [
        { name: 'Active Meters', value: stats?.active_meters ?? 0 },
        { name: 'Inactive Meters', value: inactiveMeters },
        { name: 'Total Fleet', value: stats?.total_meters ?? 0 },
      ].filter((d) => d.value > 0),
    [stats, inactiveMeters]
  );

  const barData = useMemo(
    () =>
      toBarData([
        { name: 'Total Meters', value: stats?.total_meters ?? 0 },
        { name: 'Active', value: stats?.active_meters ?? 0 },
        { name: 'Inactive', value: inactiveMeters },
      ]),
    [stats, inactiveMeters]
  );

  const meterStatusBar = useMemo(
    () =>
      toBarData([
        { name: 'Active', value: stats?.active_meters ?? 0 },
        { name: 'Inactive', value: inactiveMeters },
      ]).filter((d) => (d.count ?? 0) > 0),
    [stats, inactiveMeters]
  );

  const vendorQuickActions: QuickActionData[] = [
    { text: 'Company Profile', desc: 'Account & billing', icon: Building2, path: '/dashboard/account' },
    { text: 'Managed Meters', desc: 'Units & pricing', icon: Gauge, path: '/dashboard/meters' },
    { text: 'System Config', desc: 'Integrations', icon: ShieldCheck, path: '/dashboard/system-config' },
    { text: 'Brand Assets', desc: 'Logo & themes', icon: User, path: '/dashboard/branding' },
  ];

  const vendorStats: StatCardData[] = stats
    ? [
        { title: 'Managed Meters', value: stats.total_meters.toString(), change: `${stats.active_meters} active`, icon: Gauge },
        { title: 'Company', value: profile?.business_name || '—', change: 'Corporate account', icon: Building2 },
        { title: 'Status', value: profile?.status === 'active' ? 'Active' : profile?.status || '—', change: 'Account standing', icon: Activity },
        { title: 'Fleet Health', value: stats.total_meters > 0 ? `${Math.round((stats.active_meters / stats.total_meters) * 100)}%` : '—', change: 'Active meter ratio', icon: Zap },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <DashboardLoader title="Loading Company Portal" subtitle="Fetching profile and corporate stats..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-100">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900">Dashboard Error</h3>
          <p className="text-red-700 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-5 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeader
          title="Company Dashboard"
          subtitle={profile?.dashboard_settings?.tagline || 'Corporate smart metering & vending overview'}
          initials={getInitials(profile?.business_name || 'CO')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {vendorStats.map((stat, index) => (
            <StatCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        <QuickActionGrid actions={vendorQuickActions} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
          <div className="xl:col-span-2 space-y-5 md:space-y-6">
            <PieBarStatistics
              title="Fleet Statistics"
              subtitle="Overview of your corporate meter fleet"
              pieData={pieData}
              barData={barData}
            />

            <BarChartCard title="Meter Status" subtitle="Active vs inactive units in your fleet" delay={0.28}>
              <VerticalBarChart data={meterStatusBar} emptyMessage="No meters registered yet" />
            </BarChartCard>
          </div>

          <div className="space-y-5 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-[#0A1F44]">Corporate Entity</h3>
                <Link to="/dashboard/account" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center">
                  Edit <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  {profile?.logo_url ? (
                    <img
                      src={getVendorLogoUrl(profile.logo_url) || ''}
                      alt="Logo"
                      className="w-12 h-12 rounded-xl object-contain bg-slate-50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#0A1F44] text-white flex items-center justify-center text-sm font-bold">
                      {(profile?.business_name || 'V').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800">{profile?.business_name || '—'}</p>
                    <p className="text-xs text-slate-500">{profile?.vendor_type || 'Company'} • {profile?.bank_name || '—'}</p>
                  </div>
                </div>
                {profile?.address && <p className="text-sm text-slate-600">{profile.address}</p>}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#0A1F44] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-6 -translate-y-6">
                <Building2 size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={18} className="text-amber-400" />
                  <h3 className="font-extrabold text-base">Fleet Summary</h3>
                </div>
                <p className="text-blue-200/70 text-xs mb-5">Corporate units overview</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span className="text-blue-100 flex items-center gap-2"><Gauge size={15} /> Total Meters</span>
                    <span className="font-bold">{stats?.total_meters ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-100 flex items-center gap-2"><Activity size={15} /> Active</span>
                    <span className="font-bold">{stats?.active_meters ?? 0}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard/meters"
                  className="mt-5 w-full py-2.5 bg-white text-[#0A1F44] text-sm font-bold rounded-xl flex items-center justify-center hover:bg-blue-50 transition-all"
                >
                  View Fleet Details
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <DashboardFooter />
      </div>
    </div>
  );
};

export default CompanyDashboard;
