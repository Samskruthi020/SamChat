import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    SamChat
                </Link>
                <nav className="header-nav">
                    <NavLink to="/" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                        Home
                    </NavLink>
                    <NavLink to="/contact" className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                        Contact Us
                    </NavLink>
                </nav>
                <div className="header-auth">
                    {user ? (
                        <>
                            <Link to="/chat" className="header-button chat">
                                Go to Chat
                            </Link>
                            <Link to="/profile" className="header-button profile">
                                Profile
                            </Link>
                            <button onClick={handleLogout} className="header-button logout">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="header-button login">
                                Login
                            </Link>
                            <Link to="/register" className="header-button signup">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header; 