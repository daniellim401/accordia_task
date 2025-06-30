// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineAgents, setOnlineAgents] = useState([]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      
      // Socket URL - actual production URL or localhost in development
      const socketURL = process.env.NODE_ENV === 'production' 
        ? 'https://accordia-task.onrender.com' 
        : 'http://localhost:5001';
      
      // Create socket connection
      const newSocket = io(socketURL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
      });

      // Agent online/offline tracking
      newSocket.on('agentOnline', (data) => {
        setOnlineAgents(prev => [...prev.filter(a => a.agentId !== data.agentId), data]);
      });

      newSocket.on('agentOffline', (data) => {
        setOnlineAgents(prev => prev.filter(a => a.agentId !== data.agentId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket,
    connected,
    onlineAgents
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};