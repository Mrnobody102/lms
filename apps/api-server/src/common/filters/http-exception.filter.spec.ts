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
      originalUrl: '/api/courses',
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
      expect.objectContaining({ requestId: 'req_abc', statusCode: 400 }),
    );
  });
});
