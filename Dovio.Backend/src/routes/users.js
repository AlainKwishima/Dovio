import express from 'express';
import {
  getProfile,
  updateProfile,
  deleteAccount,
  updateWalletBalance,
  sendMoney,
  withdrawMoney,
  getWalletBalance,
  addRecentAction,
  addActiveTime,
  getActivityHistory
} from '../controllers/userController.js';
import { validate } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  updateUserSchema,
  updateWalletSchema,
  addActivitySchema,
  addActiveTimeSchema
} from '../utils/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas for new wallet features
const sendMoneySchema = Joi.object({
  recipientId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  message: Joi.string().max(200).optional()
});

const withdrawMoneySchema = Joi.object({
  amount: Joi.number().positive().required(),
  withdrawalMethod: Joi.string().valid('bank_transfer', 'paypal', 'stripe', 'crypto').required(),
  accountDetails: Joi.string().max(500).optional()
});

// All routes require authentication
router.use(authenticateToken);

// GET /users/profile
router.get('/profile', getProfile);

// PUT /users/profile
router.put('/profile', validate(updateUserSchema), updateProfile);

// DELETE /users/account
router.delete('/account', deleteAccount);

// PUT /users/wallet
router.put('/wallet', validate(updateWalletSchema), updateWalletBalance);

// GET /users/wallet/balance
router.get('/wallet/balance', getWalletBalance);

// POST /users/wallet/send
router.post('/wallet/send', validate(sendMoneySchema), sendMoney);

// POST /users/wallet/withdraw
router.post('/wallet/withdraw', validate(withdrawMoneySchema), withdrawMoney);

// POST /users/activity
router.post('/activity', validate(addActivitySchema), addRecentAction);

// POST /users/active-time
router.post('/active-time', validate(addActiveTimeSchema), addActiveTime);

// GET /users/activity-history
router.get('/activity-history', getActivityHistory);

export default router;



