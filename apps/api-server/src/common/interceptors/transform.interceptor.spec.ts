import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { TransformInterceptor } from './transform.interceptor';

function createHttpContext(path: string): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({ originalUrl: path }),
    }),
  } as ExecutionContext;
}

function createHandler(payload: unknown): CallHandler {
  return {
    handle: () => of(payload),
  };
}

describe('TransformInterceptor', () => {
  it('wraps regular API responses', async () => {
    const interceptor = new TransformInterceptor();

    const result = await lastValueFrom(
      interceptor.intercept(createHttpContext('/api/courses'), createHandler({ id: 'course-1' })),
    );

    expect(result).toEqual({
      success: true,
      data: { id: 'course-1' },
      timestamp: expect.any(String),
    });
  });

  it('does not wrap health endpoints', async () => {
    const interceptor = new TransformInterceptor();

    const result = await lastValueFrom(
      interceptor.intercept(
        createHttpContext('/api/health/ready'),
        createHandler({ status: 'ok', checks: {} }),
      ),
    );

    expect(result).toEqual({ status: 'ok', checks: {} });
  });
});
