import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || this.getTenantFromDomain(req);
    if (!tenantId) throw new BadRequestException('Tenant ID is missing');
    (req as any).tenantId = tenantId;
    next();
  }

  private getTenantFromDomain(req: Request): string | undefined {
    // Basic domain parsing logic, can be expanded
    const host = req.headers.host;
    if (!host) return undefined;
    const parts = host.split('.');
    if (parts.length > 2) return parts[0]; // subdomain
    return undefined;
  }
}
