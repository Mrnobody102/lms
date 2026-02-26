import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === "OPTIONS") {
      return next();
    }

    const tenantId =
      req.headers["x-tenant-id"] ||
      this.getTenantFromToken(req) ||
      this.getTenantFromDomain(req);
    if (!tenantId) throw new BadRequestException("Tenant ID is missing");
    (req as any).tenantId = tenantId;
    next();
  }

  private getTenantFromToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const payloadJson = Buffer.from(payloadBase64, "base64").toString();
          const payload = JSON.parse(payloadJson);
          return payload.tenantId;
        }
      } catch (e) {
        // Ignore token parse errors, fall back to other methods
      }
    }
    return undefined;
  }

  private getTenantFromDomain(req: Request): string | undefined {
    // Basic domain parsing logic, can be expanded
    const host = req.headers.host;
    if (!host) return undefined;
    const parts = host.split(".");
    if (parts.length > 2) return parts[0]; // subdomain
    return undefined;
  }
}
