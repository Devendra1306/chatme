import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import Analytics from '../models/Analytics.js';
import { extractAndChunk } from '../services/pdfService.js';
import { embedBatch } from '../services/embeddingService.js';
import { upsertVectors, deleteDocumentVectors } from '../services/pineconeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Process a document: extract → save to MongoDB chunks → embed → upsert to Pinecone → update status.
 */
async function processDocument(doc, filePath, originalname, filename, docName) {
  try {
    console.log(`🔄 Processing: ${originalname}`);

    // 1. Extract text and split into chunks
    const { chunks, totalPages } = await extractAndChunk(filePath);
    console.log(`📄 Extracted ${chunks.length} chunks from ${totalPages} pages`);

    // 2. Save chunks to MongoDB for local text-search fallback
    const chunkDocs = chunks.map((c) => ({
      documentId: doc._id,
      documentName: docName,
      text: c.text,
      chunkIndex: c.chunkIndex,
      pageApprox: c.pageApprox,
    }));
    await Chunk.insertMany(chunkDocs);
    console.log(`💾 Saved ${chunkDocs.length} chunks to MongoDB`);

    // 3. Generate embeddings
    const texts = chunks.map((c) => c.text);
    const embeddings = await embedBatch(texts);

    // 4. Upsert to Pinecone
    const vectorIds = await upsertVectors(doc._id.toString(), chunks, embeddings, docName);
    console.log(`📌 Upserted ${vectorIds.length} vectors to Pinecone`);

    // 5. Update Document record to 'ready'
    await Document.findByIdAndUpdate(doc._id, {
      status: 'ready',
      chunkCount: chunks.length,
      pages: totalPages,
      pineconeIds: vectorIds,
      storedFilename: filename,
    });

    await Analytics.increment('uploads').catch(() => {});
    console.log(`✅ Document ready: ${originalname} (${chunks.length} chunks, ${totalPages} pages)`);
  } catch (procError) {
    console.error(`❌ Processing error for ${originalname}:`, procError.message);
    await Document.findByIdAndUpdate(doc._id, {
      status: 'error',
      storedFilename: filename,
    }).catch(() => {});
  }
}

// POST /api/documents/upload
export const uploadDocument = async (req, res, next) => {
  let doc = null;
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    filePath = req.file.path;
    const { originalname, filename, size } = req.file;
    const docName = path.parse(originalname).name;

    // Create Document record with 'processing' status
    doc = await Document.create({
      name: docName,
      originalName: originalname,
      size,
      uploadedBy: req.user._id,
      status: 'processing',
      storedFilename: filename,
    });

    // Respond immediately so client sees 'processing'
    res.status(202).json({
      success: true,
      message: 'Document uploaded. Processing started.',
      document: {
        _id: doc._id,
        name: doc.name,
        originalName: doc.originalName,
        size: doc.size,
        status: doc.status,
        pages: 0,
        uploadedBy: doc.uploadedBy,
        createdAt: doc.createdAt,
      },
    });

    // Process asynchronously after response is sent
    processDocument(doc, filePath, originalname, filename, docName);

  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (doc) {
      await Document.findByIdAndDelete(doc._id).catch(() => {});
    }
    next(error);
  }
};

// GET /api/documents
export const getAllDocuments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { uploadedBy: req.user._id };

    const documents = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, documents });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:id
export const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .lean();

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (
      req.user.role !== 'admin' &&
      doc.uploadedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, document: doc });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    if (
      req.user.role !== 'admin' &&
      doc.uploadedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Delete vectors from Pinecone
    if (doc.pineconeIds && doc.pineconeIds.length > 0) {
      await deleteDocumentVectors(doc._id.toString(), doc.pineconeIds).catch((err) => {
        console.warn('Pinecone delete warning:', err.message);
      });
    }

    // Delete chunks from MongoDB
    await Chunk.deleteMany({ documentId: doc._id }).catch((err) => {
      console.warn('MongoDB chunks delete warning:', err.message);
    });

    // Delete physical file
    const storedFile = doc.storedFilename;
    if (storedFile) {
      const filePath = path.join(uploadsDir, storedFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Document.findByIdAndDelete(doc._id);

    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
