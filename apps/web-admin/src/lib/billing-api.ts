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

export interface BillingOverview {
  subscription: {
    planName: string;
    status: string;
    storageQuotaBytes: string;
    aiRequestQuota: number;
  } | null;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    currency: string;
    totalMinor: number;
    dueAt: string | null;
    paidAt: string | null;
  }>;
  payments: Array<{
    id: string;
    status: string;
    provider: string;
    currency: string;
    amountMinor: number;
    paidAt: string | null;
  }>;
}

export const billingApi = {
  getConfig() {
    return api.get('/admin/billing/config').then((r) => r.data as BillingConfig);
  },

  updateConfig(payload: UpdateBillingConfigPayload) {
    return api.patch('/admin/billing/config', payload).then((r) => r.data as BillingConfig);
  },

  getOverview() {
    return api.get('/admin/billing/overview').then((r) => r.data as BillingOverview);
  },
};
