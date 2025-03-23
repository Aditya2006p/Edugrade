/**
 * Configuration file for API endpoints
 */

// In a browser environment, we can check the hostname explicitly
const isDevelopment = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Fallback to environment variable if not in browser
const isDevelopmentEnv = process.env.NODE_ENV === 'development';

// Simplify the API path for Netlify - they handle routing for us
const API_BASE_URL = isDevelopment || isDevelopmentEnv
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