import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { CSRF_COOKIE_NAME, CsrfMiddleware } from './csrf.middleware';

describe('CsrfMiddleware', () => {
  const middleware = new CsrfMiddleware();

  function buildContext(overrides: Partial<Request> = {}) {
    const next = vi.fn() as NextFunction;
    const req = {
      method: 'POST',
      path: '/api/courses',
      headers: {},
      cookies: {},
      ...overrides,
    } as unknown as Request;

    return { req, next };
  }

  it('allows safe methods without CSRF validation', () => {
    const { req, next } = buildContext({ method: 'GET' });

    middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows exempt auth paths without CSRF validation', () => {
    const { req, next } = buildContext({ path: '/api/auth/login' });

    middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows non-cookie requests without CSRF validation', () => {
    const { req, next } = buildContext({
      cookies: {},
    });

    middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects cookie-authenticated state changes when CSRF token is missing', () => {
    const { req, next } = buildContext({
      cookies: {
        access_token: 'session-token',
      },
    });

    expect(() => middleware.use(req, {} as Response, next)).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects cookie-authenticated state changes when CSRF token mismatches', () => {
    const { req, next } = buildContext({
      cookies: {
        access_token: 'session-token',
        [CSRF_COOKIE_NAME]: 'cookie-csrf',
      },
      headers: {
        'x-csrf-token': 'header-csrf',
      },
    });

    expect(() => middleware.use(req, {} as Response, next)).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('enforces CSRF even when authorization header is present for cookie auth', () => {
    const { req, next } = buildContext({
      cookies: {
        access_token: 'session-token',
      },
      headers: {
        authorization: 'Bearer token',
      },
    });

    expect(() => middleware.use(req, {} as Response, next)).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows cookie-authenticated state changes when CSRF token matches', () => {
    const { req, next } = buildContext({
      cookies: {
        access_token: 'session-token',
        [CSRF_COOKIE_NAME]: 'csrf-token',
      },
      headers: {
        'x-csrf-token': 'csrf-token',
      },
    });

    middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
