import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const res = await axios.get('/friends');
                setFriends(res.data);
            } catch (err) {
                setError('Failed to fetch friends.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchFriends();
        }
    }, [user]);

    if (loading) {
        return <div className="loading-spinner-container">Loading profile...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h1>{user?.username}</h1>
                    <p>{user?.email}</p>
                </div>
            </div>

            <div className="profile-content">
                <h2>Your Friends ({friends.length})</h2>
                {error && <p className="error-message">{error}</p>}
                {friends.length > 0 ? (
                    <div className="friends-list">
                        {friends.map(friend => (
                            <div key={friend._id} className="friend-item">
                                <div className="friend-avatar">
                                    {friend.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="friend-info">
                                    <span className="friend-username">{friend.username}</span>
                                    <span className={`status ${friend.isOnline ? 'online' : 'offline'}`}>
                                        {friend.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>You haven't added any friends yet. Find some in the chat app!</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage; 