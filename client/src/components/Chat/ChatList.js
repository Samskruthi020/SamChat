import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import './Chat.css';

const ChatList = ({ onSelectUser, selectedUser }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { unreadCounts, lastMessageTimestamps } = useSocket();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get('/friends');
        setFriends(response.data);
      } catch (err) {
        setError('Failed to fetch friends.');
        console.error('Error fetching friends:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchFriends();
    }
  }, [user]);

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const lastTimeA = lastMessageTimestamps[a._id] || 0;
      const lastTimeB = lastMessageTimestamps[b._id] || 0;
      return new Date(lastTimeB) - new Date(lastTimeA);
    });
  }, [friends, lastMessageTimestamps]);

  if (loading) {
    return <div className="chat-list-loading">Loading friends...</div>;
  }

  if (error) {
    return <div className="chat-list-error">{error}</div>;
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h3>Friends</h3>
      </div>
      <div className="chat-list-users">
        {sortedFriends.map((friend) => (
          <div
            key={friend._id}
            className={`chat-list-item ${selectedUser?._id === friend._id ? 'selected' : ''}`}
            onClick={() => onSelectUser(friend)}
          >
            <div className="chat-list-item-avatar">
              {friend.username.charAt(0).toUpperCase()}
              {unreadCounts[friend._id] > 0 && <div className="unread-dot" />}
            </div>
            <div className="chat-list-item-info">
              <div className="chat-list-item-name">{friend.username}</div>
              <div className="chat-list-item-status">
                {friend.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        ))}
        {friends.length === 0 && (
          <div className="chat-list-empty">No friends yet. Find some!</div>
        )}
      </div>
    </div>
  );
};

export default ChatList; 