import { Router } from 'express';
import {
  createChat,
  getHistory,
  getMessages,
  sendMessage,
  deleteChat,
  renameChat,
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createChat);
router.get('/history', authenticate, getHistory);
router.get('/:id/messages', authenticate, getMessages);
router.post('/:id/message', authenticate, sendMessage);
router.delete('/:id', authenticate, deleteChat);
router.put('/:id/rename', authenticate, renameChat);

export default router;
