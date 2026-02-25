import axios from 'axios';

// In production (Firebase hosting), VITE_API_BASE_URL = Render backend URL.
// In development, it is empty so Vite's dev proxy forwards /api/* to localhost:5000.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Create an Axios instance with default configuration
const client = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in headers
client.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors (like 401 Unauthorized)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if 401 occurs
      // But avoid redirect loops if already on login page
      if (!window.location.pathname.includes('/login')) {
         sessionStorage.removeItem('token');
         sessionStorage.removeItem('user');
         // Use window.location for hard redirect or dispatch an event
         // window.location.href = '/citizen/login'; // Optional: decided by app logic
      }
    }
    return Promise.reject(error);
  }
);

export default client;
