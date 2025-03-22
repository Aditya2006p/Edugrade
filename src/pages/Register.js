import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Register.css';

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
      const response = await fetch('http://localhost:5001/api/auth/register', {
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
      setError(error.message);
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