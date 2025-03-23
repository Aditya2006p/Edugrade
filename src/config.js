/**
 * Configuration file for API endpoints
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// In development, use localhost
// In production on Netlify, use the /.netlify/functions/api path
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001/api' 
  : '/.netlify/functions/api';

export default {
  API_BASE_URL,
  ENDPOINTS: {
    ASSIGNMENTS: `${API_BASE_URL}/assignments`,
    FEEDBACK: `${API_BASE_URL}/feedback`,
    AUTH: `${API_BASE_URL}/auth`,
    HEALTH: `${API_BASE_URL}/health`
  }
}; 