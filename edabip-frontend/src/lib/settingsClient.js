import axios from "axios";
import { retryWithRefreshedToken } from "./apiClient.js";
import { getStoredAccessToken } from "../modules/auth/utils/authSession.js";

/**
 * HTTP client for the Settings module.
 *
 * Settings routes are mounted on the main API, so this defaults to
 * VITE_API_BASE_URL (port 8000 in local dev). VITE_SETTINGS_API_BASE_URL
 * overrides that only when settings is hosted somewhere else.
 *
 * A settings 401 uses the same refresh logic as apiClient: refresh against
 * /auth/refresh, retry once, log out if the refresh fails.
 */
const settingsClient = axios.create({
  baseURL:
    import.meta.env.VITE_SETTINGS_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Every Settings route needs the token; without one the API returns 401.
settingsClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

settingsClient.interceptors.response.use(
  (response) => response,
  (error) => retryWithRefreshedToken(error, settingsClient)
);

export default settingsClient;
