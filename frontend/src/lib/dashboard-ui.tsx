import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
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
import { ChevronRight } from 'lucide-react';

export const CHART_COLORS = ['#0A1F44', '#2563eb', '#4f46e5', '#60a5fa', '#f59e0b', '#10b981'];

export interface StatCardData {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
}

export interface QuickActionData {
  text: string;
  desc: string;
  icon: React.ElementType;
  path: string;
}

export interface ChartDatum {
  name: string;
  value: number;
  count?: number;
  fill?: string;
}

export const StatCard = ({ stat, index }: { stat: StatCardData; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 mb-2">{stat.title}</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0A1F44] tracking-tight break-words">
          {stat.value}
        </h3>
        <p className="text-xs text-slate-400 mt-2">{stat.change}</p>
      </div>
      <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
        <stat.icon size={22} strokeWidth={1.75} />
      </div>
    </div>
  </motion.div>
);

export const CustomTooltip = ({
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

export const BarChartCard = ({
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

export const DashboardHeader = ({
  title,
  subtitle,
  initials,
}: {
  title: string;
  subtitle: string;
  initials: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0A1F44] rounded-2xl px-6 py-5 md:px-8 md:py-6 flex items-center justify-between shadow-lg"
  >
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
      <p className="text-sm md:text-base text-blue-100/80 mt-1 font-medium">{subtitle}</p>
      <p className="text-xs text-blue-200/50 mt-2 hidden sm:block">{dayjs().format('dddd, D MMMM YYYY')}</p>
    </div>
    <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white flex items-center justify-center text-[#0A1F44] font-extrabold text-sm md:text-base shadow-md shrink-0">
      {initials}
    </div>
  </motion.div>
);

export const QuickActionGrid = ({ actions }: { actions: QuickActionData[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {actions.map((action) => (
      <Link key={action.text} to={action.path}>
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 h-full"
        >
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#0A1F44] shrink-0">
            <action.icon size={22} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[#0A1F44] text-sm">{action.text}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{action.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto shrink-0" />
        </motion.div>
      </Link>
    ))}
  </div>
);

export const PieBarStatistics = ({
  title,
  subtitle,
  pieData,
  barData,
  delay = 0.15,
}: {
  title: string;
  subtitle: string;
  pieData: ChartDatum[];
  barData: ChartDatum[];
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
  >
    <h3 className="text-lg font-extrabold text-[#0A1F44] mb-1">{title}</h3>
    <p className="text-sm text-slate-500 mb-6">{subtitle}</p>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[280px] w-full">
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                outerRadius={100}
                dataKey="value"
                label={({ value }) => `${value}`}
                labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
              >
                {pieData.map((_, index) => (
                  <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="square"
                formatter={(value) => <span className="text-slate-600 text-xs font-medium ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available yet</div>
        )}
      </div>

      <div className="h-[280px] w-full">
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={56}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {barData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill ?? CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data available yet</div>
        )}
      </div>
    </div>
  </motion.div>
);

export const VerticalBarChart = ({
  data,
  emptyMessage = 'No data yet',
}: {
  data: ChartDatum[];
  emptyMessage?: string;
}) => (
  <div className="h-[240px] w-full">
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`vbar-${index}`} fill={entry.fill ?? CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">{emptyMessage}</div>
    )}
  </div>
);

export const DashboardFooter = () => (
  <p className="text-center text-xs text-slate-400 pt-4 pb-2">
    © {dayjs().year()} SmatraPay Smart Metering & Vending System
  </p>
);

export function toBarData(items: { name: string; value: number }[]): ChartDatum[] {
  return items.map((item, i) => ({
    name: item.name,
    value: item.value,
    count: item.value,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

export function getInitials(name: string, fallback = 'TP'): string {
  if (!name?.trim()) return fallback;
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
