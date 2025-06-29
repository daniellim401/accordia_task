import express from 'express';
import auth, { requireUser, requireAgent, requireAdmin } from '../middleware/auth.js';
import {
  createChat,
  getUserChats,
  getAgentChats,
  getPendingChats,
  getChatMessages,
  getAllChats
} from '../controllers/chat.controller.js';

const router = express.Router();

// User routes
router.post('/create', requireUser, createChat);
router.get('/my-chats', requireUser, getUserChats);

// Agent routes
router.get('/my-agent-chats', requireAgent, getAgentChats);
router.get('/pending', requireAgent, getPendingChats);

// Shared routes (user, agent, admin can access)
router.get('/:chatId/messages', auth, getChatMessages);

// Admin routes
router.get('/all', requireAdmin, getAllChats);

export default router;