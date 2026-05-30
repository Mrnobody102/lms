import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class TenantCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    if (!request) return undefined;

    // We can't easily access httpAdapterHost if it's protected,
    // but we can use request.originalUrl directly in Express/Fastify.
    const url = request.originalUrl || request.url;
    const tenantId = request.tenantId || 'global';

    return `${tenantId}:${url}`;
  }
}
