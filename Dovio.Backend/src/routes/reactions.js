import express from 'express';
import { 
  addReaction, 
  getReactions, 
  getUserReaction 
} from '../controllers/reactionController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const addReactionSchema = Joi.object({
  entityType: Joi.string().valid('post', 'story', 'comment').required(),
  entityId: Joi.string().required(),
  reactionType: Joi.string().valid('like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow').required()
});

const getReactionsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const reactionParamsSchema = Joi.object({
  entityType: Joi.string().valid('post', 'story', 'comment').required(),
  entityId: Joi.string().required()
});

// Routes
router.post('/', 
  authenticateToken, 
  validate(addReactionSchema), 
  addReaction
);

router.get('/:entityType/:entityId', 
  authenticateToken, 
  validateParams(reactionParamsSchema),
  validateQuery(getReactionsSchema), 
  getReactions
);

router.get('/:entityType/:entityId/user', 
  authenticateToken, 
  validateParams(reactionParamsSchema), 
  getUserReaction
);

export default router;

