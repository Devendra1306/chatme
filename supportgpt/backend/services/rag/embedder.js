/**
 * RAG Embedder Service
 * Uses Google Gemini text-embedding-004 to generate 768-dim embeddings
 * Handles rate limiting with exponential backoff
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const BATCH_SIZE = 100; // Gemini allows up to 100 per batch call
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 500;

/**
 * Embed a single text string
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 768-dimensional float array
 */
export async function embedText(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('[Embedder] embedText: text must be a non-empty string');
  }

  // Truncate to ~8192 tokens (approx 32K chars) to stay within model limits
  const truncated = text.substring(0, 32000);

  return retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(truncated);
    const embedding = result.embedding.values;

    if (!embedding || embedding.length === 0) {
      throw new Error('[Embedder] Empty embedding returned from Gemini API');
    }

    return embedding;
  }, MAX_RETRIES);
}

/**
 * Embed multiple texts in batches of BATCH_SIZE
 * @param {string[]} texts - Array of text strings
 * @returns {Promise<number[][]>} - Array of embedding arrays
 */
export async function embedBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const allEmbeddings = [];

  // Process in batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[Embedder] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} texts)`);

    const batchEmbeddings = await Promise.all(
      batch.map((text) => embedText(text))
    );

    allEmbeddings.push(...batchEmbeddings);

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < texts.length) {
      await sleep(200);
    }
  }

  return allEmbeddings;
}

/**
 * Embed a query (uses task_type RETRIEVAL_QUERY for better retrieval accuracy)
 * @param {string} query - Query text
 * @returns {Promise<number[]>} - 768-dimensional embedding
 */
export async function embedQuery(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('[Embedder] embedQuery: query must be a non-empty string');
  }

  const truncated = query.substring(0, 8000);

  return retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Use RETRIEVAL_QUERY task type for query embeddings (better semantic retrieval)
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: truncated }] },
      taskType: 'RETRIEVAL_QUERY',
    });

    const embedding = result.embedding.values;
    if (!embedding || embedding.length === 0) {
      throw new Error('[Embedder] Empty query embedding returned from Gemini API');
    }
    return embedding;
  }, MAX_RETRIES);
}

/**
 * Embed a document chunk (uses task_type RETRIEVAL_DOCUMENT)
 * @param {string} text - Document text chunk
 * @returns {Promise<number[]>} - 768-dimensional embedding
 */
export async function embedDocument(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('[Embedder] embedDocument: text must be a non-empty string');
  }

  const truncated = text.substring(0, 32000);

  return retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text: truncated }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    });

    const embedding = result.embedding.values;
    if (!embedding || embedding.length === 0) {
      throw new Error('[Embedder] Empty document embedding returned from Gemini API');
    }
    return embedding;
  }, MAX_RETRIES);
}

/**
 * Embed a batch of document chunks with RETRIEVAL_DOCUMENT task type
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedDocumentBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[Embedder] Document batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)}`);

    const batchEmbeddings = await Promise.all(
      batch.map((text) => embedDocument(text))
    );

    allEmbeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < texts.length) {
      await sleep(300); // Slightly longer delay for document embedding
    }
  }

  return allEmbeddings;
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>}
 */
async function retryWithBackoff(fn, maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry on non-rate-limit errors
      const isRateLimit = err.message?.includes('429') ||
        err.message?.includes('rate limit') ||
        err.message?.includes('quota') ||
        err.status === 429;

      if (!isRateLimit && attempt > 0) {
        throw err; // Non-rate-limit error, fail fast
      }

      if (attempt < maxRetries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 100;
        console.warn(`[Embedder] Rate limit hit. Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default { embedText, embedBatch, embedQuery, embedDocument, embedDocumentBatch };
