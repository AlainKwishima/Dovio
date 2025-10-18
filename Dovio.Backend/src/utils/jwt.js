import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.refreshTokenSecret, { expiresIn: '7d' });
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.refreshTokenSecret);
};


