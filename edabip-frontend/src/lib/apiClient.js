import axios from 'axios';
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredTokens,
} from '../modules/auth/utils/authSession.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

/**
 * 401 handler shared by every client that sends the auth backend's access
 * token (see settingsClient.js). Refreshes the token once against
 * /auth/refresh on the auth backend, retries the original request on `client`,
 * and clears the session (logs out) if the refresh fails.
 */
export async function retryWithRefreshedToken(error, client) {
  const originalRequest = error.config;
  const status = error.response?.status;

  if (
    status !== 401 ||
    !originalRequest ||
    originalRequest._retry ||
    originalRequest.url?.includes('/auth/refresh') ||
    originalRequest.url?.includes('/auth/login')
  ) {
    return Promise.reject(error);
  }

  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    if (!refreshPromise) {
      refreshPromise = apiClient
        .post('/auth/refresh', { refresh_token: refreshToken })
        .then((response) => {
          updateStoredTokens({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          });
          return response.data.access_token;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const accessToken = await refreshPromise;
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return client(originalRequest);
  } catch (refreshError) {
    clearAuthSession();
    return Promise.reject(refreshError);
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => retryWithRefreshedToken(error, apiClient)
);

export default apiClient;
