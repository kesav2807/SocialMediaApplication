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

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typing, setTyping] = useState(new Map());
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && !socket) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for socket connection');
        return;
      }

      const newSocket = io('http://localhost:5000', {
        auth: { token },
        headers: {
          Authorization: `Bearer ${token}`
        },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000
      });

      newSocket.on('connect', () => {
        console.log('Connected to server with socket ID:', newSocket.id);
        setSocket(newSocket);
        setConnected(true);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setConnected(false);
      });

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on('userTyping', ({ userId, typing }) => {
        setTyping(prev => {
          const newMap = new Map(prev);
          if (typing) {
            newMap.set(userId, true);
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setConnected(false);
      });

      return () => {
        if (newSocket) {
          newSocket.disconnect();
          newSocket.removeAllListeners();
        }
        setSocket(null);
        setConnected(false);
      };
    }
  }, [user]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket) {
      socket.emit('sendMessage', messageData);
    }
  };

  const sendTyping = (data) => {
    if (socket) {
      socket.emit('typing', data);
    }
  };

  const value = {
    socket,
    onlineUsers,
    typing,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};