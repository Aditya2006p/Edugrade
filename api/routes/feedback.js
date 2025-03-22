const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-placeholder');

// GET feedback for a submission
router.get('/submission/:id', (req, res) => {
  const submissionId = parseInt(req.params.id);
  
  // Find feedback for this submission
  const feedbackEntry = global.feedback.find(f => f.submissionId === submissionId);
  
  if (feedbackEntry) {
    res.json({
      status: 'success',
      message: 'Feedback retrieved successfully',
      data: feedbackEntry
    });
  } else {
    // Fallback to mock data if no feedback found
    res.json({
      status: 'success',
      message: 'Feedback retrieved successfully',
      data: {
        submissionId: req.params.id,
        assignmentId: 1,
        studentId: 'student123',
        feedback: {
          understanding: {
            score: 8,
            comments: 'Strong understanding of core concepts with minor misconceptions.'
          },
          methodology: {
            score: 7,
            comments: 'Good approach but could improve efficiency.'
          },
          presentation: {
            score: 9,
            comments: 'Well-organized and clearly presented work.'
          },
          overallFeedback: 'Good work overall. Focus on improving the methodology section by applying the concepts we discussed in class. Your presentation is excellent.',
          totalScore: 80
        },
        submissionDate: '2025-03-15T10:30:00Z',
        gradedDate: '2025-03-16T14:20:00Z'
      }
    });
  }
});

// POST generate custom feedback
router.post('/generate', async (req, res) => {
  try {
    const { submissionText, studentProfile, assignmentDetails, previousFeedback } = req.body;
    
    // Generate personalized feedback using AI
    const feedback = await generatePersonalizedFeedback(
      submissionText,
      studentProfile,
      assignmentDetails,
      previousFeedback
    );
    
    res.json({
      status: 'success',
      message: 'Personalized feedback generated successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('Feedback generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating feedback',
      error: error.message
    });
  }
});

// AI feedback generation function
async function generatePersonalizedFeedback(
  submissionText,
  studentProfile = {},
  assignmentDetails = {},
  previousFeedback = []
) {
  try {
    // Format student profile information
    const profileText = studentProfile ? 
      `Student Profile:
      - Learning Style: ${studentProfile.learningStyle || 'Unknown'}
      - Strengths: ${studentProfile.strengths?.join(', ') || 'Unknown'}
      - Areas for Improvement: ${studentProfile.areasForImprovement?.join(', ') || 'Unknown'}
      - Grade Level: ${studentProfile.gradeLevel || 'Unknown'}` 
      : 'No student profile available.';
    
    // Format assignment details
    const assignmentText = assignmentDetails ?
      `Assignment Details:
      - Title: ${assignmentDetails.title || 'Unknown'}
      - Subject: ${assignmentDetails.subject || 'Unknown'}
      - Learning Objectives: ${assignmentDetails.objectives?.join(', ') || 'Unknown'}`
      : 'No assignment details available.';
    
    // Format previous feedback
    const previousFeedbackText = previousFeedback && previousFeedback.length > 0 ?
      `Previous Feedback:
      ${previousFeedback.map(fb => `- ${fb.date}: ${fb.summary}`).join('\n')}`
      : 'No previous feedback available.';

    // Create the prompt for the AI
    const prompt = `
    As an AI teaching assistant, please generate personalized feedback for the following student submission.
    
    ${profileText}
    
    ${assignmentText}
    
    ${previousFeedbackText}
    
    Student Submission:
    ${submissionText}
    
    Please provide:
    1. Specific strengths of the submission
    2. Areas for improvement
    3. Personalized suggestions based on the student's learning style and previous feedback
    4. Encouraging comments to motivate the student
    5. Specific next steps or resources for further learning
    
    Format the response as JSON with the following structure:
    {
      "strengths": ["strength1", "strength2", ...],
      "areasForImprovement": ["area1", "area2", ...],
      "suggestions": ["suggestion1", "suggestion2", ...],
      "encouragement": "Encouraging message",
      "nextSteps": ["step1", "step2", ...],
      "resources": ["resource1", "resource2", ...]
    }
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
    console.error('AI feedback generation error:', error);
    throw new Error('Failed to generate personalized feedback');
  }
}

module.exports = router; 