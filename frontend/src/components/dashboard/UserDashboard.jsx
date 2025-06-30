import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from '../ChatInterface';
import CreateChatModal from '../CreateChatModal';
import ActiveChatsModal from '../ActiveChatsModal';
import ChatHistoryModal from '../ChatHistoryModal';

const UserDashboard = ({ user }) => {
  const [myChats, setMyChats] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActiveChats, setShowActiveChats] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    pendingChats: 0,
    endedChats: 0
  });

  useEffect(() => {
    fetchMyChats();
  }, []);

  const fetchMyChats = async () => {
    try {
      const response = await axios.get('/api/chat/my-chats');
      if (response.data.success) {
        const chats = response.data.chats;
        setMyChats(chats);
        
        // Calculate stats
        const stats = {
          totalChats: chats.length,
          activeChats: chats.filter(chat => chat.status === 'active').length,
          pendingChats: chats.filter(chat => chat.status === 'pending').length,
          endedChats: chats.filter(chat => chat.status === 'ended').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatCreated = (newChat) => {
    setMyChats(prev => [newChat, ...prev]);
    setStats(prev => ({
      ...prev,
      totalChats: prev.totalChats + 1,
      pendingChats: prev.pendingChats + 1
    }));
    setSelectedChat(newChat._id);
    setShowChatModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'ended':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome, {user?.username}!
      </h1>
      
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Chats</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Chats</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeChats}</dd>
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
                  <span className="text-white font-bold text-sm">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ended</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.endedChats}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions - Now with working buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => setShowChatModal(true)}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Start New Chat
            </button>
            <button 
              onClick={() => setShowActiveChats(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Active Chats ({stats.activeChats})
            </button>
            <button 
              onClick={() => setShowChatHistory(true)}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Chat History
            </button>
          </div>
        </div>

        {/* Enhanced Recent Chats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Chats</h2>
          {myChats.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {myChats.slice(0, 5).map((chat) => (
                <div 
                  key={chat._id} 
                  className="border-l-4 border-blue-500 pl-4 cursor-pointer hover:bg-gray-50 p-3 rounded transition-colors"
                  onClick={() => setSelectedChat(chat._id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate pr-2">
                      {chat.subject}
                    </h3>
                    <span className={`text-xs capitalize whitespace-nowrap ${getStatusColor(chat.status)}`}>
                      {chat.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-1">
                    Agent: {chat.agent?.username || 'Unassigned'}
                  </div>
                  
                  {chat.lastMessage && (
                    <div className="text-xs text-gray-500 mb-2">
                      Last: {chat.lastMessage.content?.length > 60 
                        ? `${chat.lastMessage.content.substring(0, 60)}...`
                        : chat.lastMessage.content
                      }
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>
                      {chat.lastMessage 
                        ? getTimeSince(chat.lastMessage.createdAt)
                        : getTimeSince(chat.createdAt)
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-9.886 8a9.943 9.943 0 01-4.028-.838l-4.086 1.362 1.362-4.086A9.943 9.943 0 013 12C3 7.582 7.418 3 12 3s9 4.582 9 9z" />
              </svg>
              <p>No chats yet</p>
              <p className="text-sm mt-1">Start your first conversation!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Chat Modal */}
      {showChatModal && (
        <CreateChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          onChatCreated={handleChatCreated}
        />
      )}

      {/* Active Chats Modal */}
      {showActiveChats && (
        <ActiveChatsModal
          isOpen={showActiveChats}
          onClose={() => setShowActiveChats(false)}
          userRole="user"
          onChatSelect={setSelectedChat}
        />
      )}

      {/* Chat History Modal */}
      {showChatHistory && (
        <ChatHistoryModal
          isOpen={showChatHistory}
          onClose={() => setShowChatHistory(false)}
          userRole="user"
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

export default UserDashboard;