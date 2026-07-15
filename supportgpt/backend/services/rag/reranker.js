/**
 * RAG Reranker Service
 * Reranks retrieved documents by computing relevance scores
 * Uses cosine similarity + keyword overlap for cross-encoder-style scoring
 */

import { embedQuery } from './embedder.js';

const SCORE_THRESHOLD = 0.4; // Minimum score to include in results
const MAX_RERANKED = 5;

/**
 * Rerank a list of retrieved documents against a query
 * @param {string} query - User query
 * @param {Array<{id, score, content, metadata}>} documents - Retrieved documents
 * @param {number} topK - Max results to return
 * @returns {Promise<Array<{id, score, content, metadata, rerankScore}>>}
 */
export async function rerank(query, documents, topK = MAX_RERANKED) {
  if (!documents || documents.length === 0) return [];
  if (!query) return documents.slice(0, topK);

  console.log(`[Reranker] Reranking ${documents.length} documents...`);

  // Score each document
  const scored = await Promise.all(
    documents.map(async (doc) => {
      const rerankScore = await crossEncoderScore(query, doc.content || '');
      return {
        ...doc,
        rerankScore,
        // Combine original retrieval score with rerank score
        finalScore: combineScores(doc.score || doc.hybridScore || 0, rerankScore),
      };
    })
  );

  // Sort by final score
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Filter by threshold and return top K
  const filtered = scored.filter((d) => d.finalScore >= SCORE_THRESHOLD);
  const results = filtered.slice(0, topK);

  console.log(`[Reranker] Kept ${results.length}/${documents.length} documents after reranking`);
  return results;
}

/**
 * Compute relevance score between query and document using:
 * 1. Keyword overlap (Jaccard similarity)
 * 2. Phrase presence detection
 * 3. Position weighting (terms appearing early score higher)
 * 
 * Note: A true cross-encoder would require a fine-tuned model;
 * this is a high-quality approximation without an extra API call.
 * 
 * @param {string} query
 * @param {string} doc
 * @returns {Promise<number>} Score between 0 and 1
 */
export async function crossEncoderScore(query, doc) {
  if (!query || !doc) return 0;

  const queryLower = query.toLowerCase();
  const docLower = doc.toLowerCase();

  // 1. Exact phrase match (highest signal)
  const phraseScore = docLower.includes(queryLower) ? 1.0 : 0.0;

  // 2. Keyword overlap (Jaccard)
  const queryTokens = new Set(tokenize(query));
  const docTokens = new Set(tokenize(doc));
  const intersection = new Set([...queryTokens].filter((t) => docTokens.has(t)));
  const union = new Set([...queryTokens, ...docTokens]);
  const jaccardScore = union.size > 0 ? intersection.size / union.size : 0;

  // 3. Coverage: what fraction of query terms appear in doc
  const coverageScore = queryTokens.size > 0
    ? intersection.size / queryTokens.size
    : 0;

  // 4. Position weighting: query terms appearing earlier score higher
  const positionScore = computePositionScore(queryTokens, docLower);

  // 5. Bigram overlap for better phrase detection
  const queryBigrams = getBigrams(tokenize(query));
  const docBigrams = new Set(getBigrams(tokenize(doc)));
  const bigramMatches = queryBigrams.filter((b) => docBigrams.has(b)).length;
  const bigramScore = queryBigrams.length > 0 ? bigramMatches / queryBigrams.length : 0;

  // Weighted combination
  const finalScore = (
    phraseScore * 0.30 +
    coverageScore * 0.30 +
    jaccardScore * 0.15 +
    positionScore * 0.15 +
    bigramScore * 0.10
  );

  return Math.min(finalScore, 1.0);
}

/**
 * Score based on how early query terms appear in the document
 * Earlier = more relevant (documents tend to state main point first)
 */
function computePositionScore(queryTerms, docText) {
  if (queryTerms.size === 0 || !docText) return 0;

  const docWords = docText.split(/\s+/);
  const docLength = docWords.length;

  let totalPositionScore = 0;
  let found = 0;

  for (const term of queryTerms) {
    const pos = docWords.findIndex((w) => w.includes(term));
    if (pos !== -1) {
      // Score: 1.0 if at start, ~0.3 if at end
      totalPositionScore += Math.max(0, 1.0 - (pos / docLength) * 0.7);
      found++;
    }
  }

  return found > 0 ? totalPositionScore / queryTerms.size : 0;
}

/**
 * Get bigrams from token list
 */
function getBigrams(tokens) {
  const bigrams = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Combine retrieval score with rerank score
 * @param {number} retrievalScore - Pinecone cosine similarity (0-1)
 * @param {number} rerankScore - Cross-encoder score (0-1)
 * @returns {number}
 */
function combineScores(retrievalScore, rerankScore) {
  // 40% retrieval, 60% rerank
  return 0.4 * retrievalScore + 0.6 * rerankScore;
}

/**
 * Tokenize query/document into meaningful terms
 */
function tokenize(text) {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'and', 'or', 'but', 'not', 'it', 'its', 'this', 'that', 'these', 'those',
    'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'their',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));
}

export default { rerank, crossEncoderScore };
