/**
 * KnowledgeBase Model
 * Stores knowledge base articles that are also embedded into Pinecone
 */

import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [100000, 'Content cannot exceed 100000 characters'],
    },
    // Excerpt for list views
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    author: {
      uid: { type: String, required: true },
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    // Usage statistics
    views: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
    // Pinecone vector reference
    vectorId: {
      type: String,
      default: null, // Pinecone vector ID for this article
    },
    namespace: {
      type: String,
      default: 'knowledge-base',
      index: true,
    },
    // Related article IDs
    relatedArticles: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'KnowledgeBase',
      default: [],
    },
    // Content versioning
    version: {
      type: Number,
      default: 1,
    },
    // Last content review
    lastReviewed: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    // SEO / search
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // Featured article (shown on dashboard)
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Reading time in minutes
    readingTimeMinutes: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
knowledgeBaseSchema.index({ category: 1, status: 1 });
knowledgeBaseSchema.index({ tags: 1, status: 1 });
knowledgeBaseSchema.index({ views: -1 });
knowledgeBaseSchema.index({ createdAt: -1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' }); // Full-text search

// Virtual: helpfulness ratio
knowledgeBaseSchema.virtual('helpfulnessRatio').get(function () {
  const total = this.helpful + this.notHelpful;
  if (total === 0) return null;
  return Math.round((this.helpful / total) * 100);
});

// Pre-save: auto-generate slug from title
knowledgeBaseSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }

  // Auto-calculate reading time (avg 200 words/min)
  if (this.isModified('content') && this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTimeMinutes = Math.ceil(wordCount / 200);
  }

  // Auto-generate excerpt from content
  if (this.isModified('content') && !this.excerpt && this.content) {
    const plainText = this.content.replace(/[#*`\[\]]/g, '').trim();
    this.excerpt = plainText.substring(0, 300);
    if (plainText.length > 300) this.excerpt += '...';
  }

  next();
});

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
