const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// In-memory data store (would be replaced by a database in production)
global.submissions = [];
global.feedback = [];
global.assignments = [];

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

// Basic route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EduGrade API is running' });
});

// Import route handlers
const assignmentRoutes = require('../../api/routes/assignments');
const feedbackRoutes = require('../../api/routes/feedback');
const authRoutes = require('../../api/routes/auth');

// Use routes - note the path change for Netlify functions
app.use('/assignments', assignmentRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// For local testing
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/health`);
  });
}

// Export the serverless function handler
module.exports.handler = serverless(app); 