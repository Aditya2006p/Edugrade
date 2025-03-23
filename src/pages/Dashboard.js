import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';
import config from '../config';

const Dashboard = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Try to fetch assignments, but gracefully handle errors
        try {
          const assignmentsResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}`);
          const assignmentsData = await assignmentsResponse.json();
          
          if (assignmentsData.status === 'success') {
            setAssignments(assignmentsData.data);
          }
        } catch (err) {
          console.log("Error fetching assignments:", err);
          // Fallback to default assignments
          setAssignments([
            { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01', hasAttachment: false },
            { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15', hasAttachment: false }
          ]);
        }
        
        // Check if we should use mock data
        const isDemoAccount = user.username === 'teacher1' || user.username === 'student1';
        const useTemporaryMockData = true; // Set this to true to use mock data for all users temporarily
        
        if (isDemoAccount || useTemporaryMockData) {
          // For demo purposes or temporary solution, we'll create mock submission and feedback data
          if (user.role === 'student') {
            // Mock submissions data for student
            setSubmissions([
              { id: 101, assignmentId: 1, submissionDate: '2025-03-25', status: 'graded' },
              { id: 102, assignmentId: 2, submissionDate: '2025-03-26', status: 'pending' }
            ]);
            
            // Mock feedback data for student
            setFeedback([
              { 
                id: 201, 
                submissionId: 101, 
                assignmentId: 1, 
                submissionDate: '2025-03-25', 
                gradedDate: '2025-03-26', 
                score: 85, 
                summary: 'Good work with some areas for improvement' 
              }
            ]);
          } else if (user.role === 'teacher') {
            // Mock submissions data for teacher
            setSubmissions([
              { id: 101, assignmentId: 1, studentId: 'student1', studentName: 'Alice Johnson', submissionDate: '2025-03-25', status: 'graded' },
              { id: 103, assignmentId: 1, studentId: 'student2', studentName: 'Bob Smith', submissionDate: '2025-03-26', status: 'pending' },
              { id: 104, assignmentId: 2, studentId: 'student1', studentName: 'Alice Johnson', submissionDate: '2025-03-26', status: 'pending' }
            ]);
          }
          
          setLoading(false);
          return; // Skip the real API calls if using mock data
        }
        
        // For real user accounts, fetch actual submissions
        if (user.role === 'student') {
          try {
            // Fetch student's submissions using the new endpoint
            const submissionsResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/student/${user.id}/submissions`);
            const submissionsData = await submissionsResponse.json();
            
            if (submissionsData.status === 'success') {
              setSubmissions(submissionsData.data);
              
              // Fetch feedback for graded submissions
              const gradedSubmissions = submissionsData.data.filter(sub => sub.status === 'graded');
              const feedbackPromises = gradedSubmissions.map(submission =>
                fetch(`${config.ENDPOINTS.FEEDBACK}/submission/${submission.id}`)
                  .then(res => res.json())
              );
              
              if (feedbackPromises.length > 0) {
                const feedbackResponses = await Promise.all(feedbackPromises);
                const validFeedback = feedbackResponses
                  .filter(response => response.status === 'success')
                  .map(response => response.data);
                
                setFeedback(validFeedback);
              }
            }
          } catch (submissionError) {
            console.error('Error fetching student submissions:', submissionError);
            setSubmissions([]);
            setFeedback([]);
          }
        } else if (user.role === 'teacher') {
          // For teachers, we don't need to fetch all submissions here
          // They'll see submissions per assignment in the assignment detail view
          setSubmissions([]);
        }

      } catch (error) {
        setError('Failed to load dashboard data');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.role, user.username, user.id]);

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>{user.role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}</h1>
        {user.role === 'teacher' && (
          <Link to="/assignments/create" className="create-assignment-button">
            Create New Assignment
          </Link>
        )}
      </div>
      
      {user.role === 'teacher' ? (
        <TeacherDashboard 
          assignments={assignments} 
          submissions={submissions} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ) : (
        <StudentDashboard 
          assignments={assignments} 
          submissions={submissions} 
          feedback={feedback}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};

const TeacherDashboard = ({ assignments, submissions, activeTab, setActiveTab }) => {
  // Group submissions by assignment
  const submissionsByAssignment = submissions.reduce((acc, submission) => {
    if (!acc[submission.assignmentId]) {
      acc[submission.assignmentId] = [];
    }
    acc[submission.assignmentId].push(submission);
    return acc;
  }, {});

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab ${activeTab === 'assignments' ? 'active' : ''}`} 
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'submissions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('submissions')}
        >
          Submissions
        </div>
      </div>

      {activeTab === 'assignments' && (
        <>
          {assignments.length === 0 ? (
            <div className="empty-state">
              <h2>No Assignments Created</h2>
              <p>Start creating assignments for your students to complete.</p>
              <Link to="/assignments/create" className="empty-state-button">
                Create First Assignment
              </Link>
            </div>
          ) : (
            <div className="dashboard-cards">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-card-content">
                    <h2>{assignment.title}</h2>
                    <div className="assignment-card-meta">
                      <div className="due-date">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="assignment-description">{assignment.description}</p>
                  </div>
                  <div className="assignment-card-footer">
                    <div className="assignment-status status-active">
                      {submissionsByAssignment[assignment.id]?.length || 0} Submissions
                    </div>
                    <Link to={`/assignments/${assignment.id}`} className="view-assignment-link">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <h2>No Submissions Yet</h2>
              <p>Once students submit their assignments, they will appear here.</p>
            </div>
          ) : (
            <div className="dashboard-cards">
              {submissions.map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignmentId) || {};
                return (
                  <div key={submission.id} className="assignment-card">
                    <div className="assignment-card-content">
                      <h2>{assignment.title || `Assignment ${submission.assignmentId}`}</h2>
                      <div className="assignment-card-meta">
                        <span>Student: {submission.studentName}</span>
                        <div className="due-date">
                          Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="assignment-card-footer">
                      <div className={`assignment-status ${submission.status === 'graded' ? 'status-completed' : 'status-pending'}`}>
                        {submission.status}
                      </div>
                      {submission.status === 'pending' ? (
                        <Link to={`/assignments/${submission.assignmentId}/grade/${submission.id}`} className="view-assignment-link">
                          Grade Now
                        </Link>
                      ) : (
                        <Link to={`/feedback/${submission.id}`} className="view-assignment-link">
                          View Feedback
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StudentDashboard = ({ assignments, submissions, feedback, activeTab, setActiveTab }) => {
  // Filter assignments that are not yet submitted
  const submittedAssignmentIds = submissions.map(s => s.assignmentId);
  const pendingAssignments = assignments.filter(a => !submittedAssignmentIds.includes(a.id));
  
  return (
    <div className="student-dashboard">
      <div className="dashboard-tabs">
        <div 
          className={`dashboard-tab ${activeTab === 'pending' ? 'active' : ''}`} 
          onClick={() => setActiveTab('pending')}
        >
          Pending Assignments
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'submissions' ? 'active' : ''}`} 
          onClick={() => setActiveTab('submissions')}
        >
          Your Submissions
        </div>
        <div 
          className={`dashboard-tab ${activeTab === 'feedback' ? 'active' : ''}`} 
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </div>
      </div>

      {activeTab === 'pending' && (
        <>
          {pendingAssignments.length === 0 ? (
            <div className="empty-state">
              <h2>No Pending Assignments</h2>
              <p>You've completed all your assignments. Great job!</p>
            </div>
          ) : (
            <div className="dashboard-cards">
              {pendingAssignments.map(assignment => (
                <div key={assignment.id} className="assignment-card">
                  <div className="assignment-card-content">
                    <h2>{assignment.title}</h2>
                    <div className="assignment-card-meta">
                      <div className="due-date">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="assignment-description">{assignment.description}</p>
                  </div>
                  <div className="assignment-card-footer">
                    <div className="assignment-status status-pending">
                      Not Submitted
                    </div>
                    <Link to={`/assignments/${assignment.id}/submit`} className="view-assignment-link">
                      Submit Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'submissions' && (
        <>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <h2>No Submissions Yet</h2>
              <p>You haven't submitted any assignments yet.</p>
            </div>
          ) : (
            <div className="dashboard-cards">
              {submissions.map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignmentId) || {};
                return (
                  <div key={submission.id} className="assignment-card">
                    <div className="assignment-card-content">
                      <h2>{assignment.title || `Assignment ${submission.assignmentId}`}</h2>
                      <div className="assignment-card-meta">
                        <div className="due-date">
                          Submitted: {new Date(submission.submissionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="assignment-card-footer">
                      <div className={`assignment-status ${submission.status === 'graded' ? 'status-completed' : 'status-pending'}`}>
                        {submission.status === 'graded' ? 'Graded' : 'Pending Feedback'}
                      </div>
                      {submission.status === 'graded' ? (
                        <Link to={`/feedback/${submission.id}`} className="view-assignment-link">
                          View Feedback
                        </Link>
                      ) : (
                        <span className="view-assignment-link" style={{ opacity: 0.5 }}>
                          Awaiting Feedback
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'feedback' && (
        <>
          {feedback.length === 0 ? (
            <div className="empty-state">
              <h2>No Feedback Yet</h2>
              <p>Once your assignments are graded, feedback will appear here.</p>
            </div>
          ) : (
            <div className="dashboard-cards">
              {feedback.map(item => {
                const assignment = assignments.find(a => a.id === item.assignmentId) || {};
                // Handle different feedback data structures
                const feedbackData = item.feedback || item;
                const score = feedbackData.totalScore || item.score || 70;
                const summary = feedbackData.overallFeedback || item.summary || "Feedback has been provided for your submission.";
                
                return (
                  <div key={item.id} className="assignment-card">
                    <div className="assignment-card-content">
                      <h2>{assignment.title || `Assignment ${item.assignmentId}`}</h2>
                      <div className="assignment-card-meta">
                        <div className="due-date">
                          Graded: {new Date(item.gradedDate || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="assignment-description">{summary}</p>
                    </div>
                    <div className="assignment-card-footer">
                      <div className="assignment-status status-completed">
                        Score: {score}%
                      </div>
                      <Link to={`/feedback/${item.submissionId}`} className="view-assignment-link">
                        View Full Feedback
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard; 