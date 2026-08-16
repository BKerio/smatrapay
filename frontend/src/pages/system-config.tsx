import { useEffect, useState, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Settings, Save, Eye, EyeOff, MessageSquare, RefreshCw, ChevronDown, Globe, Building2, Home, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import DashboardLoader from '@/lib/loader';
import type { SystemConfig, PaymentEntity, PaymentEntityType } from '@/pages/system-config-types';
import {
  buildVendorMpesaConfigs,
  buildLandlordMpesaConfigs,
  mapEditedToVendorMpesaConfig,
} from '@/lib/payment-config-fields';

interface UserContext {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const SystemConfigPage = () => {
  const { user } = useOutletContext<UserContext>();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [editedConfigs, setEditedConfigs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'sms' | 'mpesa'>('sms');

  const [isVendor, setIsVendor] = useState(false);
  const [vendorEmail, setVendorEmail] = useState('');
  const [isTabLoading, setIsTabLoading] = useState(false);

  const [entityType, setEntityType] = useState<PaymentEntityType>('vendor');
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [entities, setEntities] = useState<PaymentEntity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    if (user) {
      console.log('User detected:', { email: user.email, role: user.role });
      const vendor = user.role === 'vendor';
      setIsVendor(vendor);
      setVendorEmail(user.email || '');
    } else {
      console.log('User is null or undefined');
      setIsVendor(false);
      setVendorEmail('');
    }
  }, [user?.email, user?.role]);

  useEffect(() => {
    if (isVendor && activeTab === 'mpesa') {
      setActiveTab('sms');
    }
  }, [isVendor, activeTab]);

  const loadPaymentEntities = useCallback(async () => {
    try {
      setEntitiesLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/payment-config/entities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 200) {
        const list: PaymentEntity[] = [
          ...(response.data.vendors || []).map((v: PaymentEntity) => ({ ...v, type: 'vendor' as const })),
          ...(response.data.landlords || []).map((l: PaymentEntity) => ({ ...l, type: 'landlord' as const })),
        ];
        setEntities(list);
      }
    } catch (error) {
      console.error('Failed to load payment entities', error);
    } finally {
      setEntitiesLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (isAdmin && activeTab === 'mpesa') {
      loadPaymentEntities();
    }
  }, [isAdmin, activeTab, loadPaymentEntities]);

  useEffect(() => {
    // Only load configs if user is available
    if (!user) {
      console.log('Waiting for user to load...');
      return;
    }

    const loadWithTransition = async () => {
      setIsTabLoading(true);
      await loadConfigs();
      // Small delay for smooth transition
      setTimeout(() => setIsTabLoading(false), 200);
    };
    loadWithTransition();
  }, [activeTab, user?.email, user?.role, selectedEntityId, entityType]);


  const loadConfigs = async () => {
    // Double-check user role from context
    const currentUser = user;

    // Don't load if user is not available yet
    if (!currentUser) {
      console.log('User not available yet, skipping config load');
      return;
    }

    const isVendorUser = currentUser.role === 'vendor';
    const isAdminUser = ['admin', 'system_admin'].includes(currentUser.role);
    const currentVendorEmail = currentUser.email || '';

    try {
      if (!isTabLoading) {
        setLoading(true);
      }
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      let configsData: SystemConfig[] = [];

      // Admin: per-vendor / per-landlord M-Pesa credentials
      if (isAdminUser && activeTab === 'mpesa') {
        if (!selectedEntityId) {
          setConfigs([]);
          setEditedConfigs({});
          setVisiblePasswords({});
          return;
        }

        if (entityType === 'vendor') {
          const response = await axios.get(`${API_URL}/admin/payment-config/vendors/${selectedEntityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.status === 200) {
            configsData = buildVendorMpesaConfigs(response.data.mpesa_config || {});
          }
        } else {
          const response = await axios.get(`${API_URL}/admin/payment-config/landlords/${selectedEntityId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.status === 200) {
            configsData = buildLandlordMpesaConfigs(response.data.mpesa_config || {});
          }
        }

        setConfigs(configsData);
        const initial: Record<string, string> = {};
        configsData.forEach((config) => {
          initial[config.key] = config.is_masked ? '' : (config.value ?? '');
        });
        setEditedConfigs(initial);
        setVisiblePasswords({});
        return;
      }

      if (isVendorUser && currentVendorEmail && activeTab === 'sms') {
        // Load vendor-specific config
        console.log('Loading vendor config for:', currentVendorEmail);
        try {
          const response = await axios.get(`${API_URL}/vendor/config`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log('Vendor config response:', response.data);

          if (response.data.status === 200) {
            const vendorConfig = response.data.sms_config;
            configsData = [
              {
                id: 1,
                key: 'sms_provider',
                value: vendorConfig?.provider || '',
                type: 'string',
                category: 'sms',
                description: 'SMS Provider name (advanta, fornax, twilio, etc.)',
                is_encrypted: false,
                is_masked: false,
                created_at: '',
                updated_at: '',
              },
              {
                id: 2,
                key: 'sms_api_url',
                value: vendorConfig?.api_url || '',
                type: 'string',
                category: 'sms',
                description: 'SMS API endpoint URL',
                is_encrypted: false,
                is_masked: false,
                created_at: '',
                updated_at: '',
              },
              {
                id: 3,
                key: 'sms_api_key',
                value: vendorConfig?.api_key ? '***' : '',
                type: 'string',
                category: 'sms',
                description: 'SMS API Key',
                is_encrypted: true,
                is_masked: !!vendorConfig?.api_key,
                created_at: '',
                updated_at: '',
              },
              {
                id: 4,
                key: 'sms_partner_id',
                value: vendorConfig?.partner_id || '',
                type: 'string',
                category: 'sms',
                description: 'SMS Partner ID',
                is_encrypted: false,
                is_masked: false,
                created_at: '',
                updated_at: '',
              },
              {
                id: 5,
                key: 'sms_shortcode',
                value: vendorConfig?.shortcode || '',
                type: 'string',
                category: 'sms',
                description: 'SMS Shortcode/Sender ID',
                is_encrypted: false,
                is_masked: false,
                created_at: '',
                updated_at: '',
              },
              {
                id: 6,
                key: 'sms_enabled',
                value: vendorConfig?.enabled ? 'true' : 'false',
                type: 'boolean',
                category: 'sms',
                description: 'Enable or disable SMS service',
                is_encrypted: false,
                is_masked: false,
                created_at: '',
                updated_at: '',
              },
            ];
          }
        } catch (vendorError: unknown) {
          console.error('Error loading vendor config:', vendorError);
          const status = (vendorError as { response?: { status?: number } })?.response?.status;
          if (status !== 404) {
            throw vendorError;
          }
        }
      }

      // Global SystemConfig for admin SMS tab only
      if (isAdminUser && activeTab === 'sms') {
        const response = await axios.get(`${API_URL}/admin/system-config/category/${activeTab}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status === 200) {
          configsData = response.data.configs;
        }
      }

      setConfigs(configsData);
      // Replace edited state entirely so values never leak between tabs/vendors
      const initial: Record<string, string> = {};
      configsData.forEach((config: SystemConfig) => {
        initial[config.key] = config.is_masked ? '' : (config.value ?? '');
      });
      setEditedConfigs(initial);
      setVisiblePasswords({});
      console.log('Configs loaded successfully:', configsData.length, 'items');
    } catch (error: any) {
      console.error('Error loading configs:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load configuration';

      // If vendor config fails with 404, silently fallback to global config
      if (error.response?.status === 404 && isVendorUser) {
        console.log('Vendor config not found, loading global config as fallback');
        try {
          const response = await axios.get(`${API_URL}/admin/system-config/category/${activeTab}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (response.data.status === 200) {
            const configsData = response.data.configs;
            setConfigs(configsData);
            const initial: Record<string, string> = {};
            configsData.forEach((config: SystemConfig) => {
              initial[config.key] = config.is_masked ? '' : (config.value ?? '');
            });
            setEditedConfigs(initial);
            setVisiblePasswords({});
            return; // Successfully loaded global config
          }
        } catch (fallbackError) {
          console.error('Fallback to global config also failed:', fallbackError);
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      if (!isTabLoading) {
        setLoading(false);
      }
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      if (isVendor) {
        if (activeTab !== 'sms') {
          Swal.fire({
            icon: 'warning',
            title: 'Not allowed',
            text: 'M-Pesa API settings are managed by your administrator.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          return;
        }

        const vendorConfig: Record<string, string | boolean> = {};

        Object.entries(editedConfigs).forEach(([key, value]) => {
          const originalConfig = configs.find((c) => c.key === key);
          if (!originalConfig) return;

          if (!originalConfig.is_masked && value === originalConfig.value) {
            return;
          }

          if (originalConfig.is_masked && (!value || !value.trim())) {
            return;
          }

          switch (key) {
            case 'sms_provider':
              vendorConfig.provider = value;
              break;
            case 'sms_api_url':
              vendorConfig.api_url = value;
              break;
            case 'sms_api_key':
              if (value.trim()) vendorConfig.api_key = value;
              break;
            case 'sms_partner_id':
              vendorConfig.partner_id = value;
              break;
            case 'sms_shortcode':
              vendorConfig.shortcode = value;
              break;
            case 'sms_enabled':
              vendorConfig.enabled = value === 'true';
              break;
          }
        });

        const response = await axios.put(
          `${API_URL}/vendor/config`,
          { sms_config: vendorConfig },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Your SMS configuration updated successfully',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          setIsTabLoading(true);
          await loadConfigs();
          setTimeout(() => {
            setIsTabLoading(false);
            setVisiblePasswords({});
          }, 300);
        }
      } else if (isAdmin && activeTab === 'mpesa') {
        if (!selectedEntityId) {
          Swal.fire({
            icon: 'warning',
            title: 'Select account',
            text: 'Choose a vendor or landlord before saving payment settings.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
          });
          return;
        }

        if (entityType === 'vendor') {
          const mpesaConfig = mapEditedToVendorMpesaConfig(editedConfigs);
          const response = await axios.put(
            `${API_URL}/admin/payment-config/vendors/${selectedEntityId}`,
            mpesaConfig,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.status === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Vendor M-Pesa configuration updated successfully',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
            });
            setIsTabLoading(true);
            await loadConfigs();
            setTimeout(() => {
              setIsTabLoading(false);
              setVisiblePasswords({});
            }, 300);
          }
        } else {
          const mpesaConfig = mapEditedToVendorMpesaConfig(editedConfigs);
          const response = await axios.put(
            `${API_URL}/admin/payment-config/landlords/${selectedEntityId}`,
            mpesaConfig,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.status === 200) {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: 'Landlord M-Pesa configuration updated successfully',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 3000,
            });
            setIsTabLoading(true);
            await loadConfigs();
            setTimeout(() => {
              setIsTabLoading(false);
              setVisiblePasswords({});
            }, 300);
          }
        }
      } else {
        // Save global SystemConfig for admins
        const configsToUpdate = Object.entries(editedConfigs)
          .filter(([key, value]) => {
            const originalConfig = configs.find(c => c.key === key);
            if (!originalConfig) return false;
            // For encrypted/masked values, any non-empty value is considered a change
            if (originalConfig.is_masked) {
              return value && value.trim() !== '';
            }
            // For other values, check if it's different from original (treating null/undefined as empty string)
            const originalValue = originalConfig.value || '';
            const newValue = value || '';
            return newValue !== originalValue;
          })
          .map(([key, value]) => ({
            key,
            value,
          }));

        const response = await axios.post(
          `${API_URL}/admin/system-config/bulk-update`,
          { configs: configsToUpdate },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `${activeTab.toUpperCase()} configuration updated successfully`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
          // Reload configs smoothly without full page reload
          setIsTabLoading(true);
          await loadConfigs();
          setTimeout(() => {
            setIsTabLoading(false);
            setVisiblePasswords({});
          }, 300);
        }
      }
    } catch (error: any) {
      console.error('Error saving configs:', error);
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



  const filteredEntities = useMemo(
    () => entities.filter((e) => e.type === entityType),
    [entities, entityType]
  );

  useEffect(() => {
    if (!isAdmin || activeTab !== 'mpesa') return;
    if (filteredEntities.length > 0 && !filteredEntities.some((e) => e.id === selectedEntityId)) {
      setSelectedEntityId(filteredEntities[0].id);
    } else if (filteredEntities.length === 0) {
      setSelectedEntityId('');
    }
  }, [entityType, filteredEntities, isAdmin, activeTab, selectedEntityId]);

  const hasChanges = () => {
    return Object.keys(editedConfigs).length > 0;
  };

  // Show loader if user is not loaded yet or initial loading
  if (!user || loading) {
    return <DashboardLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3.5 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/80 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl shrink-0 shadow-sm">
                <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate tracking-tight">
                  {isVendor ? 'My Configuration' : 'System Configuration'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {isVendor
                    ? 'Manage your SMS service settings (M-Pesa is configured by admin)'
                    : isAdmin && activeTab === 'mpesa'
                      ? 'Configure M-Pesa API credentials per vendor or landlord'
                      : `Manage ${activeTab === 'sms' ? 'SMS' : 'M-Pesa'} service settings`}
                  {isVendor && vendorEmail && (
                    <span className="inline-flex mt-1 md:mt-0 md:ml-3 items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide normal bg-[#0A1F44]-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm">
                      Vendor: {vendorEmail}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SMS Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >

          {/* Tab switcher + action buttons row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="inline-flex bg-white dark:bg-gray-800/80 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700/80">
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'sms'
                  ? 'bg-blue-50 dark:bg-gray-700/80 border-blue-100 dark:border-gray-600 text-blue-700 dark:text-blue-400 shadow-sm border'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                SMS Config
              </button>
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('mpesa')}
                  className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'mpesa'
                    ? 'bg-blue-50 dark:bg-gray-700/80 border-blue-100 dark:border-gray-600 text-blue-700 dark:text-blue-400 shadow-sm border'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  Payment API
                </button>
              )}
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
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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

          {isAdmin && activeTab === 'mpesa' && (
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="inline-flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEntityType('vendor')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                      entityType === 'vendor'
                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Vendors
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntityType('landlord')}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${
                      entityType === 'landlord'
                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    Landlords
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    {entityType === 'vendor' ? 'Select vendor' : 'Select landlord'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      disabled={entitiesLoading || filteredEntities.length === 0}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
                    >
                      <option value="">
                        {entitiesLoading
                          ? 'Loading accounts...'
                          : filteredEntities.length === 0
                            ? `No ${entityType}s found`
                            : `Choose a ${entityType}`}
                      </option>
                      {filteredEntities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                          {entity.subtitle ? ` (${entity.subtitle})` : ''}
                          {entity.has_mpesa_config ? ' — configured' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2">
                Only administrators can change payment API credentials. Vendors cannot switch M-Pesa keys to bypass platform service rates.
              </p>
            </div>
          )}

          {/* Config content */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === 'sms' ? 'SMS Service' : 'M-Pesa Integration'} Configuration
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAdmin && activeTab === 'mpesa'
                ? entityType === 'vendor'
                  ? 'Set Safaricom Daraja credentials for the selected vendor. Secrets are encrypted and masked after save.'
                  : 'Set Safaricom Daraja credentials for the selected landlord. Secrets are encrypted and masked after save.'
                : `Configure your ${activeTab === 'sms' ? 'SMS provider' : 'Safaricom M-Pesa'} settings. Changes take effect immediately after saving.`}
            </p>
          </div>

          <div className="p-6 space-y-6 relative">
            {isTabLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {isAdmin && activeTab === 'mpesa' && !selectedEntityId ? (
                <motion.div
                  key="empty-entity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-gray-500 dark:text-gray-400"
                >
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Select a {entityType} to view and edit payment settings</p>
                </motion.div>
              ) : (
                <motion.div
                  key={`${activeTab}-${entityType}-${selectedEntityId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
              {configs.map((config, index) => (
                <motion.div
                  key={`${activeTab}-${config.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {config.description || config.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    {config.is_encrypted && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        (Encrypted)
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    {config.is_encrypted ? (
                      <div className="flex gap-2">
                        <input
                          type={visiblePasswords[config.key] ? 'text' : 'password'}
                          value={editedConfigs[config.key] !== undefined ? editedConfigs[config.key] : ''}
                          onChange={(e) => handleValueChange(config.key, e.target.value)}
                          placeholder={config.is_masked ? 'Enter new API key' : 'Enter value'}
                          className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(config.key)}
                          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          {visiblePasswords[config.key] ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ) : config.type === 'boolean' ? (
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedConfigs[config.key] === 'true' || (!editedConfigs[config.key] && config.value === 'true')}
                            onChange={(e) => handleValueChange(config.key, e.target.checked ? 'true' : 'false')}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {editedConfigs[config.key] === 'true' || (!editedConfigs[config.key] && config.value === 'true') ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </div>
                    ) : config.key === 'mpesa_env' ? (
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                          <Globe className="w-4 h-4" />
                        </div>
                        <select
                          value={editedConfigs[config.key] !== undefined ? editedConfigs[config.key] : config.value}
                          onChange={(e) => handleValueChange(config.key, e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-blue-400 dark:hover:border-blue-500 shadow-sm"
                        >
                          <option value="sandbox" className="dark:bg-gray-800">Sandbox (Development / Testing)</option>
                          <option value="live" className="dark:bg-gray-800">Live (Production)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    ) : config.key === 'mpesa_transaction_type' ? (
                      <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <select
                          value={editedConfigs[config.key] !== undefined ? editedConfigs[config.key] : config.value}
                          onChange={(e) => handleValueChange(config.key, e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all hover:border-blue-400 dark:hover:hover:border-blue-500 shadow-sm"
                        >
                          <option value="CustomerBuyGoodsOnline" className="dark:bg-gray-800">Buy Goods (Till Number)</option>
                          <option value="CustomerPayBillOnline" className="dark:bg-gray-800">Pay Bill (Shortcode)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editedConfigs[config.key] !== undefined ? editedConfigs[config.key] : config.value}
                        onChange={(e) => handleValueChange(config.key, e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={config.value}
                      />
                    )}
                  </div>

                  {config.key && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      Key: {config.key}
                    </p>
                  )}
                </motion.div>
              ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Info Box */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700 rounded-2xl">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Configuration Tips
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                <li>API Key and sensitive credentials are encrypted in the database</li>
                <li>Changes take effect immediately after saving</li>
                {isVendor && (
                  <li>M-Pesa API keys are managed by your administrator — contact support if payments fail</li>
                )}
                {isAdmin && activeTab === 'mpesa' && (
                  <li>Vendors cannot edit M-Pesa credentials; configure each vendor here to ensure platform rates apply</li>
                )}
                {activeTab === 'sms' ? (
                  <li>Disable SMS service by toggling "SMS Enabled" to off</li>
                ) : isAdmin ? (
                  <li>Ensure environment is set correctly (sandbox for testing, live for production)</li>
                ) : null}
                <li>Ensure your API endpoint URL is correct for your provider.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
