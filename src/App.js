import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetail from './pages/AssignmentDetail';
import SubmitAssignment from './pages/SubmitAssignment';
import FeedbackDetail from './pages/FeedbackDetail';
import TeacherAnalytics from './pages/TeacherAnalytics';
import Navbar from './components/Navbar';
import './styles/App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/assignments/create" element={user?.role === 'teacher' ? <CreateAssignment user={user} /> : <Navigate to="/" />} />
            <Route path="/assignments/:id" element={user ? <AssignmentDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/assignments/:id/submit" element={user?.role === 'student' ? <SubmitAssignment user={user} /> : <Navigate to="/" />} />
            <Route path="/assignments/:id/analytics" element={user?.role === 'teacher' ? <TeacherAnalytics user={user} /> : <Navigate to="/" />} />
            <Route path="/feedback/:id" element={user ? <FeedbackDetail user={user} /> : <Navigate to="/login" />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>© 2025 EduGrade | AI-Powered Grading and Feedback System</p>
        </footer>
      </div>
    </Router>
  );
};

export default App; 