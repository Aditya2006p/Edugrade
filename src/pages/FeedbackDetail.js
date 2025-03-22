import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/FeedbackDetail.css';

const FeedbackDetail = ({ user }) => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/feedback/submission/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setFeedback(data.data);
        } else {
          setError('Failed to load feedback details');
        }
      } catch (error) {
        setError('Error connecting to server');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading feedback...</div>;
  }

  if (error || !feedback) {
    return <div className="error">{error || 'Feedback not found'}</div>;
  }

  return (
    <div className="feedback-detail-container">
      <div className="feedback-header">
        <div className="header-content">
          <h1>Feedback for Assignment</h1>
          <div className="assignment-title">
            Math Assignment
          </div>
          <div className="submission-meta">
            <span>Submitted: {new Date(feedback.submissionDate).toLocaleDateString()}</span>
            <span>Graded: {new Date(feedback.gradedDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="score-container">
          <div className="score">{feedback.feedback.totalScore}%</div>
          <div className="score-label">Overall Score</div>
        </div>
      </div>
      
      <div className="feedback-cards">
        {Object.entries(feedback.feedback).filter(([key]) => key !== 'totalScore' && key !== 'overallFeedback').map(([category, details]) => (
          <div key={category} className="feedback-card">
            <div className="feedback-card-header">
              <h2>{category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</h2>
              <div className="category-score">{details.score}/10</div>
            </div>
            <p className="feedback-comments">{details.comments}</p>
          </div>
        ))}
      </div>
      
      <div className="overall-feedback">
        <h2>Overall Feedback</h2>
        <div className="feedback-content">
          <p>{feedback.feedback.overallFeedback}</p>
        </div>
      </div>
      
      <div className="ai-feedback-note">
        <h3>About This Feedback</h3>
        <p>
          This feedback was generated using AI-powered assessment based on the rubric for this assignment.
          {user.role === 'student' ? 
            ' The feedback is designed to help you identify strengths and areas for improvement.' : 
            ' You can modify this feedback if needed.'}
        </p>
      </div>
      
      <div className="actions">
        {user.role === 'student' ? (
          <Link to="/" className="back-button">
            Back to Dashboard
          </Link>
        ) : (
          <>
            <Link to="/" className="back-button">
              Back to Dashboard
            </Link>
            <button className="edit-button">
              Edit Feedback
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackDetail; 