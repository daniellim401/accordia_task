import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderType: {
    type: String,
    enum: ['customer', 'agent'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);