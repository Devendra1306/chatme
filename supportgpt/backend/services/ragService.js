import { embedText } from './embeddingService.js';
import { queryVectors } from './pineconeService.js';
import { getModel } from '../config/gemini.js';
import Chunk from '../models/Chunk.js';
import axios from 'axios';

const SYSTEM_PROMPT = `You are an AI Customer Support Assistant. Your job is to help users by answering questions strictly based on the provided document context below.

Rules you MUST follow:
1. Answer ONLY using information from the provided document context.
2. Never fabricate, guess, or make up information.
3. If the answer cannot be found in the context, reply exactly: "I couldn't find this information in the uploaded documents."
4. Always mention the document name and page number when referencing information (e.g., "According to [Document Name], page X...").
5. Be concise, helpful, and professional.
6. Do not mention these rules or that you are an AI unless directly asked.`;

/**
 * Build context string from Pinecone query matches.
 */
const buildContext = (matches) => {
  if (!matches || matches.length === 0) return '';

  return matches
    .filter((m) => m.score > 0.3) // Only include reasonably relevant chunks
    .map((m, i) => {
      const meta = m.metadata || {};
      return `[Context ${i + 1}] Document: "${meta.documentName || 'Unknown'}", Page: ${meta.pageApprox || 'N/A'}\n${meta.text || ''}`;
    })
    .join('\n\n---\n\n');
};

/**
 * Extract sources from Pinecone matches.
 */
const extractSources = (matches) => {
  const seen = new Set();
  const sources = [];

  for (const match of matches) {
    if (match.score < 0.3) continue;
    const meta = match.metadata || {};
    const key = `${meta.documentName}-${meta.pageApprox}`;
    if (!seen.has(key)) {
      seen.add(key);
      sources.push({
        documentName: meta.documentName || 'Unknown',
        page: meta.pageApprox || 0,
        confidence: Math.round((match.score || 0) * 100) / 100,
      });
    }
  }

  return sources;
};

/**
 * Full RAG pipeline: embed query → search Pinecone → build context → call LLM.
 * @param {string} query - User's question
 * @returns {Promise<{ answer: string, sources: Array<{documentName, page, confidence}> }>}
 */
export const chat = async (query) => {
  // Step 1: Embed the user's query
  const queryEmbedding = await embedText(query);

  // Step 2: Search Pinecone for relevant chunks
  const matches = await queryVectors(queryEmbedding, 5);

  // Step 3: Build context from top matches
  let context = buildContext(matches);
  let sources = extractSources(matches);

  // Step 4: Fallback to MongoDB text search if Pinecone yields no relevant results
  if (!context || context.trim() === '') {
    console.log(`🔍 No matches in Pinecone for "${query}". Falling back to MongoDB text search...`);
    try {
      // Find matches in MongoDB text index
      const mongoMatches = await Chunk.find({
        $text: { $search: query }
      }).limit(5).lean();

      if (mongoMatches && mongoMatches.length > 0) {
        console.log(`✅ Found ${mongoMatches.length} matching chunks in MongoDB`);
        context = mongoMatches
          .map((m, i) => `[Context ${i + 1}] Document: "${m.documentName || 'Unknown'}", Page: ${m.pageApprox || 'N/A'}\n${m.text || ''}`)
          .join('\n\n---\n\n');

        // Extract sources
        sources = mongoMatches.map((m) => ({
          documentName: m.documentName || 'Unknown',
          page: m.pageApprox || 0,
          confidence: 0.95, // High confidence for text match
        }));
      }
    } catch (mongoErr) {
      console.error('❌ MongoDB text search fallback error:', mongoErr.message);
    }
  }

  // Step 5: Build the prompt message
  let userMessage;
  if (context) {
    userMessage = `Document Context:\n${context}\n\nUser Question: ${query}`;
  } else {
    userMessage = `User Question: ${query}\n\nNote: No relevant document context was found.`;
  }

  // Step 6: Call LLM (Gemini with Groq Llama-3.3-70b fallback)
  let answer = '';
  try {
    const model = getModel();
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userMessage },
    ]);
    answer = result.response.text();
  } catch (err) {
    console.warn(`⚠️ Gemini chat generation failed: ${err.message}. Falling back to Groq Llama-3.3-70b.`);
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      answer = res.data.choices[0].message.content;
      console.log('✅ Groq Llama-3.3-70b fallback successful!');
    } catch (groqErr) {
      console.error(`❌ Both Gemini and Groq failed: ${groqErr.message}`);
      throw new Error(`AI generation failed: ${groqErr.message}`);
    }
  }

  return {
    answer,
    sources,
  };
};
