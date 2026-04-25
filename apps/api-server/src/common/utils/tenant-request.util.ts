import type { Request } from 'express';
import { Role } from '@repo/database';

export interface TenantAwareRequest extends Request {
  requestId?: string;
  tenantId?: string;
  requestedTenantHint?: string;
}

export function extractTenantHint(req: Request): string | undefined {
  const headerValue = req.headers['x-tenant-id'];
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }

  return extractTenantHintFromHost(req);
}

export function getScopedTenantId(request: {
  user: {
    tenantId: string;
    role: Role;
  };
  tenantId?: string;
}): string {
  if (request.user.role === Role.SUPER_ADMIN) {
    return request.tenantId ?? request.user.tenantId;
  }

  return request.user.tenantId;
}

function extractTenantHintFromHost(req: Request): string | undefined {
  const hostHeader = req.headers.host;
  if (!hostHeader) return undefined;

  const host = hostHeader.split(':')[0]?.trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return undefined;
  }

  const parts = host.split('.');
  if (parts.length > 2) {
    return parts[0];
  }

  return parts.length === 2 ? host : undefined;
}
