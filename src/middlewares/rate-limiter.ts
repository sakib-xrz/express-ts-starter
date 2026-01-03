import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login and register endpoints
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter for forgot password endpoint
 * 3 attempts per hour per IP
 */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter for refresh token endpoint
 * 10 requests per 15 minutes per IP
 */
export const refreshTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many token refresh requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter for reset password endpoint
 * 5 attempts per hour per IP
 */
export const resetPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => {
    return process.env.NODE_ENV === 'test';
  },
});
