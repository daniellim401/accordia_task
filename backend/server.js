import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectMongoDB from './db/connectMongoDB.js';

// Import routes
import authRoutes from './routes/auth.route.js';
// import agentRoutes from './routes/agents.js';
// import callRoutes from './routes/calls.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectMongoDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/agents', agentRoutes);
// app.use('/api/calls', callRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});