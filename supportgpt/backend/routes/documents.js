import { Router } from 'express';
import {
  uploadDocument,
  getAllDocuments,
  getDocument,
  deleteDocument,
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.get('/', authenticate, getAllDocuments);
router.get('/:id', authenticate, getDocument);
router.delete('/:id', authenticate, deleteDocument);

export default router;
