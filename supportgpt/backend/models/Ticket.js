/**
 * Ticket Model
 * Support ticket management with timeline, comments, and SLA tracking
 */

import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    // e.g. 'created', 'assigned', 'status_changed', 'escalated', 'resolved', 'commented'
  },
  by: {
    uid: { type: String },
    name: { type: String },
    role: { type: String },
  },
  at: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: null,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null, // { from: ..., to: ... }
  },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: [5000, 'Comment cannot exceed 5000 characters'],
  },
  author: {
    uid: { type: String },
    name: { type: String },
    role: { type: String },
    photoURL: { type: String, default: null },
  },
  isInternal: {
    type: Boolean,
    default: false, // Internal notes not visible to customer
  },
  attachments: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const slaSchema = new mongoose.Schema({
  dueAt: { type: Date, default: null },
  firstResponseAt: { type: Date, default: null },
  resolutionDueAt: { type: Date, default: null },
  isBreached: { type: Boolean, default: false },
  breachedAt: { type: Date, default: null },
}, { _id: false });

const ticketSchema = new mongoose.Schema(
  {
    // Auto-generated: T-0001, T-0002, etc.
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed', 'escalated'],
      default: 'open',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    category: {
      type: String,
      default: 'general',
      index: true,
    },
    subcategory: {
      type: String,
      default: null,
    },
    // Ticket creator
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    userEmail: {
      type: String,
      default: null,
    },
    userName: {
      type: String,
      default: null,
    },
    // Assigned agent
    assignedTo: {
      uid: { type: String, default: null },
      name: { type: String, default: null },
      email: { type: String, default: null },
      assignedAt: { type: Date, default: null },
    },
    department: {
      type: String,
      default: null,
      index: true,
    },
    // Audit trail
    timeline: {
      type: [timelineEntrySchema],
      default: [],
    },
    // Comments/replies
    comments: {
      type: [commentSchema],
      default: [],
    },
    // AI-generated suggestions for resolution
    aiSuggestions: {
      type: [String],
      default: [],
    },
    // AI summary of the ticket
    aiSummary: {
      type: String,
      default: null,
    },
    // How the ticket was resolved
    resolution: {
      content: { type: String, default: null },
      resolvedBy: { type: String, default: null },
      resolvedByName: { type: String, default: null },
    },
    sla: {
      type: slaSchema,
      default: () => ({}),
    },
    tags: {
      type: [String],
      default: [],
    },
    // Linked conversation
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    // Customer satisfaction score after resolution
    csat: {
      score: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null },
      submittedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
ticketSchema.index({ userId: 1, status: 1 });
ticketSchema.index({ 'assignedTo.uid': 1, status: 1 });
ticketSchema.index({ priority: 1, status: 1 });
ticketSchema.index({ department: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ tags: 1 });
ticketSchema.index({ title: 'text', description: 'text' }); // Full-text search

// Auto-generate ticket number before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      const lastTicket = await this.constructor.findOne(
        {},
        { ticketNumber: 1 },
        { sort: { createdAt: -1 } }
      );

      let nextNum = 1;
      if (lastTicket?.ticketNumber) {
        const lastNum = parseInt(lastTicket.ticketNumber.replace('T-', ''), 10);
        nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
      }

      this.ticketNumber = `T-${String(nextNum).padStart(4, '0')}`;
    } catch (err) {
      return next(err);
    }
  }

  // Record status changes in timeline
  if (!this.isNew && this.isModified('status')) {
    this.timeline.push({
      action: 'status_changed',
      at: new Date(),
      changes: { to: this.status },
    });

    if (this.status === 'resolved') {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed') {
      this.closedAt = new Date();
    }
  }

  next();
});

// Virtual: is overdue
ticketSchema.virtual('isOverdue').get(function () {
  if (!this.sla?.dueAt || ['resolved', 'closed'].includes(this.status)) return false;
  return new Date() > this.sla.dueAt;
});

// Virtual: age in hours
ticketSchema.virtual('ageHours').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
