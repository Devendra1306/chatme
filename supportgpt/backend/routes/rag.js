/**
 * RAG Routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query, getNamespaces, getStats } from '../controllers/ragController.js';

const router = Router();

router.post('/query', requireAuth, query);
router.get('/namespaces', requireAuth, getNamespaces);
router.get('/stats', requireAuth, getStats);

export default router;
