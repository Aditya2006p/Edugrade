import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/SubmitAssignment.css';
import config from '../config';

// Add PDF viewer components
const PdfPreview = ({ fileUrl }) => {
  return (
    <div className="pdf-preview-container">
      <iframe 
        src={fileUrl} 
        title="Assignment PDF" 
        className="pdf-viewer"
      />
    </div>
  );
};

const SubmitAssignment = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [preliminaryScore, setPreliminaryScore] = useState(null);
  const [preliminaryFeedback, setPreliminaryFeedback] = useState(null);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [showAssignmentFile, setShowAssignmentFile] = useState(false);
  const assignmentFileRef = useRef(null);
  
  // Mock assignment data
  const mockAssignment = {
    id: parseInt(id) || 1,
    title: "English Essay",
    description: "Write a 5-paragraph essay on a topic of your choice",
    dueDate: "2025-04-15",
    hasAttachment: false,
    rubric: {
      content: "Quality and depth of content",
      organization: "Structure and flow of ideas",
      grammar: "Proper grammar and mechanics",
      creativity: "Original thinking and insights"
    }
  };
  
  // Mock feedback for preview
  const mockPreviewFeedback = {
    score: 85,
    feedback: {
      overallFeedback: "Good essay with strong points. Consider expanding on your third paragraph and providing more examples to support your argument.",
      totalScore: 85,
      rubricFeedback: {
        content: {
          score: 87,
          comments: "Strong content with good examples, but could use more depth in some areas."
        },
        organization: {
          score: 85,
          comments: "Well-structured essay with clear introduction and conclusion."
        },
        grammar: {
          score: 90,
          comments: "Very few grammatical errors. Good use of vocabulary."
        },
        creativity: {
          score: 82,
          comments: "Shows original thinking, but some points are conventional."
        }
      }
    }
  };

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Use mock data for offline/demo mode
        const useTemporaryMockData = true;
        
        if (useTemporaryMockData) {
          setTimeout(() => {
            setAssignment(mockAssignment);
            setLoading(false);
          }, 500);
          return;
        }
        
        const response = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setAssignment(data.data);
        } else {
          setError('Failed to load assignment details');
        }
      } catch (error) {
        console.error('Error connecting to server:', error);
        setError('Error connecting to server');
        // Fallback to mock data
        setAssignment(mockAssignment);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleTextChange = (e) => {
    setSubmissionText(e.target.value);
    // Reset preview and score when text changes
    if (showPreview) {
      setShowPreview(false);
      setPreliminaryScore(null);
      setPreliminaryFeedback(null);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // Reset preview and score when file changes
    if (showPreview) {
      setShowPreview(false);
      setPreliminaryScore(null);
      setPreliminaryFeedback(null);
    }
  };

  const toggleAssignmentFile = () => {
    setShowAssignmentFile(!showAssignmentFile);
  };

  const handlePreview = async () => {
    if (!submissionText && !file) {
      setError('Please provide either text or a file to preview');
      return;
    }
    
    setScoringLoading(true);
    setError('');
    
    try {
      // If there's a file but no text, we can't generate a preview
      if (!submissionText && file) {
        setShowPreview(true);
        setPreliminaryScore(null);
        setScoringLoading(false);
        return;
      }
      
      // Use mock data for offline/demo mode
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        // Simulate API delay
        setTimeout(() => {
          setPreliminaryScore(mockPreviewFeedback.score);
          setPreliminaryFeedback(mockPreviewFeedback.feedback);
          setShowPreview(true);
          setScoringLoading(false);
        }, 1500);
        return;
      }
      
      // Real API call
      const response = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/preview-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: submissionText,
          studentId: user.id,
          studentName: user.name
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setPreliminaryScore(data.data.score);
        setPreliminaryFeedback(data.data.feedback);
        setShowPreview(true);
      } else {
        throw new Error(data.message || 'Failed to generate preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      setError('Failed to generate preview. Please try again.');
      // Fallback to mock data
      setPreliminaryScore(mockPreviewFeedback.score);
      setPreliminaryFeedback(mockPreviewFeedback.feedback);
      setShowPreview(true);
    } finally {
      setScoringLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submissionText && !file) {
      setError('Please provide either text or a file to submit');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Use mock data for offline/demo mode
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        // Simulate submission process
        setTimeout(() => {
          setSuccessMessage('Assignment submitted successfully! Your preliminary score is 85/100.');
          setSubmitting(false);
          // Navigate after a delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }, 1500);
        return;
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('studentId', user.id);
      formData.append('studentName', user.name);
      
      if (submissionText) {
        formData.append('text', submissionText);
      }
      
      if (file) {
        formData.append('submission', file);
      }
      
      // Add preliminary score if available
      if (preliminaryScore && preliminaryFeedback) {
        formData.append('preliminaryScore', JSON.stringify({
          score: preliminaryScore,
          feedback: preliminaryFeedback
        }));
      }
      
      // Make the submission
      const response = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/submit`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccessMessage('Assignment submitted successfully!');
        
        if (data.data.feedback) {
          setSuccessMessage(prev => `${prev} Your preliminary score is ${data.data.feedback.feedback.totalScore || 'pending'}.`);
        }
        
        // Navigate back to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading assignment details...</div>;
  }

  if (!assignment) {
    return <div className="error">Assignment not found</div>;
  }

  const assignmentFileUrl = assignment.hasAttachment ? 
    `${config.ENDPOINTS.ASSIGNMENTS}/${id}/file` : null;

  return (
    <div className="submit-assignment-container">
      <h1>Submit Assignment</h1>
      <div className="assignment-details">
        <h2>{assignment.title}</h2>
        <p className="description">{assignment.description}</p>
        <p className="due-date">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
        
        {assignment.hasAttachment && (
          <div className="assignment-file">
            <h3>Assignment Questions</h3>
            <div className="assignment-file-actions">
              <button 
                className="view-questions-button"
                onClick={toggleAssignmentFile}
              >
                {showAssignmentFile ? 'Hide Questions' : 'View Questions'}
              </button>
              <a 
                href={assignmentFileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="download-file-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3"></path>
                </svg>
                Download Assignment File
              </a>
            </div>
            
            {showAssignmentFile && (
              <div className="assignment-file-preview" ref={assignmentFileRef}>
                {assignment.fileInfo?.fileType?.includes('pdf') ? (
                  <PdfPreview fileUrl={assignmentFileUrl} />
                ) : (
                  <div className="non-pdf-preview">
                    <p>This assignment includes a file that can't be previewed directly.</p> 
                    <p>Please download the file to view the questions.</p>
                    <p className="file-info">
                      <strong>File:</strong> {assignment.fileInfo?.originalName}
                      {assignment.fileInfo?.fileSize && (
                        <span> ({Math.round(assignment.fileInfo.fileSize / 1024)} KB)</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {Object.keys(assignment.rubric || {}).length > 0 && (
        <div className="rubric-section">
          <h3>Grading Rubric</h3>
          <ul className="rubric-list">
            {Object.entries(assignment.rubric).map(([key, value]) => (
              <li key={key} className="rubric-item">
                <span className="rubric-key">{key}:</span> {value}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form className="submission-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="submissionText">Your Answer:</label>
          <textarea
            id="submissionText"
            value={submissionText}
            onChange={handleTextChange}
            placeholder="Type your answer here..."
            rows="10"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="submissionFile">Or Upload a File:</label>
          <input
            type="file"
            id="submissionFile"
            onChange={handleFileChange}
          />
          <p className="file-help">Accepted formats: .pdf, .doc, .docx, .txt, .jpg, .png</p>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="preview-button" 
            onClick={handlePreview} 
            disabled={scoringLoading || submitting}
          >
            {scoringLoading ? 'Generating Preview...' : 'Preview & Get Score Estimate'}
          </button>
          
          <button 
            type="submit" 
            className="submit-button" 
            disabled={submitting || scoringLoading}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </form>
      
      {showPreview && (
        <div className="submission-preview">
          <h3>Submission Preview</h3>
          <div className="preview-content">
            <p className="preview-text">{submissionText || "File upload - preview not available"}</p>
          </div>
          
          {preliminaryScore !== null ? (
            <div className="preliminary-score">
              <h4>Estimated Score</h4>
              <div className="score-display">
                <div className="score-circle">{preliminaryScore}%</div>
                <div className="score-label">
                  {preliminaryScore >= 90 ? 'Excellent!' : 
                   preliminaryScore >= 80 ? 'Very Good!' : 
                   preliminaryScore >= 70 ? 'Good' : 
                   preliminaryScore >= 60 ? 'Satisfactory' : 'Needs Improvement'}
                </div>
              </div>
              
              {preliminaryFeedback && (
                <div className="preliminary-feedback">
                  <h4>Feedback Preview</h4>
                  <p>{preliminaryFeedback.overallFeedback || preliminaryFeedback.message}</p>
                  
                  {preliminaryFeedback.rubricFeedback && (
                    <div className="feedback-details">
                      <h5>Rubric Feedback</h5>
                      <ul>
                        {Object.entries(preliminaryFeedback.rubricFeedback).map(([key, item]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {item.score}/100 - {item.comments}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <p className="preview-note">
                <strong>Note:</strong> This is an estimated score based on AI analysis. 
                Your final grade may differ after instructor review.
              </p>
            </div>
          ) : (
            <div className="preliminary-feedback">
              <p>{preliminaryFeedback?.message || "No preview score available."}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="ai-grading-note">
        <h3>About AI Grading</h3>
        <p>
          This assignment will be analyzed by our AI-powered grading system, which provides:
        </p>
        <ul>
          <li>Detailed feedback on specific areas of your work</li>
          <li>Personalized suggestions for improvement</li>
          <li>Consistent evaluation based on the rubric</li>
        </ul>
        <p>
          Your submission will be evaluated fairly and thoroughly, with final review by your instructor.
        </p>
      </div>
    </div>
  );
};

export default SubmitAssignment;