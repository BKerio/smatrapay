import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Building,
  AlertTriangle,
  Building2,
  Activity,
  ChevronRight,
  Gauge,
  ShieldCheck,
  MessageSquare,
  Users,
  Zap,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import DashboardLoader from '@/lib/loader';

interface OutletContextType {
  user: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    roles?: string[];
    bio?: string;
  };
}

interface StatCardData {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

interface QuickActionData {
  text: string;
  desc: string;
  icon: React.ElementType;
  path: string;
}

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  account_id: string;
  paybill: string;
  vendor_type: string;
  bank_name: string;
  status: string;
  created_at: string;
}

interface Meter {
  id: string;
  meter_number: string;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface EnquiryData {
  _id: string;
  status: string;
}

const CHART_COLORS = ['#0A1F44', '#2563eb', '#4f46e5', '#60a5fa'];

const StatCard = ({ stat, index }: { stat: StatCardData; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 mb-2">{stat.title}</p>
        <h3 className="text-3xl font-extrabold text-[#0A1F44] tracking-tight">{stat.value}</h3>
        <p className="text-xs text-slate-400 mt-2">{stat.change}</p>
      </div>
      <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
        <stat.icon size={22} strokeWidth={1.75} />
      </div>
    </div>
  </motion.div>
);

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { name: string } }[];
}) => {
  if (active && payload && payload.length) {
    const label = payload[0].payload?.name ?? payload[0].name;
    return (
      <div className="bg-white text-slate-800 text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-200">
        <span className="font-semibold">{label}</span>
        <span className="text-slate-500"> : </span>
        <span className="font-bold">{payload[0].value}</span>
      </div>
    );
  }
  return null;
};

