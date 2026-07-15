/**
 * RAG Document Chunker
 * Splits documents into overlapping chunks with metadata preservation
 * Handles markdown, paragraphs, code blocks, headers
 */

import { v4 as uuidv4 } from 'uuid';

// Chunk configuration
const CHUNK_SIZE = 512;       // Target tokens per chunk (approx 4 chars/token)
const CHUNK_OVERLAP = 50;     // Overlap tokens between chunks
const CHARS_PER_TOKEN = 4;    // Approximate chars per token for estimation
const MIN_CHUNK_SIZE = 50;    // Minimum tokens for a valid chunk

const MAX_CHARS = CHUNK_SIZE * CHARS_PER_TOKEN;
const OVERLAP_CHARS = CHUNK_OVERLAP * CHARS_PER_TOKEN;
const MIN_CHARS = MIN_CHUNK_SIZE * CHARS_PER_TOKEN;

/**
 * Main chunking function — recursively splits documents into overlapping chunks
 * @param {string} text - Full document text
 * @param {object} metadata - Source metadata (source, page, section, etc.)
 * @returns {Array<{id: string, content: string, metadata: object}>}
 */
export function chunkDocument(text, metadata = {}) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanedText = cleanText(text);
  if (cleanedText.length < MIN_CHARS) {
    // Document too small — return as single chunk
    return [{
      id: generateChunkId(metadata.source, 0),
      content: cleanedText,
      metadata: {
        ...metadata,
        chunkIndex: 0,
        totalChunks: 1,
        tokens: estimateTokens(cleanedText),
        startChar: 0,
        endChar: cleanedText.length,
      },
    }];
  }

  // Determine chunking strategy based on content type
  let rawChunks;
  if (isMarkdown(cleanedText)) {
    rawChunks = chunkMarkdown(cleanedText);
  } else {
    rawChunks = chunkByParagraphs(cleanedText);
  }

  // Merge small chunks and split large ones
  const balancedChunks = balanceChunks(rawChunks);

  // Add overlap and metadata
  const finalChunks = addOverlapAndMetadata(balancedChunks, metadata);

  console.log(`[Chunker] Document '${metadata.source || 'unknown'}' → ${finalChunks.length} chunks`);
  return finalChunks;
}

/**
 * Chunk markdown text using headers as natural boundaries
 */
function chunkMarkdown(text) {
  const lines = text.split('\n');
  const sections = [];
  let currentSection = '';
  let currentHeader = '';

  for (const line of lines) {
    if (isMarkdownHeader(line)) {
      // Save current section
      if (currentSection.trim().length > 0) {
        sections.push({ content: currentSection.trim(), header: currentHeader });
      }
      currentHeader = line.trim();
      currentSection = line + '\n';
    } else {
      currentSection += line + '\n';
    }
  }

  // Push last section
  if (currentSection.trim().length > 0) {
    sections.push({ content: currentSection.trim(), header: currentHeader });
  }

  // If no markdown headers found, fall back to paragraph chunking
  if (sections.length <= 1) {
    return chunkByParagraphs(text);
  }

  return sections.map((s) => s.content);
}

/**
 * Chunk text by paragraphs (double newlines)
 */
function chunkByParagraphs(text) {
  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  // Also split on sentence boundaries if paragraphs are very long
  const chunks = [];
  for (const para of paragraphs) {
    if (para.length > MAX_CHARS * 2) {
      // Split long paragraph by sentences
      const sentences = splitBySentences(para);
      chunks.push(...sentences);
    } else {
      chunks.push(para.trim());
    }
  }

  return chunks;
}

/**
 * Split text into sentences
 */
