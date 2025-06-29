import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import connectMongoDB from './db/connectMongoDB.js';
import { initializeSocket } from './socket.js';

// Import routes
import authRoutes from './routes/auth.route.js';
import statsRoutes from './routes/stats.route.js';
import chatRoutes from './routes/chat.route.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Connect to MongoDB
connectMongoDB();

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173", 
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});