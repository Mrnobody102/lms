import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../services/prisma.service';
import { extractTenantHint, TenantAwareRequest } from '../utils/tenant-request.util';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const tenantHint = extractTenantHint(req);
    const tenantRequest = req as TenantAwareRequest;
    tenantRequest.requestedTenantHint = tenantHint;

    if (!tenantHint) {
      return next();
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        isActive: true,
        OR: [{ id: tenantHint }, { slug: tenantHint }, { domain: tenantHint }],
      },
      select: {
        id: true,
      },
    });

    if (!tenant) {
      throw new BadRequestException('Invalid or inactive tenant context');
    }

    tenantRequest.tenantId = tenant.id;
    next();
  }
}