function splitBySentences(text) {
  // Split on sentence-ending punctuation followed by space and capital letter
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Balance chunks: merge small chunks, split large ones
 */
function balanceChunks(rawChunks) {
  const balanced = [];
  let buffer = '';

  for (const chunk of rawChunks) {
    const combined = buffer ? `${buffer}\n\n${chunk}` : chunk;

    if (combined.length <= MAX_CHARS) {
      buffer = combined;
    } else {
      // Buffer is full — save it
      if (buffer.length >= MIN_CHARS) {
        balanced.push(buffer);
      }

      // If the new chunk itself is too large, split it
      if (chunk.length > MAX_CHARS) {
        const subChunks = splitLargeChunk(chunk);
        balanced.push(...subChunks.slice(0, -1));
        buffer = subChunks[subChunks.length - 1] || '';
      } else {
        buffer = chunk;
      }
    }
  }

  if (buffer.length >= MIN_CHARS) {
    balanced.push(buffer);
  } else if (buffer.length > 0 && balanced.length > 0) {
    // Append remaining buffer to last chunk
    balanced[balanced.length - 1] += '\n\n' + buffer;
  }

  return balanced.filter((c) => c.trim().length >= MIN_CHARS);
}

/**
 * Split a large chunk into smaller pieces
 */
function splitLargeChunk(text) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + MAX_CHARS;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to break at a word boundary
    const breakPoint = text.lastIndexOf(' ', end);
    if (breakPoint > start + MIN_CHARS) {
      end = breakPoint;
    }

    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + MIN_CHARS, end - OVERLAP_CHARS);
  }

  return chunks.filter((c) => c.trim().length >= MIN_CHARS);
}

/**
 * Add overlap context and metadata to chunks
 */
function addOverlapAndMetadata(chunks, metadata) {
  const result = [];

  for (let i = 0; i < chunks.length; i++) {
    let content = chunks[i];

    // Add overlap from previous chunk
    if (i > 0 && OVERLAP_CHARS > 0) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-OVERLAP_CHARS);
      // Only add overlap if it's not already at the start
      if (!content.startsWith(overlapText.trim())) {
        content = overlapText.trim() + ' ' + content;
      }
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < MIN_CHARS) continue;

    // Calculate character offsets
    const startChar = metadata.startOffset || 0;
    const endChar = startChar + trimmedContent.length;

    result.push({
      id: generateChunkId(metadata.source, i),
      content: trimmedContent,
      metadata: {
        source: metadata.source || 'unknown',
        page: metadata.page || null,
        section: extractSection(trimmedContent),
        chunkIndex: i,
        totalChunks: chunks.length,
        tokens: estimateTokens(trimmedContent),
        startChar,
        endChar,
        ...Object.fromEntries(
          Object.entries(metadata).filter(([k]) =>
            !['source', 'page', 'startOffset'].includes(k)
          )
        ),
      },
    });
  }

  return result;
}

/**
 * Generate a stable chunk ID based on source and index
 */
function generateChunkId(source = 'doc', index = 0) {
  // Use a hash-like approach: source-name + index + random for uniqueness
  const sanitizedSource = (source || 'doc')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  return `${sanitizedSource}_chunk_${index}_${uuidv4().split('-')[0]}`;
}

/**
 * Extract the section heading from chunk content
 */
function extractSection(text) {
  const firstLine = text.split('\n')[0].trim();
  if (isMarkdownHeader(firstLine)) {
    return firstLine.replace(/^#+\s*/, '').trim();
  }
  // Return first 60 chars as section hint
  return firstLine.substring(0, 60);
}

/**
 * Check if text contains markdown headers
 */
function isMarkdown(text) {
  return /^#{1,6}\s+.+/m.test(text) || /\*\*.+\*\*/.test(text) || /\[.+\]\(.+\)/.test(text);
}

function isMarkdownHeader(line) {
  return /^#{1,6}\s+/.test(line);
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')         // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\t/g, '    ')          // Tabs to spaces
    .replace(/[ \t]+\n/g, '\n')      // Trailing spaces
    .replace(/\n{4,}/g, '\n\n\n')   // Limit blank lines
    .trim();
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars for English)
 */
function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export default { chunkDocument };
