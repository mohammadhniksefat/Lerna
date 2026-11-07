import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

export interface ErrorEnvelope {
  error: {
    code: string | number;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message: string;
      let details: unknown;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof responseObj.message === 'string'
            ? responseObj.message
            : Array.isArray(responseObj.message)
              ? responseObj.message.join(', ')
              : HttpException.name;
        details = responseObj.details ?? undefined;
      } else {
        message = exceptionResponse as string;
      }

      response.status(status).json({
        error: {
          code: status,
          message,
          ...(details ? { details } : {}),
        },
      } as ErrorEnvelope);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    } as ErrorEnvelope);
  }
}
