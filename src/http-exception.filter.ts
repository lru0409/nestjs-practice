import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        message = response;
      }
      if (
        typeof response === 'object' &&
        Boolean((response as Record<string, unknown>)?.message)
      ) {
        message = (response as Record<string, unknown>).message as string;
      }
    }

    response.status(status).json({
      path: request.url,
      statusCode: status,
      message,
      timestamp: Date.now(),
    });
  }
}
