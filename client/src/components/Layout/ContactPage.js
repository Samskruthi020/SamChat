import React from 'react';
import './ContactPage.css';

const ContactPage = () => {
  return (
    <div className="contact-container">
      <div className="contact-card">
        <h1 className="contact-title">Contact Us</h1>
        <p className="contact-intro">
          This application was developed with passion and dedication. Feel free to reach out!
        </p>
        <div className="contact-details">
          <div className="contact-item">
            <strong>Developed by:</strong> Shaganti Samskruthi
          </div>
          <div className="contact-item">
            <strong>LinkedIn:</strong>{' '}
            <a href="https://www.linkedin.com/in/shaganti-samskruthi-59076b287/" target="_blank" rel="noopener noreferrer">
              shaganti-samskruthi-59076b287
            </a>
          </div>
          <div className="contact-item">
            <strong>Email:</strong>{' '}
            <a href="mailto:shagantisamskruthi20@gmail.com">
              shagantisamskruthi20@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 