import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MessageCircle, Clock, User } from 'lucide-react';

const ActiveChatsModal = ({ isOpen, onClose, userRole = 'user', onChatSelect }) => {
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchActiveChats();
    }
  }, [isOpen, userRole]);

  const fetchActiveChats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = userRole === 'agent' 
        ? '/api/chat/my-agent-chats?status=active'  // Agent's assigned active chats
        : '/api/chat/my-chats?status=active';  // User's active chats
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setActiveChats(response.data.chats || []);
      } else {
        setError('Failed to fetch active chats');
      }
    } catch (error) {
      console.error('Error fetching active chats:', error);
      setError('Error loading active chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId) => {
    onChatSelect(chatId);
    onClose();
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffInHours = Math.floor((now - chatDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - chatDate) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Active Chats ({activeChats.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              {error}
            </div>
          ) : activeChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Chats</h3>
              <p className="text-gray-500">
                {userRole === 'agent' 
                  ? "You don't have any active chats assigned at the moment."
                  : "You don't have any active chats right now."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleChatClick(chat._id)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {chat.subject}
                      </h3>
                      {userRole === 'agent' ? (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User size={16} className="mr-1" />
                          <span>Customer: {chat.customer?.username || 'Unknown'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User size={16} className="mr-1" />
                          <span>Agent: {chat.agent?.username || 'Unassigned'}</span>
                        </div>
                      )}
                      
                      {chat.lastMessage && (
                        <div className="text-sm text-gray-500 mb-2">
                          <span className="font-medium">Last message: </span>
                          {chat.lastMessage.content?.length > 100 
                            ? `${chat.lastMessage.content.substring(0, 100)}...`
                            : chat.lastMessage.content
                          }
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end text-xs text-gray-500 ml-4">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium mb-2">
                        Active
                      </span>
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        <span>
                          {chat.lastMessage 
                            ? getTimeSince(chat.lastMessage.createdAt)
                            : getTimeSince(chat.createdAt)
                          }
                        </span>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Started: {new Date(chat.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveChatsModal;