import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ChatInterface = ({ chatId, onClose }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [typing, setTyping] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (chatId && socket) {
      // Join chat room
      socket.emit('joinChat', chatId);
      
      // Fetch chat messages
      fetchMessages();

      // Listen for new messages
      socket.on('newMessage', handleNewMessage);
      socket.on('chatEnded', handleChatEnded);
      socket.on('userTyping', handleUserTyping);
      socket.on('chatAccepted', handleChatAccepted);

      return () => {
        socket.emit('leaveChat', chatId);
        socket.off('newMessage', handleNewMessage);
        socket.off('chatEnded', handleChatEnded);
        socket.off('userTyping', handleUserTyping);
        socket.off('chatAccepted', handleChatAccepted);
      };
    }
  }, [chatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/${chatId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
        setChatInfo(response.data.chat);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleChatEnded = (data) => {
    setChatInfo(prev => ({ ...prev, status: 'ended' }));
    // Show system message
    const systemMessage = {
      _id: `system_${Date.now()}`,
      content: data.message,
      senderType: 'system',
      createdAt: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleChatAccepted = (data) => {
    setChatInfo(prev => ({ ...prev, status: 'active' }));
    const systemMessage = {
      _id: `system_${Date.now()}`,
      content: data.message,
      senderType: 'system',
      createdAt: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleUserTyping = (data) => {
    if (data.userName !== user.username) {
      if (data.isTyping) {
        setTyping(`${data.userName} is typing...`);
      } else {
        setTyping('');
      }
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket && chatInfo?.status !== 'ended') {
      socket.emit('sendMessage', {
        chatId,
        content: newMessage.trim()
      });
      setNewMessage('');
      // Stop typing indicator
      socket.emit('stopTyping', { chatId });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Typing indicator
    if (socket) {
      socket.emit('typing', { chatId });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stopTyping', { chatId });
      }, 1000);
    }
  };

  const endChat = () => {
    if (socket) {
      socket.emit('endChat', chatId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white border rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">
            {chatInfo?.subject || 'Chat'}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className={`inline-block w-2 h-2 rounded-full ${
              chatInfo?.status === 'active' ? 'bg-green-500' : 
              chatInfo?.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <span className="capitalize">{chatInfo?.status}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          {chatInfo?.status === 'active' && (
            <button
              onClick={endChat}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              End Chat
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${
              message.senderType === 'system' ? 'justify-center' :
              message.senderName === user.username ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.senderType === 'system' ? (
              <div className="text-center text-gray-500 text-sm italic">
                {message.content}
              </div>
            ) : (
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderName === user.username
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {message.senderName} • {formatTime(message.createdAt)}
                </div>
                <div>{message.content}</div>
              </div>
            )}
          </div>
        ))}
        
        {typing && (
          <div className="flex justify-start">
            <div className="text-gray-500 text-sm italic">{typing}</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {chatInfo?.status !== 'ended' && (
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={chatInfo?.status === 'pending' && user.role === 'user'}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || (chatInfo?.status === 'pending' && user.role === 'user')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          {chatInfo?.status === 'pending' && user.role === 'user' && (
            <div className="mt-2 text-sm text-yellow-600">
              Waiting for an agent to join the chat...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;