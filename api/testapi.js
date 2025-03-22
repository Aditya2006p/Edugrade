// Test the Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Get API key from environment
const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key available:', !!apiKey);

async function main() {
  try {
    // Initialize the API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // List available models
    console.log('Attempting to list available models...');
    const result = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await result.json();
    console.log('Available models:');
    
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
      });
    } else {
      console.log('No models found or error:', data);
    }
    
    // Try different model versions
    console.log('\nTesting different model versions:');
    
    // Try gemini-pro (old beta path)
    try {
      console.log('\nTesting gemini-pro...');
      const model1 = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result1 = await model1.generateContent('Hello World');
      console.log('✅ gemini-pro works!');
    } catch (error) {
      console.log('❌ gemini-pro failed:', error.message);
    }
    
    // Try gemini-1.5-pro
    try {
      console.log('\nTesting gemini-1.5-pro...');
      const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result2 = await model2.generateContent('Hello World');
      console.log('✅ gemini-1.5-pro works!');
    } catch (error) {
      console.log('❌ gemini-1.5-pro failed:', error.message);
    }
    
    // Try gemini-1.0-pro
    try {
      console.log('\nTesting gemini-1.0-pro...');
      const model3 = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
      const result3 = await model3.generateContent('Hello World');
      console.log('✅ gemini-1.0-pro works!');
    } catch (error) {
      console.log('❌ gemini-1.0-pro failed:', error.message);
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main(); 