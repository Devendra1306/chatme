import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        documentName: { type: String, default: '' },
        page: { type: Number, default: 0 },
        confidence: { type: Number, default: 0 },
      },
    ],
    tokens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
