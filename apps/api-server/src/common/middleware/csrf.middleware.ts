import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/api/auth/login',
  '/api/auth/register',
]);

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT_PATHS.has(req.path)) {
      return next();
    }

    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const authCookie = cookies?.access_token;
    if (!authCookie) {
      return next();
    }

    const csrfCookie = cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers[CSRF_HEADER_NAME];
    const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;

    if (!csrfCookie || !csrfToken || csrfCookie !== csrfToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return next();
  }
}

export { CSRF_COOKIE_NAME };
