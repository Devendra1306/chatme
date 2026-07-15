/**
 * RAG Retriever Service
 * Semantic retrieval from Pinecone with optional hybrid BM25-like scoring
 */

import { embedQuery } from './embedder.js';
import { queryVectors } from './vectorstore.js';

const DEFAULT_TOP_K = 5;
const MIN_SCORE_THRESHOLD = 0.3;

/**
 * Standard semantic retrieval
 * Embeds query → queries Pinecone → returns ranked results
 * @param {string} query - User query
 * @param {string} namespace - Pinecone namespace
 * @param {number} topK - Number of results
 * @param {object} filter - Optional metadata filter
 * @returns {Promise<Array<{id, score, content, metadata}>>}
 */
export async function retrieve(query, namespace = 'default', topK = DEFAULT_TOP_K, filter = null) {
  if (!query || typeof query !== 'string') {
    throw new Error('[Retriever] retrieve: query must be a non-empty string');
  }

  console.log(`[Retriever] Semantic retrieval for: "${query.substring(0, 80)}..." (ns: ${namespace})`);

  // Embed the query
  const queryEmbedding = await embedQuery(query);

  // Query Pinecone (fetch more than topK to allow for filtering/reranking)
  const rawResults = await queryVectors(queryEmbedding, Math.min(topK * 3, 30), namespace, filter);

  // Filter low-score results
  const filtered = rawResults.filter((r) => r.score >= MIN_SCORE_THRESHOLD);

  // Map to standardized format
  const results = filtered.slice(0, topK).map((r) => ({
    id: r.id,
    score: r.score,
    content: r.metadata?.content || r.metadata?.text || '',
    metadata: r.metadata || {},
  }));

  console.log(`[Retriever] Retrieved ${results.length}/${rawResults.length} results above threshold ${MIN_SCORE_THRESHOLD}`);
  return results;
}

/**
 * Hybrid retrieval: combine semantic similarity + keyword scoring (BM25-like)
 * @param {string} query
 * @param {string} namespace
 * @param {number} topK
 * @returns {Promise<Array<{id, score, content, metadata, hybridScore}>>}
 */
export async function hybridRetrieve(query, namespace = 'default', topK = DEFAULT_TOP_K) {
  if (!query || typeof query !== 'string') {
    throw new Error('[Retriever] hybridRetrieve: query must be a non-empty string');
  }

  console.log(`[Retriever] Hybrid retrieval for: "${query.substring(0, 80)}..."`);

  // Fetch more candidates for hybrid fusion
  const semanticResults = await retrieve(query, namespace, topK * 3);

  if (semanticResults.length === 0) {
    return [];
  }

  // Compute keyword scores using BM25-inspired TF-IDF-like scoring
  const queryTerms = tokenize(query);
  const scoredResults = semanticResults.map((result) => {
    const keywordScore = computeKeywordScore(queryTerms, result.content);
    const semanticScore = result.score;

    // Reciprocal Rank Fusion (RRF) hybrid combination
    // Weight: 70% semantic, 30% keyword
    const hybridScore = 0.7 * semanticScore + 0.3 * keywordScore;

    return {
      ...result,
      semanticScore,
      keywordScore,
      hybridScore,
    };
  });

  // Sort by hybrid score
  scoredResults.sort((a, b) => b.hybridScore - a.hybridScore);

  const results = scoredResults.slice(0, topK);
  console.log(`[Retriever] Hybrid retrieval returned ${results.length} results`);
  return results;
}

/**
 * Retrieve by document ID (fetch all chunks from a specific document)
 * @param {string} documentId - Document ID stored in metadata
 * @param {string} namespace
 * @returns {Promise<Array>}
 */
export async function retrieveByDocument(documentId, namespace = 'default') {
  // Use a dummy vector and filter by documentId
  const filter = { documentId: { $eq: documentId } };
  const index = await import('../../config/pinecone.js').then(m => m.getIndex());
  const ns = index.namespace(namespace);

  // Query with filter using zero vector (will return by metadata filter)
  const dummyVector = new Array(768).fill(0);
  const result = await ns.query({
    vector: dummyVector,
    topK: 1000, // Get all chunks
    includeMetadata: true,
    filter,
  });

  return (result.matches || []).map((m) => ({
    id: m.id,
    score: m.score,
    content: m.metadata?.content || '',
    metadata: m.metadata || {},
  }));
}

/**
 * BM25-inspired keyword score
 * Counts term frequency with length normalization
 */
function computeKeywordScore(queryTerms, text) {
  if (!text || queryTerms.length === 0) return 0;

  const docTerms = tokenize(text);
  const docLength = docTerms.length;
  const avgDocLength = 200; // Assumed average

  const k1 = 1.5; // Term frequency saturation
  const b = 0.75; // Length normalization

  let score = 0;
  for (const term of queryTerms) {
    const tf = docTerms.filter((t) => t === term).length;
    if (tf === 0) continue;

    // BM25 TF component
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)));
    score += tfNorm;
  }

  // Normalize to [0, 1]
  return Math.min(score / (queryTerms.length * 2), 1);
}

/**
 * Tokenize text into lowercase terms, removing stop words
 */
function tokenize(text) {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'and', 'or', 'but', 'not', 'it', 'its', 'this', 'that', 'these', 'those',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));
}

export default { retrieve, hybridRetrieve, retrieveByDocument };
