import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@repo/database';

interface AuthenticatedUser {
  tenantId: string;
  role: Role;
}

interface TenantScopedRequest {
  tenantId?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthenticatedUser>(
    err: unknown,
    user: AuthenticatedUser | false | null,
    _info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    const request = context.switchToHttp().getRequest<TenantScopedRequest>();

    // Enforce tenant isolation: Users can only access APIs matching their own tenant,
    // except SUPER_ADMINs who have universal access (if they choose to supply x-tenant-id).
    if (user.role !== Role.SUPER_ADMIN) {
      if (request.tenantId && user.tenantId !== request.tenantId) {
        throw new ForbiddenException(
          "Tenant mismatch: You do not have access to this tenant's resources",
        );
      }
    }

    return user as TUser;
  }
}
