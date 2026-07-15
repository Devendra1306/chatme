/**
 * RAG Generator Service
 * Generates responses using Gemini 2.5 Flash with context injection
 * Falls back to Grok if Gemini fails
 * Supports both streaming and non-streaming responses
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROK_MODEL = 'llama-3.3-70b-versatile'; // Best available Groq model

// Default system prompt for customer support
const DEFAULT_SYSTEM_PROMPT = `You are SupportGPT, a highly knowledgeable and empathetic AI customer support assistant.

Your role is to:
- Answer customer questions accurately using the provided knowledge context
- Be concise, friendly, and professional
- Always cite your sources when referencing specific documentation
- Admit when you don't know something rather than guessing
- Escalate to a human agent when the issue is complex or the customer is frustrated

Response format:
- Use clear, structured responses with bullet points when listing steps
- Use [Source: document_name] to cite sources
- Keep responses under 400 words unless detailed explanation is needed`;

/**
 * Generate a complete response (non-streaming)
 * @param {string} query - User's question
 * @param {Array<{content, metadata}>} context - Retrieved knowledge chunks
 * @param {Array<{role, content}>} history - Conversation history
 * @param {string} systemPrompt - Custom system prompt
 * @returns {Promise<{response, model, tokens, latency, citations}>}
 */
export async function generateResponse(query, context = [], history = [], systemPrompt = null) {
  const startTime = Date.now();
  const prompt = buildPrompt(systemPrompt || DEFAULT_SYSTEM_PROMPT, context, history, query);

  // Try Gemini first
  try {
    const result = await callGemini(prompt, false);
    const latency = Date.now() - startTime;

    return {
      response: result.text,
      model: GEMINI_MODEL,
      tokens: result.tokens,
      latency,
      citations: extractCitationsFromContext(context),
      provider: 'gemini',
    };
  } catch (geminiErr) {
    console.warn(`[Generator] Gemini failed: ${geminiErr.message}. Falling back to Grok...`);

    // Fallback to Grok (Groq)
    try {
      const result = await callGrok(prompt);
      const latency = Date.now() - startTime;

      return {
        response: result.text,
        model: GROK_MODEL,
        tokens: result.tokens,
        latency,
        citations: extractCitationsFromContext(context),
        provider: 'grok',
      };
    } catch (grokErr) {
      console.error(`[Generator] Both Gemini and Grok failed. Grok error: ${grokErr.message}`);
      throw new Error(`AI generation failed: ${geminiErr.message}`);
    }
  }
}

/**
 * Generate a streaming response (returns AsyncGenerator)
 * @param {string} query
 * @param {Array} context
 * @param {Array} history
 * @param {string} systemPrompt
 * @yields {string} Token chunks
 * @returns {AsyncGenerator}
 */
export async function* generateResponseStream(query, context = [], history = [], systemPrompt = null) {
  const prompt = buildPrompt(systemPrompt || DEFAULT_SYSTEM_PROMPT, context, history, query);

  let usedFallback = false;
  let streamResult;

  // Try Gemini streaming
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    streamResult = await model.generateContentStream(prompt);

    let fullText = '';
    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        yield { type: 'token', content: chunkText, model: GEMINI_MODEL };
      }
    }

    // Yield metadata at the end
    const finalResponse = await streamResult.response;
    yield {
      type: 'done',
      model: GEMINI_MODEL,
      tokens: {
        prompt: finalResponse.usageMetadata?.promptTokenCount || 0,
        completion: finalResponse.usageMetadata?.candidatesTokenCount || 0,
        total: finalResponse.usageMetadata?.totalTokenCount || 0,
      },
      citations: extractCitationsFromContext(context),
      provider: 'gemini',
    };

    return;
  } catch (geminiErr) {
    console.warn(`[Generator] Gemini streaming failed: ${geminiErr.message}. Falling back to Grok...`);
    usedFallback = true;
  }

  // Fallback: Grok streaming via Groq OpenAI-compatible API
  if (usedFallback) {
    try {
      const messages = buildGrokMessages(systemPrompt || DEFAULT_SYSTEM_PROMPT, context, history, query);

      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body;
      let buffer = '';
      let totalTokens = 0;

      for await (const chunk of reader) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              yield { type: 'token', content, model: GROK_MODEL };
              totalTokens++;
            }
          } catch (_parseErr) {
            // Skip malformed SSE lines
          }
        }
      }

      yield {
        type: 'done',
        model: GROK_MODEL,
        tokens: { total: totalTokens },
        citations: extractCitationsFromContext(context),
        provider: 'grok',
      };
    } catch (grokErr) {
      console.error(`[Generator] Grok streaming also failed: ${grokErr.message}`);
      yield {
        type: 'error',
        message: 'Both AI providers failed. Please try again later.',
      };
    }
  }
}

