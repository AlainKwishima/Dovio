import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/mobile',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-key',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
};


