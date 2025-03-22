// NEW ENDPOINT: Batch grade multiple submissions for an assignment
router.post('/:id/batch-grade', async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { submissionIds } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of submission IDs to grade'
      });
    }
    
    console.log(`Batch grading ${submissionIds.length} submissions for assignment ${assignmentId}`);
    
    // Find the submissions to grade
    const submissionsToGrade = submissionIds.map(id => 
      global.submissions.find(s => s.id === parseInt(id))
    ).filter(s => s); // Remove any undefined submissions
    
    if (submissionsToGrade.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No valid submissions found to grade'
      });
    }
    
    // Find assignment to get rubric
    let assignment;
    if (global.assignments) {
      assignment = global.assignments.find(a => a.id === parseInt(assignmentId));
    }
    
    const rubric = assignment?.rubric || {
      'Content Quality': 'Assess the depth, clarity, and relevance of the content',
      'Organization': 'Evaluate the structure and flow of ideas',
      'Grammar & Mechanics': 'Check for proper grammar, spelling, and punctuation',
      'Critical Thinking': 'Assess analysis, synthesis, and evaluation of ideas'
    };
    
    // Process submissions in parallel, but with a concurrency limit
    const concurrencyLimit = 3; // Process 3 at a time to avoid overwhelming the API
    let gradedSubmissions = [];
    let errorSubmissions = [];
    
    // Create chunks to process submissions with controlled concurrency
    for (let i = 0; i < submissionsToGrade.length; i += concurrencyLimit) {
      const chunk = submissionsToGrade.slice(i, i + concurrencyLimit);
      
      const chunkPromises = chunk.map(async submission => {
        try {
          // Skip submissions that don't have text
          if (!submission.submissionText) {
            return {
              submission,
              error: 'No text content to grade',
              status: 'skipped'
            };
          }
          
          // Grade the submission
          const feedback = await gradeSubmissionAdvanced(submission.submissionText, rubric);
          
          // Create feedback entry
          const feedbackEntry = {
            id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
            submissionId: submission.id,
            assignmentId: submission.assignmentId,
            studentId: submission.studentId,
            feedback,
            submissionDate: submission.submissionDate,
            gradedDate: new Date(),
            gradingMethod: feedback.isAIFallback ? 'fallback' : 'ai'
          };
          
          // Add to global feedback array
          global.feedback.push(feedbackEntry);
          
          // Update submission status
          submission.status = 'graded';
          
          return {
            submission,
            feedback: feedbackEntry,
            status: 'success'
          };
        } catch (error) {
          console.error(`Error grading submission ${submission.id}:`, error);
          return {
            submission,
            error: error.message,
            status: 'error'
          };
        }
      });
      
      // Wait for all submissions in this chunk to be processed
      const chunkResults = await Promise.all(chunkPromises);
      
      // Sort results
      chunkResults.forEach(result => {
        if (result.status === 'success') {
          gradedSubmissions.push(result);
        } else {
          errorSubmissions.push(result);
        }
      });
    }
    
    // Generate batch analytics
    const analytics = generateBatchAnalytics(gradedSubmissions);
    
    res.json({
      status: 'success',
      message: `Processed ${submissionsToGrade.length} submissions. Successfully graded: ${gradedSubmissions.length}, Errors: ${errorSubmissions.length}`,
      data: {
        graded: gradedSubmissions,
        errors: errorSubmissions,
        analytics
      }
    });
  } catch (error) {
    console.error('Batch grading error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error batch grading submissions',
      error: error.message
    });
  }
});

