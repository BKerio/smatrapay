import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Activity,
    RefreshCw,
    Loader2,
    Calendar,
    Monitor,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLoader from "@/lib/loader";

// --- Types ---
type TabType = 'logs' | 'communications' | 'tasks' | 'attendances';

interface AuditLogDto {
    id: number;
    user_id: number | null;
    action: string;
    description: string;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    user?: {
        name: string;
        member?: { full_name: string; e_kanisa_number: string; }
    };
}

interface CommunicationDto {
    id: number;
    title: string;
    message: string;
    type: string;
    sent_by: number;
    created_at: string;
    sender?: { full_name: string; role: string; };
    group?: { name: string; };
}

interface TaskDto {
    id: number;
    action: string;
    status: string;
    due_date?: string;
    created_at: string;
    minute?: { title: string; };
}

interface AttendanceDto {
    id: number;
    event_type: string;
    event_date: string;
    scanned_at?: string;
    created_at: string;
    member?: { full_name: string; e_kanisa_number: string; };
}

// --- Helpers ---
const getActionStyle = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add')) return { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-800 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800/50", icon: "plus" };
    if (a.includes('update') || a.includes('edit')) return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800/50", icon: "edit" };
    if (a.includes('delete') || a.includes('remove')) return { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-400", border: "border-red-200 dark:border-red-800/50", icon: "trash" };
    if (a.includes('login') || a.includes('auth')) return { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800/50", icon: "lock" };
    return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-300", border: "border-slate-200 dark:border-slate-700", icon: "activity" };
};

const getCommStyle = (type: string) => {
    if (type === 'broadcast') return { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-900 dark:text-orange-400", label: "Broadcast" };
    if (type === 'group') return { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-900 dark:text-indigo-400", label: "Group" };
    return { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-900 dark:text-blue-400", label: "Individual" };
};

// --- Main Component ---
const AuditLogsPage = () => {
    const API_URL = import.meta.env.VITE_API_URL;
    const [activeTab, setActiveTab] = useState<TabType>('logs');
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [perPage] = useState(20);

    const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("token") : null), []);

    const fetchData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            let endpoint = '/admin/audit-logs';
            if (activeTab === 'communications') endpoint = '/admin/audit-logs/communications';
            if (activeTab === 'tasks') endpoint = '/admin/audit-logs/tasks';
            if (activeTab === 'attendances') endpoint = '/admin/audit-logs/attendances';

            const url = `${API_URL}${endpoint}?search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

            const responseData = res.data as any;
            const pagination = responseData.data;
            const items = Array.isArray(pagination) ? pagination : (pagination?.data || []);

            setData(items);
            setTotal(pagination?.total || items.length);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        const handler = setTimeout(() => fetchData(), 400);
        return () => clearTimeout(handler);
    }, [query, page]);

    // Formatters
    const formatDate = (date: string) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const formatTime = (date: string) => new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    // Renderers
    const renderLogs = (log: AuditLogDto) => {
        const style = getActionStyle(log.action);
        return (
            <div className="flex flex-col md:flex-row gap-5 items-start">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${style.bg} ${style.text}`}>
                    <Activity className="w-5 h-5" />
                </div>
                <div className="flex-grow w-full">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{log.action}</h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatDate(log.created_at)} {formatTime(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{log.description}</p>
                    {log.details && (
                        <div className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-500 dark:text-slate-400 overflow-x-auto max-h-32 overflow-y-auto custom-scrollbar">
                            {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2).replace(/[{},"]/g, '').trim() : String(log.details)}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                        <span className="font-bold text-slate-500 dark:text-slate-300">{log.user?.member?.full_name || log.user?.name || 'System'}</span>
                        <span className="dark:text-slate-700">•</span>
                        <span className="font-mono">{log.ip_address}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderComm = (comm: CommunicationDto) => {
        const style = getCommStyle(comm.type);
        return (
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.bg} ${style.text}`}>
                    <span className="font-bold text-xs">{style.label[0]}</span>
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>{style.label}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{comm.title || 'No Subject'}</span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comm.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-2">{comm.message}</p>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        From: <span className="font-bold text-slate-700 dark:text-slate-300">{comm.sender?.full_name || 'System'}</span> {comm.group && `• To: ${comm.group.name}`}
                    </div>
                </div>
            </div>
        );
    };

    const renderTask = (task: TaskDto) => {
        const isDone = task.status === 'Done' || task.status === 'Completed';
        return (
            <div className="flex gap-4 items-center">
                <div className={`w-1.5 rounded-full h-12 ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <div className="flex-grow">
                    <div className="flex justify-between">
                        <h4 className={`font-bold ${isDone ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{task.action}</h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${isDone ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'}`}>
                            {task.status}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span>Minute: {task.minute?.title || 'Unknown'}</span>
                        {task.due_date && (
                            <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                <Calendar className="w-3 h-3" /> {formatDate(task.due_date)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAttendance = (att: AttendanceDto) => {
        const isScanned = !!att.scanned_at;
        return (
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${isScanned ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    {isScanned ? <Monitor className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{att.member?.full_name || 'Unknown Member'}</div>
                        {isScanned && (
                            <div className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/50 font-bold">
                                Scanned {formatTime(att.scanned_at!)}
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {att.member?.e_kanisa_number && <span className="font-mono mr-2">#{att.member.e_kanisa_number}</span>}
                        <span>{att.event_type} • {formatDate(att.event_date)}</span>
                    </div>
                </div>
            </div>
        );
    };

    const totalPages = Math.max(1, Math.ceil(total / perPage));

    if (loading && activeTab === 'logs' && data.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <DashboardLoader title="Loading Activity" subtitle="Fetching system records..." />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors">
            {/* Header with Tabs */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0A1F44] dark:text-white mb-1">System Activity</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Global registry of all system events and records</p>
                </div>

                {/* Tabs Pilla */}
                <div className="flex overflow-x-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-full">
                    {(['logs', 'communications', 'tasks', 'attendances'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-[#0A1F44] dark:bg-blue-700 text-white shadow-md transform scale-[1.02]'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 mb-6">
                <div className="relative group flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="pl-10 pr-4 py-2.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-[#0A1F44]/10 dark:focus:ring-blue-500/20 focus:border-[#0A1F44] dark:focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                </div>
                <button onClick={fetchData} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:text-[#0A1F44] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm active:scale-95">
                    {loading ? <Loader2 className="animate-spin w-5 h-5 text-slate-500 dark:text-slate-400" /> : <RefreshCw className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                </button>
            </div>

            {/* Content List */}
            <div className="space-y-4 max-w-5xl mx-auto pb-20">
                <AnimatePresence mode="wait">
                    {data.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:border-blue-900 transition-all cursor-default"
                        >
                            {activeTab === 'logs' && renderLogs(item)}
                            {activeTab === 'communications' && renderComm(item)}
                            {activeTab === 'tasks' && renderTask(item)}
                            {activeTab === 'attendances' && renderAttendance(item)}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!loading && data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4 opacity-50">
                            <Activity className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-500 font-medium">No records found for {activeTab}</p>
                    </div>
                )}

                {/* Pagination */}
                {total > 0 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-500 dark:text-slate-400 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center px-4 font-bold text-sm text-[#0A1F44] dark:text-white">
                                Page {page} of {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 text-slate-500 dark:text-slate-400 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogsPage;