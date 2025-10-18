import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const generalLimiter = createRateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later'
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'test' ? 100 : 5, // More attempts in test mode
  'Too many authentication attempts, please try again later'
);



