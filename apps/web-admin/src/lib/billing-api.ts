import api from './api';

export type BillingPaymentProvider = 'none' | 'manual' | 'stripe' | 'payos' | 'vnpay' | 'momo';
export type BillingExportFormat = 'csv' | 'xlsx';

export interface BillingConfig {
  paymentProvider: BillingPaymentProvider;
  paymentPublicKey: string;
  paymentMerchantId: string;
  paymentWebhookUrl: string;
  currency: string;
  baseCoursePriceMinor: number;
  discountPercent: number;
  taxPercent: number;
  invoicePrefix: string;
  exportFormat: BillingExportFormat;
  updatedAt: string | null;
}

export type UpdateBillingConfigPayload = Partial<Omit<BillingConfig, 'updatedAt'>>;

export const billingApi = {
  getConfig() {
    return api.get('/admin/billing/config').then((r) => r.data as BillingConfig);
  },

  updateConfig(payload: UpdateBillingConfigPayload) {
    return api.patch('/admin/billing/config', payload).then((r) => r.data as BillingConfig);
  },
};
