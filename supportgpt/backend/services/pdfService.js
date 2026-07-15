import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Clean raw text extracted from PDF.
 */
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
};

/**
 * Split text into overlapping chunks of approximately CHUNK_SIZE characters.
 */
const splitIntoChunks = (text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at a sentence boundary
    if (end < text.length) {
      const breakpoints = ['. ', '.\n', '! ', '? ', '\n\n'];
      let breakFound = false;
      for (const bp of breakpoints) {
        const breakIndex = text.lastIndexOf(bp, end);
        if (breakIndex > start + chunkSize * 0.5) {
          end = breakIndex + bp.length;
          breakFound = true;
          break;
        }
      }
      if (!breakFound) {
        // Fall back to word boundary
        const spaceIndex = text.lastIndexOf(' ', end);
        if (spaceIndex > start + chunkSize * 0.5) {
          end = spaceIndex + 1;
        }
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText.length > 50) {
      // Skip tiny fragments
      chunks.push(chunkText);
    }

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
};

/**
 * Estimate the approximate page number for a chunk based on its position.
 */
const estimatePage = (chunkIndex, totalChunks, totalPages) => {
  if (!totalPages || totalPages === 0) return 1;
  return Math.max(1, Math.ceil((chunkIndex / totalChunks) * totalPages));
};

/**
 * Extract text from a PDF file and split it into chunks.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<Array<{ text: string, chunkIndex: number, pageApprox: number }>>}
 */
export const extractAndChunk = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);

  const data = await pdfParse(dataBuffer);

  const rawText = data.text;
  const totalPages = data.numpages || 1;

  const cleaned = cleanText(rawText);

  if (!cleaned || cleaned.length < 10) {
    throw new Error('No readable text found in the PDF.');
  }

  const chunkTexts = splitIntoChunks(cleaned, CHUNK_SIZE, CHUNK_OVERLAP);

  const chunks = chunkTexts.map((text, index) => ({
    text,
    chunkIndex: index,
    pageApprox: estimatePage(index, chunkTexts.length, totalPages),
  }));

  return { chunks, totalPages };
};
