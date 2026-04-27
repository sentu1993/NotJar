import axios from 'axios';

// Using relative path to work with Next.js rewrites
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  return config;
});

export { API_URL };
export default api;
