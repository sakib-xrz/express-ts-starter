import httpStatus from 'http-status';
import AppError from '@/errors/app-error';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  hashPasswordResetToken,
} from './auth.utils';
import sendMail from '@/utils/mailer';
import config from '@/config';
import AuthTemplate from './auth.template';

interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface ResetPasswordPayload {
  token: string;
  password: string;
}

interface ChangePasswordPayload {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * Register a new user
 */
const register = async (payload: RegisterPayload) => {
  const { email, password, name } = payload;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      'User with this email already exists',
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      email_verified: true,
      created_at: true,
    },
  });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Login user
 */
const login = async (payload: LoginPayload) => {
  const { email, password } = payload;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  // Check if user account is deleted
  if (user.is_deleted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deleted',
    );
  }

  // Check if user account is active
  if (!user.is_active) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deactivated. Please contact support.',
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: { refresh_token: refreshToken },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Get user by id
 */
const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
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

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      image_url: user.image_url,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired refresh token',
    );
  }

  // Find user and verify refresh token matches
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || user.refresh_token !== refreshToken) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Invalid or expired refresh token',
    );
  }

  // Check if user account is deleted
  if (user.is_deleted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deleted',
    );
  }

  // Check if user account is active
  if (!user.is_active) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deactivated. Please contact support.',
    );
  }

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    accessToken,
  };
};

/**
 * Forgot password - send reset email
 */
const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    // Return success even if user doesn't exist to prevent email enumeration
    return {
      message: 'A password reset link has been sent.',
    };
  }

  // Check if user account is deleted or inactive
  // Don't reveal specific reason to prevent enumeration
  if (user.is_deleted || !user.is_active) {
    // Return success message even if account is deleted/inactive
    return {
      message: 'A password reset link has been sent.',
    };
  }

  // Generate reset token
  const resetToken = generatePasswordResetToken();
  const hashedToken = hashPasswordResetToken(resetToken);

  // Set token expiration (1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store hashed token and expiration
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_reset_token: hashedToken,
      password_reset_expires: expiresAt,
    },
  });

  // Create reset URL (frontend URL)
  const resetUrl = `${config.frontendBaseUrl}/reset-password?token=${resetToken}`;

  // Send email
  const emailBody = AuthTemplate.passwordResetEmailTemplate({
    userName: user.name,
    resetUrl,
  });

  try {
    await sendMail(user.email, 'Password Reset Request', emailBody);
  } catch (error) {
    // Clear the reset token if email fails
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_reset_token: null,
        password_reset_expires: null,
      },
    });
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to send password reset email',
    );
  }

  return {
    message:
      'If an account with that email exists, a password reset link has been sent.',
  };
};

/**
 * Reset password using reset token
 */
const resetPassword = async (payload: ResetPasswordPayload) => {
  const { token, password } = payload;

  // Hash the token to compare with stored hash
  const hashedToken = hashPasswordResetToken(token);

  // Find user with this token and check expiration
  const user = await prisma.user.findFirst({
    where: {
      password_reset_token: hashedToken,
      password_reset_expires: {
        gt: new Date(), // Token not expired
      },
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid or expired password reset token',
    );
  }

  // Check if user account is deleted
  if (user.is_deleted) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot reset password for a deleted account',
    );
  }

  // Check if user account is active
  if (!user.is_active) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot reset password for a deactivated account',
    );
  }

  // Hash new password
  const hashedPassword = await hashPassword(password);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      password_reset_token: null,
      password_reset_expires: null,
      password_reset_at: new Date(),
      refresh_token: null, // Invalidate all refresh tokens for security
    },
  });

  return {
    message: 'Password has been reset successfully',
  };
};

/**
 * Change password (for authenticated users)
 */
const changePassword = async (payload: ChangePasswordPayload) => {
  const { userId, currentPassword, newPassword } = payload;

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user account is deleted
  if (user.is_deleted) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deleted',
    );
  }

  // Check if user account is active
  if (!user.is_active) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Your account has been deactivated. Please contact support.',
    );
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Current password is incorrect',
    );
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and invalidate refresh tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      password_reset_at: new Date(),
      refresh_token: null, // Invalidate all refresh tokens for security
    },
  });

  return {
    message: 'Password has been changed successfully',
  };
};

/**
 * Logout user (invalidate refresh token)
 */
const logout = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refresh_token: null },
  });

  return {
    message: 'Logged out successfully',
  };
};

const AuthService = {
  register,
  login,
  getMe,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
};

export default AuthService;
