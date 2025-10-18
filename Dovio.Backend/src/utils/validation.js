import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  fullNames: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string().min(8).required(),
  dob: Joi.date().required(),
  address: Joi.string().max(200).required(),
  phoneNumber: Joi.string().max(20).required(),
  occupation: Joi.string().max(100).required(),
  hobbies: Joi.string().max(200).required(),
  profilePictureURL: Joi.string().uri().max(5000).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateUserSchema = Joi.object({
  fullNames: Joi.string().max(100).optional(),
  bio: Joi.string().max(500).optional(),
  address: Joi.string().max(200).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  occupation: Joi.string().max(100).optional(),
  hobbies: Joi.string().max(200).optional(),
  profilePictureURL: Joi.string().uri().max(5000).optional()
});

// Message validation schemas
export const createMessageSchema = Joi.object({
  receiverId: Joi.string().required(),
  content: Joi.string().required(),
  mediaUrl: Joi.string().uri().optional()
});

// Post validation schemas
export const createPostSchema = Joi.object({
  postText: Joi.string().max(1000).optional(),
  mediaURLs: Joi.array().items(Joi.string().uri().max(5000)).optional(),
  location: Joi.object({
    name: Joi.string().max(200).optional(),
    coordinates: Joi.array().items(Joi.number()).length(2).optional()
  }).optional()
}).custom((value, helpers) => {
  // At least one of postText or mediaURLs must be provided
  if (!value.postText && (!value.mediaURLs || value.mediaURLs.length === 0)) {
    return helpers.error('custom.atLeastOneRequired');
  }
  return value;
}).messages({
  'custom.atLeastOneRequired': 'Either postText or mediaURLs is required'
});

export const updatePostSchema = Joi.object({
  postText: Joi.string().max(1000).optional(),
  mediaURLs: Joi.array().items(Joi.string().uri().max(5000)).optional()
});

// Follow validation schemas
export const followSchema = Joi.object({
  followeeId: Joi.string().required()
});

// Wallet validation schemas
export const updateWalletSchema = Joi.object({
  amount: Joi.number().required(),
  operation: Joi.string().valid('add', 'subtract').required()
});

// Activity tracking validation schemas
export const addActivitySchema = Joi.object({
  action: Joi.string().required(),
  details: Joi.string().max(500).optional()
});

export const addActiveTimeSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  beginningTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});


