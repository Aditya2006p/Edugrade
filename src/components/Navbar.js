import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">EduGrade</span>
          <span className="logo-icon">📚</span>
        </Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <span className="navbar-welcome">Welcome, {user.name} ({user.role})</span>
            {user.role === 'teacher' && (
              <Link to="/assignments/create" className="navbar-item">
                Create Assignment
              </Link>
            )}
            <Link to="/" className="navbar-item">
              Dashboard
            </Link>
            <button onClick={onLogout} className="navbar-button logout-button">
              Logout
            </button>
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="navbar-button login-button">
              Login
            </Link>
            <Link to="/register" className="navbar-button register-button">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 