const BarChartCard = ({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
  >
    <h3 className="text-lg font-extrabold text-[#0A1F44] mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-5">{subtitle}</p>
    {children}
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { user } = useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'customer') {
      navigate('/dashboard/customer', { replace: true });
    } else if (user?.role === 'vendor' || user?.roles?.includes('vendor')) {
      const vendorType = (user as { vendor_type?: string }).vendor_type;
      if (vendorType === 'Individual') {
        navigate('/dashboard/individual', { replace: true });
      } else {
        navigate('/dashboard/company', { replace: true });
      }
    }
  }, [user, navigate]);

  const [stats, setStats] = useState<StatCardData[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quickActions: QuickActionData[] = [
    { text: 'Add Vendor', desc: 'Create account', icon: Building2, path: '/dashboard/vendors' },
    { text: 'Meters', desc: 'Manage units', icon: Gauge, path: '/dashboard/meters' },
    { text: 'Account', desc: 'System settings', icon: ShieldCheck, path: '/dashboard/account' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [vendorsRes, metersRes, enquiriesRes] = await Promise.all([
          api.get<PaginatedResponse<Vendor>>(`/admin/vendors?per_page=1000`),
          api.get<PaginatedResponse<Meter>>(`/admin/meters?per_page=1000`),
          api.get<EnquiryData[]>(`/admin/enquiries`),
        ]);

        const vData = vendorsRes.data.data || [];
        const mData = metersRes.data.data || [];
        const eData = enquiriesRes.data || [];

        const activeVendors = vData.filter((v: Vendor) => v.status === 'active').length;
        const totalMeters = mData.length;
        const pendingEnquiries = eData.filter((e) => e.status === 'pending').length;

        setStats([
          { title: 'Total Vendors', value: vData.length.toString(), change: `${activeVendors} active accounts`, icon: Building2 },
          { title: 'Total Meters', value: totalMeters.toString(), change: 'Registered devices', icon: Gauge },
          { title: 'Pending Enquiries', value: pendingEnquiries.toString(), change: 'New website leads', icon: MessageSquare },
          { title: 'System Status', value: 'Healthy', change: 'All services operational', icon: Activity },
        ]);

        setVendors(vData);
        setMeters(mData);
        setEnquiries(eData);
      } catch (err) {
        setError('Unable to sync dashboard data.');
        console.error('Dashboard fetch error:', err);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    fetchDashboardData();
  }, []);

  const platformChartData = useMemo(() => {
    const activeMeters = meters.filter((m) => m.status === 'active').length;
    const pendingEnquiries = enquiries.filter((e) => e.status === 'pending').length;

    return [
      { name: 'Vendors', value: vendors.length },
      { name: 'Meters', value: meters.length },
      { name: 'Active Meters', value: activeMeters },
      { name: 'Enquiries', value: pendingEnquiries },
    ].filter((item) => item.value > 0);
  }, [vendors, meters, enquiries]);

  const overviewBarData = useMemo(() => {
    const activeVendors = vendors.filter((v) => v.status === 'active').length;
    const activeMeters = meters.filter((m) => m.status === 'active').length;
    const pendingEnquiries = enquiries.filter((e) => e.status === 'pending').length;
    const resolvedEnquiries = enquiries.filter((e) => e.status !== 'pending').length;

    return [
      { name: 'Vendors', count: vendors.length, fill: CHART_COLORS[0] },
      { name: 'Active Vendors', count: activeVendors, fill: CHART_COLORS[1] },
      { name: 'Meters', count: meters.length, fill: CHART_COLORS[2] },
      { name: 'Active Meters', count: activeMeters, fill: CHART_COLORS[3] },
      { name: 'Pending Enquiries', count: pendingEnquiries, fill: '#f59e0b' },
      { name: 'Resolved Enquiries', count: resolvedEnquiries, fill: '#10b981' },
    ];
  }, [vendors, meters, enquiries]);

  const vendorStatusBarData = useMemo(() => {
    const counts = vendors.reduce((acc, v) => {
      const status = v.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, count], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [vendors]);

  const meterStatusBarData = useMemo(() => {
    const counts = meters.reduce((acc, m) => {
      const status = m.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, count], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [meters]);

  const vendorTypeData = Object.entries(
    vendors.reduce((acc, curr) => {
      const t = curr.vendor_type || 'Unknown';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value, count: value, fill: CHART_COLORS[0] }))
    .sort((a, b) => b.value - a.value);

  const vendorTypeBarData = vendorTypeData.map((item, i) => ({
    ...item,
    count: item.value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const adminInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'AD';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100">
        <DashboardLoader title="Syncing Dashboard" subtitle="Gathering metrics, structure data..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-100">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900">Authentication Error</h3>
          <p className="text-red-700 mt-2 text-sm">User data not available. Please log in again.</p>
        </div>
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-5 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header banner */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0A1F44] rounded-2xl px-6 py-5 md:px-8 md:py-6 flex items-center justify-between shadow-lg"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-blue-100/80 mt-1 font-medium">
              Smart metering & vending program overview
            </p>
            <p className="text-xs text-blue-200/50 mt-2 hidden sm:block">{dayjs().format('dddd, D MMMM YYYY')}</p>
          </div>
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white flex items-center justify-center text-[#0A1F44] font-extrabold text-sm md:text-base shadow-md shrink-0">
            {adminInitials}
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {stats?.map((stat, index) => (
            <StatCard key={stat.title} stat={stat} index={index} />
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => (
            <Link key={action.text} to={action.path}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0A1F44]">
                  <action.icon size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-[#0A1F44] text-sm">{action.text}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Charts & side panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
          {/* Platform Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-extrabold text-[#0A1F44] mb-1">Platform Statistics</h3>
            <p className="text-sm text-slate-500 mb-6">Overview of vendors, meters & enquiries</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie chart */}
              <div className="h-[280px] w-full">
                {platformChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformChartData}
                        cx="50%"
                        cy="45%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ value }) => `${value}`}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      >
                        {platformChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="square"
                        formatter={(value) => (
                          <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    No platform data available yet
                  </div>
                )}
              </div>

              {/* Bar chart */}
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overviewBarData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="bg-white text-slate-800 text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-200">
                            <span className="font-semibold">{payload[0].payload.name}</span>
                            <span className="text-slate-500"> : </span>
                            <span className="font-bold">{payload[0].value}</span>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {overviewBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Right column */}
          <div className="space-y-5 md:space-y-6">
            {/* Recent Vendors */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-extrabold text-[#0A1F44]">Recent Vendors</h3>
                <Link
                  to="/dashboard/vendors"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                >
                  View All <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto">
                {vendors.slice(0, 5).map((v) => (
                  <div key={v.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#0A1F44] text-white flex items-center justify-center text-[10px] font-bold">
                      {v.business_name?.substring(0, 2).toUpperCase() || 'NA'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{v.business_name || 'Unnamed Vendor'}</p>
                      <p className="text-xs text-slate-400 truncate">{v.vendor_type || 'Unknown'}</p>
                    </div>
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        v.status === 'active' ? 'bg-emerald-500' : 'bg-rose-400'
                      )}
                    />
                  </div>
                ))}
                {vendors.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">No vendors registered yet</div>
                )}
              </div>
            </motion.div>

            {/* Network Status */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#0A1F44] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-6 -translate-y-6">
                <Building size={120} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={18} className="text-amber-400" />
                  <h3 className="font-extrabold text-base">Network Status</h3>
                </div>
                <p className="text-blue-200/70 text-xs mb-5">Registered entities overview</p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span className="text-blue-100 flex items-center gap-2">
                      <Building2 size={15} /> Total Vendors
                    </span>
                    <span className="font-bold">{vendors.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                    <span className="text-blue-100 flex items-center gap-2">
                      <Gauge size={15} /> Active Meters
                    </span>
                    <span className="font-bold">{meters.filter((m) => m.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-100 flex items-center gap-2">
                      <Users size={15} /> Total Meters
                    </span>
                    <span className="font-bold">{meters.length}</span>
                  </div>
                </div>

                <Link
                  to="/dashboard/vendors"
                  className="mt-5 w-full py-2.5 bg-white text-[#0A1F44] text-sm font-bold rounded-xl flex items-center justify-center hover:bg-blue-50 transition-all"
                >
                  Review Fleet
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bar graph statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <BarChartCard title="Vendor Status" subtitle="Active vs inactive vendor accounts" delay={0.28}>
            <div className="h-[240px] w-full">
              {vendorStatusBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorStatusBarData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} width={72} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {vendorStatusBarData.map((entry, index) => (
                        <Cell key={`vs-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No vendor data yet</div>
              )}
            </div>
          </BarChartCard>

          <BarChartCard title="Meter Status" subtitle="Distribution of meter states across the fleet" delay={0.32}>
            <div className="h-[240px] w-full">
              {meterStatusBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={meterStatusBarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {meterStatusBarData.map((entry, index) => (
                        <Cell key={`ms-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No meter data yet</div>
              )}
            </div>
          </BarChartCard>
        </div>

        {/* Vendor Distribution */}
        {vendorTypeBarData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <h3 className="text-lg font-extrabold text-[#0A1F44] mb-1">Vendor Distribution</h3>
            <p className="text-sm text-slate-500 mb-6">Breakdown by business category</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vendorTypeBarData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
                      {vendorTypeBarData.map((entry, index) => (
                        <Cell key={`vtb-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-[260px] w-full max-w-md mx-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vendorTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {vendorTypeData.map((_, index) => (
                        <Cell key={`vt-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="square"
                      formatter={(value) => (
                        <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pt-4 pb-2">
          © {dayjs().year()} SmatraPay Smart Metering & Vending System
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
