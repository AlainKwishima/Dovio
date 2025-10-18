import express from 'express';
import { 
  getFeed, 
  getDiscoverFeed, 
  getTrendingPosts 
} from '../controllers/feedController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const getFeedSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: Joi.string().valid('all', 'posts', 'stories').default('all')
});

const getDiscoverFeedSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getTrendingPostsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  timeframe: Joi.string().valid('1h', '24h', '7d', '30d').default('24h')
});

// Routes
router.get('/', 
  authenticateToken, 
  validateQuery(getFeedSchema), 
  getFeed
);

// For discover, allow unauthenticated access in dev to serve mock data
router.get('/discover', 
  (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') return next();
    return authenticateToken(req, res, next);
  },
  validateQuery(getDiscoverFeedSchema), 
  getDiscoverFeed
);

router.get('/trending', 
  authenticateToken, 
  validateQuery(getTrendingPostsSchema), 
  getTrendingPosts
);

export default router;

