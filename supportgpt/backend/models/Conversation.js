/**
 * Conversation Model
 * Stores chat sessions between users and the AI
 */

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      unique: true,
      index: true,
    },
    userId: {
      type: String, // Firebase UID
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    // References to Message documents
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    // AI-generated conversation summary
    summary: {
      type: String,
      default: null,
      maxlength: [2000, 'Summary cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'escalated'],
      default: 'active',
      index: true,
    },
    // If escalated to a human agent
    assignedAgent: {
      uid: { type: String, default: null },
      name: { type: String, default: null },
      assignedAt: { type: Date, default: null },
    },
    department: {
      type: String,
      default: null,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Session metadata
    metadata: {
      userAgent: { type: String, default: null },
      channel: {
        type: String,
        enum: ['web', 'mobile', 'api', 'widget', 'email'],
        default: 'web',
      },
      ipAddress: { type: String, default: null },
      namespace: { type: String, default: null }, // Pinecone namespace used
      language: { type: String, default: 'en' },
    },
    // Denormalized for quick access
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      content: { type: String, default: null },
      role: { type: String, default: null },
      at: { type: Date, default: null },
    },
    // Satisfaction rating
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: null },
      ratedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, createdAt: -1 });
conversationSchema.index({ 'assignedAgent.uid': 1 });
conversationSchema.index({ tags: 1 });
conversationSchema.index({ department: 1, status: 1 });

// Virtual: is escalated
conversationSchema.virtual('isEscalated').get(function () {
  return this.status === 'escalated';
});

// Method: add a message reference
conversationSchema.methods.addMessage = async function (messageId, content, role) {
  this.messages.push(messageId);
  this.messageCount += 1;
  this.lastMessage = {
    content: content?.substring(0, 200),
    role,
    at: new Date(),
  };
  return this.save();
};

// Pre-save: auto-generate title from first user message if still default
conversationSchema.pre('save', function (next) {
  if (this.isModified('lastMessage') && this.title === 'New Conversation' && this.lastMessage?.content) {
    // Generate title from first message content
    this.title = this.lastMessage.content.substring(0, 80).trim();
    if (this.lastMessage.content.length > 80) {
      this.title += '...';
    }
  }
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
