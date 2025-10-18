import express from 'express';
import { register, login, refreshToken, verifyEmail, forgotPassword, resetPassword, request2FA, verify2FA, verifyPassword, logout, changePassword } from '../controllers/authController.js';
import { validate } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// POST /auth/register
router.post('/register', validate(registerSchema), register);

// POST /auth/login
router.post('/login', validate(loginSchema), login);

// POST /auth/refresh-token
router.post('/refresh-token', refreshToken);

// Email verification
router.get('/verify-email', verifyEmail);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 2FA
router.post('/2fa/request', request2FA);
router.post('/2fa/verify', verify2FA);

// Verify password (for sensitive actions)
router.post('/verify-password', authenticateToken, verifyPassword);

// Logout
router.post('/logout', authenticateToken, logout);

// Change password
router.put('/change-password', authenticateToken, changePassword);

export default router;



