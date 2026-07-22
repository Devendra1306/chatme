import { getPineconeIndex } from '../config/pinecone.js';

const NAMESPACE = 'default';

/**
 * Upsert document chunk vectors into Pinecone.
 * @param {string} documentId - MongoDB Document ID
 * @param {Array<{text: string, chunkIndex: number, pageApprox: number}>} chunks
 * @param {number[][]} embeddings
 * @param {string} documentName
 */
export const upsertVectors = async (documentId, chunks, embeddings, documentName) => {
  const index = getPineconeIndex();

  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}_chunk_${chunk.chunkIndex}`,
    values: embeddings[i],
    metadata: {
      documentId: documentId.toString(),
      documentName,
      chunkIndex: chunk.chunkIndex,
      pageApprox: chunk.pageApprox,
      text: chunk.text.slice(0, 1000), // Pinecone metadata limit
    },
  }));

  // Upsert in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE);
    await index.namespace(NAMESPACE).upsert(batch);
  }

  return vectors.map((v) => v.id);
};

/**
 * Query Pinecone for top-K most similar vectors, optionally filtered by document IDs.
 * @param {number[]} queryEmbedding
 * @param {number} topK
 * @param {string[]} documentIds
 * @returns {Promise<Array>}
 */
export const queryVectors = async (queryEmbedding, topK = 5, documentIds = []) => {
  const index = getPineconeIndex();

  const queryOptions = {
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    includeValues: false,
  };

  if (documentIds && documentIds.length > 0) {
    queryOptions.filter = {
      documentId: { $in: documentIds.map(id => id.toString()) }
    };
  }

  const result = await index.namespace(NAMESPACE).query(queryOptions);

  return result.matches || [];
};

/**
 * Delete all vectors belonging to a document from Pinecone.
 * @param {string} documentId
 * @param {string[]} pineconeIds - Array of vector IDs stored on the Document record
 */
export const deleteDocumentVectors = async (documentId, pineconeIds = []) => {
  const index = getPineconeIndex();

  if (pineconeIds && pineconeIds.length > 0) {
    // Delete by explicit IDs (more efficient)
    const BATCH_SIZE = 1000;
    for (let i = 0; i < pineconeIds.length; i += BATCH_SIZE) {
      const batch = pineconeIds.slice(i, i + BATCH_SIZE);
      await index.namespace(NAMESPACE).deleteMany(batch);
    }
  } else {
    // Fallback: delete by metadata filter (if supported)
    try {
      await index.namespace(NAMESPACE).deleteMany({
        filter: { documentId: { $eq: documentId.toString() } },
      });
    } catch {
      console.warn(`Could not delete vectors by filter for documentId: ${documentId}`);
    }
  }
};
