import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthTokens } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const tokenStorage = {
  getTokens: (): AuthTokens | null => {
    const tokens = localStorage.getItem("tokens");
    return tokens ? JSON.parse(tokens) : null;
  },
  setTokens: (tokens: AuthTokens) => {
    localStorage.setItem("tokens", JSON.stringify(tokens));
  },
  clearTokens: () => {
    localStorage.removeItem("tokens");
  },
};

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = tokenStorage.getTokens();
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = tokenStorage.getTokens();
      if (!tokens?.refresh) {
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: tokens.refresh,
        });

        const newTokens: AuthTokens = {
          access: response.data.access,
          refresh: tokens.refresh,
        };

        tokenStorage.setTokens(newTokens);
        processQueue(null, newTokens.access);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data?.detail) {
      return typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail);
    }

    if (data && typeof data === "object") {
      const messages = Object.entries(data)
        .map(([field, errors]) => {
          if (Array.isArray(errors)) {
            return `${field}: ${errors.join(", ")}`;
          }
          return `${field}: ${errors}`;
        })
        .join("; ");
      return messages || "Произошла ошибка";
    }

    return error.message || "Произошла ошибка сети";
  }

  return "Неизвестная ошибка";
};

export default axiosInstance;
