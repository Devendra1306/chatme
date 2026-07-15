import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    pages: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['processing', 'ready', 'error'],
      default: 'processing',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    pineconeIds: {
      type: [String],
      default: [],
    },
    storedFilename: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;
