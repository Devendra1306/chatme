/**
 * Conversation Memory Service
 * Manages conversation history in MongoDB for RAG context
 */

import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const MAX_HISTORY_MESSAGES = 20; // Max messages to load for context
const CONTEXT_WINDOW_MESSAGES = 10; // Messages to include in LLM context

/**
 * ConversationMemory class — manages per-session conversation state
 */
export class ConversationMemory {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this._cache = null; // In-memory cache for this request
  }

  /**
   * Load last N messages from MongoDB for a session
   * @param {number} limit - Max messages to load
   * @returns {Promise<Array<{role, content, createdAt}>>}
   */
  async load(limit = MAX_HISTORY_MESSAGES) {
    try {
      // Find conversation by sessionId
      const conversation = await Conversation.findOne(
        { sessionId: this.sessionId },
        { messages: 1 }
      );

      if (!conversation || !conversation.messages.length) {
        this._cache = [];
        return [];
      }

      // Get last N message IDs
      const messageIds = conversation.messages.slice(-limit);

      // Fetch messages
      const messages = await Message.find(
        { _id: { $in: messageIds } },
        { role: 1, content: 1, createdAt: 1, confidence: 1, model: 1 }
      ).sort({ createdAt: 1 });

      this._cache = messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        confidence: m.confidence,
        model: m.model,
      }));

      return this._cache;
    } catch (err) {
      console.error(`[Memory] Failed to load session ${this.sessionId}:`, err.message);
      this._cache = [];
      return [];
    }
  }

  /**
   * Save a message to MongoDB (linked to conversation)
   * @param {object} messageData - Message fields
   * @returns {Promise<Message>} - Saved message document
   */
  async save(messageData) {
    try {
      // Find or create conversation
      let conversation = await Conversation.findOne({ sessionId: this.sessionId });

      if (!conversation) {
        conversation = new Conversation({
          sessionId: this.sessionId,
          userId: messageData.userId || 'anonymous',
          title: 'New Conversation',
          status: 'active',
          metadata: {
            channel: 'web',
            namespace: messageData.namespace || 'default',
          },
        });
        await conversation.save();
      }

      // Create message
      const message = new Message({
        conversationId: conversation._id,
        role: messageData.role,
        content: messageData.content,
        citations: messageData.citations || [],
        confidence: messageData.confidence || null,
        model: messageData.model || null,
        tokens: messageData.tokens || {},
        latency: messageData.latency || null,
        isStreamed: messageData.isStreamed || false,
        evaluation: messageData.evaluation || {},
        metadata: {
          sessionId: this.sessionId,
          namespace: messageData.namespace || 'default',
        },
      });

      await message.save();

      // Update conversation
      await conversation.addMessage(message._id, messageData.content, messageData.role);

      // Update cache
      if (this._cache) {
        this._cache.push({
          role: message.role,
          content: message.content,
          createdAt: message.createdAt,
        });
      }

      return message;
    } catch (err) {
      console.error(`[Memory] Failed to save message for session ${this.sessionId}:`, err.message);
      throw err;
    }
  }

  /**
   * Get formatted conversation history for LLM context window
   * @returns {Promise<Array<{role, content}>>}
   */
  async getSummary() {
    const messages = this._cache || await this.load();

    // Return last CONTEXT_WINDOW_MESSAGES messages in LLM-friendly format
    return messages
      .slice(-CONTEXT_WINDOW_MESSAGES)
      .filter((m) => m.role !== 'system') // Exclude system messages from context
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));
  }

  /**
   * Clear all messages for this session (soft delete — archives conversation)
   */
  async clear() {
    try {
      await Conversation.findOneAndUpdate(
        { sessionId: this.sessionId },
        { status: 'archived', 'lastMessage.content': null }
      );
      this._cache = [];
      console.log(`[Memory] Cleared session: ${this.sessionId}`);
    } catch (err) {
      console.error(`[Memory] Failed to clear session ${this.sessionId}:`, err.message);
    }
  }

  /**
   * Get conversation statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    try {
      const conversation = await Conversation.findOne(
        { sessionId: this.sessionId },
        { messageCount: 1, createdAt: 1, updatedAt: 1, status: 1, rating: 1 }
      );

      if (!conversation) return null;

      return {
        messageCount: conversation.messageCount,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        status: conversation.status,
        rating: conversation.rating,
        sessionId: this.sessionId,
      };
    } catch (err) {
      console.error(`[Memory] Failed to get stats for session ${this.sessionId}:`, err.message);
      return null;
    }
  }
}

/**
 * Static helper: load messages for a session without class instantiation
 * @param {string} sessionId
 * @param {number} limit
 */
export async function loadSessionHistory(sessionId, limit = CONTEXT_WINDOW_MESSAGES) {
  const memory = new ConversationMemory(sessionId);
  return memory.load(limit);
}

/**
 * Static helper: get formatted summary for a session
 * @param {string} sessionId
 */
export async function getSessionSummary(sessionId) {
  const memory = new ConversationMemory(sessionId);
  return memory.getSummary();
}

export default { ConversationMemory, loadSessionHistory, getSessionSummary };
