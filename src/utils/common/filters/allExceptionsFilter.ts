import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { capitalizedMessage } from 'src/utils';
import { CustomLoggerService } from 'src/lib/logger/logger.service';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: any;
    let statusType: string;

    // Handle Prisma Client Known Request Errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma Known Errors
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
      statusType = HttpStatus[HttpStatus.BAD_REQUEST] || 'Bad Request';
    } else if (exception instanceof HttpException) {
      // Handle standard HTTP exceptions
      status = exception.getStatus();
      const responseMessage = exception.getResponse();
      message =
        typeof responseMessage === 'string'
          ? responseMessage
          : (responseMessage as any).message || 'Unknown error';
      statusType = HttpStatus[status] || 'Unknown Error';
    } else {
      // Handle other exceptions (e.g. Internal Server Error)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      statusType = 'Internal Server Error';
    }

    // Create the error response object, including timestamp and path
    const errorResponse = {
      statusCode: status,
      statusType,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the error using the custom logger
    this.logger.error(
      `Exception: ${JSON.stringify(errorResponse)}`,
      exception instanceof Error
        ? exception.stack || 'No stack trace available'
        : 'No stack trace available',
    );

    // Send the structured error response to the client
    response.status(status).json(errorResponse);
  }

  // Handle Prisma errors and provide meaningful messages
  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = exception.meta?.target;
        return `${capitalizedMessage(target)} already exists`;
      }
      case 'P2003': {
        // Foreign key violation
        const field = exception.meta?.field_name;
        return `${capitalizedMessage(field)} key relationship not found`;
      }
      case 'P2025': // Record not found
        return 'The record was not found';
      default:
        return 'Database error occurred';
    }
  }
}
