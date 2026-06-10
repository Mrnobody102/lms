import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Tenant } from './use-tenants';

export interface TenantRef {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
}

export interface PlatformPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlatformPaginated<T> {
  items: T[];
  meta: PlatformPaginationMeta;
}

export interface PlatformListParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: string;
  status?: string;
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
  summary: {
    plans: number;
    subscriptions: number;
    invoices: number;
    payments: number;
  };
  plans: PlatformPaginated<{
    id: string;
    tenantId: string;
    tenant: TenantRef;
    name: string;
    code: string;
    status: string;
    storageQuotaBytes: string;
    aiRequestQuota: number;
  }>;
  subscriptions: PlatformPaginated<{
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
  invoices: PlatformPaginated<{
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
  payments: PlatformPaginated<{
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

export interface PlatformAiUsageRow {
  tenant: TenantRef;
  provider: 'off' | 'gateway' | 'groq';
  configured: boolean;
  model: string | null;
  quotaConfigured: boolean;
  subscriptionQuota: number | null;
  periodUsed: number;
  periodRemaining: number | null;
  latestRequestAt: string | null;
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

export function usePlatformUsage(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'usage', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformUsageRow>>('/admin/platform/usage', {
        params: cleanListParams(params),
      });
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformBilling(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'billing', params],
    queryFn: async () => {
      const response = await api.get<PlatformBillingData>('/admin/platform/billing', {
        params: cleanListParams(params),
      });
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformDomains(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'domains', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformDomainRow>>(
        '/admin/platform/domains',
        { params: cleanListParams(params) },
      );
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePlatformFeatureFlags(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'feature-flags', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformFeatureFlagRow>>(
        '/admin/platform/feature-flags',
        { params: cleanListParams(params) },
      );
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

export function usePlatformAuditLogs(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'audit-logs', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformAuditLog>>(
        '/admin/platform/audit-logs',
        { params: cleanListParams(params) },
      );
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function usePlatformIncidents(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'incidents', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformIncident>>(
        '/admin/platform/incidents',
        { params: cleanListParams(params) },
      );
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

export function usePlatformAiUsage(params: PlatformListParams = {}, enabled = true) {
  return useQuery({
    queryKey: ['platform', 'ai-usage', params],
    queryFn: async () => {
      const response = await api.get<PlatformPaginated<PlatformAiUsageRow>>(
        '/admin/platform/ai-usage',
        { params: cleanListParams(params) },
      );
      return response.data;
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

function cleanListParams(params: PlatformListParams) {
  const cleaned: Record<string, string | number> = {};
  if (params.page) cleaned.page = params.page;
  if (params.limit) cleaned.limit = params.limit;
  if (params.search?.trim()) cleaned.search = params.search.trim();
  if (params.tenantId?.trim() && params.tenantId !== 'all') cleaned.tenantId = params.tenantId;
  if (params.status?.trim() && params.status !== 'all') cleaned.status = params.status;
  return cleaned;
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
