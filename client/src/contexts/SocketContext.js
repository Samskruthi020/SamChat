import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  
  // Refs for socket event handlers to avoid stale closures
  const socketRef = useRef(null);
  const messageHandlersRef = useRef(new Map());
  const typingTimeoutRef = useRef(null);

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
        auth: {
          token
        },
        autoConnect: true
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        // Get online users when connected
        newSocket.emit('getOnlineUsers');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // User status events
      newSocket.on('userOnline', (data) => {
        setOnlineUsers(prev => {
          const existing = prev.find(u => u.id === data.userId);
          if (!existing) {
            return [...prev, { id: data.userId, username: data.username, isOnline: true }];
          }
          return prev.map(u => 
            u.id === data.userId ? { ...u, isOnline: true } : u
          );
        });
      });

      newSocket.on('userOffline', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => 
            u.id === data.userId ? { ...u, isOnline: false } : u
          )
        );
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      // Notification events
      newSocket.on('newNotification', (notification) => {
        setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
        
        // Show desktop notification if window is not focused
        if (document.hidden) {
          showDesktopNotification(notification);
        }
      });

      // Message events
      newSocket.on('newMessage', (message) => {
        const senderId = message.sender?._id || message.sender;
        const receiverId = message.receiver?._id || message.receiver;
        const otherUserId = senderId === user.id ? receiverId : senderId;

        // Update last message timestamp for sorting
        setLastMessageTimestamps(prev => ({ ...prev, [otherUserId]: new Date().toISOString() }));
        
        // Update unread count if the message is from another user
        if (senderId !== user.id) {
            setUnreadCounts(prev => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
        }
      });

      // Error handling
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        addNotification({
          type: 'error',
          message: error.message || 'An error occurred'
        });
      });

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        socketRef.current = null;
      };
    }
  }, [user, token]);

  const showDesktopNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const { from, message } = notification;
      new Notification(`New message from ${from}`, {
        body: message,
        icon: '/favicon.ico' // Optional: you can add a custom icon
      });
    }
  };

  // Join a chat room
  const joinChat = (otherUserId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinChat', { otherUserId });
    }
  };

  // Leave a chat room
  const leaveChat = (otherUserId) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveChat', { otherUserId });
    }
  };

  // Send a message
  const sendMessage = (receiverId, content) => {
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { receiverId, content });
    }
  };

  // Handle typing indicator
  const sendTyping = (receiverId, isTyping) => {
    if (socketRef.current) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socketRef.current.emit('typing', { receiverId, isTyping });

      // Auto-stop typing after 3 seconds if still typing
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current.emit('typing', { receiverId, isTyping: false });
        }, 3000);
      }
    }
  };

  // Mark messages as read
  const markAsRead = (userId) => {
    setUnreadCounts(prev => {
        const newCounts = { ...prev };
        delete newCounts[userId];
        return newCounts;
    });
  };

  // Subscribe to message events for a specific chat
  const subscribeToMessages = (callback) => {
    if (socketRef.current) {
      const handler = (message) => {
        callback(message);
      };

      socketRef.current.on('newMessage', handler);

      // Return unsubscribe function
      return () => {
        if (socketRef.current) {
          socketRef.current.off('newMessage', handler);
        }
      };
    }
    return () => {};
  };

  // Subscribe to typing events
  const subscribeToTyping = (callback) => {
    if (socketRef.current) {
      const handler = (data) => {
        callback(data);
      };

      socketRef.current.on('userTyping', handler);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('userTyping', handler);
        }
      };
    }
    return () => {};
  };

  // Subscribe to message read events
  const subscribeToMessageRead = (callback) => {
    if (socketRef.current) {
      const handler = (data) => {
        callback(data);
      };

      socketRef.current.on('messagesRead', handler);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('messagesRead', handler);
        }
      };
    }
    return () => {};
  };

  // Add notification
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    unreadCounts,
    lastMessageTimestamps,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    markAsRead,
    subscribeToMessages,
    subscribeToTyping,
    subscribeToMessageRead,
    addNotification,
    removeNotification,
    clearNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext; 