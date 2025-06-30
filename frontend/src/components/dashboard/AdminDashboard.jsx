import { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from '../ChatInterface';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalChats: 0,
    pendingChats: 0,
    activeChats: 0
  });
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const chatsPerPage = 10;

  useEffect(() => {
    fetchAdminStats();
    fetchAllChats();
  }, [currentPage, statusFilter]);

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChats = async () => {
    try {
      setChatsLoading(true);
      const params = {
        page: currentPage,
        limit: chatsPerPage
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await axios.get('/api/chat/all', { params });
      
      if (response.data.success) {
        setChats(response.data.chats);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/chat/${chatId}`);
      
      if (response.data.success) {
        setChats(prev => prev.filter(chat => chat._id !== chatId));
        if (selectedChat === chatId) {
          setSelectedChat(null);
        }
        fetchAdminStats();
        alert('Chat deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Error deleting chat');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredChats = chats.filter(chat => 
    chat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.agent?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Agents</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAgents}</dd>
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
                  <span className="text-white font-bold">U</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
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
                  <span className="text-white font-bold">C</span>
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
      </div>

      {/* All Chats Section */}
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">All Chats</h2>
            <div className="flex space-x-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search chats..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="p-6">
          {chatsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No chats found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-medium text-gray-900 mr-3">
                          {chat.subject}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Customer:</span> {chat.customer?.username || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Agent:</span> {chat.agent?.username || 'Unassigned'}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span> {formatDate(chat.createdAt)}
                        </p>
                        {chat.startedAt && (
                          <p>
                            <span className="font-medium">Started:</span> {formatDate(chat.startedAt)}
                          </p>
                        )}
                        {chat.endedAt && (
                          <p>
                            <span className="font-medium">Ended:</span> {formatDate(chat.endedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedChat(chat._id)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        View Messages
                      </button>
                      <button
                        onClick={() => handleDeleteChat(chat._id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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

export default AdminDashboard;