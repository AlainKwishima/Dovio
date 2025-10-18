import express from 'express';
import { 
  createComment, 
  getComments, 
  updateComment, 
  deleteComment,
  likeComment,
  getCommentReplies
} from '../controllers/commentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createCommentSchema = Joi.object({
  postId: Joi.string().required(),
  content: Joi.string().max(500).required(),
  parentCommentId: Joi.string().optional()
});

const getCommentsSchema = Joi.object({
  postId: Joi.string().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const updateCommentSchema = Joi.object({
  content: Joi.string().max(500).required()
});

const commentParamsSchema = Joi.object({
  commentId: Joi.string().required()
});

const getRepliesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sortBy: Joi.string().valid('timestamp', 'popularity').default('timestamp')
});

// Routes
router.post('/', 
  authenticateToken, 
  validate(createCommentSchema), 
  createComment
);

router.get('/', 
  authenticateToken, 
  validateQuery(getCommentsSchema), 
  getComments
);

router.put('/:commentId', 
  authenticateToken, 
  validateParams(commentParamsSchema),
  validate(updateCommentSchema), 
  updateComment
);

router.delete('/:commentId', 
  authenticateToken, 
  validateParams(commentParamsSchema), 
  deleteComment
);

router.post('/:commentId/like', 
  authenticateToken, 
  validateParams(commentParamsSchema), 
  likeComment
);

router.get('/:commentId/replies', 
  authenticateToken, 
  validateParams(commentParamsSchema),
  validateQuery(getRepliesSchema),
  getCommentReplies
);

export default router;
