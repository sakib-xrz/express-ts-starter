import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '@/errors/app-error';
import { verifyAccessToken } from '@/modules/auth/auth.utils';
import { prisma } from '@/lib/prisma';
import { Role } from '../../prisma/generated/prisma/enums';

const authenticate = (...roles: Role[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Authentication token is required',
        );
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      if (!token) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Authentication token is required',
        );
      }

      // Verify token (decoded object includes iat claim)
      let decoded: any;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
      }

      // Get token issued time from decoded token (iat is in seconds)
      const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;

      // Fetch user from database to ensure user still exists and get latest role
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          is_active: true,
          is_deleted: true,
          password_reset_at: true,
        },
      });

      if (!user) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'User not found or account has been deleted',
        );
      }

      // Check if user account is deleted
      if (user.is_deleted) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'User not found or account has been deleted',
        );
      }

      // Check if user account is active
      if (!user.is_active) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Your account has been deactivated. Please contact support.',
        );
      }

      // Check if token was issued before password was changed
      if (user.password_reset_at && tokenIssuedAt) {
        const passwordResetTime = new Date(user.password_reset_at);
        if (tokenIssuedAt < passwordResetTime) {
          throw new AppError(
            httpStatus.UNAUTHORIZED,
            'Token is invalid. Please login again.',
          );
        }
      }

      // Attach user info to request
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      // If roles are specified, check authorization
      if (roles.length > 0) {
        if (!roles.includes(user.role)) {
          throw new AppError(
            httpStatus.FORBIDDEN,
            'You do not have permission to access this resource',
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authenticate;
