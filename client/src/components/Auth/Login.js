import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../UI/LoadingSpinner';

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    login: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.login.trim()) {
      errors.login = 'Username or email is required';
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login" className="form-label">
              Username or Email
            </label>
            <input
              type="text"
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              className={`form-input ${formErrors.login ? 'error' : ''}`}
              placeholder="Enter your username or email"
              disabled={loading}
            />
            {formErrors.login && (
              <div className="error-message">{formErrors.login}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={loading}
            />
            {formErrors.password && (
              <div className="error-message">{formErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" color="white" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 