import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalChats: 0,
    pendingChats: 0,
    activeChats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get('/api/stats/admin');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
      
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">User Management</h2>
          <div className="space-y-3">
            <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
              Manage Users
            </button>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Add New Agent
            </button>
            <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              System Settings
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Chat Management</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Chats:</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {stats.pendingChats || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Chats:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {stats.activeChats || 0}
              </span>
            </div>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              View All Chats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;