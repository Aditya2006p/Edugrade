import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/AssignmentDetail.css';
import config from '../config';

const AssignmentDetail = ({ user }) => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mock data for offline/demo mode
  const mockAssignment = {
    id: parseInt(id) || 1,
    title: "English Essay",
    description: "Write a 5-paragraph essay on a topic of your choice. Focus on clear structure, strong thesis statement, and supporting evidence.",
    dueDate: "2025-04-15",
    hasAttachment: false,
    rubric: {
      content: "Quality and depth of content",
      organization: "Structure and flow of ideas",
      grammar: "Proper grammar and mechanics",
      creativity: "Original thinking and insights"
    }
  };
  
  const mockSubmissions = [
    { id: 101, studentId: 'student1', studentName: 'Alice Johnson', submissionDate: '2025-03-25', status: 'graded' },
    { id: 103, studentId: 'student2', studentName: 'Bob Smith', submissionDate: '2025-03-26', status: 'pending' },
    { id: 104, studentId: 'student3', studentName: 'Charlie Davis', submissionDate: '2025-03-27', status: 'pending' }
  ];

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        // Use mock data for offline/demo mode
        const useTemporaryMockData = true;
        
        if (useTemporaryMockData) {
          setTimeout(() => {
            setAssignment(mockAssignment);
            
            if (user.role === 'teacher') {
              setSubmissions(mockSubmissions);
            } else {
              setSubmissions([]);
            }
            
            setLoading(false);
          }, 500);
          return;
        }
        
        // Fetch assignment details
        const assignmentResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}`);
        const assignmentData = await assignmentResponse.json();
        
        if (assignmentData.status === 'success') {
          setAssignment(assignmentData.data);
          
          // Only show mock data for the demo teacher account
          // For real teacher accounts, fetch actual submissions
          const isDemoTeacher = user.username === 'teacher1' && user.role === 'teacher';
          
          if (isDemoTeacher) {
            // For demo purposes, show mock submission data
            setSubmissions([
              { id: 101, studentId: 'student1', studentName: 'Alice Johnson', submissionDate: '2025-03-25', status: 'graded' },
              { id: 103, studentId: 'student2', studentName: 'Bob Smith', submissionDate: '2025-03-26', status: 'pending' }
            ]);
          } else if (user.role === 'teacher') {
            // For real teacher accounts, fetch actual submissions
            try {
              const submissionsResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/submissions`);
              const submissionsData = await submissionsResponse.json();
              
              if (submissionsData.status === 'success') {
                setSubmissions(submissionsData.data);
              }
            } catch (submissionError) {
              console.error('Error fetching submissions:', submissionError);
              setSubmissions([]);
            }
          } else {
            // For student accounts, no need to show submissions
            setSubmissions([]);
          }
        } else {
          setError('Failed to load assignment details');
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
        setError('Error connecting to server');
        
        // Fallback to mock data
        setAssignment(mockAssignment);
        if (user.role === 'teacher') {
          setSubmissions(mockSubmissions);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id, user.role, user.username]);

  // Update the file URL to use config
  const fileUrl = assignment?.hasAttachment ? `${config.ENDPOINTS.ASSIGNMENTS}/${id}/file` : null;

  if (loading) {
    return <div className="loading">Loading assignment details...</div>;
  }

  if (error || !assignment) {
    return <div className="error">{error || 'Assignment not found'}</div>;
  }

  return (
    <div className="assignment-detail-container">
      <div className="assignment-header">
        <h1>{assignment.title}</h1>
        <div className="assignment-meta">
          <span className="due-date">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
          {user.role === 'student' && (
            <Link to={`/assignments/${id}/submit`} className="submit-button">
              Submit Assignment
            </Link>
          )}
          {user.role === 'teacher' && (
            <Link to={`/assignments/${id}/analytics`} className="analytics-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6"></path>
              </svg>
              Class Analytics
            </Link>
          )}
        </div>
      </div>
      
      <div className="assignment-card">
        <h2>Assignment Description</h2>
        <p className="description">{assignment.description}</p>
        
        {assignment.hasAttachment && (
          <div className="assignment-file">
            <h3>Assignment File</h3>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="download-file-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3"></path>
              </svg>
              Download Assignment File
            </a>
            <p className="file-info">
              {assignment.fileInfo?.originalName} 
              {assignment.fileInfo?.fileSize && (
                <span className="file-size">
                  ({Math.round(assignment.fileInfo.fileSize / 1024)} KB)
                </span>
              )}
            </p>
          </div>
        )}
      </div>
      
      {Object.keys(assignment.rubric || {}).length > 0 && (
        <div className="rubric-card">
          <h2>Grading Rubric</h2>
          <div className="rubric-items">
            {Object.entries(assignment.rubric).map(([key, value]) => (
              <div key={key} className="rubric-item">
                <h3>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {user.role === 'teacher' && (
        <div className="submissions-section">
          <div className="section-header">
            <h2>Student Submissions</h2>
            <Link to={`/assignments/${id}/analytics`} className="view-analytics-link">
              View Detailed Analytics
            </Link>
          </div>
          
          {submissions.length === 0 ? (
            <p className="empty-message">No submissions yet.</p>
          ) : (
            <div className="submissions-table-container">
              <table className="submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(submission => (
                    <tr key={submission.id}>
                      <td>{submission.studentName}</td>
                      <td>{new Date(submission.submissionDate).toLocaleDateString()}</td>
                      <td className={`status ${submission.status}`}>{submission.status}</td>
                      <td>
                        {submission.status === 'pending' ? (
                          <Link to={`/assignments/${id}/grade/${submission.id}`} className="grade-button">
                            Grade
                          </Link>
                        ) : (
                          <Link to={`/feedback/${submission.id}`} className="view-feedback-button">
                            View Feedback
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="ai-grading-note">
        <h3>About AI Grading</h3>
        <p>
          This assignment uses AI-powered grading to provide timely and personalized feedback.
          {user.role === 'student' 
            ? 'Your work will be evaluated based on the rubric criteria with fair and consistent scoring.'
            : 'Student submissions are automatically evaluated based on the rubric, saving you time while maintaining quality feedback.'}
        </p>
      </div>
    </div>
  );
};

export default AssignmentDetail; 