/**
 * Call Gemini API (non-streaming)
 */
async function callGemini(prompt, stream = false) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  return {
    text,
    tokens: {
      prompt: response.usageMetadata?.promptTokenCount || 0,
      completion: response.usageMetadata?.candidatesTokenCount || 0,
      total: response.usageMetadata?.totalTokenCount || 0,
    },
  };
}

/**
 * Call Grok (Groq) API (non-streaming)
 */
async function callGrok(prompt) {
  const messages = [{ role: 'user', content: prompt }];

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};

  return {
    text,
    tokens: {
      prompt: usage.prompt_tokens || 0,
      completion: usage.completion_tokens || 0,
      total: usage.total_tokens || 0,
    },
  };
}

/**
 * Build the RAG prompt with context injection
 */
function buildPrompt(systemPrompt, context, history, query) {
  let contextSection = '';

  if (context && context.length > 0) {
    contextSection = '\n\n--- KNOWLEDGE BASE CONTEXT ---\n';
    context.forEach((chunk, idx) => {
      const source = chunk.metadata?.source || chunk.metadata?.documentName || 'Knowledge Base';
      const page = chunk.metadata?.page ? ` (Page ${chunk.metadata.page})` : '';
      contextSection += `\n[${idx + 1}] Source: ${source}${page}\n${chunk.content}\n`;
    });
    contextSection += '\n--- END CONTEXT ---\n';
    contextSection += '\nInstructions: Use the above context to answer the question. Cite sources using [Source: name] format. If the context does not contain the answer, say so and answer from your general knowledge with a clear disclaimer.\n';
  } else {
    contextSection = '\n[No specific knowledge base context available. Answer from general knowledge with appropriate disclaimers.]\n';
  }

  // Build conversation history
  let historySection = '';
  if (history && history.length > 0) {
    historySection = '\n--- CONVERSATION HISTORY ---\n';
    const recentHistory = history.slice(-10); // Last 10 exchanges
    for (const msg of recentHistory) {
      historySection += `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}\n`;
    }
    historySection += '--- END HISTORY ---\n';
  }

  return `${systemPrompt}${contextSection}${historySection}\nCustomer: ${query}\n\nAssistant:`;
}

/**
 * Build messages array for Grok/OpenAI-style API
 */
function buildGrokMessages(systemPrompt, context, history, query) {
  const messages = [{ role: 'system', content: systemPrompt }];

  // Add context as system context
  if (context && context.length > 0) {
    let contextText = 'KNOWLEDGE BASE CONTEXT:\n';
    context.forEach((chunk, idx) => {
      const source = chunk.metadata?.source || 'Knowledge Base';
      contextText += `\n[${idx + 1}] ${source}: ${chunk.content}\n`;
    });
    messages.push({ role: 'system', content: contextText });
  }

  // Add conversation history
  if (history && history.length > 0) {
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
  }

  // Add current query
  messages.push({ role: 'user', content: query });

  return messages;
}

/**
 * Extract citation objects from context chunks
 */
function extractCitationsFromContext(context) {
  if (!context || context.length === 0) return [];

  return context.map((chunk) => ({
    source: chunk.metadata?.source || chunk.metadata?.documentName || 'Knowledge Base',
    chunk: chunk.content?.substring(0, 300),
    score: chunk.score || chunk.finalScore || chunk.rerankScore || 0,
    page: chunk.metadata?.page || null,
    section: chunk.metadata?.section || null,
    vectorId: chunk.id || null,
  }));
}

export default { generateResponse, generateResponseStream };
