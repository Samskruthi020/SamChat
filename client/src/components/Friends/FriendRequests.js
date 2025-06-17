import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Friends.css';

const FriendRequests = () => {
    const [requests, setRequests] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await axios.get('/friends/requests');
                setRequests(res.data);
            } catch (err) {
                setError('Error fetching friend requests.');
                console.error(err);
            }
        };
        fetchRequests();
    }, []);

    const handleRequest = async (requestId, action) => {
        try {
            const res = await axios.post(`/friends/${action}/${requestId}`);
            setMessage(res.data.message);
            // Remove the processed request from the list
            setRequests(requests.filter(req => req._id !== requestId));
        } catch (err) {
            setError(err.response?.data?.message || `Error ${action}ing request.`);
            console.error(err);
        }
    };

    return (
        <div className="friend-requests-container">
            <h3>Friend Requests</h3>
            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            {requests.length === 0 && <p>No new friend requests.</p>}
            <div className="friend-requests-list">
                {requests.map(req => (
                    <div key={req._id} className="friend-request-item">
                        <div className="user-info">
                            <span className="username">{req.requester.username}</span>
                            <span className="email">({req.requester.email})</span>
                        </div>
                        <div className="request-actions">
                            <button onClick={() => handleRequest(req._id, 'accept')} className="accept-button">Accept</button>
                            <button onClick={() => handleRequest(req._id, 'decline')} className="decline-button">Decline</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequests; 