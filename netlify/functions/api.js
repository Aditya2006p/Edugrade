const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// In-memory data store (would be replaced by a database in production)
global.submissions = global.submissions || [];
global.feedback = global.feedback || [];
global.assignments = global.assignments || [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Google Generative AI
let genAI;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.error('WARNING: GEMINI_API_KEY is not set in environment variables');
    console.error('AI-powered grading will fall back to manual assessment');
  } else if (process.env.GEMINI_API_KEY.startsWith('AIza')) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
  } else {
    console.error('WARNING: GEMINI_API_KEY appears to be invalid (should start with "AIza")');
    console.error('AI-powered grading will fall back to manual assessment');
  }
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error.message);
}

// Make genAI available globally
global.genAI = genAI;

// Add a root path response
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EduGrade API is running at /.netlify/functions/api' });
});

// Basic health route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EduGrade API is running' });
});

// Test route to verify student data is working
app.get('/test/student', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Student test data retrieved successfully',
    data: {
      assignments: [
        { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01', hasAttachment: false },
        { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15', hasAttachment: false }
      ],
      submissions: [
        { id: 101, assignmentId: 1, submissionDate: '2025-03-25', status: 'graded' },
        { id: 102, assignmentId: 2, submissionDate: '2025-03-26', status: 'pending' }
      ],
      netlifySaysHello: true
    }
  });
});

// Instead of importing from relative paths, we'll define routes here
// Start with assignments routes
const assignmentsRouter = express.Router();

// Configure storage for file uploads - this won't work in serverless functions, but we'll keep it for local testing
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Initialize global assignments with default data if empty
if (!global.assignments || global.assignments.length === 0) {
  console.log('Initializing default assignments in Netlify function');
  global.assignments = [
    { 
      id: 1, 
      title: 'Math Assignment', 
      description: 'Solve algebra problems', 
      dueDate: '2025-04-01', 
      hasAttachment: false,
      teacherId: 'teacher1',
      createdAt: '2023-01-01'
    },
    { 
      id: 2, 
      title: 'English Essay', 
      description: 'Write a 5-paragraph essay', 
      dueDate: '2025-04-15', 
      hasAttachment: false,
      teacherId: 'teacher1',
      createdAt: '2023-01-02'
    }
  ];
}

// GET all assignments
assignmentsRouter.get('/', (req, res) => {
  if (global.assignments && global.assignments.length > 0) {
    return res.json({ 
      status: 'success',
      message: 'Assignments retrieved successfully',
      data: global.assignments
    });
  }
  
  // Return default assignments
  res.json({ 
    status: 'success',
    message: 'Assignments retrieved successfully',
    data: [
      { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01', hasAttachment: false },
      { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15', hasAttachment: false }
    ]
  });
});

// GET assignments for a specific teacher
assignmentsRouter.get('/teacher/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  
  // Filter assignments for this teacher
  const teacherAssignments = global.assignments.filter(
    assignment => assignment.teacherId === teacherId
  );
  
  res.json({
    status: 'success',
    message: 'Teacher assignments retrieved successfully',
    data: teacherAssignments.length > 0 ? teacherAssignments : [
      { id: 1, title: 'Math Assignment', description: 'Solve algebra problems', dueDate: '2025-04-01', hasAttachment: false, teacherId },
      { id: 2, title: 'English Essay', description: 'Write a 5-paragraph essay', dueDate: '2025-04-15', hasAttachment: false, teacherId }
    ]
  });
});

// GET a single assignment
assignmentsRouter.get('/:id', (req, res) => {
  const assignmentId = parseInt(req.params.id);
  
  if (global.assignments) {
    const foundAssignment = global.assignments.find(a => a.id === assignmentId);
    if (foundAssignment) {
      return res.json({ 
        status: 'success',
        message: 'Assignment retrieved successfully',
        data: foundAssignment
      });
    }
  }
  
  res.json({ 
    status: 'success',
    message: 'Assignment retrieved successfully',
    data: { 
      id: req.params.id, 
      title: 'Math Assignment', 
      description: 'Solve algebra problems', 
      dueDate: '2025-04-01',
      hasAttachment: false,
      rubric: {
        understanding: 'Shows complete understanding of the concepts',
        methodology: 'Uses appropriate methods to solve problems',
        presentation: 'Work is well-organized and clearly presented'
      }
    }
  });
});

// POST create a new assignment
assignmentsRouter.post('/', upload.single('assignmentFile'), (req, res) => {
  try {
    const { title, description, dueDate, rubric, teacherId } = req.body;
    
    // Create assignment object
    const assignment = { 
      id: Date.now(),
      title, 
      description, 
      dueDate, 
      rubric: rubric ? JSON.parse(rubric) : null,
      createdAt: new Date(),
      hasAttachment: !!req.file,
      teacherId: teacherId || 'unknown'
    };
    
    // Add file information if a file was uploaded
    if (req.file) {
      assignment.fileInfo = {
        fileName: req.file.filename || `file-${Date.now()}`,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }
    
    // Ensure global assignments array exists
    if (!global.assignments) {
      global.assignments = [];
    }
    
    global.assignments.push(assignment);
    
    res.status(201).json({ 
      status: 'success',
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create assignment',
      error: error.message
    });
  }
});

// GET submissions for a specific student
assignmentsRouter.get('/student/:studentId/submissions', (req, res) => {
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

// Basic feedback routes
const feedbackRouter = express.Router();

// GET feedback for a specific submission
feedbackRouter.get('/submission/:id', (req, res) => {
  const submissionId = parseInt(req.params.id);
  
  // Find the feedback item in our global array
  const feedbackItem = global.feedback.find(f => f.submissionId === submissionId);
  
  if (feedbackItem) {
    return res.json({
      status: 'success',
      message: 'Feedback retrieved successfully',
      data: feedbackItem
    });
  }
  
  // Default response with sample feedback
  res.json({
    status: 'success',
    message: 'Feedback retrieved successfully',
    data: {
      id: Date.now(),
      submissionId,
      feedback: {
        overallFeedback: "Great work on this assignment!",
        totalScore: 85,
        rubricFeedback: {
          "understanding": {
            score: 90,
            comments: "Excellent grasp of the core concepts."
          },
          "methodology": {
            score: 85,
            comments: "Good approach to solving the problems."
          },
          "presentation": {
            score: 80,
            comments: "Well-organized but could improve clarity in some areas."
          }
        }
      }
    }
  });
});

// Basic auth routes
const authRouter = express.Router();

// POST login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple login logic for demo
  if (email && password) {
    const userType = email.includes('teacher') ? 'teacher' : 'student';
    const userId = email.split('@')[0]; // Use the username part as ID
    
    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        id: userId,
        email,
        name: userId,
        role: userType
      }
    });
  } else {
    res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }
});

// POST register
authRouter.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (name && email && password && role) {
    const userId = email.split('@')[0]; // Use the username part as ID
    
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        id: userId,
        name,
        email,
        role
      }
    });
  } else {
    res.status(400).json({
      status: 'error',
      message: 'All fields are required'
    });
  }
});

// Use routes - simple structure without /api prefix
app.use('/assignments', assignmentsRouter);
app.use('/feedback', feedbackRouter);
app.use('/auth', authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Export the serverless function handler
module.exports.handler = serverless(app); 