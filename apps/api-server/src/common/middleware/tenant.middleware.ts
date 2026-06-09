import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@repo/database';
import { PrismaService } from '../services/prisma.service';
import { extractTenantHints, TenantAwareRequest } from '../utils/tenant-request.util';
import { isUUID } from 'class-validator';
import { TtlCache } from '../cache/ttl-cache';

interface TenantResolutionCacheTarget {
  id: string;
  slug: string;
  domain: string | null;
}

// Tenant records (slug/domain/active) change rarely, but this lookup runs on
// every request. A short-lived in-process cache removes that DB round-trip from
// the hot path while keeping changes visible within the TTL window.
const TENANT_RESOLUTION_TTL_MS = 60_000;
const tenantHintCache = new TtlCache<string | null>(TENANT_RESOLUTION_TTL_MS);

/** Test-only: clear the in-process tenant resolution cache between cases. */
export function clearTenantResolutionCacheForTests(): void {
  tenantHintCache.clear();
}

export function invalidateTenantResolutionCacheForTenant(
  tenant: TenantResolutionCacheTarget,
): void {
  const hints = new Set([tenant.id, tenant.slug]);
  if (tenant.domain) {
    hints.add(tenant.domain);
  }

  tenantHintCache.deleteWhere((tenantId, hint) => tenantId === tenant.id || hints.has(hint));
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService?: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const allowedOrigins = this.getAllowedOrigins();
    const nodeEnv = this.configService?.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
    const tenantHints = extractTenantHints(req, {
      allowTenantHeaderInProduction:
        this.configService?.get<boolean>('ALLOW_TENANT_HEADER_IN_PRODUCTION') ?? false,
      allowedOrigins,
      nodeEnv,
    });
    const tenantRequest = req as TenantAwareRequest;
    tenantRequest.requestedTenantHint = tenantHints[0];

    if (tenantHints.length === 0) {
      return next();
    }

    const tenantId = await this.resolveTenantId(tenantHints);

    if (!tenantId) {
      throw new BadRequestException('Invalid or inactive tenant context');
    }

    tenantRequest.tenantId = tenantId;
    next();
  }

  private async resolveTenantId(tenantHints: string[]): Promise<string | null> {
    for (const tenantHint of tenantHints) {
      const cached = tenantHintCache.get(tenantHint);
      if (cached !== undefined) {
        // A cached `null` means this hint is known-bad; keep checking the
        // remaining hints before giving up.
        if (cached) {
          return cached;
        }
        continue;
      }

      const tenantId = await this.lookupTenantId(tenantHint);
      tenantHintCache.set(tenantHint, tenantId);

      if (tenantId) {
        return tenantId;
      }
    }

    return null;
  }

  private async lookupTenantId(tenantHint: string): Promise<string | null> {
    const orConditions: Prisma.TenantWhereInput[] = [{ slug: tenantHint }, { domain: tenantHint }];

    if (isUUID(tenantHint)) {
      orConditions.push({ id: tenantHint });
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        isActive: true,
        OR: orConditions,
      },
      select: {
        id: true,
      },
    });

    return tenant?.id ?? null;
  }

  private getAllowedOrigins(): string[] {
    const configuredOrigins = this.configService?.get<string>('CORS_ORIGINS');
    if (!configuredOrigins) {
      return [];
    }

    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
}
