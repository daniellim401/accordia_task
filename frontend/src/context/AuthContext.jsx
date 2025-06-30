import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Check if user was previously logged in
      const token = localStorage.getItem('token');

      if (token) {
        // 2. Set up axios to include token in all request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 3. Try to get user data from localStorage first
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // 4. Double check with server that token is still valid
        try {
          const response = await axios.get('/api/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // If token is invalid, clear everything
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      // 1. send credentials to server
      const response = await axios.post('/api/auth/login', { 
        username: username.trim(), 
        password 
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        // 2. Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // 3. Set default authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // 4. Update state (triggers re-render)
        setUser(userData);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.response?.data?.message) {
        return { 
          success: false, 
          message: error.response.data.message 
        };
      } else if (error.response?.status === 400) {
        return { 
          success: false, 
          message: 'Invalid username or password' 
        };
      } else if (error.response?.status >= 500) {
        return { 
          success: false, 
          message: 'Server error. Please try again later.' 
        };
      } else {
        return { 
          success: false, 
          message: 'Network error. Please check your connection.' 
        };
      }
    }
  };

  const register = async (username, email, password, role = 'user') => {
    try {
      const response = await axios.post('/api/auth/register', { 
        username: username.trim(), 
        email: email.trim(), 
        password,
        role 
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(userData);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error types
      if (error.response?.data?.message) {
        return { 
          success: false, 
          message: error.response.data.message 
        };
      } else if (error.response?.status === 400) {
        return { 
          success: false, 
          message: 'Invalid registration data' 
        };
      } else if (error.response?.status >= 500) {
        return { 
          success: false, 
          message: 'Server error. Please try again later.' 
        };
      } else {
        return { 
          success: false, 
          message: 'Network error. Please check your connection.' 
        };
      }
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear state
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};