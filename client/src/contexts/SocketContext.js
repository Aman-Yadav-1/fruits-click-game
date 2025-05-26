import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const { isAuthenticated, user, token } = useAuth();

  // Initialize socket connection when authenticated
  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && token) {
      // Connect to socket server with authentication token
      socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token }
      });

      // Socket connection events
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // Listen for active users updates (admin only)
      socketInstance.on('active-users', (users) => {
        setActiveUsers(users);
      });

      // Listen for rankings updates
      socketInstance.on('rankings-updated', (data) => {
        setRankings(data);
      });

      // Listen for banana count updates
      socketInstance.on('banana-count-updated', (data) => {
        if (user) {
          // Update user's banana count in context
          // This will be handled by the component that uses this context
        }
      });

      setSocket(socketInstance);
    }

    // Cleanup socket connection on unmount or when auth state changes
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, token, user]);

  // Function to emit banana click event
  const emitBananaClick = () => {
    if (socket && connected) {
      socket.emit('banana-click');
    }
  };

  const value = {
    socket,
    connected,
    activeUsers,
    rankings,
    emitBananaClick
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
