import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { LoggerService } from '../services/logger.service';
import { getRequestPath } from '../utils/request-path.util';
import { REQUEST_ID_HEADER } from '../utils/request-id.util';

type HttpExceptionResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as HttpExceptionResponse;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse?.message !== undefined) {
        message = exceptionResponse.message;
      }
    }

    const responseMessage = Array.isArray(message) && message.length === 1 ? message[0] : message;
    const requestId = (request as { requestId?: string }).requestId;

    if (requestId) {
      response.setHeader(REQUEST_ID_HEADER, requestId);
    }

    this.logger.error('Request error', {
      method: request.method,
      path: getRequestPath(request),
      statusCode: status,
      error: exception instanceof Error ? exception.stack : exception,
      requestId,
    });

    response.status(status).json({
      success: false,
      message: responseMessage,
      statusCode: status,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
