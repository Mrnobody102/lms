import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

type HttpExceptionResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as HttpExceptionResponse;

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (exceptionResponse?.message !== undefined) {
        message = exceptionResponse.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseMessage =
      Array.isArray(message) && message.length === 1 ? message[0] : message;

    response.status(status).json({
      success: false,
      message: responseMessage,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}
