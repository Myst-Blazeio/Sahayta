import axios from 'axios';

// Create an Axios instance with default configuration
const client = axios.create({
  baseURL: '/api', // Proxy in vite.config.ts will handle this to http://localhost:5000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token in headers
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
         localStorage.removeItem('token');
         localStorage.removeItem('user');
         // Use window.location for hard redirect or dispatch an event
         // window.location.href = '/citizen/login'; // Optional: decided by app logic
      }
    }
    return Promise.reject(error);
  }
);

export default client;
