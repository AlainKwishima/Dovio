import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validate, validateQuery, validateParams } from '../middleware/validation.js';
import { 
  createMessage,
  getMessages,
  getConversations,
  deleteMessage
} from '../controllers/messageController.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createConversationSchema = Joi.object({
  type: Joi.string().valid('direct', 'group').default('direct'),
  participants: Joi.array().items(Joi.string()).min(1).required(),
  name: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  avatarURL: Joi.string().uri().max(5000).optional()
});

const getConversationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

const getMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

const sendMessageSchema = Joi.object({
  conversationId: Joi.string().required(),
  content: Joi.string().max(2000).required(),
  mediaUrl: Joi.string().uri().max(5000).optional()
});

const messageParamsSchema = Joi.object({
  messageId: Joi.string().required()
});

const conversationParamsSchema = Joi.object({
  conversationId: Joi.string().required()
});

const updateMessageSchema = Joi.object({
  content: Joi.string().max(2000).required()
});

// Apply authentication to all routes
router.use(authenticateToken);

// Conversation Routes
router.post('/conversations', 
  validate(createConversationSchema), 
  async (req, res) => {
    // Minimal implementation: direct conversations are implicit by participant pairing
    const { participants, type, name, description, avatarURL } = req.body;
    if (!Array.isArray(participants) || participants.length < 1) {
      return res.status(400).json({ success: false, message: 'participants required' });
    }
    return res.status(201).json({ success: true, data: { 
      conversation: {
        conversationId: participants[0],
        type: type || 'direct',
        name: name || null,
        description: description || null,
        avatarURL: avatarURL || null,
        participants: [req.user.userId, ...participants],
      }
    }});
  }
);

router.get('/conversations', 
  validateQuery(getConversationsSchema), 
  getConversations
);

router.get('/conversations/:conversationId', 
  validateParams(conversationParamsSchema),
  validateQuery(getMessagesSchema), 
  async (req, res, next) => {
    // Map to existing getMessages by using otherUserId
    req.query.otherUserId = req.params.conversationId;
    return getMessages(req, res, next);
  }
);

// Message Routes
router.post('/messages', 
  validate(sendMessageSchema), 
  async (req, res, next) => {
    // Map to existing createMessage by using conversationId as receiverId
    req.body.receiverId = req.body.conversationId;
    return createMessage(req, res, next);
  }
);

router.put('/messages/:messageId/read', 
  validateParams(messageParamsSchema), 
  async (_req, res) => res.json({ success: true })
);

router.put('/conversations/:conversationId/read', 
  validateParams(conversationParamsSchema), 
  async (_req, res) => res.json({ success: true })
);

router.put('/messages/:messageId', 
  validateParams(messageParamsSchema),
  validate(updateMessageSchema), 
  async (_req, res) => res.status(501).json({ success: false, message: 'Not implemented' })
);

router.delete('/messages/:messageId', 
  validateParams(messageParamsSchema), 
  deleteMessage
);

export default router;

