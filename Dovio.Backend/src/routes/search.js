import express from 'express';
import { 
  searchUsers, 
  searchPosts, 
  searchStories, 
  globalSearch, 
  getSuggestedUsers,
  searchHashtags,
  getHashtagSuggestions,
  getTrendingHashtags,
  searchByLocation
} from '../controllers/searchController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const searchSchema = Joi.object({
  q: Joi.string().min(2).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const globalSearchSchema = Joi.object({
  q: Joi.string().min(2).required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const suggestedUsersSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const hashtagSearchSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  sortBy: Joi.string().valid('recent', 'popular').default('recent')
});

const hashtagSuggestionsSchema = Joi.object({
  query: Joi.string().min(1).required()
});

const trendingHashtagsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(20),
  timeframe: Joi.string().valid('1h', '24h', '7d', '30d').default('24h')
});

const locationSearchSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  radius: Joi.number().integer().min(1).max(100).default(10),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  type: Joi.string().valid('all', 'posts', 'stories').default('all')
});

const hashtagParamsSchema = Joi.object({
  tag: Joi.string().required()
});

// Routes
router.get('/users', 
  authenticateToken, 
  validateQuery(searchSchema), 
  searchUsers
);

router.get('/posts', 
  authenticateToken, 
  validateQuery(searchSchema), 
  searchPosts
);

router.get('/stories', 
  authenticateToken, 
  validateQuery(searchSchema), 
  searchStories
);

router.get('/global', 
  authenticateToken, 
  validateQuery(globalSearchSchema), 
  globalSearch
);

router.get('/suggested-users', 
  authenticateToken, 
  validateQuery(suggestedUsersSchema), 
  getSuggestedUsers
);

// Hashtag Routes
router.get('/hashtags/:tag', 
  authenticateToken, 
  validateQuery(hashtagParamsSchema),
  validateQuery(hashtagSearchSchema), 
  searchHashtags
);

router.get('/hashtags/suggest', 
  authenticateToken, 
  validateQuery(hashtagSuggestionsSchema), 
  getHashtagSuggestions
);

router.get('/hashtags/trending', 
  authenticateToken, 
  validateQuery(trendingHashtagsSchema), 
  getTrendingHashtags
);

// Location Search Routes
router.get('/location', 
  authenticateToken, 
  validateQuery(locationSearchSchema), 
  searchByLocation
);

export default router;

