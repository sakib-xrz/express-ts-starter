import httpStatus from 'http-status';
import { TGenericErrorResponse } from '../interfaces/error';
import { Prisma } from '../../generated/prisma/client';

const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError,
): TGenericErrorResponse => {
  let statusCode = httpStatus.BAD_REQUEST as number;
  let message = 'Database Error';
  let errorSources = [
    {
      path: '',
      message: err.message,
    },
  ];

  switch (err.code) {
    case 'P2002': // Unique Constraint
      statusCode = httpStatus.CONFLICT;
      message = 'Duplicate Value';
      const target = err.meta?.target;
      // Handle if target is array or string
      const field = Array.isArray(target)
        ? target[target.length - 1]
        : target || 'unknown_field';

      errorSources = [
        {
          path: field as string,
          message: `${field} is already exists`,
        },
      ];
      break;

    case 'P2025': // Record Not Found
      statusCode = httpStatus.NOT_FOUND;
      message = 'Record not found';
      errorSources = [
        {
          path: '',
          message: 'The requested record was not found in the database.',
        },
      ];
      break;

    case 'P2003': // Foreign Key Constraint
      statusCode = httpStatus.BAD_REQUEST;
      message = 'Foreign Key Constraint Violation';
      errorSources = [
        {
          path: (err.meta?.field_name as string) || '',
          message:
            'This record is linked to another record and cannot be modified/deleted.',
        },
      ];
      break;
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handlePrismaError;
