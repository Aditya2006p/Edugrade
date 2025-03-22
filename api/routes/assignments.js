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
        console.log(`Grading submission for student ${studentId} on assignment ${assignmentId}`);
        
        // Call AI service to grade the submission with timeout
        const gradePromise = gradeSubmission(submissionText, req.body.rubric);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Grading timed out after 20 seconds')), 20000)
        );
        
        // Race between grading and timeout
        const feedback = await Promise.race([gradePromise, timeoutPromise])
          .catch(error => {
            console.error('Error during grading:', error.message);
            // If there's an error, use fallback grading
            return generateFallbackGrading(submissionText, req.body.rubric || {
              'Content': 'Quality of content',
              'Organization': 'Structure and flow',
              'Completion': 'Completeness of submission'
            });
          });
        
        // Store feedback
        const feedbackEntry = {
          id: Date.now(),
          submissionId: submission.id,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          feedback,
          submissionDate: submission.submissionDate,
          gradedDate: new Date(),
          gradingMethod: feedback.isAIFallback ? 'fallback' : 'ai'
        };
        
        global.feedback.push(feedbackEntry);
        
        // Update submission status
        submission.status = 'graded';
        
        // Log success
        console.log(`Successfully graded submission ${submission.id} with method: ${feedbackEntry.gradingMethod}`);
      } catch (gradeError) {
        console.error('Failed to grade submission:', gradeError);
        // Don't update status - leave as pending for manual grading
      }
    }

    res.status(201).json({
      status: 'success',
      message: 'Assignment submitted successfully',
      data: submission
    });
    
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit assignment',
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
    const feedback = await gradeSubmission(textToGrade, rubric);
    
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

// Updated gradeSubmission function with improved error handling
async function gradeSubmission(submissionText, rubric) {
  // Use default rubric if none is provided
  const defaultRubric = {
    'Content Quality': 'Assess the depth, clarity, and relevance of the content',
    'Organization': 'Evaluate the structure and flow of ideas',
    'Grammar & Mechanics': 'Check for proper grammar, spelling, and punctuation',
    'Critical Thinking': 'Assess analysis, synthesis, and evaluation of ideas'
  };

  const gradingRubric = rubric || defaultRubric;

  try {
    // Construct prompt for AI
    const prompt = `
    Grade the following student submission according to this rubric:
    ${JSON.stringify(gradingRubric, null, 2)}
    
    Student submission:
    "${submissionText}"
    
    Provide feedback in JSON format with the following structure:
    1. Specific feedback for each rubric item
    2. Overall feedback with constructive comments
    3. Score for each rubric item (1-100)
    4. Total score as a percentage
    
    Format the response as JSON.
    `;
    
    try {
      // Check if genAI is available globally
      if (!global.genAI) {
        console.warn('Gemini AI not initialized - using fallback grading');
        return generateFallbackGrading(submissionText, gradingRubric);
      }
      
      // Get the Gemini model
      const model = global.genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
      
      // Generate content with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timed out after 15 seconds')), 15000)
      );
      
      const generatePromise = model.generateContent(prompt);
      
      // Race between generation and timeout
      const result = await Promise.race([generatePromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse the response as JSON
      try {
        // Extract JSON portion if it's wrapped in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
        const jsonText = jsonMatch[1].trim();
        return JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', text);
        // Return the text response if JSON parsing fails
        return {
          rawFeedback: text,
          error: 'Failed to parse structured feedback',
          totalScore: 75 // Provide a default score
        };
      }
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      // Return a fallback grading response if the API fails
      return generateFallbackGrading(submissionText, gradingRubric);
    }
  } catch (error) {
    console.error('AI grading error:', error);
    // Instead of throwing, return a fallback response
    return generateFallbackGrading(submissionText, rubric || defaultRubric);
  }
}

// Fallback function to generate grading when AI fails
function generateFallbackGrading(submissionText, rubric) {
  console.log('Using fallback grading mechanism');
  
  // Extract rubric criteria
  const rubricKeys = Object.keys(rubric);
  
  // Create a basic feedback structure
  const feedback = {
    overallFeedback: "Your submission has been received. Due to technical issues, this is an automated placeholder feedback. Your instructor will review your work soon.",
    totalScore: 70,
    rubricFeedback: {}
  };
  
  // Generate placeholder feedback for each rubric item
  rubricKeys.forEach(key => {
    const score = Math.floor(Math.random() * 20) + 60; // Random score between 60-80
    feedback.rubricFeedback[key] = {
      score: score,
      comments: `Your work has been evaluated on ${key}. The instructor will provide more detailed feedback soon.`
    };
  });
  
  // Add a timestamp for tracking
  feedback.generatedAt = new Date().toISOString();
  feedback.isAIFallback = true;
  
  // If the submission is very short, add a note about insufficient content
  if (submissionText && submissionText.length < 100) {
    feedback.overallFeedback += " Note: Your submission appears to be quite brief. Consider providing more detailed responses in future assignments.";
    feedback.totalScore = Math.max(60, feedback.totalScore - 10); // Reduce score for very short submissions
  }
  
  return feedback;
}

module.exports = router; 