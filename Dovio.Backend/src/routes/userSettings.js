import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery } from '../middleware/validation.js';
import { 
  getUserSettings, 
  updateUserSettings, 
  getUserPrivacy, 
  updateUserPrivacy,
  blockUser,
  unblockUser
} from '../controllers/userSettingsController.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const settingsUpdateSchema = Joi.object({
  privacy: Joi.object({
    accountVisibility: Joi.string().valid('public', 'private').optional(),
    dmPermissions: Joi.string().valid('everyone', 'followers', 'none').optional(),
    commentPermissions: Joi.string().valid('everyone', 'followers', 'none').optional(),
    storyVisibility: Joi.string().valid('everyone', 'followers', 'close_friends').optional(),
    tagApproval: Joi.boolean().optional(),
    showOnlineStatus: Joi.boolean().optional(),
    showLastSeen: Joi.boolean().optional()
  }).optional(),
  notifications: Joi.object({
    email: Joi.object({
      newFollowers: Joi.boolean().optional(),
      newLikes: Joi.boolean().optional(),
      newComments: Joi.boolean().optional(),
      newShares: Joi.boolean().optional(),
      newMessages: Joi.boolean().optional(),
      storyViews: Joi.boolean().optional(),
      securityAlerts: Joi.boolean().optional()
    }).optional(),
    push: Joi.object({
      newFollowers: Joi.boolean().optional(),
      newLikes: Joi.boolean().optional(),
      newComments: Joi.boolean().optional(),
      newShares: Joi.boolean().optional(),
      newMessages: Joi.boolean().optional(),
      storyViews: Joi.boolean().optional(),
      securityAlerts: Joi.boolean().optional()
    }).optional(),
    inApp: Joi.object({
      newFollowers: Joi.boolean().optional(),
      newLikes: Joi.boolean().optional(),
      newComments: Joi.boolean().optional(),
      newShares: Joi.boolean().optional(),
      newMessages: Joi.boolean().optional(),
      storyViews: Joi.boolean().optional(),
      securityAlerts: Joi.boolean().optional()
    }).optional()
  }).optional(),
  content: Joi.object({
    autoPlayVideos: Joi.boolean().optional(),
    showSensitiveContent: Joi.boolean().optional(),
    language: Joi.string().optional(),
    timezone: Joi.string().optional()
  }).optional()
});

const privacyUpdateSchema = Joi.object({
  privacy: Joi.object({
    accountVisibility: Joi.string().valid('public', 'private').optional(),
    dmPermissions: Joi.string().valid('everyone', 'followers', 'none').optional(),
    commentPermissions: Joi.string().valid('everyone', 'followers', 'none').optional(),
    storyVisibility: Joi.string().valid('everyone', 'followers', 'close_friends').optional(),
    tagApproval: Joi.boolean().optional(),
    showOnlineStatus: Joi.boolean().optional(),
    showLastSeen: Joi.boolean().optional()
  }).optional(),
  blockedUsers: Joi.array().items(Joi.string()).optional(),
  restrictedUsers: Joi.array().items(Joi.string()).optional(),
  closeFriends: Joi.array().items(Joi.string()).optional()
});

const blockUserSchema = Joi.object({
  targetUserId: Joi.string().required()
});

// Apply authentication to all routes
router.use(authenticateToken);

// User Settings Routes
router.get('/settings', getUserSettings);
router.put('/settings', validate(settingsUpdateSchema), updateUserSettings);

// Privacy Routes
router.get('/privacy', getUserPrivacy);
router.put('/privacy', validate(privacyUpdateSchema), updateUserPrivacy);

// Block/Unblock Routes
router.post('/block', validate(blockUserSchema), blockUser);
router.post('/unblock', validate(blockUserSchema), unblockUser);

export default router;

