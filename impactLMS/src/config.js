/**
 * Application configuration module.
 * Provides the API base URL as a proper module export.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Backward compatibility: set window.API_URL for components that use it
window.API_URL = API_URL;
