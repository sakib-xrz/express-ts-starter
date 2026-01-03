import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '@/config';

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access token
 */
export const generateAccessToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  // @ts-ignore
  return jwt.sign(payload, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenExpiresIn,
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  // @ts-ignore
  return jwt.sign(payload, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenExpiresIn,
  });
};

/**
 * Verify access token
 */
export const verifyAccessToken = (
  token: string,
): {
  userId: string;
  email: string;
  role: string;
} => {
  return jwt.verify(token, config.jwt.accessTokenSecret) as {
    userId: string;
    email: string;
    role: string;
  };
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (
  token: string,
): {
  userId: string;
  email: string;
  role: string;
} => {
  return jwt.verify(token, config.jwt.refreshTokenSecret) as {
    userId: string;
    email: string;
    role: string;
  };
};

/**
 * Generate password reset token (cryptographically secure random token)
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash password reset token for storage
 */
export const hashPasswordResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
