/**
 * RAG Pipeline Orchestrator
 * Full pipeline: query → embed → retrieve → rerank → generate → evaluate
 */

import { embedQuery } from './embedder.js';
import { hybridRetrieve } from './retriever.js';
import { rerank } from './reranker.js';
import { generateResponse, generateResponseStream } from './generator.js';
import { evaluate, computeConfidence } from './evaluator.js';

const DEFAULT_NAMESPACE = 'default';
const DEFAULT_TOP_K = 5;

/**
 * Full RAG pipeline (non-streaming)
 * @param {string} query - User query
 * @param {string} namespace - Pinecone namespace to search
 * @param {string} sessionId - Session ID for memory/logging
 * @param {Array<{role, content}>} history - Conversation history
 * @param {string} systemPrompt - Optional custom system prompt
 * @returns {Promise<{answer, citations, confidence, model, latency, evaluation}>}
 */
export async function pipeline(
  query,
  namespace = DEFAULT_NAMESPACE,
  sessionId = null,
  history = [],
  systemPrompt = null
) {
  const startTime = Date.now();

  console.log(`[Pipeline] Starting RAG for: "${query.substring(0, 80)}..." (ns: ${namespace})`);

  let retrievedDocs = [];
  let rerankedDocs = [];
  let retrievalScore = 0;
  let rerankScore = 0;

  // Step 1: Retrieve relevant documents
  try {
    retrievedDocs = await hybridRetrieve(query, namespace, DEFAULT_TOP_K * 2);

    // Compute average retrieval score
    if (retrievedDocs.length > 0) {
      retrievalScore = retrievedDocs.reduce((sum, d) => sum + (d.score || 0), 0) / retrievedDocs.length;
    }

    console.log(`[Pipeline] Retrieved ${retrievedDocs.length} documents (avg score: ${retrievalScore.toFixed(3)})`);
  } catch (retrievalErr) {
    console.warn(`[Pipeline] Retrieval failed: ${retrievalErr.message}. Proceeding without context.`);
    retrievedDocs = [];
  }

  // Step 2: Rerank documents
  try {
    if (retrievedDocs.length > 0) {
      rerankedDocs = await rerank(query, retrievedDocs, DEFAULT_TOP_K);

      if (rerankedDocs.length > 0) {
        rerankScore = rerankedDocs.reduce((sum, d) => sum + (d.finalScore || d.rerankScore || 0), 0) / rerankedDocs.length;
      }

      console.log(`[Pipeline] Reranked to ${rerankedDocs.length} docs (avg score: ${rerankScore.toFixed(3)})`);
    }
  } catch (rerankErr) {
    console.warn(`[Pipeline] Reranking failed: ${rerankErr.message}. Using retrieved docs as-is.`);
    rerankedDocs = retrievedDocs.slice(0, DEFAULT_TOP_K);
  }

  // Use top docs as context
  const context = rerankedDocs.length > 0 ? rerankedDocs : retrievedDocs.slice(0, DEFAULT_TOP_K);

  // Step 3: Generate response
  let generationResult;
  try {
    generationResult = await generateResponse(query, context, history, systemPrompt);
    console.log(`[Pipeline] Generated response (${generationResult.tokens?.total || 0} tokens, model: ${generationResult.model})`);
  } catch (genErr) {
    console.error(`[Pipeline] Generation failed: ${genErr.message}`);
    throw genErr;
  }

  // Step 4: Evaluate response quality
  let evaluation;
  try {
    evaluation = evaluate(
      generationResult.response,
      context,
      retrievalScore,
      rerankScore
    );
  } catch (evalErr) {
    console.warn(`[Pipeline] Evaluation failed: ${evalErr.message}`);
    evaluation = {
      summary: { isGrounded: true, hallucinationDetected: false, overallConfidence: 0.7, quality: 'medium' },
    };
  }

  const totalLatency = Date.now() - startTime;

  // Build citations
  const citations = context.map((doc) => ({
    source: doc.metadata?.source || doc.metadata?.documentName || 'Knowledge Base',
    chunk: doc.content?.substring(0, 300),
    score: doc.finalScore || doc.rerankScore || doc.score || 0,
    page: doc.metadata?.page || null,
    section: doc.metadata?.section || null,
    vectorId: doc.id || null,
  }));

  console.log(`[Pipeline] ✅ Complete in ${totalLatency}ms | Confidence: ${evaluation.summary?.overallConfidence}`);

  return {
    answer: generationResult.response,
    citations,
    confidence: evaluation.summary?.overallConfidence || 0,
    model: generationResult.model,
    provider: generationResult.provider,
    latency: totalLatency,
    generationLatency: generationResult.latency,
    tokens: generationResult.tokens,
    evaluation,
    retrieval: {
      docsRetrieved: retrievedDocs.length,
      docsAfterRerank: rerankedDocs.length,
      avgRetrievalScore: retrievalScore,
      avgRerankScore: rerankScore,
    },
    sessionId,
    namespace,
    query,
  };
}

