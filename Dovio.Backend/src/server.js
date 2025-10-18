import express from 'express';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import config from './config/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import messagingRoutes from './routes/messaging.js';
import postRoutes from './routes/posts.js';
import followRoutes from './routes/follows.js';
import storyRoutes from './routes/stories.js';
import commentRoutes from './routes/comments.js';
import shareRoutes from './routes/shares.js';
import notificationRoutes from './routes/notifications.js';
import feedRoutes from './routes/feed.js';
import searchRoutes from './routes/search.js';
import reactionRoutes from './routes/reactions.js';
import userSettingsRoutes from './routes/userSettings.js';
import bookmarkRoutes from './routes/bookmarks.js';
import uploadRoutes from './routes/upload.js';

// Load environment variables
dotenv.config();

export const app = express();

// Connect to MongoDB (skip during tests)
if (config.nodeEnv !== 'test') {
  connectDB();
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const isProd = process.env.NODE_ENV === 'production';

    if (!isProd) {
      // Allow all origins in development/non-production environments
      callback(null, true);
      return;
    }

    // In production, use configured origins
    const allowed = config.corsOrigins.length ? config.corsOrigins : [];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Prevent NoSQL injection and HTTP parameter pollution
app.use(mongoSanitize());
app.use(hpp());

// Rate limiting
app.use(generalLimiter);

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile Backend API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Swagger docs
try {
  // Prefer the full spec under openapi/; fallback to src/swagger.yaml
  let specUrl = new URL('../openapi/mobile.v1.yaml', import.meta.url);
  let swaggerDocument;
  try {
    swaggerDocument = YAML.load(specUrl);
  } catch (_e) {
    swaggerDocument = YAML.load(new URL('./swagger.yaml', import.meta.url));
  }
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.warn('Swagger not loaded:', e?.message || e);
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/users', userSettingsRoutes);
app.use('/api', bookmarkRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = config.port;

if (config.nodeEnv !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
    console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});



