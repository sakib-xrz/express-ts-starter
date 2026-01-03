/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import httpStatus from 'http-status';
import { ErrorRequestHandler, Request } from 'express';
import { ZodError } from 'zod';
import { randomUUID } from 'crypto';

import config from '@/config';
import AppError from '@/errors/app-error';
import handelZodError from '@/errors/handle-zod-error';
import handlePrismaError from '@/errors/handle-prisma-error';
import handlePrismaValidationError from '@/errors/handle-prisma-validation-error';
import { Prisma } from '../../prisma/generated/prisma/client';
import { TErrorSources } from '@/interfaces/error';
import { logger } from '@/utils/logger';

/**
 * Extracts request context for logging
 */
const getRequestContext = (req: Request) => {
  return {
    method: req.method,
    path: req.path,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId,
    email: req.user?.email,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: Object.keys(req.body || {}).length > 0 ? req.body : undefined,
  };
};

/**
 * Sanitizes error message for production
 */
const sanitizeErrorMessage = (message: string): string => {
  if (config.nodeEnv === 'production') {
    // Remove sensitive information from error messages in production
    return message.replace(
      /(password|token|secret|key|authorization|auth|credential)/gi,
      '[REDACTED]',
    );
  }
  return message;
};

const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Generate correlation ID for error tracking
  const errorId = randomUUID();
  const requestContext = getRequestContext(req);

  // Default values
  let statusCode = httpStatus.INTERNAL_SERVER_ERROR as number;
  let message = 'Something went wrong!';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong!',
    },
  ];

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const simplifiedError = handelZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }
  // 2. Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }
  // 3. Prisma Validation Errors (Type mismatches)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }
  // 4. Prisma Initialization Errors (Connection issues)
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = httpStatus.SERVICE_UNAVAILABLE;
    message = 'Database connection error';
    errorSources = [
      {
        path: '',
        message:
          config.nodeEnv === 'development'
            ? err.message
            : 'Unable to connect to the database. Please try again later.',
      },
    ];
  }
  // 5. Prisma Rust Panic Errors (Critical database errors)
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Database error occurred';
    errorSources = [
      {
        path: '',
        message:
          config.nodeEnv === 'development'
            ? err.message
            : 'A critical database error occurred. Please contact support.',
      },
    ];
  }
  // 6. JSON Syntax Errors (Malformed request body)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid JSON in request body';
    errorSources = [
      {
        path: 'body',
        message: 'The request body contains invalid JSON.',
      },
    ];
  }
  // 7. Custom App Errors
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message || message;
    errorSources = [
      {
        path: '',
        message: err.message || message,
      },
    ];
  }
  // 8. Generic / Unknown Errors
  else if (err instanceof Error) {
    message = err.message || message;
    errorSources = [
      {
        path: '',
        message: err.message || message,
      },
    ];
  }

  // Sanitize error message for production
  const sanitizedMessage = sanitizeErrorMessage(message);
  const sanitizedErrorSources: TErrorSources = errorSources.map((source) => ({
    ...source,
    message: sanitizeErrorMessage(source.message),
  }));

  // Structured error logging with context
  const logData = {
    errorId,
    statusCode,
    message: sanitizedMessage,
    errorSources: sanitizedErrorSources,
    request: requestContext,
    errorName: err?.name,
    errorCode: (err as any)?.code,
    stack: err?.stack,
    timestamp: new Date().toISOString(),
  };

  // Log with appropriate level based on status code
  if (statusCode >= 500) {
    logger.error(`[${errorId}] Global Error Handler:`, logData);
  } else if (statusCode >= 400) {
    logger.warn(`[${errorId}] Global Error Handler:`, logData);
  } else {
    logger.info(`[${errorId}] Global Error Handler:`, logData);
  }

  // Final Response Construction
  const response: any = {
    success: false,
    message: sanitizedMessage,
    errorSources: sanitizedErrorSources,
    errorId, // Include error ID for client-side tracking
  };

  // Only show detailed stack traces and full error in Development
  if (config.nodeEnv === 'development') {
    response.stack = err?.stack;
    response.error = {
      name: err?.name,
      message: err?.message,
      code: (err as any)?.code,
    };
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;
