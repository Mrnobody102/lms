import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Tenant } from './use-tenants';

export interface TenantRef {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface PlatformUsageRow {
  tenant: TenantRef;
  mediaAssets: number;
  mediaStorageBytes: number;
  ledger: Array<{ type: string; unit: string; quantity: string }>;
  requestMetrics: {
    count: number;
    errorCount: number;
    averageDurationMs: number;
    maxDurationMs: number;
    lastSeenAt?: string;
  } | null;
}

export interface PlatformBillingData {
  plans: Array<{
    id: string;
    tenantId: string;
    tenant: TenantRef;
    name: string;
    code: string;
    status: string;
    storageQuotaBytes: string;
    aiRequestQuota: number;
  }>;
  subscriptions: Array<{
    id: string;
    tenantId: string;
    tenant: TenantRef;
    plan: { id: string; name: string; code: string };
    status: string;
    storageQuotaBytes: string;
    aiRequestQuota: number;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  }>;
  invoices: Array<{
    id: string;
    tenantId: string;
    tenant: TenantRef;
    number: string;
    status: string;
    currency: string;
    totalMinor: number;
    dueAt?: string | null;
    paidAt?: string | null;
  }>;
  payments: Array<{
    id: string;
    tenantId: string;
    tenant: TenantRef;
    status: string;
    provider: string;
    currency: string;
    amountMinor: number;
    paidAt?: string | null;
  }>;
}

export interface PlatformDomainRow {
  tenant: TenantRef;
  domain: string | null;
  status: 'configured' | 'missing';
  metadata: Record<string, unknown>;
}

export interface PlatformFeatureFlagRow {
  tenant: TenantRef;
  featureFlags: PlatformFeatureFlags;
}

export interface PlatformFeatureFlags {
  aiTutorEnabled: boolean;
  activationCodesEnabled: boolean;
  roleplayEnabled: boolean;
  marketplaceEnabled: boolean;
  billingEnabled: boolean;
  mediaUploadEnabled: boolean;
}

export interface PlatformAuditLog {
  id: string;
  tenantId: string;
  action: string;
  status: string;
  userId?: string | null;
  metadata?: unknown;
  createdAt: string;
  user?: { id: string; email: string; fullName: string | null; role: string } | null;
}

export interface PlatformIncident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'warning' | 'critical';
  status: string;
  title: string;
  detail: string;
  tenantId?: string | null;
  createdAt: string;
}

export interface PlatformAiStatus {
  mode: 'env-managed';
  provider: 'off' | 'gateway' | 'groq';
  configured: boolean;
  model: string | null;
  dynamicConfigEnabled: boolean;
  keyStorage: 'render-env';
  keyMasked: 'configured' | 'missing';
  frontendExposureAllowed: boolean;
}

export interface TenantOverview {
  tenant: Tenant;
  counts: {
    users: number;
    activeUsers: number;
    courses: number;
    enrollments: number;
    lessons: number;
    mediaAssets: number;
    mediaStorageBytes: number;
  };
  subscription: {
    id: string;
    status: string;
    plan: { id: string; name: string; code: string };
    storageQuotaBytes: string;
    aiRequestQuota: number;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  } | null;
  readiness: {
    hasDomain: boolean;
    hasActiveSubscription: boolean;
    hasStorageQuota: boolean;
    hasAiQuota: boolean;
    featureFlags: PlatformFeatureFlags;
  };
  recentAuditLogs: PlatformAuditLog[];
}

export function usePlatformUsage(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'usage'],
    queryFn: async () => {
      const response = await api.get<PlatformUsageRow[]>('/admin/platform/usage');
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformBilling(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'billing'],
    queryFn: async () => {
      const response = await api.get<PlatformBillingData>('/admin/platform/billing');
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformDomains(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'domains'],
    queryFn: async () => {
      const response = await api.get<PlatformDomainRow[]>('/admin/platform/domains');
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformFeatureFlags(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'feature-flags'],
    queryFn: async () => {
      const response = await api.get<PlatformFeatureFlagRow[]>('/admin/platform/feature-flags');
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useUpdatePlatformFeatureFlags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId,
      featureFlags,
    }: {
      tenantId: string;
      featureFlags: Partial<PlatformFeatureFlags>;
    }) => {
      const response = await api.patch<PlatformFeatureFlagRow>(
        `/admin/platform/feature-flags/${tenantId}`,
        featureFlags,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-overview'] });
    },
  });
}

export function usePlatformAuditLogs(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'audit-logs'],
    queryFn: async () => {
      const response = await api.get<PlatformAuditLog[]>('/admin/platform/audit-logs');
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function usePlatformIncidents(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'incidents'],
    queryFn: async () => {
      const response = await api.get<PlatformIncident[]>('/admin/platform/incidents');
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function usePlatformAiStatus(enabled = true) {
  return useQuery({
    queryKey: ['platform', 'ai-status'],
    queryFn: async () => {
      const response = await api.get<PlatformAiStatus>('/admin/platform/ai-status');
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useTenantOverview(id: string, enabled = true) {
  return useQuery({
    queryKey: ['tenant-overview', id],
    queryFn: async () => {
      const response = await api.get<TenantOverview>(`/admin/tenants/${id}/overview`);
      return response.data;
    },
    enabled: enabled && Boolean(id),
    staleTime: 30 * 1000,
  });
}
