import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

try { if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true }); } catch {}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsRoot);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const name = `${base}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = express.Router();

router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const file = req.file;
  const publicUrl = `/uploads/${file.filename}`;
  const host = req.get('host');
  const protocol = req.protocol;
  const absoluteUrl = `${protocol}://${host}${publicUrl}`;

  res.json({
    success: true,
    data: {
      url: absoluteUrl,
      path: publicUrl,
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
    }
  });
});

export default router;
