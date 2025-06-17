import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Welcome to SamChat</h1>
        <p className="subtitle">Your new favorite place to connect and communicate instantly.</p>
        <Link to="/register" className="cta-button">Get Started for Free</Link>
      </header>

      <section className="features-section">
        <h2 className="section-title">Features That Set Us Apart</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-Time Messaging</h3>
            <p>Experience lightning-fast, real-time messaging with our socket-based architecture. No delays, no refreshing.</p>
          </div>
          <div className="feature-card">
            <h3>Friend System</h3>
            <p>Find users and send friend requests. Your chat list is composed of only the friends you've accepted.</p>
          </div>
          <div className="feature-card">
            <h3>Instant Notifications</h3>
            <p>Get desktop notifications for new messages and friend requests, so you never miss an important update.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 