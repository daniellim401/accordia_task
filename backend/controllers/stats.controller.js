import User from '../models/user.model.js';
import Chat from '../models/chat.model.js';

// Admin Stats Controller
export const getAdminStats = async (req, res) => {
  try {

    // Get total agents
    const totalAgents = await User.countDocuments({ role: 'agent' });
    
    // Get total users
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get total chats
    const totalChats = await Chat.countDocuments();
    
    // Get average rating
    const ratingAgg = await Chat.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = ratingAgg.length > 0 ? ratingAgg[0].avgRating : 0;

    // Get chat status counts
    const pendingChats = await Chat.countDocuments({ status: 'pending' });
    const activeChats = await Chat.countDocuments({ status: 'active' });
    const endedChats = await Chat.countDocuments({ status: 'ended' });

    // Get online agents
    const onlineAgents = await User.countDocuments({ 
      role: 'agent', 
      isActive: true 
    });

    res.json({
      totalAgents,
      totalUsers,
      totalChats,
      avgRating,
      pendingChats,
      activeChats,
      endedChats,
      onlineAgents
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Agent Stats Controller
export const getAgentStats = async (req, res) => {
  try {
    // Role check removed - handled by middleware

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get my chats today
    const myChatsToday = await Chat.countDocuments({
      agent: req.user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get my active chats
    const myActiveChats = await Chat.countDocuments({
      agent: req.user._id,
      status: 'active'
    });

    // Get my total chats
    const myTotalChats = await Chat.countDocuments({
      agent: req.user._id
    });

    // Get my average rating
    const myRatingAgg = await Chat.aggregate([
      { $match: { agent: req.user._id, rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const myAvgRating = myRatingAgg.length > 0 ? myRatingAgg[0].avgRating : 0;

    // Get pending chats in queue
    const pendingChats = await Chat.countDocuments({ status: 'pending' });

    res.json({
      myChatsToday,
      myActiveChats,
      myTotalChats,
      myAvgRating,
      pendingChats
    });
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Chats Controller
export const getUserChats = async (req, res) => {
  try {
    // Role check removed - handled by middleware

    // Get user's chats
    const myChats = await Chat.find({ customer: req.user._id })
      .populate('agent', 'username')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(myChats);
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Stats Controller
export const getUserStats = async (req, res) => {
  try {
    // Role check removed - handled by middleware

    // Get user's total chats
    const myTotalChats = await Chat.countDocuments({ customer: req.user._id });

    // Get user's active chats
    const myActiveChats = await Chat.countDocuments({
      customer: req.user._id,
      status: 'active'
    });

    // Get user's pending chats
    const myPendingChats = await Chat.countDocuments({
      customer: req.user._id,
      status: 'pending'
    });

    // Get user's ended chats
    const myEndedChats = await Chat.countDocuments({
      customer: req.user._id,
      status: 'ended'
    });

    // Get user's average rating given
    const myRatingAgg = await Chat.aggregate([
      { $match: { customer: req.user._id, rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const myAvgRating = myRatingAgg.length > 0 ? myRatingAgg[0].avgRating : 0;

    res.json({
      myTotalChats,
      myActiveChats,
      myPendingChats,
      myEndedChats,
      myAvgRating
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};