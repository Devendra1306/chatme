/**
 * File Processor Service
 * Extracts text from PDF, DOCX, XLSX, TXT, CSV, MD files
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Dynamic imports for optional heavy dependencies
let pdfParse;
let mammoth;
let xlsx;

async function loadPdfParse() {
  if (!pdfParse) {
    const mod = await import('pdf-parse/lib/pdf-parse.js');
    pdfParse = mod.default || mod;
  }
  return pdfParse;
}

async function loadMammoth() {
  if (!mammoth) {
    const mod = await import('mammoth');
    mammoth = mod.default || mod;
  }
  return mammoth;
}

async function loadXlsx() {
  if (!xlsx) {
    const mod = await import('xlsx');
    xlsx = mod.default || mod;
  }
  return xlsx;
}

/**
 * Main extraction function — routes to appropriate extractor based on MIME type
 * @param {string} filePath - Absolute path to the file
 * @param {string} mimeType - File MIME type
 * @param {string} originalName - Original filename for type detection fallback
 * @returns {Promise<{text: string, pageCount: number|null, metadata: object}>}
 */
export async function extractText(filePath, mimeType, originalName = '') {
  if (!existsSync(filePath)) {
    throw new Error(`[FileProcessor] File not found: ${filePath}`);
  }

  const ext = path.extname(originalName || filePath).toLowerCase();

  console.log(`[FileProcessor] Extracting text from: ${originalName || filePath} (${mimeType})`);

  try {
    // Route by MIME type or extension
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      return await extractPDF(filePath);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      ext === '.docx' || ext === '.doc'
    ) {
      return await extractDOCX(filePath);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel' ||
      ext === '.xlsx' || ext === '.xls'
    ) {
      return await extractXLSX(filePath);
    }

    if (mimeType === 'text/csv' || mimeType === 'application/csv' || ext === '.csv') {
      return await extractCSV(filePath);
    }

    if (
      mimeType === 'text/plain' ||
      mimeType === 'text/markdown' ||
      mimeType === 'text/x-markdown' ||
      ext === '.txt' || ext === '.md' || ext === '.text'
    ) {
      return await extractTXT(filePath);
    }

    // Default: try as plain text
    console.warn(`[FileProcessor] Unknown MIME type '${mimeType}', attempting plain text extraction`);
    return await extractTXT(filePath);
  } catch (err) {
    console.error(`[FileProcessor] Extraction failed for ${filePath}: ${err.message}`);
    throw new Error(`Text extraction failed: ${err.message}`);
  }
}

/**
 * Extract text from PDF using pdf-parse
 * @param {string} filePath
 * @returns {Promise<{text, pageCount, metadata}>}
 */
export async function extractPDF(filePath) {
  const pdfParseLib = await loadPdfParse();
  const dataBuffer = readFileSync(filePath);

  const data = await pdfParseLib(dataBuffer, {
    // Custom page renderer to preserve structure
    pagerender: (pageData) => {
      return pageData.getTextContent({ normalizeWhitespace: true }).then((textContent) => {
        let text = '';
        let lastY = null;

        for (const item of textContent.items) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            text += '\n';
          }
          text += item.str;
          lastY = item.transform[5];
        }

        return text;
      });
    },
  });

  const cleanedText = cleanExtractedText(data.text);

  return {
    text: cleanedText,
    pageCount: data.numpages || null,
    metadata: {
      pdfVersion: data.info?.PDFFormatVersion,
      author: data.info?.Author,
      title: data.info?.Title,
      subject: data.info?.Subject,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      wordCount: cleanedText.split(/\s+/).length,
    },
  };
}

/**
 * Extract text from DOCX using mammoth
 * @param {string} filePath
 * @returns {Promise<{text, pageCount, metadata}>}
 */
