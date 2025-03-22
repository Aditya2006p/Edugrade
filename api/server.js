const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();
console.log('Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'Set (starts with: ' + process.env.GEMINI_API_KEY.substring(0, 5) + '...)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

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
    
    // Test the API key by making a simple request
    (async () => {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        await model.generateContent('Hello, testing API connection');
        console.log('✅ Gemini API key verified successfully');
      } catch (error) {
        console.error('❌ Gemini API key validation failed:', error.message);
        console.error('AI-powered grading will use fallback mechanisms');
      }
    })();
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
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EduGrade API is running' });
});

// Import route handlers
const assignmentRoutes = require('./routes/assignments');
const feedbackRoutes = require('./routes/feedback');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/health`);
});

// Connect to MongoDB (if needed in the future)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = app; 
