import express from 'express';
import { createArticle, getArticles, getArticleById, updateArticle, deleteArticle, markHelpful } from '../controllers/knowledgeController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, createArticle);
router.get('/', optionalAuth, getArticles);
router.get('/:id', optionalAuth, getArticleById);
router.put('/:id', optionalAuth, updateArticle);
router.delete('/:id', optionalAuth, deleteArticle);

router.post('/:id/helpful', optionalAuth, markHelpful);

export default router;
