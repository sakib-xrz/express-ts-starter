/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import httpStatus from 'http-status';
import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import config from '@/config';
import AppError from '@/errors/app-error';
import handelZodError from '@/errors/handle-zod-error';
import handlePrismaError from '@/errors/handle-prisma-error';
import handlePrismaValidationError from '@/errors/handle-prisma-validation-error';
import { Prisma } from '../../generated/prisma/client';
import { TErrorSources } from '@/interfaces/error';
import { logger } from '@/utils/logger';

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Default Defaults
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
  // 2. Prisma Known Request Errors (P2002, P2025, P2003)
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
  // 4. Custom App Errors
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }
  // 5. Generic / Unknown Errors
  else if (err instanceof Error) {
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      statusCode,
      message,
      errorSources,
      stack: err?.stack,
    });
  } else {
    logger.warn('Client Error:', {
      statusCode,
      message,
      errorSources,
    });
  }

  // Final Response Construction
  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    // Only show detailed stack traces in Development
    stack: config.nodeEnv === 'development' ? err?.stack : null,
  });
};

export default globalErrorHandler;
