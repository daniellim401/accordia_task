import express from 'express';
import { requireAdmin, requireAgent, requireUser } from '../middleware/auth.js';
import {
  getAdminStats,
  getAgentStats,
  getUserChats,
  getUserStats
} from '../controllers/stats.controller.js';

const router = express.Router();

// Admin Routes - Only admins can access
router.get('/admin', requireAdmin, getAdminStats);

// Agent Routes - Only agents can access
router.get('/agent', requireAgent, getAgentStats);

// User Routes - Only users can access
router.get('/user/chats', requireUser, getUserChats);
router.get('/user', requireUser, getUserStats);

export default router;