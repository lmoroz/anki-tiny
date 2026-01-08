import axios from 'axios';

const api = axios.create({
  get baseURL() {
    return `${window.__BACKEND_URL__}/api`;
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Client] Request failed:', error);
    return Promise.reject(error);
  }
);

export default api;
