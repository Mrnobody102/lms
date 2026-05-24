import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T> | T> {
    if (shouldBypassResponseWrapping(context)) {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data: data ?? null,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

function shouldBypassResponseWrapping(context: ExecutionContext): boolean {
  if (context.getType() !== 'http') return false;

  const request = context.switchToHttp().getRequest<{
    originalUrl?: string;
    path?: string;
    url?: string;
  }>();
  const requestPath = request.originalUrl ?? request.path ?? request.url ?? '';

  return (
    requestPath.startsWith('/api/health') ||
    requestPath.startsWith('/health') ||
    requestPath.startsWith('/api/notifications/stream') ||
    requestPath.startsWith('/notifications/stream') ||
    (requestPath.startsWith('/api/certificates/verify/') && requestPath.endsWith('/image'))
  );
}
