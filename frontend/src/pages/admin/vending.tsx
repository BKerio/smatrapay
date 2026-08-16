import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Settings, Save, RefreshCw, Zap, Database, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';

interface VendingSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const VendingSettingsPage = () => {
  const { user } = useOutletContext<UserContext>();
  const [settings, setSettings] = useState<VendingSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [isTabLoading, setIsTabLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (!user) return;
    loadConfigs();
  }, [user]);

  const loadConfigs = async () => {
    try {
      if (!isTabLoading) setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/admin/vending-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 200) {
        const settingsData = response.data.settings;
        setSettings(settingsData);
        
        const initial: Record<string, string> = {};
        settingsData.forEach((setting: VendingSetting) => {
          initial[setting.key] = setting.value;
        });
        setEditedConfigs(initial);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load vending configuration',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setLoading(false);
      setIsTabLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const settingsToUpdate = Object.entries(editedConfigs)
        .filter(([key, value]) => {
          const original = settings.find(s => s.key === key);
          return original && String(value) !== String(original.value);
        })
        .map(([key, value]) => ({ key, value }));

      if (settingsToUpdate.length === 0) {
          setSaving(false);
          return;
      }

      const response = await axios.post(
        `${API_URL}/admin/vending-settings/bulk-update`,
        { settings: settingsToUpdate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Vending configuration updated successfully',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
        setIsTabLoading(true);
        await loadConfigs();
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
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

  const hasChanges = () => {
    return Object.keys(editedConfigs).some(key => {
      const original = settings.find(s => s.key === key);
      return original && String(editedConfigs[key]) !== String(original.value);
    });
  };

  if (!user || loading) return <DashboardLoader />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header - Matching SystemConfig design */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3.5 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/80 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl shrink-0 shadow-sm">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                  Vending Configuration
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  Manage global STS vending parameters (SGC, KRN, TI, EA, KEN)
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Configuration Card - Matching SystemConfig styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Action Header - Matching SystemConfig row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                STS Parameters
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setIsTabLoading(true);
                  await loadConfigs();
                  setTimeout(() => setIsTabLoading(false), 300);
                }}
                disabled={isTabLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isTabLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges() || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vending Engine Configuration
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure baseline parameters for STS token generation. Changes take effect on the next transaction.
            </p>
          </div>

          <div className="p-6 space-y-6 relative">
            {isTabLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading State...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {settings.map((setting, index) => (
                <motion.div
                  key={setting.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {setting.key.replace('vending_', '').toUpperCase()}
                    <span className="ml-2 text-[10px] text-gray-400 font-normal">
                      ({setting.type})
                    </span>
                  </label>

                  <input
                    type="text"
                    value={editedConfigs[setting.key] !== undefined ? editedConfigs[setting.key] : setting.value}
                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder={`Enter ${setting.key.replace('vending_', '')}`}
                  />
                  
                  {setting.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic pl-1">
                      {setting.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Warning Context - Matching the blue warning bar style */}
            <div className="mt-8 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <div className="flex gap-3">
                <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-bold mb-1 underline">Protocol Note:</p>
                  <p className="opacity-80">
                    These values define the encryption and group membership for STS meters. Incorrect <b>SGC</b> or <b>KRN</b> settings will cause generated tokens to be rejected by the physical meters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VendingSettingsPage;
