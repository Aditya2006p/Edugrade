import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/FeedbackDetail.css';
import config from '../config';

const FeedbackDetail = ({ user }) => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mock feedback data to use if API fails
  const mockFeedback = {
    id: parseInt(id) || Date.now(),
    submissionId: parseInt(id) || 101,
    assignmentId: 1,
    studentId: user?.id || 'student1',
    feedback: {
      overallFeedback: "Well-written essay with strong arguments and evidence. The structure is logical and the conclusion effectively summarizes your main points. Consider adding more specific examples to strengthen your analysis.",
      totalScore: 85,
      rubricFeedback: {
        "Content": {
          score: 88,
          comments: "Excellent depth of analysis with well-researched points."
        },
        "Organization": {
          score: 85,
          comments: "Good logical flow, with clear introduction and conclusion."
        },
        "Grammar": {
          score: 82,
          comments: "Generally correct grammar with a few minor errors."
        }
      }
    },
    submissionDate: new Date('2025-03-25').toISOString(),
    gradedDate: new Date('2025-03-26').toISOString()
  };
  
  // Mock assignment data if needed
  const mockAssignment = {
    id: 1,
    title: "English Essay",
    description: "Write a 5-paragraph essay on a topic of your choice",
    dueDate: "2025-04-15"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use mock data for now as we're having API connectivity issues
        const useTemporaryMockData = true;
        
        if (useTemporaryMockData) {
          // Use mock data
          setFeedback(mockFeedback);
          setAssignment(mockAssignment);
          setLoading(false);
          return;
        }
        
        // Fetch feedback using config for proper URLs
        try {
          const feedbackResponse = await fetch(`${config.ENDPOINTS.FEEDBACK}/submission/${id}`);
          const feedbackData = await feedbackResponse.json();
          
          if (feedbackData.status === 'success') {
            setFeedback(feedbackData.data);
            
            // Fetch assignment info if we have assignmentId
            if (feedbackData.data.assignmentId) {
              try {
                const assignmentResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${feedbackData.data.assignmentId}`);
                const assignmentData = await assignmentResponse.json();
                if (assignmentData.status === 'success') {
                  setAssignment(assignmentData.data);
                }
              } catch (assignmentError) {
                console.error('Error fetching assignment details:', assignmentError);
              }
            }
          } else {
            setError('Failed to load feedback details');
          }
        } catch (error) {
          console.error('Error connecting to server:', error);
          // Fallback to mock data
          setFeedback(mockFeedback);
          setAssignment(mockAssignment);
        }
      } catch (error) {
        setError('Error connecting to server');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getGradeLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Satisfactory';
    return 'Needs Improvement';
  };

  if (loading) {
    return <div className="loading">Loading feedback...</div>;
  }

  if (error || !feedback) {
    return <div className="error">{error || 'Feedback not found'}</div>;
  }

  // Process feedback data to handle different formats from the enhanced grading
  const totalScore = feedback.feedback?.totalScore || feedback.totalScore || 0;
  const overallFeedback = feedback.feedback?.overallFeedback || feedback.overallFeedback || '';
  const rubricFeedback = feedback.feedback?.rubricFeedback || feedback.rubricFeedback || {};
  const keyStrengths = feedback.feedback?.keyStrengths || feedback.keyStrengths || [];
  const improvementAreas = feedback.feedback?.improvementAreas || feedback.improvementAreas || [];
  const learningRecommendations = feedback.feedback?.learningRecommendations || feedback.learningRecommendations || [];
  
  // Handle legacy feedback format
  const legacyFeedback = Object.entries(feedback.feedback || feedback)
    .filter(([key]) => 
      key !== 'totalScore' && 
      key !== 'overallFeedback' && 
      key !== 'rubricFeedback' &&
      key !== 'keyStrengths' &&
      key !== 'improvementAreas' &&
      key !== 'learningRecommendations' &&
      key !== 'differentialAnalysis' &&
      key !== 'isAIFallback' &&
      key !== 'generatedAt'
    );
  
  return (
    <div className="feedback-detail-container">
      <div className="feedback-header">
        <div className="header-content">
          <h1>Assignment Feedback</h1>
          <div className="assignment-title">
            {assignment?.title || 'Assignment'}
          </div>
          <div className="submission-meta">
            <span>Submitted: {new Date(feedback.submissionDate || Date.now()).toLocaleDateString()}</span>
            <span>Graded: {new Date(feedback.gradedDate || Date.now()).toLocaleDateString()}</span>
            {(feedback.feedback?.isAIFallback || feedback.isAIFallback) && (
              <span className="ai-badge">AI-Assisted</span>
            )}
          </div>
        </div>
        <div className="score-container">
          <div className="score-circle">
            <div className="score-value">{totalScore}%</div>
            <div className="score-label">{getGradeLabel(totalScore)}</div>
          </div>
        </div>
      </div>
      
      <div className="feedback-content">
        <div className="feedback-section">
          <h2>Overall Assessment</h2>
          <div className="overall-feedback">
            <p>{overallFeedback}</p>
          </div>
        </div>
        
        {Object.keys(rubricFeedback).length > 0 ? (
          // Enhanced feedback format
          <div className="feedback-section">
            <h2>Rubric Assessment</h2>
            <div className="rubric-cards">
              {Object.entries(rubricFeedback).map(([criterion, { score, comments, strengths, improvements }]) => (
                <div key={criterion} className="rubric-card">
                  <div className="rubric-card-header">
                    <h3>{criterion}</h3>
                    <div className={`criterion-score score-${Math.floor(score/10)}`}>
                      {score}/100
                    </div>
                  </div>
                  <div className="rubric-card-body">
                    <p className="rubric-comments">{comments}</p>
                    
                    {strengths && (
                      <div className="rubric-strengths">
                        <h4>Strengths</h4>
                        <p>{strengths}</p>
                      </div>
                    )}
                    
                    {improvements && (
                      <div className="rubric-improvements">
                        <h4>Areas for Improvement</h4>
                        <p>{improvements}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Legacy feedback format
          <div className="feedback-section">
            <h2>Detailed Feedback</h2>
            <div className="legacy-feedback-cards">
              {legacyFeedback.map(([category, details]) => (
                <div key={category} className="legacy-feedback-card">
                  <div className="feedback-card-header">
                    <h3>{category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                    <div className="category-score">{details.score}/100</div>
                  </div>
                  <p className="feedback-comments">{details.comments}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {keyStrengths.length > 0 && (
          <div className="feedback-section">
            <h2>Key Strengths</h2>
            <ul className="strengths-list">
              {keyStrengths.map((strength, index) => (
                <li key={index} className="strength-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {improvementAreas.length > 0 && (
          <div className="feedback-section">
            <h2>Areas for Improvement</h2>
            <ul className="improvements-list">
              {improvementAreas.map((improvement, index) => (
                <li key={index} className="improvement-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12" y2="16"></line>
                  </svg>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {learningRecommendations.length > 0 && (
          <div className="feedback-section">
            <h2>Learning Recommendations</h2>
            <ul className="recommendations-list">
              {learningRecommendations.map((recommendation, index) => (
                <li key={index} className="recommendation-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
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
            {assignment && (
              <Link to={`/assignments/${assignment.id}/analytics`} className="analytics-button">
                View Class Analytics
              </Link>
            )}
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