import axios from "axios";

let isRedirecting = false;
let refreshTimer = null;
const REFRESH_BEFORE_MS = 2 * 60 * 1000;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const getTokenExpiryTime = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000;
  } catch (e) {
    return null;
  }
};

const scheduleAutoRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = localStorage.getItem("token");
  if (!token) return;

  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return;

  const refreshTime = expiryTime - Date.now() - REFRESH_BEFORE_MS;

  if (refreshTime <= 0) {
    silentRefresh();
    return;
  }

  refreshTimer = setTimeout(() => {
    silentRefresh();
  }, refreshTime);
};

const silentRefresh = async () => {
  if (isRefreshing) return;

  isRefreshing = true;

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const { newAccessToken } = res.data;
    localStorage.setItem("token", newAccessToken);
    scheduleAutoRefresh();
    processQueue(null, newAccessToken);

  } catch (error) {
    processQueue(error, null);
    localStorage.removeItem("token");
    
    if (!isRedirecting) {
      isRedirecting = true;
      window.location.href = "/";
    }
  } finally {
    isRefreshing = false;
  }
};

api.interceptors.response.use(
  (response) => response,
  
  async (error) => {
    const originalRequest = error.config;

    if (error.config.url?.includes("/api/auth/refresh")) {
      localStorage.removeItem("token");
      if (!isRedirecting) {
        isRedirecting = true;
        window.location.href = "/";
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { newAccessToken } = res.data;
        localStorage.setItem("token", newAccessToken);
        scheduleAutoRefresh();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        
        if (!isRedirecting) {
          isRedirecting = true;
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

//  EXPORTS ONLY — No auto-start!
export const startAutoRefresh = () => {
  scheduleAutoRefresh();
};

export const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

// Reset function for logout
 export const resetAuthFlags = () => {
   isRedirecting = false;
   isRefreshing = false;
   if (refreshTimer) {
     clearTimeout(refreshTimer);
     refreshTimer = null;
   }
 };

export default api;