import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import AgentDashboard from '../components/dashboard/AgentDashboard';
import UserDashboard from '../components/dashboard/UserDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'agent':
        return <AgentDashboard user={user} />;
      case 'user':
        return <UserDashboard user={user} />;
      default:
        return <UserDashboard user={user} />;
    }
  };

  return renderDashboard();
};

export default Dashboard;