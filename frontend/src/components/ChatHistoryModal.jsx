import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Search, Calendar, Filter, MessageCircle, Clock, User, CheckCircle, XCircle } from 'lucide-react';

const ChatHistoryModal = ({ isOpen, onClose, userRole = 'user', onChatSelect }) => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const chatsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen, userRole]);

  useEffect(() => {
    filterChats();
  }, [chats, searchTerm, statusFilter, dateFilter]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = userRole === 'agent' 
        ? '/api/chat//my-agent-chats'  // Agent's chat history
        : '/api/chat/my-chats';  // User's chat history
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setChats(response.data.chats || []);
      } else {
        setError('Failed to fetch chat history');
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Error loading chat history');
    } finally {
      setLoading(false);
    }
  };

  const filterChats = () => {
    let filtered = [...chats];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(chat => 
        chat.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userRole === 'agent' && chat.customer?.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (userRole === 'user' && chat.agent?.username?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(chat => chat.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(chat => new Date(chat.createdAt) >= filterDate);
      }
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredChats(filtered);
    setCurrentPage(1);
  };

  const handleChatClick = (chatId) => {
    onChatSelect(chatId);
    onClose();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <MessageCircle size={16} className="text-green-500" />;
      case 'completed':
        return <CheckCircle size={16} className="text-blue-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <MessageCircle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const chatDate = new Date(date);
    const diffInDays = Math.floor((now - chatDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return chatDate.toLocaleDateString();
    }
  };

  // Pagination
  const indexOfLastChat = currentPage * chatsPerPage;
  const indexOfFirstChat = indexOfLastChat - chatsPerPage;
  const currentChats = filteredChats.slice(indexOfFirstChat, indexOfLastChat);
  const totalPages = Math.ceil(filteredChats.length / chatsPerPage);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl h-5/6 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Chat History ({filteredChats.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">
              {error}
            </div>
          ) : currentChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Chats Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? "No chats match your current filters."
                  : "You don't have any chat history yet."
                }
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {currentChats.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => handleChatClick(chat._id)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          {getStatusIcon(chat.status)}
                          <h3 className="font-medium text-gray-900 ml-2">
                            {chat.subject}
                          </h3>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User size={16} className="mr-1" />
                          <span>
                            {userRole === 'agent' 
                              ? `Customer: ${chat.customer?.username || 'Unknown'}`
                              : `Agent: ${chat.agent?.username || 'Unassigned'}`
                            }
                          </span>
                        </div>
                        
                        {chat.lastMessage && (
                          <div className="text-sm text-gray-500 mb-2">
                            <span className="font-medium">Last message: </span>
                            {chat.lastMessage.content?.length > 150 
                              ? `${chat.lastMessage.content.substring(0, 150)}...`
                              : chat.lastMessage.content
                            }
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end text-xs text-gray-500 ml-4">
                        <span className={`px-2 py-1 rounded-full font-medium mb-2 capitalize ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </span>
                        <span>{getTimeSince(chat.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Started: {new Date(chat.createdAt).toLocaleString()}</span>
                      {chat.completedAt && (
                        <span>Completed: {new Date(chat.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <span className="text-sm text-gray-700">
              Showing {indexOfFirstChat + 1} to {Math.min(indexOfLastChat, filteredChats.length)} of {filteredChats.length} chats
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
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

export default ChatHistoryModal;