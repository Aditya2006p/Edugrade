# EduGrade Technical Documentation

## Gemini AI Implementation

### Overview

EduGrade leverages Google's Gemini API to automate the grading process for student assignments. The implementation focuses on providing detailed, personalized feedback based on custom rubrics defined by teachers.

### Technical Architecture

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  React        │     │  Express.js   │     │  Gemini AI    │
│  Frontend     │────▶│  Backend      │────▶│  API          │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Core Components

1. **GoogleGenerativeAI Integration**: Uses the official Google SDK to interact with the Gemini model
2. **Assignment Routes**: Handles submission and grading operations
3. **Prompt Engineering**: Constructs context-aware prompts for optimal AI responses
4. **Response Parsing**: Processes AI responses into structured feedback

### Gemini API Implementation Details

The main AI integration happens in `api/routes/assignments.js` through the `gradeSubmission` function:

```javascript
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
    
    // Process the response
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, text];
      const jsonText = jsonMatch[1].trim();
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', error);
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
```

### Prompt Engineering

The effectiveness of the AI grading depends heavily on prompt engineering. Our prompt:

1. Establishes the AI's role as a teaching assistant
2. Provides the assignment context
3. Includes detailed rubric criteria
4. Structures the expected response format
5. Requests specific components (scores, feedback, improvement suggestions)

### Response Processing

The system expects a JSON response with:
- Scores for each rubric criterion
- Detailed feedback on each component
- Overall assessment
- Improvement recommendations

### Error Handling

The implementation includes robust error handling for:
- API connection issues
- Response parsing failures
- Malformed JSON responses
- Rate limiting or quota issues

### Performance Optimization

- **Batched Processing**: Submissions are processed one at a time to avoid rate limiting
- **Caching**: Responses are cached to minimize API calls
- **Response Validation**: Ensures AI-generated feedback meets quality standards

### Future AI Enhancements

1. **Fine-tuned Model**: Training on educational grading examples
2. **Multi-modal Support**: Handling image and document submissions
3. **Feedback Customization**: Tailoring tone based on student profile
4. **Pattern Recognition**: Identifying recurring errors across submissions
5. **Contextual Learning**: Adapting to specific course and subject requirements

## Security Considerations

- API Key Management: Stored securely in environment variables
- Input Sanitization: All user input is sanitized before being sent to the AI
- Response Validation: AI outputs are validated before presenting to users
- Privacy Protection: Student data is handled according to educational privacy standards

## Deployment Guidelines

For optimal AI performance:
- Use a production Gemini API key
- Configure appropriate rate limiting
- Monitor API usage metrics
- Implement robust error handling
- Consider asynchronous processing for large submission volumes 