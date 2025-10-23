import express from 'express';
import { 
  createStory, 
  getStories, 
  getStory, 
  deleteStory,
  getStoryViewers,
  getStoryHighlights,
  createStoryHighlight,
  updateStoryHighlight,
  deleteStoryHighlight
} from '../controllers/storyController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createStorySchema = Joi.object({
  storyText: Joi.string().max(1000).allow('').optional(),
  mediaURL: Joi.string().uri().max(5000).optional(),
  mediaType: Joi.string().valid('image', 'video', 'text').default('text')
}).custom((value, helpers) => {
  if (!value.storyText && !value.mediaURL) {
    return helpers.error('custom.atLeastOneRequired');
  }
  return value;
}).messages({
  'custom.atLeastOneRequired': 'Either story text or media URL is required'
});

const getStoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  userId: Joi.string().optional()
});

const getStorySchema = Joi.object({
  storyId: Joi.string().required()
});

const deleteStorySchema = Joi.object({
  storyId: Joi.string().required()
});

const getViewersSchema = Joi.object({
  storyId: Joi.string().required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getHighlightsSchema = Joi.object({
  userId: Joi.string().required()
});

const createHighlightSchema = Joi.object({
  title: Joi.string().max(100).required(),
  coverImageURL: Joi.string().uri().max(5000).optional(),
  storyIds: Joi.array().items(Joi.string()).min(1).required(),
  isPublic: Joi.boolean().default(true)
});

const updateHighlightSchema = Joi.object({
  title: Joi.string().max(100).optional(),
  coverImageURL: Joi.string().uri().max(5000).optional(),
  storyIds: Joi.array().items(Joi.string()).min(1).optional(),
  isPublic: Joi.boolean().optional(),
  order: Joi.number().integer().min(0).optional()
});

const highlightParamsSchema = Joi.object({
  highlightId: Joi.string().required()
});

// Routes
router.post('/', 
  authenticateToken, 
  validate(createStorySchema), 
  createStory
);

router.get('/', 
  authenticateToken, 
  validateQuery(getStoriesSchema), 
  getStories
);

router.get('/:storyId', 
  authenticateToken, 
  validateParams(getStorySchema), 
  getStory
);

router.delete('/:storyId', 
  authenticateToken, 
  validateParams(deleteStorySchema), 
  deleteStory
);

// Story Viewers
router.get('/:storyId/viewers', 
  authenticateToken, 
  validateParams(getViewersSchema), 
  getStoryViewers
);

// Story Highlights
router.get('/highlights/:userId', 
  authenticateToken, 
  validateParams(getHighlightsSchema), 
  getStoryHighlights
);

router.post('/highlights', 
  authenticateToken, 
  validate(createHighlightSchema), 
  createStoryHighlight
);

router.put('/highlights/:highlightId', 
  authenticateToken, 
  validateParams(highlightParamsSchema),
  validate(updateHighlightSchema), 
  updateStoryHighlight
);

router.delete('/highlights/:highlightId', 
  authenticateToken, 
  validateParams(highlightParamsSchema), 
  deleteStoryHighlight
);

export default router;
