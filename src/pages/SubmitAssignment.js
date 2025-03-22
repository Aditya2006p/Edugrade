import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/SubmitAssignment.css';

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

  // Fetch assignment details
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/assignments/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setAssignment(data.data);
        } else {
          setError('Failed to load assignment details');
        }
      } catch (error) {
        setError('Error connecting to server');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleTextChange = (e) => {
    setSubmissionText(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
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
      const formData = new FormData();
      formData.append('studentId', user.id);
      formData.append('studentName', user.name);
      
      if (submissionText) {
        formData.append('text', submissionText);
      }
      
      if (file) {
        formData.append('submission', file);
      }
      
      const response = await fetch(`http://localhost:5001/api/assignments/${id}/submit`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccessMessage('Assignment submitted successfully!');
        
        // Navigate to dashboard after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (error) {
      setError(error.message || 'Error submitting assignment');
      console.error(error);
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

  return (
    <div className="submit-assignment-container">
      <h1>Submit Assignment</h1>
      <div className="assignment-details">
        <h2>{assignment.title}</h2>
        <p className="description">{assignment.description}</p>
        <p className="due-date">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
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
        
        <button type="submit" className="submit-button" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </button>
      </form>
      
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