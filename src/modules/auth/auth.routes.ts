import express from 'express';
import validateRequest from '@/middlewares/validate-request';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation';
import AuthController from './auth.controller';
import {
  authRateLimiter,
  forgotPasswordRateLimiter,
  refreshTokenRateLimiter,
  resetPasswordRateLimiter,
} from '@/middlewares/rate-limiter';
import authenticate from '@/middlewares/auth';

const router = express.Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  AuthController.register,
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  AuthController.login,
);

router.get('/me', authenticate(), AuthController.getMe);

router.post(
  '/refresh-token',
  refreshTokenRateLimiter,
  validateRequest(refreshTokenSchema),
  AuthController.refreshToken,
);

router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validateRequest(forgotPasswordSchema),
  AuthController.forgotPassword,
);

router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  validateRequest(resetPasswordSchema),
  AuthController.resetPassword,
);

// Protected routes
router.post(
  '/change-password',
  authenticate(),
  validateRequest(changePasswordSchema),
  AuthController.changePassword,
);

router.post('/logout', authenticate(), AuthController.logout);

export const AuthRoutes = router;
