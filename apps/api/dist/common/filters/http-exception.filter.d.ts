import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export interface ErrorEnvelope {
    error: {
        code: string | number;
        message: string;
        details?: unknown;
    };
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
