import express from 'express';
import multer from 'multer';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost
} from '../controllers/postController.js';
import { validate, validateQuery } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { normalizeCreateOrUpdatePostPayload } from '../middleware/normalizers.js';
import {
  createPostSchema,
  updatePostSchema,
  paginationSchema
} from '../utils/validation.js';

const router = express.Router();
const upload = multer();

// GET /posts (public route - no auth required)
router.get('/', validateQuery(paginationSchema), getPosts);

// GET /posts/:postId (public route - no auth required)
router.get('/:postId', getPost);

// All other routes require authentication
router.use(authenticateToken);

// POST /posts (accept JSON or form-data without files)
router.post('/', upload.none(), normalizeCreateOrUpdatePostPayload, validate(createPostSchema), createPost);

// PUT /posts/:postId (accept JSON or form-data without files)
router.put('/:postId', upload.none(), normalizeCreateOrUpdatePostPayload, validate(updatePostSchema), updatePost);

// DELETE /posts/:postId
router.delete('/:postId', deletePost);

export default router;



