import type { SystemConfig } from '@/pages/system-config-types';

type VendorMpesaConfig = {
  consumer_key?: string;
  consumer_secret?: string;
  passkey?: string;
  shortcode?: string;
  till_no?: string;
  env?: string;
  transaction_type?: string;
};

export function buildVendorMpesaConfigs(vendorConfig: VendorMpesaConfig = {}): SystemConfig[] {
  return [
    {
      id: 7,
      key: 'mpesa_consumer_key',
      value: vendorConfig.consumer_key ? '***' : '',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Consumer Key',
      is_encrypted: true,
      is_masked: !!vendorConfig.consumer_key,
      created_at: '',
      updated_at: '',
    },
    {
      id: 8,
      key: 'mpesa_consumer_secret',
      value: vendorConfig.consumer_secret ? '***' : '',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Consumer Secret',
      is_encrypted: true,
      is_masked: !!vendorConfig.consumer_secret,
      created_at: '',
      updated_at: '',
    },
    {
      id: 9,
      key: 'mpesa_passkey',
      value: vendorConfig.passkey ? '***' : '',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Passkey (for STK Push)',
      is_encrypted: true,
      is_masked: !!vendorConfig.passkey,
      created_at: '',
      updated_at: '',
    },
    {
      id: 10,
      key: 'mpesa_shortcode',
      value: vendorConfig.shortcode || '',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Business Shortcode (Paybill/Store)',
      is_encrypted: false,
      is_masked: false,
      created_at: '',
      updated_at: '',
    },
    {
      id: 11,
      key: 'mpesa_till_no',
      value: vendorConfig.till_no || '',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Till Number (if applicable)',
      is_encrypted: false,
      is_masked: false,
      created_at: '',
      updated_at: '',
    },
    {
      id: 12,
      key: 'mpesa_env',
      value: vendorConfig.env || 'sandbox',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Environment (sandbox or live)',
      is_encrypted: false,
      is_masked: false,
      created_at: '',
      updated_at: '',
    },
    {
      id: 14,
      key: 'mpesa_transaction_type',
      value: vendorConfig.transaction_type || 'CustomerBuyGoodsOnline',
      type: 'string',
      category: 'mpesa',
      description: 'M-Pesa Transaction Type',
      is_encrypted: false,
      is_masked: false,
      created_at: '',
      updated_at: '',
    },
  ];
}

export function buildLandlordMpesaConfigs(config: VendorMpesaConfig = {}): SystemConfig[] {
  return buildVendorMpesaConfigs(config);
}

/** @deprecated Use buildLandlordMpesaConfigs */
export const buildLandlordPaymentConfigs = buildLandlordMpesaConfigs;

export function mapEditedToVendorMpesaConfig(edited: Record<string, string>): Record<string, string> {
  const vendorConfig: Record<string, string> = {};
  const setIf = (key: string, field: string, trim = false) => {
    const val = edited[key];
    if (val === undefined) return;
    if (trim && !val.trim()) return;
    vendorConfig[field] = val;
  };

  setIf('mpesa_consumer_key', 'consumer_key', true);
  setIf('mpesa_consumer_secret', 'consumer_secret', true);
  setIf('mpesa_passkey', 'passkey', true);
  setIf('mpesa_shortcode', 'shortcode');
  setIf('mpesa_till_no', 'till_no');
  setIf('mpesa_env', 'env');
  setIf('mpesa_transaction_type', 'transaction_type');

  return vendorConfig;
}
