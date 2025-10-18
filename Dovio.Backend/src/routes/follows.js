import express from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus
} from '../controllers/followController.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { followSchema, paginationSchema } from '../utils/validation.js';
import Joi from 'joi';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /follows
router.post('/', validate(followSchema), followUser);

// DELETE /follows/:followeeId
router.delete('/:followeeId', unfollowUser);

// GET /follows/followers/:userId
router.get('/followers/:userId', 
  validateParams(Joi.object({ userId: Joi.string().required() })), 
  validateQuery(paginationSchema), 
  getFollowers
);

// GET /follows/following/:userId
router.get('/following/:userId', 
  validateParams(Joi.object({ userId: Joi.string().required() })), 
  validateQuery(paginationSchema), 
  getFollowing
);

// GET /follows/status/:userId
router.get('/status/:userId', 
  validateParams(Joi.object({ userId: Joi.string().required() })), 
  checkFollowStatus
);

export default router;



