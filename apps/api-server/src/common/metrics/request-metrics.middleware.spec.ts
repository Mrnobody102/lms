import { EventEmitter } from 'events';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { RequestMetricsMiddleware } from './request-metrics.middleware';

describe('RequestMetricsMiddleware', () => {
  it('should record request metrics when the response finishes', () => {
    const metricsService = {
      recordRequest: vi.fn(),
    };
    const middleware = new RequestMetricsMiddleware(metricsService as any);
    const req = {
      method: 'PATCH',
      originalUrl: '/api/lessons/lesson-1',
    } as Request;
    const res = new EventEmitter() as Response & EventEmitter;
    res.statusCode = 204;
    const next: NextFunction = vi.fn();

    middleware.use(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledOnce();
    expect(metricsService.recordRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        path: '/api/lessons/lesson-1',
        statusCode: 204,
      }),
    );
    expect(metricsService.recordRequest.mock.calls[0][0].durationMs).toEqual(expect.any(Number));
  });
});
