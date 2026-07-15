import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

export const getModel = () => {
  return getGenAI().getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 2048,
    },
  });
};

export const getEmbeddingModel = () => {
  // text-embedding-004 is accessed via getGenerativeModel, same as chat models
  return getGenAI().getGenerativeModel({
    model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  });
};

/**
 * Generate embedding for a single text using the Gemini Embedding API.
 * Uses the correct embedContent call for the @google/generative-ai SDK.
 */
export const generateEmbedding = async (text) => {
  const model = getEmbeddingModel();
  // The embedContent method returns { embedding: { values: float[] } }
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export default getGenAI;
