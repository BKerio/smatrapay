import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import api from '@/lib/api';
import {
  Home,
  CreditCard,
  Phone,
  Mail,
  User,
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  MapPin,
  Gauge,
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
  CHART_COLORS,
  CustomTooltip,
  type StatCardData,
  type QuickActionData,
} from '@/lib/dashboard-ui';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OutletContextType {
  user: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  };
}

interface LandlordProfile {
  id: string;
  full_name: string;
  phone: string;
  payment_account: string;
  status: string;
  user?: { id: string; name: string; email: string; username?: string };
}

const LandlordDashboard: React.FC = () => {
  useOutletContext<OutletContextType>();
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [summary, setSummary] = useState({
    properties: 0,
    zones: 0,
    routes: 0,
    streets: 0,
    units: 0,
    tenants: 0,
    meters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, summaryRes, metersRes] = await Promise.all([
          api.get<{ status: number; landlord: LandlordProfile }>('/landlord/profile'),
          api.get<{ status: number; summary: typeof summary }>('/landlord/hierarchy/summary'),
          api.get<{ status: number; meters: unknown[] }>('/landlord/meters'),
        ]);
        if (profileRes.data.status === 200) {
          setProfile(profileRes.data.landlord);
        }
        if (summaryRes.data.status === 200) {
          setSummary({
            ...summaryRes.data.summary,
            meters: metersRes.data.status === 200 ? (metersRes.data.meters?.length ?? 0) : 0,
          });
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const displayName = profile?.full_name || profile?.user?.name || 'Landlord';

  const pieData = useMemo(
    () =>
      [
        { name: 'Properties', value: summary.properties },
        { name: 'Zones', value: summary.zones },
        { name: 'Units', value: summary.units },
        { name: 'Meters', value: summary.meters },
        { name: 'Tenants', value: summary.tenants },
      ].filter((d) => d.value > 0),
    [summary]
  );

  const barData = useMemo(
    () =>
      toBarData([
        { name: 'Properties', value: summary.properties },
        { name: 'Zones', value: summary.zones },
        { name: 'Routes', value: summary.routes },
        { name: 'Streets', value: summary.streets },
        { name: 'Units', value: summary.units },
        { name: 'Tenants', value: summary.tenants },
        { name: 'Meters', value: summary.meters },
      ]),
    [summary]
  );

  const occupancyBarData = useMemo(
    () =>
      toBarData([
        { name: 'Tenants', value: summary.tenants },
        { name: 'Meters', value: summary.meters },
        { name: 'Units', value: summary.units },
        { name: 'Properties', value: summary.properties },
      ]),
    [summary]
  );

  const locationBarData = useMemo(
    () =>
      toBarData([
        { name: 'Zones', value: summary.zones },
        { name: 'Routes', value: summary.routes },
        { name: 'Streets', value: summary.streets },
        { name: 'Units', value: summary.units },
      ]).filter((d) => (d.count ?? 0) > 0),
    [summary]
  );

  const quickActions: QuickActionData[] = [
    { text: 'My Profile', desc: 'View & edit details', icon: User, path: '/dashboard/account' },
    { text: 'Properties', desc: 'Manage properties', icon: Home, path: '/dashboard/properties' },
    { text: 'Location Hierarchy', desc: 'Zones, routes & units', icon: Layers, path: '/dashboard/location-hierarchy' },
    { text: 'Security', desc: 'Password & access', icon: ShieldCheck, path: '/dashboard/account' },
  ];

  const landlordStats: StatCardData[] = [
    { title: 'Properties', value: String(summary.properties), change: 'Registered estates', icon: Home },
    { title: 'Zones', value: String(summary.zones), change: `${summary.routes} routes · ${summary.streets} streets`, icon: Layers },
    { title: 'Units', value: String(summary.units), change: 'Across all locations', icon: MapPin },
    { title: 'Meters', value: String(summary.meters), change: `${summary.tenants} tenants linked`, icon: Gauge },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <DashboardLoader title="Loading Landlord Portal" subtitle="Fetching your account details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-100">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
          title="Landlord Dashboard"
          subtitle="Property & location hierarchy overview"
          initials={getInitials(displayName, 'LL')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {landlordStats.map((stat, index) => (
            <StatCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        <QuickActionGrid actions={quickActions} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
          <div className="xl:col-span-2 space-y-5 md:space-y-6">
            <PieBarStatistics
              title="Portfolio Statistics"
              subtitle="Properties, zones, units, meters & tenants"
              pieData={pieData}
              barData={barData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              <BarChartCard title="Location Hierarchy" subtitle="Zones, routes, streets & units" delay={0.28}>
                <VerticalBarChart data={locationBarData} emptyMessage="No location data yet" />
              </BarChartCard>

              <BarChartCard title="Occupancy Overview" subtitle="Tenants vs meters across portfolio" delay={0.32}>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyBarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {occupancyBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill ?? CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </BarChartCard>
            </div>
          </div>

          <div className="space-y-5 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-[#0A1F44]">Owner Profile</h3>
                <Link to="/dashboard/account" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#0A1F44] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 font-medium">Property Owner</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {profile?.user?.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail size={14} className="shrink-0" />
                      <span className="truncate text-xs">{profile.user.email}</span>
                    </div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={14} className="shrink-0" />
                      <span className="text-xs">{profile.phone}</span>
                    </div>
                  )}
                  {profile?.payment_account && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <CreditCard size={14} className="shrink-0" />
                      <span className="text-xs font-mono">{profile.payment_account}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#0A1F44] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-6 -translate-y-6">
                <Home size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={18} className="text-amber-400" />
                  <h3 className="font-extrabold text-base">Account Status</h3>
                </div>
                <p className="text-blue-200/70 text-xs mb-5">Property owner account</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span className="text-blue-100 flex items-center gap-2"><Activity size={15} /> Status</span>
                    <span className="font-bold capitalize">{profile?.status || 'Active'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span className="text-blue-100 flex items-center gap-2"><ShieldCheck size={15} /> Role</span>
                    <span className="font-bold">Landlord</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-100 flex items-center gap-2"><Gauge size={15} /> Meters</span>
                    <span className="font-bold">{summary.meters}</span>
                  </div>
                </div>
                <Link
                  to="/dashboard/location-hierarchy"
                  className="mt-5 w-full py-2.5 bg-white text-[#0A1F44] text-sm font-bold rounded-xl flex items-center justify-center hover:bg-blue-50 transition-all"
                >
                  Manage Locations
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

export default LandlordDashboard;
