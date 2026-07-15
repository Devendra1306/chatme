/**
 * RAG Controller
 * Non-streaming queries, namespace management, index stats
 */

import { pipeline } from '../services/rag/pipeline.js';
import { listNamespaces, getIndexStats } from '../services/rag/vectorstore.js';
import { getSessionSummary } from '../services/memory.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/rag/query
 * Non-streaming RAG query — returns full answer + citations
 */
export async function query(req, res, next) {
  try {
    const {
      query: userQuery,
      namespace = 'default',
      sessionId,
      history,
      systemPrompt,
    } = req.body;

    if (!userQuery || typeof userQuery !== 'string') {
      return res.status(400).json({ success: false, message: 'query field is required' });
    }

    const sid = sessionId || uuidv4();
    const userId = req.user?.uid;

    // Load history from DB if not provided
    let conversationHistory = history || [];
    if (!history && sessionId) {
      try {
        conversationHistory = await getSessionSummary(sessionId);
      } catch (_err) {
        conversationHistory = [];
      }
    }

    const result = await pipeline(
      userQuery.trim(),
      namespace,
      sid,
      conversationHistory,
      systemPrompt
    );

    res.json({
      success: true,
      sessionId: sid,
      answer: result.answer,
      citations: result.citations,
      confidence: result.confidence,
      model: result.model,
      provider: result.provider,
      tokens: result.tokens,
      latency: result.latency,
      evaluation: result.evaluation?.summary,
      retrieval: result.retrieval,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/rag/namespaces
 * List all Pinecone namespaces
 */
export async function getNamespaces(req, res, next) {
  try {
    const namespaces = await listNamespaces();
    res.json({ success: true, namespaces, count: namespaces.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/rag/stats
 * Get Pinecone index statistics
 */
export async function getStats(req, res, next) {
  try {
    const stats = await getIndexStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

export default { query, getNamespaces, getStats };
