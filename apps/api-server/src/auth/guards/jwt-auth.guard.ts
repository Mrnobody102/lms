import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@repo/database';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing authentication token');
    }

    const request = context.switchToHttp().getRequest();

    // Enforce tenant isolation: Users can only access APIs matching their own tenant,
    // except SUPER_ADMINs who have universal access (if they choose to supply x-tenant-id).
    if (user.role !== Role.SUPER_ADMIN) {
      if (request.tenantId && user.tenantId !== request.tenantId) {
        throw new ForbiddenException(
          "Tenant mismatch: You do not have access to this tenant's resources",
        );
      }
    }

    return user;
  }
}
