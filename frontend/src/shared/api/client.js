import axios from 'axios';

let backendPort = 3000;

if (window.electronAPI) {
  window.electronAPI.onBackendPort((port) => {
    backendPort = port;
    console.log('[API Client] Backend port received:', port);
  });
}

const api = axios.create({
  get baseURL() {
    return `http://localhost:${backendPort}/api`;
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
