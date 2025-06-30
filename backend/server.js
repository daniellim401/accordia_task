import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import connectMongoDB from './db/connectMongoDB.js';
import { initializeSocket } from './socket.js';

// Import routes
import authRoutes from './routes/auth.route.js';
import statsRoutes from './routes/stats.route.js';
import chatRoutes from './routes/chat.route.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatRoutes);

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});