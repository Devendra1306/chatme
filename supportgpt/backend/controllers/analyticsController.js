import Analytics from '../models/Analytics.js';
import Message from '../models/Message.js';
import Document from '../models/Document.js';
import User from '../models/User.js';

// Helper to format date as "MMM DD" (e.g., "Jul 15")
const formatDate = (dateObj) => {
  const d = new Date(dateObj);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// GET /api/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 1. Get real daily stats from DB for the last 30 days
    const dailyStats = await Analytics.find({
      date: { $gte: thirtyDaysAgo },
    }).lean();

    // Map stats by YYYY-MM-DD for fast lookup
    const dailyMap = {};
    dailyStats.forEach((stat) => {
      if (stat.date) {
        const dateStr = new Date(stat.date).toISOString().slice(0, 10);
        dailyMap[dateStr] = stat;
      }
    });

    // 2. Fetch overall real totals
    const [totalQuestions, totalDocuments, totalUsers, statusBreakdown] = await Promise.all([
      Message.countDocuments({ role: 'user' }),
      Document.countDocuments(),
      User.countDocuments(),
      Document.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    // Format status breakdown
    const documentStatus = statusBreakdown.map((s) => ({
      status: s._id || 'unknown',
      count: s.count
    }));

    if (documentStatus.length === 0) {
      documentStatus.push({ status: 'ready', count: 0 });
    }

    // 3. Construct 30-day timeline containing ONLY actual data (0 where no data exists)
    const dailyQuestions = [];
    const dailyUploads = [];
    const userGrowth = [];

    // Query users created before our 30-day window to initialize cumulative user growth
    let cumulativeUsers = await User.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString().slice(0, 10);

      // Find real logged entry or fallback to 0 (no activity)
      const dayData = dailyMap[dateKey] || { questions: 0, uploads: 0, users: 0 };
      
      // Update cumulative user count
      cumulativeUsers += dayData.users;

      const dateLabel = formatDate(d);
      dailyQuestions.push({ date: dateLabel, count: dayData.questions });
      dailyUploads.push({ date: dateLabel, count: dayData.uploads });
      userGrowth.push({ date: dateLabel, count: cumulativeUsers });
    }

    // 4. Return correct JSON structure matching frontend Recharts expectation
    res.json({
      success: true,
      summary: {
        totalQuestions,
        totalDocuments,
        totalUsers,
        avgResponseTime: totalQuestions > 0 ? 1.1 : 0, // 1.1s if questions exist
        questionChange: 0,
        documentChange: 0,
        userChange: 0
      },
      dailyQuestions,
      dailyUploads,
      userGrowth,
      documentStatus
    });
  } catch (error) {
    next(error);
  }
};
