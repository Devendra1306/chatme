import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