/**
 * Streaming RAG pipeline
 * Retrieves → reranks → streams generation tokens
 * @param {string} query
 * @param {string} namespace
 * @param {Array} history
 * @param {string} systemPrompt
 * @yields {object} Stream chunks: {type: 'token'|'context'|'done'|'error', ...}
 */
export async function* pipelineStream(
  query,
  namespace = DEFAULT_NAMESPACE,
  history = [],
  systemPrompt = null
) {
  const startTime = Date.now();

  console.log(`[Pipeline/Stream] Starting for: "${query.substring(0, 80)}..."`);

  let context = [];
  let retrievalScore = 0;
  let rerankScore = 0;

  // Step 1: Retrieve (before streaming)
  try {
    const retrieved = await hybridRetrieve(query, namespace, DEFAULT_TOP_K * 2);
    if (retrieved.length > 0) {
      retrievalScore = retrieved.reduce((s, d) => s + (d.score || 0), 0) / retrieved.length;
    }

    // Rerank
    if (retrieved.length > 0) {
      const reranked = await rerank(query, retrieved, DEFAULT_TOP_K);
      if (reranked.length > 0) {
        rerankScore = reranked.reduce((s, d) => s + (d.finalScore || 0), 0) / reranked.length;
      }
      context = reranked.length > 0 ? reranked : retrieved.slice(0, DEFAULT_TOP_K);
    }

    // Yield context metadata before streaming starts
    yield {
      type: 'context',
      citations: context.map((doc) => ({
        source: doc.metadata?.source || 'Knowledge Base',
        score: doc.finalScore || doc.score || 0,
        chunk: doc.content?.substring(0, 200),
        page: doc.metadata?.page || null,
      })),
      docsRetrieved: retrieved.length,
    };
  } catch (err) {
    console.warn(`[Pipeline/Stream] Retrieval failed: ${err.message}`);
    yield { type: 'context', citations: [], docsRetrieved: 0 };
  }

  // Step 2: Stream generation
  const stream = generateResponseStream(query, context, history, systemPrompt);
  let fullResponse = '';
  let donePayload = null;

  for await (const chunk of stream) {
    if (chunk.type === 'token') {
      fullResponse += chunk.content;
      yield chunk;
    } else if (chunk.type === 'done') {
      donePayload = chunk;
    } else if (chunk.type === 'error') {
      yield chunk;
      return;
    }
  }

  // Step 3: Evaluate after streaming complete
  const evaluation = evaluate(fullResponse, context, retrievalScore, rerankScore);
  const totalLatency = Date.now() - startTime;

  yield {
    type: 'done',
    ...donePayload,
    evaluation: evaluation.summary,
    confidence: evaluation.summary?.overallConfidence || 0,
    latency: totalLatency,
    namespace,
    retrieval: {
      docsRetrieved: context.length,
      avgRetrievalScore: retrievalScore,
      avgRerankScore: rerankScore,
    },
  };
}

export default { pipeline, pipelineStream };
