import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import { 
  savePost,
  getSavedPosts,
  removeSavedPost,
  tagUserInPost,
  getPostTags,
  approveTag,
  rejectTag,
  getPendingTags
} from '../controllers/bookmarkTagController.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const savePostSchema = Joi.object({
  folder: Joi.string().max(50).default('default'),
  tags: Joi.array().items(Joi.string().max(30)).default([]),
  notes: Joi.string().max(500).optional()
});

const getSavedPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  folder: Joi.string().optional(),
  tag: Joi.string().optional()
});

const postParamsSchema = Joi.object({
  postId: Joi.string().required()
});

const tagUserSchema = Joi.object({
  taggedUserId: Joi.string().required(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).required()
});

const tagParamsSchema = Joi.object({
  tagId: Joi.string().required()
});

// Apply authentication to all routes
router.use(authenticateToken);

// Bookmark Routes
router.post('/posts/:postId/save', 
  validateParams(postParamsSchema),
  validate(savePostSchema), 
  savePost
);

router.get('/posts/saved', 
  validateQuery(getSavedPostsSchema), 
  getSavedPosts
);

router.delete('/posts/:postId/save', 
  validateParams(postParamsSchema), 
  removeSavedPost
);

// Tagging Routes
router.post('/posts/:postId/tags', 
  validateParams(postParamsSchema),
  validate(tagUserSchema), 
  tagUserInPost
);

router.get('/posts/:postId/tags', 
  validateParams(postParamsSchema), 
  getPostTags
);

router.put('/tags/:tagId/approve', 
  validateParams(tagParamsSchema), 
  approveTag
);

router.delete('/tags/:tagId/reject', 
  validateParams(tagParamsSchema), 
  rejectTag
);

router.get('/tags/pending', getPendingTags);

export default router;

