import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useSocket } from '../../contexts/SocketContext';
import UserSearch from '../Friends/UserSearch';
import FriendRequests from '../Friends/FriendRequests';
import './Chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'search', 'requests'
  const { markAsRead } = useSocket();

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (user) {
      markAsRead(user._id);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'search':
        return <UserSearch />;
      case 'requests':
        return <FriendRequests />;
      default:
        return <ChatList onSelectUser={handleSelectUser} selectedUser={selectedUser} />;
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-tabs">
            <button onClick={() => setActiveTab('friends')} className={activeTab === 'friends' ? 'active' : ''}>Friends</button>
            <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'active' : ''}>Search Users</button>
            <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'active' : ''}>Requests</button>
        </div>
        <div className="sidebar-content">
            {renderActiveTab()}
        </div>
      </div>
      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
};

export default Chat; 