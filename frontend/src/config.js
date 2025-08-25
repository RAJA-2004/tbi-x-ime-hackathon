// Configuration file for environment-specific settings

const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  API_BASE_URL: isDevelopment
    ? (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000')
    : (process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || `${window.location.protocol}//${window.location.hostname}`),

  // Other configuration options
  APP_NAME: 'SoF Event Extractor',
  VERSION: '2.0.0'
};

console.log('API Base URL:', config.API_BASE_URL);
console.log('Environment:', process.env.NODE_ENV);

export const API_BASE_URL = config.API_BASE_URL;
export default config;
