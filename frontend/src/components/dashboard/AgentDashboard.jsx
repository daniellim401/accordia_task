import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import ChatInterface from '../ChatInterface';
import ActiveChatsModal from '../ActiveChatsModal';
import ChatHistoryModal from '../ChatHistoryModal';

const AgentDashboard = ({ user }) => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    myChatsToday: 0,
    myActiveChats: 0,
    pendingChats: 0
  });
  const [pendingChats, setPendingChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showActiveChats, setShowActiveChats] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);

  useEffect(() => {
    fetchAgentStats();
    fetchPendingChats();
  }, []);

  useEffect(() => {
    if (socket) {
      // Listen for new pending chats
      socket.on('newPendingChat', (chatData) => {
        setPendingChats(prev => [chatData, ...prev]);
        setStats(prev => ({ ...prev, pendingChats: prev.pendingChats + 1 }));
      });

      // Listen for chats being taken by other agents
      socket.on('chatTaken', ({ chatId }) => {
        setPendingChats(prev => prev.filter(chat => chat._id !== chatId));
        setStats(prev => ({ ...prev, pendingChats: Math.max(0, prev.pendingChats - 1) }));
      });

      // Listen for successful chat acceptance
      socket.on('chatAcceptedSuccess', ({ chatId }) => {
        setPendingChats(prev => prev.filter(chat => chat._id !== chatId));
        setSelectedChat(chatId);
        fetchAgentStats(); // Refresh stats
      });

      socket.on('error', (error) => {
        alert(error.message);
      });

      return () => {
        socket.off('newPendingChat');
        socket.off('chatTaken');
        socket.off('chatAcceptedSuccess');
        socket.off('error');
      };
    }
  }, [socket]);

  const fetchAgentStats = async () => {
    try {
      const response = await axios.get('/api/stats/agent');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingChats = async () => {
    try {
      const response = await axios.get('/api/chat/pending');
      if (response.data.success) {
        setPendingChats(response.data.chats);
      }
    } catch (error) {
      console.error('Error fetching pending chats:', error);
    }
  };

  const handleAcceptChat = (chatId) => {
    if (socket) {
      socket.emit('acceptChat', chatId);
    }
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffInMinutes = Math.floor((now - chatDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}d ago`;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome back, {user?.username}!
      </h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">My Chats Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.myChatsToday}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Chats</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.myActiveChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Queue</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingChats.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => {
                if (pendingChats.length > 0) {
                  handleAcceptChat(pendingChats[0]._id);
                }
              }}
              disabled={pendingChats.length === 0}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Accept Next Chat ({pendingChats.length})
            </button>
            <button 
              onClick={() => setShowActiveChats(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View My Active Chats ({stats.myActiveChats})
            </button>
            <button 
              onClick={() => setShowChatHistory(true)}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Chat History
            </button>
          </div>
        </div>

        {/* Pending Chats Only */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Pending Chats</h2>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
              {pendingChats.length}
            </span>
          </div>

          {pendingChats.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {pendingChats.map((chat) => (
                <div key={chat._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {chat.subject}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1">
                        Customer: {chat.customer?.username || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getTimeSince(chat.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAcceptChat(chat._id)}
                      className="ml-4 bg-green-600 text-white px-4 py-2 text-sm rounded hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9.886 8a9.943 9.943 0 01-4.028-.838l-4.086 1.362 1.362-4.086A9.943 9.943 0 013 12C3 7.582 7.418 3 12 3s9 4.582 9 9z" />
              </svg>
              <div className="text-sm font-medium">No pending chats</div>
              <div className="text-xs mt-1">All caught up! 🎉</div>
            </div>
          )}
        </div>
      </div>

      {/* Active Chats Modal */}
      {showActiveChats && (
        <ActiveChatsModal
          isOpen={showActiveChats}
          onClose={() => setShowActiveChats(false)}
          userRole="agent"
          onChatSelect={setSelectedChat}
        />
      )}

      {/* Chat History Modal */}
      {showChatHistory && (
        <ChatHistoryModal
          isOpen={showChatHistory}
          onClose={() => setShowChatHistory(false)}
          userRole="agent"
          onChatSelect={setSelectedChat}
        />
      )}

      {/* Chat Interface Modal */}
      {selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 mx-4">
            <ChatInterface
              chatId={selectedChat}
              onClose={() => setSelectedChat(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;