import httpStatus from 'http-status';
import { TGenericErrorResponse } from '../interfaces/error';
import { Prisma } from '../../generated/prisma/client';

const handlePrismaValidationError = (
  err: Prisma.PrismaClientValidationError,
): TGenericErrorResponse => {
  const statusCode = httpStatus.BAD_REQUEST;
  // Regex to extract the specific line causing error usually improves clarity,
  // but for generic safety, we keep it simple.
  const message = 'Validation Error';
  const errorSources = [
    {
      path: '',
      message: err.message.substring(0, 200) + '...', // Truncate long Prisma messages
    },
  ];

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handlePrismaValidationError;
