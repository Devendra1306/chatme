import { generateEmbedding } from '../config/gemini.js';

const BATCH_SIZE = 5;
const DELAY_MS = 200;
const DIMENSION = parseInt(process.env.PINECONE_DIMENSION) || 768;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a deterministic 768-dimensional float vector for text.
 * Used as a fallback when Gemini API fails/has no quota.
 */
function localVectorizer(text, dimension = DIMENSION) {
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  };

  const vector = [];
  const seed = hash(text);
  
  let state = seed || 123456789;
  const nextRandom = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };

  for (let i = 0; i < dimension; i++) {
    let val = nextRandom() * 2 - 1;
    if (Math.abs(val) < 1e-5) val = 1e-5; // avoid all zeros
    vector.push(val);
  }

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / (magnitude || 1));
}

/**
 * Generate an embedding vector for a text string.
 */
export const embedText = async (text) => {
  try {
    const trimmed = text.slice(0, 8192);
    const values = await generateEmbedding(trimmed);
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid embedding response');
    }
    return values;
  } catch (err) {
    console.warn(`⚠️ embedText failed: ${err.message}. Falling back to local vectorizer.`);
    return localVectorizer(text);
  }
};

/**
 * Generate embeddings for an array of texts with batching.
 */
export const embedBatch = async (texts) => {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchEmbeddings = await Promise.all(
      batch.map(async (text) => {
        try {
          return await embedText(text);
        } catch {
          return localVectorizer(text);
        }
      })
    );

    embeddings.push(...batchEmbeddings);

    if (i + BATCH_SIZE < texts.length) {
      await sleep(DELAY_MS);
    }
  }

  return embeddings;
};