// Enhanced grading function with advanced analysis
async function gradeSubmissionAdvanced(submissionText, rubric) {
  // Use default rubric if none is provided
  const defaultRubric = {
    'Content Quality': 'Assess the depth, clarity, and relevance of the content',
    'Organization': 'Evaluate the structure and flow of ideas',
    'Grammar & Mechanics': 'Check for proper grammar, spelling, and punctuation',
    'Critical Thinking': 'Assess analysis, synthesis, and evaluation of ideas'
  };

  const gradingRubric = rubric || defaultRubric;

  try {
    // Construct prompt for AI with enhanced instructions
    const prompt = `
    You are an expert educator grading the following student submission. 
    
    Grading Rubric:
    ${JSON.stringify(gradingRubric, null, 2)}
    
    Student submission:
    "${submissionText}"
    
    Please provide a detailed assessment using the following structure:
    1. For each rubric criterion: 
       - Score (1-100) 
       - Detailed, actionable feedback with specific examples from the submission
       - Identify key strengths
       - Provide concrete suggestions for improvement
    2. Overall assessment:
       - Total weighted score as a percentage
       - Summary of key strengths
       - Most important areas for improvement
       - Personalized learning recommendations (e.g., topics to review, resources to explore)
    3. Differential analysis:
       - Which areas show the most promise?
       - Which areas need the most attention?
    
    Format the response as JSON with the following structure:
    {
      "rubricFeedback": {
        "[criterion name]": {
          "score": number,
          "comments": string,
          "strengths": string,
          "improvements": string
        }
      },
      "overallFeedback": string,
      "totalScore": number,
      "keyStrengths": [strings],
      "improvementAreas": [strings],
      "learningRecommendations": [strings],
      "differentialAnalysis": {
        "strongestAreas": [strings],
        "weakestAreas": [strings]
      }
    }
    `;
    
    try {
      // Check if genAI is available globally
      if (!global.genAI) {
        console.warn('Gemini AI not initialized - using fallback grading');
        return generateEnhancedFallbackGrading(submissionText, gradingRubric);
      }
      
      // Get the Gemini model
      const model = global.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Generate content with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timed out after 25 seconds')), 25000)
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
      return generateEnhancedFallbackGrading(submissionText, gradingRubric);
    }
  } catch (error) {
    console.error('AI grading error:', error);
    // Instead of throwing, return a fallback response
    return generateEnhancedFallbackGrading(submissionText, rubric || defaultRubric);
  }
}

// Enhanced fallback function with more detailed feedback
function generateEnhancedFallbackGrading(submissionText, rubric) {
  console.log('Using enhanced fallback grading mechanism');
  
  // Extract rubric criteria
  const rubricKeys = Object.keys(rubric);
  
  // Create a comprehensive feedback structure
  const feedback = {
    overallFeedback: "Your submission has been processed by our automated system. Due to high demand or technical limitations, we're providing this preliminary feedback. Your instructor will review your work for a more personalized assessment soon.",
    totalScore: 70,
    rubricFeedback: {},
    keyStrengths: [
      "Completion of the assigned task",
      "Attempt to address the main requirements"
    ],
    improvementAreas: [
      "Consider adding more specific details to support your points",
      "Review and revise your work for clarity and organization"
    ],
    learningRecommendations: [
      "Review course materials on effective writing strategies",
      "Practice organizing ideas before writing to improve structure"
    ],
    differentialAnalysis: {
      strongestAreas: ["Task completion"],
      weakestAreas: ["Detail level"]
    },
    isAIFallback: true
  };
  
  // Analysis of text characteristics for slightly better feedback
  const wordCount = submissionText.split(/\s+/).length;
  const sentenceCount = submissionText.split(/[.!?]+/).length;
  const avgSentenceLength = wordCount / Math.max(1, sentenceCount);
  
  // Generate somewhat customized feedback for each rubric item
  rubricKeys.forEach(key => {
    // Adjust scores based on simple text analysis
    let score = Math.floor(Math.random() * 15) + 65; // Base random score between 65-80
    
    // Adjust based on simple metrics
    if (wordCount < 100) score = Math.max(60, score - 10);
    if (wordCount > 500) score = Math.min(85, score + 5);
    if (avgSentenceLength > 30) score = Math.max(60, score - 5); // Too long sentences
    if (avgSentenceLength < 8) score = Math.max(60, score - 5);  // Too short sentences
    
    let strengths = "";
    let improvements = "";
    
    // Generate different feedback based on the rubric key
    if (key.toLowerCase().includes('content') || key.toLowerCase().includes('quality')) {
      strengths = "You've attempted to address the main topic.";
      improvements = "Consider adding more specific examples and evidence to support your points.";
    } else if (key.toLowerCase().includes('organization') || key.toLowerCase().includes('structure')) {
      strengths = "Your submission has a basic structure.";
      improvements = "Try using clearer transitions between ideas and create a stronger opening and conclusion.";
    } else if (key.toLowerCase().includes('grammar') || key.toLowerCase().includes('mechanics')) {
      strengths = "Your submission is readable and communicates basic ideas.";
      improvements = "Review for sentence structure variety and proper punctuation.";
    } else if (key.toLowerCase().includes('critical') || key.toLowerCase().includes('thinking')) {
      strengths = "You've presented some analysis of the topic.";
      improvements = "Try to deepen your analysis by considering multiple perspectives and implications.";
    } else {
      strengths = "You've addressed aspects of this criterion.";
      improvements = "Review the specific requirements for this area and ensure all parts are addressed.";
    }
    
    feedback.rubricFeedback[key] = {
      score: score,
      comments: `Your work has been evaluated on ${key}. The score reflects an automated assessment based on text characteristics.`,
      strengths: strengths,
      improvements: improvements
    };
  });
  
  // Add a timestamp for tracking
  feedback.generatedAt = new Date().toISOString();
  
  return feedback;
}

