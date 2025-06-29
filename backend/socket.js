import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';

let io;

// Store connected users
const connectedUsers = new Map();

// Initialize Socket.IO
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173", // Vite default
        process.env.CLIENT_URL
      ].filter(Boolean), 
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.IO Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userRole})`);
    
    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      role: socket.userRole,
      name: socket.userName
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);
    
    // If agent, join agents room
    if (socket.userRole === 'agent') {
      socket.join('agents');
      // Notify other agents that this agent is online
      socket.to('agents').emit('agentOnline', {
        agentId: socket.userId,
        agentName: socket.userName
      });
    }

    // If admin, join admin room
    if (socket.userRole === 'admin') {
      socket.join('admins');
    }

    // Join specific chat room
    socket.on('joinChat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`${socket.userName} joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`${socket.userName} left chat ${chatId}`);
    });

    // Handle new message
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, content } = data;
        
        // Create message in database
        const Message = (await import('./models/message.model.js')).default;
        const newMessage = new Message({
          chat: chatId,
          senderName: socket.userName,
          senderType: socket.userRole === 'agent' ? 'agent' : 'customer',
          content
        });
        
        await newMessage.save();

        // Emit to all users in the chat room
        io.to(`chat_${chatId}`).emit('newMessage', {
          _id: newMessage._id,
          chat: chatId,
          senderName: socket.userName,
          senderType: newMessage.senderType,
          content,
          createdAt: newMessage.createdAt
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle agent accepting chat
    socket.on('acceptChat', async (chatId) => {
      try {
        if (socket.userRole !== 'agent') {
          return socket.emit('error', { message: 'Only agents can accept chats' });
        }

        const Chat = (await import('./models/chat.model.js')).default;
        const chat = await Chat.findById(chatId).populate('customer', 'username email');
        
        if (!chat || chat.status !== 'pending') {
          return socket.emit('error', { message: 'Chat not available or already taken' });
        }

        // Update chat
        chat.agent = socket.userId;
        chat.status = 'active';
        chat.startedAt = new Date();
        await chat.save();

        // Join agent to chat room
        socket.join(`chat_${chatId}`);

        // Notify customer that agent joined
        socket.to(`chat_${chatId}`).emit('chatAccepted', {
          chatId,
          agentName: socket.userName,
          message: `${socket.userName} has joined the chat`
        });

        // Notify other agents that chat is taken
        socket.to('agents').emit('chatTaken', { chatId });

        // Confirm to the accepting agent
        socket.emit('chatAcceptedSuccess', { 
          chatId,
          chat: {
            _id: chat._id,
            subject: chat.subject,
            customer: chat.customer,
            status: chat.status,
            startedAt: chat.startedAt
          }
        });

        console.log(`Agent ${socket.userName} accepted chat ${chatId}`);

      } catch (error) {
        console.error('Error accepting chat:', error);
        socket.emit('error', { message: 'Failed to accept chat' });
      }
    });

    // Handle ending chat
    socket.on('endChat', async (chatId) => {
      try {
        const Chat = (await import('./models/chat.model.js')).default;
        const chat = await Chat.findById(chatId);
        
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }

        // Only customer or assigned agent can end chat
        if (chat.customer.toString() !== socket.userId && 
            chat.agent?.toString() !== socket.userId) {
          return socket.emit('error', { message: 'Unauthorized to end this chat' });
        }

        chat.status = 'ended';
        chat.endedAt = new Date();
        await chat.save();

        // Notify all users in chat
        io.to(`chat_${chatId}`).emit('chatEnded', {
          chatId,
          endedBy: socket.userName,
          message: 'Chat has been ended'
        });

      } catch (error) {
        console.error('Error ending chat:', error);
        socket.emit('error', { message: 'Failed to end chat' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`chat_${data.chatId}`).emit('userTyping', {
        userName: socket.userName,
        isTyping: true
      });
    });

    socket.on('stopTyping', (data) => {
      socket.to(`chat_${data.chatId}`).emit('userTyping', {
        userName: socket.userName,
        isTyping: false
      });
    });

    // Handle new chat notification
    socket.on('newChatCreated', (chatData) => {
      // Notify all agents about new pending chat
      socket.to('agents').emit('newPendingChat', chatData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName}`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // If agent, notify other agents
      if (socket.userRole === 'agent') {
        socket.to('agents').emit('agentOffline', {
          agentId: socket.userId,
          agentName: socket.userName
        });
      }
    });
  });

  return io;
};

// Helper functions to emit events from controllers
export const notifyNewChat = (chatData) => {
  if (io) {
    io.to('agents').emit('newPendingChat', chatData);
  }
};

export const notifyAgents = (event, data) => {
  if (io) {
    io.to('agents').emit(event, data);
  }
};

export const notifyUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const notifyChat = (chatId, event, data) => {
  if (io) {
    io.to(`chat_${chatId}`).emit(event, data);
  }
};

// Get connected users info
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

export const getOnlineAgents = () => {
  return Array.from(connectedUsers.values()).filter(user => user.role === 'agent');
};

export default { initializeSocket, notifyNewChat, notifyAgents, notifyUser, notifyChat };