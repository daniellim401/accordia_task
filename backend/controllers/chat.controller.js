import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { notifyNewChat } from '../socket.js';

// User: Create new chat
export const createChat = async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only users can create chats' 
      });
    }

    const { subject } = req.body;

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    const newChat = new Chat({
      customer: req.user._id,
      subject: subject.trim(),
      status: 'pending'
    });

    await newChat.save();
    await newChat.populate('customer', 'username email');

    // Notify agents about new pending chat
    notifyNewChat({
      _id: newChat._id,
      chatId: newChat._id,
      subject: newChat.subject,
      customer: newChat.customer,
      customerName: newChat.customer.username,
      createdAt: newChat.createdAt,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      chat: newChat
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// User: Get user's chat with filtering enabled
export const getUserChats = async (req, res) => {
  try {
    const { status } = req.query; 
    const query = { customer: req.user._id }; 
    
    if (status) { 
      query.status = status;
    }

    const chats = await Chat.find(query) 
      .populate('agent', 'username')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Agent: Get agent's chat with filtering enabled
export const getAgentChats = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can access this endpoint'
      });
    }

    const { status } = req.query; 
    const query = { agent: req.user._id }; 
    
    if (status) { 
      query.status = status;
    }

    const chats = await Chat.find(query) 
      .populate('customer', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Error fetching agent chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Agent: Get pending chats (newly created chats by users)
export const getPendingChats = async (req, res) => {
  try {
    if (req.user.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Only agents can access pending chats'
      });
    }

    const pendingChats = await Chat.find({ status: 'pending' })
      .populate('customer', 'username email')
      .sort({ createdAt: 1 }); // Oldest first

    res.json({
      success: true,
      chats: pendingChats
    });
  } catch (error) {
    console.error('Error fetching pending chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// All: Check the messages of a chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Check if user has access to this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check authorization
    const isCustomer = chat.customer?.toString() === req.user._id.toString();
    const isAgent = chat.agent?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isAgent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
      chat
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Get All Chats
export const getAllChats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const chats = await Chat.find(query)
      .populate('customer', 'username email')
      .populate('agent', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments(query);

    res.json({
      success: true,
      chats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all chats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Admin: Delete chat
export const deleteChat = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { chatId } = req.params;

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Delete all messages associated with this chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({
      success: true,
      message: 'Chat and all associated messages deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};