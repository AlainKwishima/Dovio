import express from 'express';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateQuery, validateParams } from '../middleware/validation.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20),
  unreadOnly: Joi.string().valid('true', 'false').default('false')
});

const notificationParamsSchema = Joi.object({
  notificationId: Joi.string().required()
});

// Routes
router.get('/', 
  authenticateToken, 
  validateQuery(getNotificationsSchema), 
  getNotifications
);

router.put('/:notificationId/read', 
  authenticateToken, 
  validateParams(notificationParamsSchema), 
  markNotificationAsRead
);

router.put('/read-all', 
  authenticateToken, 
  markAllNotificationsAsRead
);

router.delete('/:notificationId', 
  authenticateToken, 
  validateParams(notificationParamsSchema), 
  deleteNotification
);

export default router;

