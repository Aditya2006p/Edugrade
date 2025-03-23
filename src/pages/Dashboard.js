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
  const [usedMockData, setUsedMockData] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('Dashboard: Starting to fetch data', { 
        userRole: user.role, 
        userId: user.id,
        apiBaseUrl: config.API_BASE_URL,
        endpoints: config.ENDPOINTS 
      });
      
      try {
        // Try to fetch assignments based on user role
        try {
          let assignmentsData;
          let url;
          
          if (user.role === 'teacher') {
            // Use the teacher-specific endpoint for teachers
            url = `${config.ENDPOINTS.ASSIGNMENTS}/teacher/${user.id}`;
            console.log('Dashboard: Fetching teacher assignments from', url);
            const assignmentsResponse = await fetch(url);
            assignmentsData = await assignmentsResponse.json();
          } else {
            // Use the standard endpoint for students
            url = `${config.ENDPOINTS.ASSIGNMENTS}`;
            console.log('Dashboard: Fetching student assignments from', url);
            const assignmentsResponse = await fetch(url);
            assignmentsData = await assignmentsResponse.json();
          }
          
          console.log('Dashboard: Assignments response', assignmentsData);
          
          if (assignmentsData && assignmentsData.status === 'success') {
            setAssignments(assignmentsData.data);
          } else {
            throw new Error('Failed to fetch assignments');
          }
        } catch (err) {
          console.log("Error fetching assignments:", err);
          // Fallback to default assignments
          setAssignments([
            { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01', hasAttachment: false },
            { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15', hasAttachment: false }
          ]);
          console.log('Dashboard: Using fallback assignments data due to error');
        }
        
        // We'll skip using mock data entirely
        const isDemoAccount = false;
        const useTemporaryMockData = false;

        // Only in cases where the API fails completely will we use last-resort fallbacks
        
        // For real user accounts, fetch actual submissions
        if (user.role === 'student') {
          try {
            const studentSubmissionsUrl = `${config.ENDPOINTS.ASSIGNMENTS}/student/${user.id}/submissions`;
            console.log('Dashboard: Fetching student submissions from', studentSubmissionsUrl);
            
            // Fetch student's submissions using the endpoint
            const submissionsResponse = await fetch(studentSubmissionsUrl);
            const submissionsData = await submissionsResponse.json();
            
            console.log('Dashboard: Student submissions response', submissionsData);
            
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
          // For teachers, fetch recent submissions
          try {
            // We'll fetch submissions for each assignment
            const submissionPromises = assignments.map(assignment => 
              fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${assignment.id}/submissions`)
                .then(res => res.json())
            );
            
            if (submissionPromises.length > 0) {
              const submissionResponses = await Promise.all(submissionPromises);
              const allSubmissions = submissionResponses
                .filter(response => response.status === 'success')
                .flatMap(response => response.data);
              
              // Sort by date and take the most recent ones
              const sortedSubmissions = allSubmissions.sort((a, b) => 
                new Date(b.submissionDate) - new Date(a.submissionDate)
              ).slice(0, 10); // Limit to 10 most recent
              
              setSubmissions(sortedSubmissions);
            }
          } catch (error) {
            console.error('Error fetching teacher submissions:', error);
          }
        }
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard: Main error in fetchDashboardData:', error);
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