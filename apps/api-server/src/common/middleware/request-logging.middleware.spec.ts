import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { RequestLoggingMiddleware } from './request-logging.middleware';

function makeResponse(statusCode = 200) {
  const emitter = new EventEmitter() as EventEmitter & Partial<Response>;
  emitter.statusCode = statusCode;
  emitter.setHeader = vi.fn();
  return emitter as Response & EventEmitter;
}

describe('RequestLoggingMiddleware', () => {
  it('should reuse a valid incoming request id and echo it in the response header', () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const middleware = new RequestLoggingMiddleware(logger as any);
    const req = {
      headers: {
        'x-request-id': 'req_123',
        'user-agent': 'vitest',
      },
      method: 'GET',
      originalUrl: '/api/health/live',
    } as unknown as Request & { requestId?: string };
    const res = makeResponse();
    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);
    res.emit('finish');

    expect(req.requestId).toBe('req_123');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'req_123');
    expect(next).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      'Incoming request',
      expect.objectContaining({ requestId: 'req_123' }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Request completed',
      expect.objectContaining({ requestId: 'req_123', statusCode: 200 }),
    );
  });

  it('should generate a fresh request id when the incoming value is unsafe', () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const middleware = new RequestLoggingMiddleware(logger as any);
    const req = {
      headers: {
        'x-request-id': '../bad header',
      },
      method: 'POST',
      originalUrl: '/api/courses',
    } as unknown as Request & { requestId?: string };
    const res = makeResponse(201);

    middleware.use(req, res, vi.fn());

    expect(req.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', req.requestId);
  });
});
