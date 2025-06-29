import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectMongoDB from './db/connectMongoDB.js';

// Import routes
import authRoutes from './routes/auth.route.js';

dotenv.config();

const app = express();

// Connect to MongoDB
connectMongoDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});