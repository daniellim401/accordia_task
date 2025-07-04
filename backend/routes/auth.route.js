import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser
} from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);

router.post('/login', loginUser);

router.get('/me', auth, getCurrentUser);

export default router;