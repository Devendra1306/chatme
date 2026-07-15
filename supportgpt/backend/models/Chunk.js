import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    documentName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    pageApprox: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create a text index for full-text search fallback
chunkSchema.index({ text: 'text' });

const Chunk = mongoose.model('Chunk', chunkSchema);

export default Chunk;
