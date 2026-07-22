import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Analytics from '../models/Analytics.js';
import { chat as ragChat } from '../services/ragService.js';

// POST /api/chat
export const createChat = async (req, res, next) => {
  try {
    const { title } = req.body;

    const newChat = await Chat.create({
      title: title || 'New Chat',
      userId: req.user._id,
    });

    res.status(201).json({ success: true, chat: newChat });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/history
export const getHistory = async (req, res, next) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    res.json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/:id/messages
export const getMessages = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (chat.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const messages = await Message.find({ chatId: req.params.id }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// POST /api/chat/:id/message
export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (chat.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Save the user message
    const userMessage = await Message.create({
      chatId: chat._id,
      role: 'user',
      content: content.trim(),
    });

    // Call RAG pipeline
    let answer = '';
    let sources = [];

    try {
      const ragResult = await ragChat(content.trim(), req.user._id, req.user.role);
      answer = ragResult.answer;
      sources = ragResult.sources;
    } catch (ragError) {
      console.error('RAG error:', ragError.message);
      answer = "I'm sorry, I encountered an error while processing your question. Please try again.";
      sources = [];
    }

    // Save the assistant message
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: answer,
      sources,
    });

    // Update chat: set title from first message, update updatedAt and messageCount
    const isFirstMessage = chat.messageCount === 0;
    const updateData = {
      updatedAt: new Date(),
      $inc: { messageCount: 2 }, // user + assistant
    };

    if (isFirstMessage) {
      // Use first 60 chars of the user's message as the chat title
      updateData.title = content.trim().slice(0, 60) + (content.trim().length > 60 ? '…' : '');
    }

    await Chat.findByIdAndUpdate(chat._id, updateData);

    // Track question in analytics
    await Analytics.increment('questions').catch(() => {});

    res.json({
      success: true,
      message: assistantMessage,
      sources,
      userMessage,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/chat/:id
export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (chat.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Delete all messages in this chat
    await Message.deleteMany({ chatId: chat._id });

    // Delete the chat
    await Chat.findByIdAndDelete(chat._id);

    res.json({ success: true, message: 'Chat deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/chat/:id/rename
export const renameChat = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (chat.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chat._id,
      { title: title.trim().slice(0, 200) },
      { new: true }
    );

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    next(error);
  }
};
