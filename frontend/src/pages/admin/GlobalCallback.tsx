import { useEffect, useState } from 'react';
import { Globe, Save, RefreshCw, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';

const GlobalCallback = () => {
    const [callbackUrl, setCallbackUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/admin/system-config/category/mpesa`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status === 200) {
                const config = response.data.configs.find((c: any) => c.key === 'mpesa_callback_url');
                if (config) {
                    setCallbackUrl(config.value);
                }
            }
        } catch (error: any) {
            console.error('Error loading config:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load M-Pesa configuration',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!callbackUrl.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Invalid URL',
                text: 'Please enter a valid callback URL',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/admin/system-config/bulk-update`,
                {
                    configs: [
                        { key: 'mpesa_callback_url', value: callbackUrl }
                    ]
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.status === 200) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Global M-Pesa Callback updated successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
            }
        } catch (error: any) {
            console.error('Error saving config:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to save configuration',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <DashboardLoader />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
            <div className="w-full max-w-xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-8"
                >
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                            <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Global M-Pesa Callback
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Update the platform's central callback URL for all vendor transactions.
                        </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                                Callback URL (Ngrok or Production)
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Smartphone className="w-5 h-5" />
                                </div>
                                <input
                                    type="url"
                                    value={callbackUrl}
                                    onChange={(e) => setCallbackUrl(e.target.value)}
                                    placeholder="https://your-ngrok.ngrok-free.app/api/mpesa/callback"
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-1 italic">
                                Important: All vendor transactions will be sent to this URL.
                            </p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={loadConfig}
                                className="flex-1 px-6 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reset
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl py-3.5 font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {saving ? 'Applying...' : 'Apply Global Callback'}
                            </button>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">
                            Operational Note
                        </h4>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
                            Ensure your local Ngrok tunnel is active before saving. Any changes here instantly update the STK push payload for all active vendors on the platform.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GlobalCallback;
