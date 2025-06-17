import React, { useState } from 'react';
import axios from 'axios';
import './Friends.css';

const UserSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (!searchTerm.trim()) return;

        try {
            const res = await axios.get(`/users/search?q=${searchTerm}`);
            setUsers(res.data.users);
            if (res.data.users.length === 0) {
                setMessage('No users found.');
            }
        } catch (err) {
            setError('Error searching for users.');
            console.error(err);
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            const res = await axios.post(`/friends/request/${userId}`);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Error sending request.');
            console.error(err);
        }
    };

    return (
        <div className="user-search-container">
            <form onSubmit={handleSearch} className="user-search-form">
                <input
                    type="text"
                    placeholder="Search for users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="user-search-input"
                />
                <button type="submit" className="user-search-button">Search</button>
            </form>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="user-search-results">
                {users.map(user => (
                    <div key={user._id} className="user-search-item">
                        <span>{user.username} ({user.email})</span>
                        <button onClick={() => sendFriendRequest(user._id)} className="add-friend-button">
                            Add Friend
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserSearch; 