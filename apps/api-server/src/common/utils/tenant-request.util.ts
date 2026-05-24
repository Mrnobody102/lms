import type { Request } from 'express';
import { Role } from '@repo/database';

export interface TenantAwareRequest extends Request {
  requestId?: string;
  tenantId?: string;
  requestedTenantHint?: string;
}

interface TenantHintOptions {
  allowTenantHeaderInProduction?: boolean;
  allowedOrigins?: string[];
  nodeEnv?: string;
}

export function extractTenantHints(req: Request, options: TenantHintOptions = {}): string[] {
  const queryValue = req.query?.tenantId;
  if (typeof queryValue === 'string' && queryValue.trim()) {
    return [queryValue.trim()];
  }

  const headerValue = req.headers['x-tenant-id'];
  const isProduction = (options.nodeEnv ?? process.env.NODE_ENV) === 'production';
  if (
    typeof headerValue === 'string' &&
    headerValue.trim() &&
    (!isProduction || options.allowTenantHeaderInProduction)
  ) {
    return [headerValue.trim()];
  }

  if (isProduction) {
    const originHints = extractTenantHintsFromUrl(req.headers.origin, options.allowedOrigins);
    if (originHints.length > 0) {
      return originHints;
    }

    return [];
  }

  return extractTenantHintsFromHost(req);
}

export function extractTenantHint(
  req: Request,
  options: TenantHintOptions = {},
): string | undefined {
  return extractTenantHints(req, options)[0];
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

function extractTenantHintsFromHost(req: Request): string[] {
  const hostHeader = req.hostname || req.headers.host;
  if (!hostHeader) return [];

  const host = normalizeHost(hostHeader);
  if (!host) {
    return [];
  }

  return buildTenantHintCandidates(host);
}

function extractTenantHintsFromUrl(
  urlValue: string | string[] | undefined,
  allowedOrigins: string[] | undefined,
): string[] {
  if (typeof urlValue !== 'string' || !urlValue.trim()) {
    return [];
  }

  try {
    const origin = new URL(urlValue.trim()).origin;
    if (allowedOrigins && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
      return [];
    }

    const parsed = new URL(origin);
    const host = normalizeHost(parsed.hostname);
    return host ? buildTenantHintCandidates(host) : [];
  } catch {
    return [];
  }
}

function normalizeHost(hostHeader: string): string | undefined {
  const host = hostHeader.split(':')[0]?.trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return undefined;
  }

  return host;
}

function buildTenantHintCandidates(host: string): string[] {
  const hints = [host];
  const parts = host.split('.');
  if (parts.length > 2) {
    hints.push(parts[0]);
  }

  return [...new Set(hints)];
}
