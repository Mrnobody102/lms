import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@repo/database';
import { PrismaService } from '../services/prisma.service';
import { extractTenantHints, TenantAwareRequest } from '../utils/tenant-request.util';
import { isUUID } from 'class-validator';

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
        this.configService?.get<boolean>('ALLOW_TENANT_HEADER_IN_PRODUCTION') ?? true,
      allowedOrigins,
      nodeEnv,
    });
    const tenantRequest = req as TenantAwareRequest;
    tenantRequest.requestedTenantHint = tenantHints[0];

    if (tenantHints.length === 0) {
      return next();
    }

    const tenant = await this.resolveTenant(tenantHints);

    if (!tenant) {
      throw new BadRequestException('Invalid or inactive tenant context');
    }

    tenantRequest.tenantId = tenant.id;
    next();
  }

  private async resolveTenant(tenantHints: string[]) {
    for (const tenantHint of tenantHints) {
      const orConditions: Prisma.TenantWhereInput[] = [
        { slug: tenantHint },
        { domain: tenantHint },
      ];

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

      if (tenant) {
        return tenant;
      }
    }

    return null;
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
