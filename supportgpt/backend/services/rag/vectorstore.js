/**
 * RAG Vector Store Service
 * All Pinecone operations: upsert, query, delete, namespace management
 */

import { getIndex, describeIndex } from '../../config/pinecone.js';

const DEFAULT_NAMESPACE = 'default';
const DEFAULT_TOP_K = 10;

/**
 * Upsert vectors into Pinecone
 * @param {Array<{id: string, values: number[], metadata: object}>} vectors
 * @param {string} namespace
 * @returns {Promise<{upsertedCount: number}>}
 */
export async function upsertVectors(vectors, namespace = DEFAULT_NAMESPACE) {
  if (!vectors || vectors.length === 0) {
    return { upsertedCount: 0 };
  }

  const index = await getIndex();
  const ns = index.namespace(namespace);

  // Pinecone recommends batches of 100 vectors
  const UPSERT_BATCH_SIZE = 100;
  let totalUpserted = 0;

  for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
    const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);

    // Validate and clean vectors
    const cleanedBatch = batch.map((v) => ({
      id: String(v.id),
      values: v.values,
      metadata: sanitizeMetadata(v.metadata || {}),
    }));

    const result = await ns.upsert(cleanedBatch);
    totalUpserted += result?.upsertedCount || cleanedBatch.length;
    console.log(`[VectorStore] Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}: ${cleanedBatch.length} vectors to namespace '${namespace}'`);

    // Small delay between batches
    if (i + UPSERT_BATCH_SIZE < vectors.length) {
      await sleep(100);
    }
  }

  console.log(`[VectorStore] ✅ Total upserted: ${totalUpserted} vectors to namespace '${namespace}'`);
  return { upsertedCount: totalUpserted };
}

/**
 * Query Pinecone for similar vectors
 * @param {number[]} embedding - Query embedding vector
 * @param {number} topK - Number of results to return
 * @param {string} namespace - Pinecone namespace
 * @param {object} filter - Metadata filter (optional)
 * @returns {Promise<Array<{id, score, metadata}>>}
 */
export async function queryVectors(
  embedding,
  topK = DEFAULT_TOP_K,
  namespace = DEFAULT_NAMESPACE,
  filter = null
) {
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('[VectorStore] queryVectors: invalid embedding vector');
  }

  const index = await getIndex();
  const ns = index.namespace(namespace);

  const queryOptions = {
    vector: embedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  };

  if (filter && Object.keys(filter).length > 0) {
    queryOptions.filter = filter;
  }

  const result = await ns.query(queryOptions);

  const matches = (result.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata || {},
  }));

  console.log(`[VectorStore] Query returned ${matches.length} results from namespace '${namespace}'`);
  return matches;
}

/**
 * Delete specific vectors by ID
 * @param {string[]} ids - Vector IDs to delete
 * @param {string} namespace
 */
export async function deleteVectors(ids, namespace = DEFAULT_NAMESPACE) {
  if (!ids || ids.length === 0) return;

  const index = await getIndex();
  const ns = index.namespace(namespace);

  // Delete in batches of 1000
  const DELETE_BATCH_SIZE = 1000;
  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + DELETE_BATCH_SIZE);
    await ns.deleteMany(batch);
    console.log(`[VectorStore] Deleted ${batch.length} vectors from namespace '${namespace}'`);
  }
}

/**
 * Delete all vectors in a namespace
 * @param {string} namespace
 */
export async function deleteNamespace(namespace) {
  if (!namespace) throw new Error('[VectorStore] deleteNamespace: namespace is required');

  const index = await getIndex();
  const ns = index.namespace(namespace);
  await ns.deleteAll();
  console.log(`[VectorStore] ✅ Deleted all vectors in namespace '${namespace}'`);
}

/**
 * List all namespaces in the index
 * @returns {Promise<string[]>}
 */
export async function listNamespaces() {
  try {
    const stats = await getIndexStats();
    const namespaces = Object.keys(stats.namespaces || {});
    return namespaces;
  } catch (err) {
    console.error('[VectorStore] Failed to list namespaces:', err.message);
    return [];
  }
}

/**
 * Get index statistics
 * @returns {Promise<object>}
 */
export async function getIndexStats() {
  try {
    const index = await getIndex();
    const stats = await index.describeIndexStats();
    return {
      totalVectorCount: stats.totalVectorCount || 0,
      dimension: stats.dimension,
      indexFullness: stats.indexFullness,
      namespaces: stats.namespaces || {},
    };
  } catch (err) {
    console.error('[VectorStore] Failed to get index stats:', err.message);
    throw err;
  }
}

/**
 * Fetch specific vectors by ID
 * @param {string[]} ids
 * @param {string} namespace
 * @returns {Promise<object>}
 */
export async function fetchVectors(ids, namespace = DEFAULT_NAMESPACE) {
  if (!ids || ids.length === 0) return {};

  const index = await getIndex();
  const ns = index.namespace(namespace);
  const result = await ns.fetch(ids);
  return result.records || {};
}

/**
 * Sanitize metadata for Pinecone (only string, number, boolean, string[] allowed)
 */
function sanitizeMetadata(metadata) {
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[key] = value;
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      clean[key] = value;
    } else {
      // Convert complex types to string
      clean[key] = String(value);
    }
  }
  return clean;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  upsertVectors,
  queryVectors,
  deleteVectors,
  deleteNamespace,
  listNamespaces,
  getIndexStats,
  fetchVectors,
};
