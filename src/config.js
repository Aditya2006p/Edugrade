/**
 * Configuration file for API endpoints
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// In development, use localhost
// In production on Netlify, use the /.netlify/functions/api/api path with double /api
// This is because our Netlify function routes use /api prefix internally
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5001/api' 
  : '/.netlify/functions/api/api';

export default {
  API_BASE_URL,
  ENDPOINTS: {
    ASSIGNMENTS: `${API_BASE_URL}/assignments`,
    FEEDBACK: `${API_BASE_URL}/feedback`,
    AUTH: `${API_BASE_URL}/auth`,
    HEALTH: `${API_BASE_URL}/health`
  }
};