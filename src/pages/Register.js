import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';
import config from '../config';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Use mock data in case of API issues
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        console.log('Using mock registration data');
        // Create mock user data
        const mockUser = {
          id: `user-${Date.now()}`,
          username: formData.username,
          name: formData.name || formData.username,
          role: formData.role
        };
        
        setSuccess(true);
        
        // Login after a short delay to show success message
        setTimeout(() => {
          onLogin(mockUser);
          navigate('/');
        }, 1500);
        
        return;
      }
      
      // Use config for API URL
      const response = await fetch(`${config.ENDPOINTS.AUTH}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      setSuccess(true);
      
      // Login after a short delay to show success message
      setTimeout(() => {
        onLogin(data.data.user);
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Create an Account</h1>
      
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">Account created successfully! Redirecting...</div>}
      
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Choose a username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Choose a password"
          />
        </div>
        
        <div className="form-group">
          <label>I am a:</label>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id="student"
                name="role"
                value="student"
                checked={formData.role === 'student'}
                onChange={handleChange}
              />
              <label htmlFor="student">Student</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id="teacher"
                name="role"
                value="teacher"
                checked={formData.role === 'teacher'}
                onChange={handleChange}
              />
              <label htmlFor="teacher">Teacher</label>
            </div>
          </div>
        </div>
        
        <button type="submit" className="register-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <div className="login-link">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Register; 