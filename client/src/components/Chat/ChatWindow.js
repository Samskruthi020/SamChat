import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import './Chat.css';

const ChatWindow = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { socket, joinChat, leaveChat, sendMessage } = useSocket();

  // Effect to fetch messages and handle socket events
  useEffect(() => {
    if (selectedUser) {
      if (joinChat) joinChat(selectedUser._id);
      fetchMessages();
      
      const handleNewMessage = (message) => {
        const senderId = message.sender?._id || message.sender;
        const receiverId = message.receiver?._id || message.receiver;

        if (
          (senderId === user.id && receiverId === selectedUser._id) ||
          (senderId === selectedUser._id && receiverId === user.id)
        ) {
          setMessages((prev) => [...prev, message]);
        }
      };
      
      if (socket) {
        socket.on('newMessage', handleNewMessage);
        return () => {
          socket.off('newMessage', handleNewMessage);
          if (leaveChat) leaveChat(selectedUser._id);
        };
      }
    }
  }, [selectedUser, user.id, socket, joinChat, leaveChat]);

  // Effect to scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const response = await axios.get(`/messages/${selectedUser._id}`);
      setMessages(response.data.messages);
      setError('');
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !sendMessage) return;
    sendMessage(selectedUser._id, newMessage.trim());
    setNewMessage('');
  };

  const handleClearChat = async () => {
    if (!selectedUser) return;

    // eslint-disable-next-line no-restricted-globals
    if (confirm(`Are you sure you want to clear your chat history with ${selectedUser.username}? This cannot be undone.`)) {
        try {
            await axios.delete(`/messages/clear/${selectedUser._id}`);
            setMessages([]); // Clear messages from UI
        } catch (err) {
            setError('Failed to clear chat history.');
            console.error('Error clearing chat:', err);
        }
    }
  };

  if (!selectedUser) {
    return (
      <div className="chat-window-placeholder">
        Select a user to start chatting
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-user-info">
          <div className="chat-window-avatar">
            {selectedUser.username.charAt(0).toUpperCase()}
          </div>
          <div className="chat-window-user-details">
            <div className="chat-window-username">{selectedUser.username}</div>
            <div className="chat-window-status">
              {selectedUser.online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <button onClick={handleClearChat} className="clear-chat-button">
            Clear Chat
        </button>
      </div>

      <div className="chat-messages">
        {loading ? (
            <div className="loading-messages">Loading...</div>
        ) : (
          messages.map((message) => {
            const senderId = message.sender?._id || message.sender;
            return (
              <div key={message._id} className={`chat-message ${senderId === user.id ? 'sent' : 'received'}`}>
                <div className="chat-message-content">{message.content}</div>
                <div className="chat-message-time">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">
          Send
        </button>
      </form>

      {error && <div className="chat-error">{error}</div>}
    </div>
  );
};

export default ChatWindow; 