// Function to generate analytics for batch grading
function generateBatchAnalytics(gradedSubmissions) {
  if (!gradedSubmissions || gradedSubmissions.length === 0) {
    return {
      empty: true,
      message: "No submissions were successfully graded"
    };
  }
  
  // Extract scores from all submissions
  const scores = gradedSubmissions.map(s => 
    s.feedback?.feedback?.totalScore || 
    Object.values(s.feedback?.feedback?.rubricFeedback || {})
      .reduce((sum, item) => sum + (item.score || 0), 0) / 
      Math.max(1, Object.keys(s.feedback?.feedback?.rubricFeedback || {}).length)
  ).filter(score => !isNaN(score));
  
  // Calculate basic statistics
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  
  // Sort scores and find median
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median = sortedScores.length % 2 === 0 
    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
    : sortedScores[Math.floor(sortedScores.length / 2)];
  
  // Calculate standard deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Group scores by grade ranges
  const gradeDistribution = {
    'A (90-100)': scores.filter(s => s >= 90).length,
    'B (80-89)': scores.filter(s => s >= 80 && s < 90).length,
    'C (70-79)': scores.filter(s => s >= 70 && s < 80).length,
    'D (60-69)': scores.filter(s => s >= 60 && s < 70).length,
    'F (0-59)': scores.filter(s => s < 60).length
  };
  
  // Collect common strengths and weaknesses
  const allStrengths = gradedSubmissions
    .flatMap(s => s.feedback?.feedback?.keyStrengths || [])
    .filter(Boolean);
    
  const allWeaknesses = gradedSubmissions
    .flatMap(s => s.feedback?.feedback?.improvementAreas || [])
    .filter(Boolean);
  
  // Count occurrences of each strength and weakness
  const strengthCounts = allStrengths.reduce((acc, strength) => {
    acc[strength] = (acc[strength] || 0) + 1;
    return acc;
  }, {});
  
  const weaknessCounts = allWeaknesses.reduce((acc, weakness) => {
    acc[weakness] = (acc[weakness] || 0) + 1;
    return acc;
  }, {});
  
  // Get top 3 common strengths and weaknesses
  const topStrengths = Object.entries(strengthCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([strength]) => strength);
    
  const topWeaknesses = Object.entries(weaknessCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([weakness]) => weakness);
  
  return {
    submissionsCount: gradedSubmissions.length,
    scoreStats: {
      average: Math.round(avgScore * 10) / 10,
      median: Math.round(median * 10) / 10,
      min: minScore,
      max: maxScore,
      standardDeviation: Math.round(stdDev * 10) / 10
    },
    gradeDistribution,
    classTrends: {
      commonStrengths: topStrengths,
      commonWeaknesses: topWeaknesses
    },
    recommendedFocus: topWeaknesses.length > 0 ? topWeaknesses[0] : "No clear trends identified"
  };
}

// Add a new endpoint to retrieve class analytics for an assignment
router.get('/:id/analytics', (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Convert to number if possible for easier comparison
    const assignmentIdNum = parseInt(assignmentId);
    const targetId = isNaN(assignmentIdNum) ? assignmentId : assignmentIdNum;
    
    // Get all submissions for this assignment
    const submissions = global.submissions.filter(
      sub => sub.assignmentId === targetId || sub.assignmentId === assignmentId
    );
    
    if (!submissions || submissions.length === 0) {
      return res.json({
        status: 'success',
        message: 'No submissions found for analytics',
        data: {
          empty: true
        }
      });
    }
    
    // Get feedback for these submissions
    const submissionIds = submissions.map(s => s.id);
    const feedbackEntries = global.feedback.filter(
      f => submissionIds.includes(f.submissionId)
    );
    
    // Prepare data for analytics function
    const gradedSubmissions = submissions
      .filter(s => s.status === 'graded')
      .map(submission => {
        const feedback = feedbackEntries.find(f => f.submissionId === submission.id);
        return { submission, feedback, status: 'success' };
      });
    
    // Generate analytics
    const analytics = generateBatchAnalytics(gradedSubmissions);
    
    // Add completion statistics
    const completionStats = {
      total: submissions.length,
      graded: gradedSubmissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      gradingRate: Math.round((gradedSubmissions.length / submissions.length) * 100)
    };
    
    res.json({
      status: 'success',
      message: 'Analytics generated successfully',
      data: {
        analytics,
        completionStats
      }
    });
  } catch (error) {
    console.error('Analytics generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error generating analytics',
      error: error.message
    });
  }
}); 