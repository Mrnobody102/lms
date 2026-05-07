import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  it('should include request id in response header and error body', () => {
    const logger = {
      error: vi.fn(),
    };
    const filter = new HttpExceptionFilter(logger as any);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const response = {
      setHeader: vi.fn(),
      status,
    };
    const request = {
      method: 'POST',
      originalUrl: '/api/courses?token=secret',
      requestId: 'req_abc',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new BadRequestException('Invalid payload'), host);

    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'req_abc');
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid payload',
        statusCode: 400,
        requestId: 'req_abc',
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Request error',
      expect.objectContaining({
        path: '/api/courses',
        requestId: 'req_abc',
        statusCode: 400,
      }),
    );
  });

  it('should not expose unexpected internal error messages to clients', () => {
    const logger = {
      error: vi.fn(),
    };
    const filter = new HttpExceptionFilter(logger as never);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const response = {
      setHeader: vi.fn(),
      status,
    };
    const request = {
      method: 'GET',
      originalUrl: '/api/internal',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new Error('database password is invalid'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Request error',
      expect.objectContaining({
        error: expect.any(Error),
        statusCode: 500,
      }),
    );
  });
});
