import express from 'express';
import { 
  sharePost, 
  getSharedPosts, 
  getPostShares, 
  deleteShare 
} from '../controllers/shareController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const sharePostSchema = Joi.object({
  originalPostId: Joi.string().required(),
  shareText: Joi.string().max(500).optional()
});

const getSharedPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  userId: Joi.string().optional()
});

const getPostSharesSchema = Joi.object({
  postId: Joi.string().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const shareParamsSchema = Joi.object({
  shareId: Joi.string().required()
});

const postParamsSchema = Joi.object({
  postId: Joi.string().required()
});

// Routes
router.post('/', 
  authenticateToken, 
  validate(sharePostSchema), 
  sharePost
);

router.get('/', 
  authenticateToken, 
  validateQuery(getSharedPostsSchema), 
  getSharedPosts
);

router.get('/post/:postId', 
  authenticateToken, 
  validateParams(postParamsSchema),
  validateQuery(getPostSharesSchema), 
  getPostShares
);

router.delete('/:shareId', 
  authenticateToken, 
  validateParams(shareParamsSchema), 
  deleteShare
);

export default router;
