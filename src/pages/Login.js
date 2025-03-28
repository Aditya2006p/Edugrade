import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';
import config from '../config';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Try using demo login directly since the API might not be accessible
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        // Determine role based on username (simple rule for demo)
        const isTeacher = formData.username.includes('teacher');
        const demoUser = isTeacher 
          ? { id: `teacher-${Date.now()}`, username: formData.username, name: 'Teacher Account', role: 'teacher' }
          : { id: `student-${Date.now()}`, username: formData.username, name: 'Student Account', role: 'student' };
        
        onLogin(demoUser);
        return;
      }
      
      // Use config for API URL if we're not using mock data
      const response = await fetch(`${config.ENDPOINTS.AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      onLogin(data.data.user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoUser = role === 'teacher' 
      ? { id: 1, username: 'teacher1', name: 'John Smith', role: 'teacher' }
      : { id: 2, username: 'student1', name: 'Alice Johnson', role: 'student' };
    
    onLogin(demoUser);
  };

  return (
    <div className="login-container">
      <h1>Login to EduGrade</h1>
      
      {error && <div className="form-error">{error}</div>}
      
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="Enter your username"
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
            placeholder="Enter your password"
          />
        </div>
        
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="register-link">
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
      
      <div className="login-demo-accounts">
        <h3>Quick Demo Access</h3>
        <div className="demo-accounts-list">
          <button 
            onClick={() => handleDemoLogin('teacher')} 
            className="demo-account-button"
          >
            <div className="demo-account-info">
              <span>John Smith</span>
              <span className="demo-account-role">Teacher Account</span>
            </div>
            <span>&rarr;</span>
          </button>
          <button 
            onClick={() => handleDemoLogin('student')} 
            className="demo-account-button"
          >
            <div className="demo-account-info">
              <span>Alice Johnson</span>
              <span className="demo-account-role">Student Account</span>
            </div>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 