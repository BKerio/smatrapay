export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  is_encrypted: boolean;
  is_masked?: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentEntityType = 'vendor' | 'landlord';

export interface PaymentEntity {
  id: string;
  type: PaymentEntityType;
  name: string;
  subtitle?: string;
  vendor_type?: string;
  status?: string;
  has_mpesa_config?: boolean;
  payment_account?: string;
  phone?: string;
}
