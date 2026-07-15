import KnowledgeBase from '../models/KnowledgeBase.js';
import { embedBatch } from '../services/rag/embedder.js';
import { upsertVectors, deleteVectors } from '../services/rag/vectorstore.js';

export const createArticle = async (req, res, next) => {
  try {
    const article = new KnowledgeBase(req.body);
    article.author = req.user?._id;
    
    const embeddings = await embedBatch([article.content]);
    const vectorId = `kb_${article._id}`;
    
    await upsertVectors([{
      id: vectorId,
      values: embeddings[0],
      metadata: { source: 'kb', title: article.title }
    }], article.namespace || 'default');
    
    article.vectorId = vectorId;
    await article.save();
    
    res.status(201).json(article);
  } catch (error) {
    next(error);
  }
};

export const getArticles = async (req, res, next) => {
  try {
    const articles = await KnowledgeBase.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    next(error);
  }
};

export const getArticleById = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    
    article.views += 1;
    await article.save();
    
    res.json(article);
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!article) return res.status(404).json({ error: 'Not found' });
    
    if (req.body.content) {
      const embeddings = await embedBatch([article.content]);
      await upsertVectors([{
        id: article.vectorId,
        values: embeddings[0],
        metadata: { source: 'kb', title: article.title }
      }], article.namespace || 'default');
    }
    
    res.json(article);
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    
    if (article.vectorId) {
      await deleteVectors([article.vectorId], article.namespace || 'default');
    }
    
    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
};

export const markHelpful = async (req, res, next) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) return res.status(404).json({ error: 'Not found' });
    
    if (req.body.helpful) {
      article.helpful += 1;
    } else {
      article.notHelpful += 1;
    }
    
    await article.save();
    res.json(article);
  } catch (error) {
    next(error);
  }
};
