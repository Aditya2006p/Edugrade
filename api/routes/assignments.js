const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Configure Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-placeholder');

// GET all assignments
router.get('/', (req, res) => {
  // In a real app, this would fetch from a database
  res.json({ 
    status: 'success',
    message: 'Assignments retrieved successfully',
    data: [
      { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01' },
      { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15' }
    ]
  });
});

// GET a single assignment
router.get('/:id', (req, res) => {
  // In a real app, this would fetch from a database
  res.json({ 
    status: 'success',
    message: 'Assignment retrieved successfully',
    data: { 
      id: req.params.id, 
      title: 'Math Assignment', 
      description: 'Solve algebra problems', 
      dueDate: '2025-04-01',
      rubric: {
        understanding: 'Shows complete understanding of the concepts',
        methodology: 'Uses appropriate methods to solve problems',
        presentation: 'Work is well-organized and clearly presented'
      }
    }
  });
});

// POST create a new assignment
router.post('/', (req, res) => {
  const { title, description, dueDate, rubric } = req.body;
  // In a real app, this would save to a database
  res.status(201).json({ 
    status: 'success',
    message: 'Assignment created successfully',
    data: { id: Date.now(), title, description, dueDate, rubric }
  });
});

// PUT update an assignment
router.put('/:id', (req, res) => {
  const { title, description, dueDate, rubric } = req.body;
  // In a real app, this would update in a database
  res.json({ 
    status: 'success',
    message: 'Assignment updated successfully',
    data: { id: req.params.id, title, description, dueDate, rubric }
  });
});

// DELETE an assignment
router.delete('/:id', (req, res) => {
  // In a real app, this would delete from a database
  res.json({ 
    status: 'success',
    message: 'Assignment deleted successfully',
    data: { id: req.params.id }
  });
});

// POST submit an assignment (student)
router.post('/:id/submit', upload.single('submission'), async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.body.studentId;
    const studentName = req.body.studentName || 'Anonymous Student';
    const submissionText = req.body.text || '';
    let filePath = '';
    
    if (req.file) {
      filePath = req.file.path;
    }

    // Create submission object
    const submission = {
      id: Date.now(), // Simple ID generation
      assignmentId: parseInt(assignmentId) || assignmentId,
      studentId,
      studentName,
      submissionText,
      filePath: req.file ? req.file.filename : null,
      submissionDate: new Date(),
      status: 'pending'
    };
    
    // Store submission in global array
    global.submissions.push(submission);
    
    // Automatically grade text submissions using AI
    if (submissionText) {
      try {
        // Call AI service to grade the submission
        const feedback = await gradeSubmission(assignmentId, submissionText);
        
        // Store feedback
        const feedbackEntry = {
          id: Date.now(),
          submissionId: submission.id,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          feedback,
          submissionDate: submission.submissionDate,
          gradedDate: new Date()
        };
        
        global.feedback.push(feedbackEntry);
        
        // Update submission status
        submission.status = 'graded';
        
        res.status(201).json({
          status: 'success',
          message: 'Assignment submitted and graded successfully',
          data: {
            submission,
            feedback: feedbackEntry
          }
        });
      } catch (error) {
        console.error('Grading error:', error);
        res.status(201).json({
          status: 'success',
          message: 'Assignment submitted successfully, but automatic grading failed',
          data: submission
        });
      }
    } else {
      res.status(201).json({
        status: 'success',
        message: 'Assignment submitted successfully, awaiting grading',
        data: submission
      });
    }
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error submitting assignment',
      error: error.message
    });
  }
});

// POST grade an assignment (teacher or automated)
router.post('/:id/grade', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { submissionId, submissionText, rubric } = req.body;
    
    // Find the submission
    const submission = global.submissions.find(s => s.id === parseInt(submissionId));
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }
    
    // Use submission text from the request or from the stored submission
    const textToGrade = submissionText || submission.submissionText;
    
    // Call AI service to grade the submission
    const feedback = await gradeSubmission(assignmentId, textToGrade, rubric);
    
    // Create and store feedback
    const feedbackEntry = {
      id: Date.now(),
      submissionId: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      feedback,
      submissionDate: submission.submissionDate,
      gradedDate: new Date()
    };
    
    global.feedback.push(feedbackEntry);
    
    // Update submission status
    submission.status = 'graded';
    
    res.json({
      status: 'success',
      message: 'Assignment graded successfully',
      data: {
        submission,
        feedback: feedbackEntry
      }
    });
  } catch (error) {
    console.error('Grading error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error grading assignment',
      error: error.message
    });
  }
});

// GET submissions for an assignment
router.get('/:id/submissions', (req, res) => {
  const assignmentId = req.params.id;
  
  // Convert to number if possible for easier comparison
  const assignmentIdNum = parseInt(assignmentId);
  const targetId = isNaN(assignmentIdNum) ? assignmentId : assignmentIdNum;
  
  // Filter submissions for this assignment
  const filteredSubmissions = global.submissions.filter(
    sub => sub.assignmentId === targetId || sub.assignmentId === assignmentId
  );
  
  res.json({
    status: 'success',
    message: 'Submissions retrieved successfully',
    data: filteredSubmissions
  });
});

// GET submissions for a specific student
router.get('/student/:studentId/submissions', (req, res) => {
  const studentId = req.params.studentId;
  
  // Filter submissions for this student
  const studentSubmissions = global.submissions.filter(
    submission => submission.studentId === studentId
  );
  
  res.json({
    status: 'success',
    message: 'Student submissions retrieved successfully',
    data: studentSubmissions
  });
});

// AI grading function using Google's Generative AI
async function gradeSubmission(assignmentId, submissionText, rubric = null) {
  try {
    // Default rubric if none provided
    const defaultRubric = {
      understanding: 'Shows complete understanding of the concepts',
      methodology: 'Uses appropriate methods to solve problems',
      presentation: 'Work is well-organized and clearly presented'
    };
    
    const gradingRubric = rubric || defaultRubric;
    
    // Format the rubric for the prompt
    const rubricText = Object.entries(gradingRubric)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    // Create the prompt for the AI
    const prompt = `
    As an AI teaching assistant, please grade the following student submission based on the given rubric.
    
    Assignment ID: ${assignmentId}
    
    Rubric:
    ${rubricText}
    
    Student Submission:
    ${submissionText}
    
    Please provide:
    1. A numerical score for each rubric item (1-10)
    2. Specific feedback for each rubric item
    3. Overall feedback with suggestions for improvement
    4. Total score as a percentage
    
    Format the response as JSON.
    `;
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the response as JSON
    try {
      // Extract JSON portion if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
      const jsonText = jsonMatch[1].trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
      // Return the text response if JSON parsing fails
      return {
        rawFeedback: text,
        error: 'Failed to parse structured feedback'
      };
    }
  } catch (error) {
    console.error('AI grading error:', error);
    throw new Error('Failed to generate AI feedback');
  }
}

module.exports = router; 