import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateAssignment.css';
import config from '../config';

const CreateAssignment = ({ user }) => {
  const navigate = useNavigate();
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [rubric, setRubric] = useState({});
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setAssignmentData({
      ...assignmentData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRubricChange = (key, value) => {
    setRubric({
      ...rubric,
      [key]: value
    });
  };

  const handleAddRubricItem = () => {
    const newKey = `item${Object.keys(rubric).length + 1}`;
    setRubric({
      ...rubric,
      [newKey]: ''
    });
  };

  const handleRemoveRubricItem = (keyToRemove) => {
    const updatedRubric = { ...rubric };
    delete updatedRubric[keyToRemove];
    setRubric(updatedRubric);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('title', assignmentData.title);
    formData.append('description', assignmentData.description);
    formData.append('dueDate', assignmentData.dueDate);
    
    // Add rubric if provided
    if (Object.keys(rubric).length > 0) {
      formData.append('rubric', JSON.stringify(rubric));
    }
    
    // Add file if provided
    if (file) {
      formData.append('assignmentFile', file);
    }
    
    try {
      // Use mock data for temporary demonstration
      const useTemporaryMockData = true;
      
      if (useTemporaryMockData) {
        // Create mock assignment
        console.log('Using mock assignment creation');
        setTimeout(() => {
          setIsSubmitting(false);
          setSuccess(true);
          // Navigate back after a delay
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }, 1000);
        return;
      }
      
      // Use config for API URL
      const response = await fetch(`${config.ENDPOINTS.ASSIGNMENTS}`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create assignment');
      }
      
      setSuccess(true);
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error creating assignment:', error);
      setError('Failed to create assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-assignment-container">
      <h1>Create New Assignment</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form className="assignment-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Assignment Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={assignmentData.title}
            onChange={handleChange}
            required
            placeholder="Enter a title for your assignment"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={assignmentData.description}
            onChange={handleChange}
            required
            placeholder="Provide instructions and details about the assignment"
            rows="5"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={assignmentData.dueDate}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="assignmentFile">Assignment File (Optional)</label>
          <input
            type="file"
            id="assignmentFile"
            name="assignmentFile"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
          />
          <p className="file-help">
            Upload a PDF, Word document, or text file with assignment details or questions
          </p>
        </div>
        
        <div className="rubric-section">
          <h2>Grading Rubric</h2>
          <p className="rubric-help">
            Define grading criteria for the AI to evaluate student submissions
          </p>
          
          {Object.entries(rubric).map(([key, value]) => (
            <div key={key} className="rubric-item">
              <div className="rubric-item-header">
                <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                {Object.keys(rubric).length > 1 && (
                  <button 
                    type="button" 
                    className="remove-rubric-button"
                    onClick={() => handleRemoveRubricItem(key)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                id={key}
                name={key}
                value={value}
                onChange={(e) => handleRubricChange(key, e.target.value)}
                required
                placeholder="Describe this grading criterion"
                rows="2"
              ></textarea>
            </div>
          ))}
          
          <button 
            type="button" 
            className="add-rubric-button"
            onClick={handleAddRubricItem}
          >
            + Add Rubric Item
          </button>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => navigate('/')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="create-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>
      
      <div className="ai-grading-note">
        <h3>About AI Grading</h3>
        <p>
          Your assignment will be set up for automated grading based on the rubric you define.
          The AI will use these criteria to provide consistent and objective feedback to students.
        </p>
      </div>
    </div>
  );
};

export default CreateAssignment; 