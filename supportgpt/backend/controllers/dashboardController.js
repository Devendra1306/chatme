import Document from '../models/Document.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// GET /api/dashboard
export const getDashboard = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // Build queries based on role
    const docQuery = isAdmin ? {} : { uploadedBy: req.user._id };
    const chatQuery = isAdmin ? {} : { userId: req.user._id };
    
    // For questions, find user chats first if not admin
    let questionQuery = { role: 'user' };
    if (!isAdmin) {
      const userChats = await Chat.find({ userId: req.user._id }).select('_id');
      const chatIds = userChats.map(c => c._id);
      questionQuery = { chatId: { $in: chatIds }, role: 'user' };
    }

    const [
      totalDocuments,
      totalChats,
      totalUsers,
      totalQuestions,
      recentDocuments,
      recentChats,
      recentUsers,
    ] = await Promise.all([
      Document.countDocuments(docQuery),
      Chat.countDocuments(chatQuery),
      isAdmin ? User.countDocuments() : Promise.resolve(1),
      Message.countDocuments(questionQuery),
      Document.find(docQuery)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Chat.find(chatQuery)
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      isAdmin
        ? User.find()
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean()
        : Promise.resolve([]),
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