export async function extractDOCX(filePath) {
  const mammothLib = await loadMammoth();
  const dataBuffer = readFileSync(filePath);

  // Extract as markdown to preserve some structure
  const result = await mammothLib.extractRawText({ buffer: dataBuffer });

  // Also try to get markdown for better structure
  let markdownText = '';
  try {
    const mdResult = await mammothLib.convertToMarkdown({ buffer: dataBuffer });
    markdownText = mdResult.value;
  } catch (_err) {
    // Markdown conversion failed — use raw text
  }

  const text = markdownText || result.value;
  const cleanedText = cleanExtractedText(text);

  return {
    text: cleanedText,
    pageCount: null, // DOCX doesn't expose page count easily
    metadata: {
      wordCount: cleanedText.split(/\s+/).length,
      warnings: result.messages?.map((m) => m.message).slice(0, 5) || [],
    },
  };
}

/**
 * Extract text from XLSX/XLS using xlsx library
 * @param {string} filePath
 * @returns {Promise<{text, pageCount, metadata}>}
 */
export async function extractXLSX(filePath) {
  const xlsxLib = await loadXlsx();
  const workbook = xlsxLib.readFile(filePath, {
    cellText: true,
    cellDates: true,
  });

  const sheetNames = workbook.SheetNames;
  let fullText = '';

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    fullText += `\n## Sheet: ${sheetName}\n`;

    // Convert sheet to CSV-like text
    const csvText = xlsxLib.utils.sheet_to_csv(sheet, {
      skipHidden: true,
      blankrows: false,
    });

    // Convert CSV rows to readable text
    const rows = csvText.split('\n').filter((row) => row.trim() && row !== ','.repeat(row.split(',').length - 1));
    fullText += rows.join('\n') + '\n';
  }

  const cleanedText = cleanExtractedText(fullText);

  return {
    text: cleanedText,
    pageCount: sheetNames.length, // Use sheet count as "pages"
    metadata: {
      sheetNames,
      sheetCount: sheetNames.length,
      wordCount: cleanedText.split(/\s+/).length,
    },
  };
}

/**
 * Extract text from CSV file
 * @param {string} filePath
 * @returns {Promise<{text, pageCount, metadata}>}
 */
export async function extractCSV(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter((l) => l.trim());

  // Get headers from first line
  const headers = lines[0]?.split(',').map((h) => h.replace(/"/g, '').trim()) || [];

  // Convert to readable text: each row becomes a sentence
  let text = `Data columns: ${headers.join(', ')}\n\n`;

  for (let i = 1; i < Math.min(lines.length, 1000); i++) {
    const values = lines[i].split(',').map((v) => v.replace(/"/g, '').trim());
    const rowText = headers.map((h, idx) => `${h}: ${values[idx] || ''}`).join(', ');
    text += rowText + '\n';
  }

  if (lines.length > 1000) {
    text += `\n[Note: File contains ${lines.length - 1} rows; showing first 1000]`;
  }

  const cleanedText = cleanExtractedText(text);

  return {
    text: cleanedText,
    pageCount: 1,
    metadata: {
      rowCount: lines.length - 1, // Exclude header
      columnCount: headers.length,
      headers,
      wordCount: cleanedText.split(/\s+/).length,
    },
  };
}

/**
 * Extract text from plain text or markdown files
 * @param {string} filePath
 * @returns {Promise<{text, pageCount, metadata}>}
 */
export async function extractTXT(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const cleanedText = cleanExtractedText(content);

  return {
    text: cleanedText,
    pageCount: 1,
    metadata: {
      encoding: 'utf8',
      wordCount: cleanedText.split(/\s+/).length,
      lineCount: content.split('\n').length,
      isMarkdown: /^#{1,6}\s+/m.test(content),
    },
  };
}

/**
 * Clean and normalize extracted text
 */
function cleanExtractedText(text) {
  if (!text) return '';

  return text
    .replace(/\r\n/g, '\n')          // Normalize line endings
    .replace(/\r/g, '\n')
    .replace(/\x00/g, '')             // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
    .replace(/\t/g, '  ')             // Tabs to spaces
    .replace(/[ \t]+\n/g, '\n')       // Trailing whitespace
    .replace(/\n{4,}/g, '\n\n\n')    // Limit consecutive blank lines
    .trim();
}

export default { extractText, extractPDF, extractDOCX, extractXLSX, extractCSV, extractTXT };
