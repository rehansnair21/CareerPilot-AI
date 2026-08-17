import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization JWT token & handle FormData headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('career_pilot_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If payload is FormData, remove default application/json header so browser sets multipart boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
