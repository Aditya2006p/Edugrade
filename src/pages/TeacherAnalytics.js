import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/TeacherAnalytics.css';
import config from '../config';

// Donut chart component to visualize grade distribution
const GradeDistributionChart = ({ distribution }) => {
  const colors = {
    'A (90-100)': '#4CAF50',
    'B (80-89)': '#8BC34A',
    'C (70-79)': '#FFC107',
    'D (60-69)': '#FF9800',
    'F (0-59)': '#F44336'
  };
  
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return <div className="empty-chart">No grade data available</div>;
  
  let cumulativePercentage = 0;
  
  return (
    <div className="grade-distribution-chart">
      <div className="donut-chart">
        {Object.entries(distribution).map(([grade, count]) => {
          const percentage = Math.round((count / total) * 100);
          if (percentage === 0) return null;
          
          const startPercentage = cumulativePercentage;
          cumulativePercentage += percentage;
          
          return (
            <div 
              key={grade}
              className="donut-segment"
              style={{
                '--start-percentage': startPercentage,
                '--end-percentage': cumulativePercentage,
                '--color': colors[grade]
              }}
              title={`${grade}: ${count} students (${percentage}%)`}
            ></div>
          );
        })}
        <div className="donut-hole"></div>
      </div>
      
      <div className="grade-legend">
        {Object.entries(distribution).map(([grade, count]) => (
          <div key={grade} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: colors[grade] }}></span>
            <span className="legend-label">{grade}: {count} ({Math.round((count / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Table component to display submissions with batch grading controls
const SubmissionsTable = ({ submissions, onBatchGrade, selectedSubmissions, setSelectedSubmissions }) => {
  const toggleAll = () => {
    if (selectedSubmissions.length === submissions.length) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(submissions.map(s => s.id));
    }
  };
  
  const toggleSubmission = (submissionId) => {
    if (selectedSubmissions.includes(submissionId)) {
      setSelectedSubmissions(selectedSubmissions.filter(id => id !== submissionId));
    } else {
      setSelectedSubmissions([...selectedSubmissions, submissionId]);
    }
  };
  
  if (!submissions || submissions.length === 0) {
    return <div className="empty-message">No submissions found</div>;
  }
  
  return (
    <div className="submissions-table-container">
      <table className="submissions-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedSubmissions.length === submissions.length}
                onChange={toggleAll}
              />
            </th>
            <th>Student</th>
            <th>Submission Date</th>
            <th>Status</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(submission => {
            const isPending = submission.status === 'pending';
            return (
              <tr key={submission.id} className={isPending ? 'pending-row' : ''}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedSubmissions.includes(submission.id)}
                    onChange={() => toggleSubmission(submission.id)}
                    disabled={!isPending}
                  />
                </td>
                <td>{submission.studentName}</td>
                <td>{new Date(submission.submissionDate).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${submission.status}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </td>
                <td>
                  {submission.score ? 
                    `${submission.score}%` : 
                    submission.status === 'graded' ? 'Graded' : '-'}
                </td>
                <td>
                  <Link to={`/feedback/${submission.id}`} className="view-feedback-link">
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="batch-actions">
        <button 
          className="batch-grade-button"
          disabled={selectedSubmissions.length === 0}
          onClick={onBatchGrade}
        >
          {selectedSubmissions.length > 0 
            ? `Grade ${selectedSubmissions.length} Selected Submissions` 
            : 'Select Submissions to Grade'}
        </button>
      </div>
    </div>
  );
};

// Class insights component to display trends and recommendations
const ClassInsights = ({ analytics }) => {
  if (!analytics || analytics.empty) {
    return <div className="empty-insights">No analytics data available</div>;
  }
  
  return (
    <div className="class-insights">
      <div className="insights-section">
        <h3>Class Performance</h3>
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-value">{analytics.scoreStats.average}%</div>
            <div className="stat-label">Class Average</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.scoreStats.median}%</div>
            <div className="stat-label">Median Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.scoreStats.standardDeviation}</div>
            <div className="stat-label">Standard Deviation</div>
          </div>
        </div>
      </div>
      
      <div className="insights-section">
        <h3>Class Trends</h3>
        <div className="trends-container">
          <div className="trend-column">
            <h4>Common Strengths</h4>
            <ul className="trend-list strengths">
              {analytics.classTrends.commonStrengths.length > 0 ? 
                analytics.classTrends.commonStrengths.map((strength, i) => (
                  <li key={i}>{strength}</li>
                )) : 
                <li className="empty-trend">No common strengths identified</li>
              }
            </ul>
          </div>
          <div className="trend-column">
            <h4>Areas for Improvement</h4>
            <ul className="trend-list weaknesses">
              {analytics.classTrends.commonWeaknesses.length > 0 ? 
                analytics.classTrends.commonWeaknesses.map((weakness, i) => (
                  <li key={i}>{weakness}</li>
                )) : 
                <li className="empty-trend">No common weaknesses identified</li>
              }
            </ul>
          </div>
        </div>
      </div>
      
      <div className="insights-section">
        <h3>Teaching Recommendations</h3>
        <div className="recommendation-card">
          <h4>Recommended Focus Area</h4>
          <p>{analytics.recommendedFocus || "No specific focus area recommended at this time"}</p>
          
          <h4>Suggested Actions</h4>
          <ul className="action-list">
            {analytics.classTrends.commonWeaknesses.length > 0 ? (
              <>
                <li>
                  Allocate additional class time to review {analytics.classTrends.commonWeaknesses[0]}
                </li>
                <li>
                  Provide supplemental materials addressing common weaknesses
                </li>
                <li>
                  Consider adjusting future lessons to reinforce these concepts
                </li>
              </>
            ) : (
              <li>Continue with current teaching plan</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

const TeacherAnalytics = ({ user }) => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState([]);
  const [batchGrading, setBatchGrading] = useState(false);
  const [gradingProgress, setGradingProgress] = useState({ total: 0, completed: 0 });
  const [completionStats, setCompletionStats] = useState(null);
  
  // Mock data for offline/demo mode
  const mockAssignment = {
    id: parseInt(id) || 1,
    title: "Mathematical Problem Solving",
    description: "Solve a set of algebraic equations and explain your reasoning.",
    dueDate: "2025-04-01",
    hasAttachment: false,
    rubric: {
      understanding: "Shows complete understanding of the concepts",
      methodology: "Uses appropriate methods to solve problems",
      presentation: "Work is well-organized and clearly presented"
    }
  };
  
  const mockSubmissions = [
    { 
      id: 101, 
      assignmentId: parseInt(id) || 1, 
      studentId: "student1", 
      studentName: "Alice Johnson", 
      submissionDate: "2025-03-25", 
      status: "graded" 
    },
    { 
      id: 102, 
      assignmentId: parseInt(id) || 1, 
      studentId: "student2", 
      studentName: "Bob Smith", 
      submissionDate: "2025-03-26", 
      status: "pending" 
    },
    { 
      id: 103, 
      assignmentId: parseInt(id) || 1, 
      studentId: "student3", 
      studentName: "Charlie Davis", 
      submissionDate: "2025-03-27", 
      status: "graded" 
    }
  ];
  
  const mockAnalytics = {
    averageScore: 82,
    gradeDistribution: {
      "90-100": 5,
      "80-89": 8,
      "70-79": 4,
      "60-69": 2,
      "Below 60": 1
    },
    commonIssues: [
      "Difficulty with problem interpretation",
      "Incomplete methodologies",
      "Lack of detailed explanations"
    ],
    strengths: [
      "Creative approaches to problem solving",
      "Clear mathematical notation",
      "Logical reasoning"
    ]
  };
  
  const mockCompletionStats = {
    submitted: 15,
    total: 20,
    graded: 12,
    pending: 3
  };
  
  // Fetch assignment details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use mock data for offline/demo mode
        const useTemporaryMockData = true;
        
        if (useTemporaryMockData) {
          // Set mock data
          setTimeout(() => {
            setAssignment(mockAssignment);
            setSubmissions(mockSubmissions);
            setAnalytics(mockAnalytics);
            setCompletionStats(mockCompletionStats);
            setLoading(false);
          }, 800);
          return;
        }
        
        // Fetch assignment
        const assignmentResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}`);
        const assignmentData = await assignmentResponse.json();
        
        if (assignmentData.status === 'success') {
          setAssignment(assignmentData.data);
        } else {
          throw new Error('Failed to load assignment details');
        }
        
        // Fetch submissions
        const submissionsResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/submissions`);
        const submissionsData = await submissionsResponse.json();
        
        if (submissionsData.status === 'success') {
          setSubmissions(submissionsData.data);
        } else {
          throw new Error('Failed to load submissions');
        }
        
        // Fetch analytics
        const analyticsResponse = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/analytics`);
        const analyticsData = await analyticsResponse.json();
        
        if (analyticsData.status === 'success') {
          setAnalytics(analyticsData.data.analytics);
          setCompletionStats(analyticsData.data.completionStats);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message || 'Error loading analytics data');
        
        // Fallback to mock data on error
        setAssignment(mockAssignment);
        setSubmissions(mockSubmissions);
        setAnalytics(mockAnalytics);
        setCompletionStats(mockCompletionStats);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Batch grade selected submissions
  const handleBatchGrade = async () => {
    if (selectedSubmissions.length === 0) return;
    
    try {
      setBatchGrading(true);
      setGradingProgress({ total: selectedSubmissions.length, completed: 0 });
      
      // Use mock data for offline/demo mode
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        // Simulate batch grading process
        const totalSelected = selectedSubmissions.length;
        
        for (let i = 0; i < totalSelected; i++) {
          // Update progress
          setTimeout(() => {
            setGradingProgress({ total: totalSelected, completed: i + 1 });
            
            // If this is the last item, finish the process
            if (i === totalSelected - 1) {
              setBatchGrading(false);
              // Update submissions to show all as graded
              setSubmissions(submissions.map(sub => 
                selectedSubmissions.includes(sub.id) ? { ...sub, status: 'graded' } : sub
              ));
              setSelectedSubmissions([]);
            }
          }, 1000 * (i + 1));
        }
        return;
      }
      
      // Real API call
      const response = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}/${id}/batch-grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionIds: selectedSubmissions
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update submissions with newly graded ones
        const gradedSubmissionIds = data.data.graded.map(g => g.submission.id);
        
        setSubmissions(prevSubmissions => 
          prevSubmissions.map(submission => {
            if (gradedSubmissionIds.includes(submission.id)) {
              const gradedSubmission = data.data.graded.find(g => g.submission.id === submission.id);
              return {
                ...submission,
                status: 'graded',
                score: gradedSubmission.feedback.feedback.totalScore
              };
            }
            return submission;
          })
        );
        
        // Update analytics with new data
        setAnalytics(data.data.analytics);
        
        // Clear selection
        setSelectedSubmissions([]);
        
        // Show success message
        alert(`Successfully graded ${data.data.graded.length} submissions`);
      } else {
        throw new Error(data.message || 'Failed to grade submissions');
      }
    } catch (error) {
      console.error('Batch grading error:', error);
      setError(error.message || 'Error during batch grading');
    } finally {
      setBatchGrading(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Loading analytics data...</div>;
  }
  
  if (!assignment) {
    return <div className="error">Assignment not found</div>;
  }
  
  return (
    <div className="teacher-analytics-container">
      <header className="analytics-header">
        <h1>Class Analytics: {assignment.title}</h1>
        <p className="assignment-meta">
          Due: {new Date(assignment.dueDate).toLocaleDateString()}
          {completionStats && ` | Completion Rate: ${completionStats.gradingRate}% (${completionStats.graded}/${completionStats.total})`}
        </p>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      {batchGrading && (
        <div className="grading-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(gradingProgress.completed / gradingProgress.total) * 100}%` }}></div>
          </div>
          <p>Grading {gradingProgress.completed} of {gradingProgress.total} submissions...</p>
        </div>
      )}
      
      <div className="analytics-grid">
        <section className="grade-distribution-section">
          <h2>Grade Distribution</h2>
          {analytics && analytics.gradeDistribution ? (
            <GradeDistributionChart distribution={analytics.gradeDistribution} />
          ) : (
            <div className="empty-chart">No grade data available</div>
          )}
        </section>
        
        <section className="submissions-section">
          <h2>Student Submissions</h2>
          <SubmissionsTable 
            submissions={submissions} 
            onBatchGrade={handleBatchGrade}
            selectedSubmissions={selectedSubmissions}
            setSelectedSubmissions={setSelectedSubmissions}
          />
        </section>
        
        <section className="insights-section">
          <h2>Class Insights & Recommendations</h2>
          <ClassInsights analytics={analytics} />
        </section>
      </div>
    </div>
  );
};

export default TeacherAnalytics; 