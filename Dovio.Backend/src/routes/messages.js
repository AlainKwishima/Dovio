import express from 'express';
import {
  createMessage,
  getMessages,
  deleteMessage,
  getConversations
} from '../controllers/messageController.js';
import { validate, validateQuery } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { createMessageSchema, paginationSchema } from '../utils/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// POST /messages
router.post('/', validate(createMessageSchema), createMessage);

// GET /messages
router.get('/', validateQuery(paginationSchema), getMessages);

// GET /messages/conversations
router.get('/conversations', getConversations);

// DELETE /messages/:messageId
router.delete('/:messageId', deleteMessage);

export default router;



