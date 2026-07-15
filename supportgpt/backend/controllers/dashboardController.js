import Document from '../models/Document.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// GET /api/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const [
      totalDocuments,
      totalChats,
      totalUsers,
      totalQuestions,
      recentDocuments,
      recentChats,
      recentUsers,
    ] = await Promise.all([
      Document.countDocuments(),
      Chat.countDocuments(),
      User.countDocuments(),
      Message.countDocuments({ role: 'user' }),
      Document.find()
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Chat.find()
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      dashboard: {
        totalDocuments,
        totalChats,
        totalUsers,
        totalQuestions,
        recentDocuments,
        recentChats,
        recentUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};
