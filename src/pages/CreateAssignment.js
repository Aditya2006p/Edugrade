import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CreateAssignment.css';

const CreateAssignment = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    rubric: {
      understanding: 'Shows complete understanding of the concepts',
      methodology: 'Uses appropriate methods to solve problems',
      presentation: 'Work is well-organized and clearly presented'
    }
  });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAssignmentFile(file);
  };

  const handleRubricChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      rubric: {
        ...formData.rubric,
        [name]: value
      }
    });
  };

  const handleAddRubricItem = () => {
    const newItemName = `item${Object.keys(formData.rubric).length + 1}`;
    setFormData({
      ...formData,
      rubric: {
        ...formData.rubric,
        [newItemName]: ''
      }
    });
  };

  const handleRemoveRubricItem = (key) => {
    const updatedRubric = { ...formData.rubric };
    delete updatedRubric[key];
    setFormData({
      ...formData,
      rubric: updatedRubric
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.values(formData.rubric).some(item => !item.trim())) {
      setError('Please fill in all rubric items or remove empty ones');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create a FormData object for multipart/form-data submission (required for file upload)
      const submitFormData = new FormData();
      
      // Add text fields
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('dueDate', formData.dueDate);
      submitFormData.append('rubric', JSON.stringify(formData.rubric));
      
      // Add file if one was selected
      if (assignmentFile) {
        submitFormData.append('assignmentFile', assignmentFile);
      }
      
      // Send the request without Content-Type header (browser will set it with boundary)
      const response = await fetch('http://localhost:5001/api/assignments', {
        method: 'POST',
        body: submitFormData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create assignment');
      }
      
      setSuccess('Assignment created successfully!');
      
      // Navigate to assignment details after a delay
      setTimeout(() => {
        navigate(`/assignments/${data.data.id}`);
      }, 1500);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
            value={formData.title}
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
            value={formData.description}
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
            value={formData.dueDate}
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
          
          {Object.entries(formData.rubric).map(([key, value]) => (
            <div key={key} className="rubric-item">
              <div className="rubric-item-header">
                <label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                {Object.keys(formData.rubric).length > 1 && (
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
                onChange={handleRubricChange}
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
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Assignment'}
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