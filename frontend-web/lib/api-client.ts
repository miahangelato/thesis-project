/**
 * Enhanced API client with interceptors, retry logic, and error handling.
 * Replaces the basic axios setup in lib/api.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { env } from "./env";
import { API_CONFIG, HTTP_STATUS } from "./constants";
import {
  APIError,
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  logError,
} from "./errors";

// ============================================================================
// API CLIENT INSTANCE
// ============================================================================

const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to requests for debugging
    if (env.NODE_ENV === "development") {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add auth token if exists
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Add API Key for Backend Auth
    const apiKey = env.NEXT_PUBLIC_KIOSK_API_KEY;
    if (apiKey && config.headers) {
      config.headers["X-API-Key"] = apiKey;
    }

    return config;
  },
  (error) => {
    logError(error, "Request Interceptor");
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (env.NODE_ENV === "development") {
      console.log(
        `[API Response] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
    }
    return response;
  },
  async (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      logError(error, `API Error ${status}`);

      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Clear auth and redirect to login if needed
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token");
          }
          throw new UnauthorizedError((data as any)?.message || "Unauthorized access");

        case HTTP_STATUS.FORBIDDEN:
          throw new ForbiddenError((data as any)?.message || "Access forbidden");

        case HTTP_STATUS.NOT_FOUND:
          throw new NotFoundError((data as any)?.message || "Resource not found");

        case HTTP_STATUS.TOO_MANY_REQUESTS:
          const retryAfter = error.response.headers["retry-after"];
          throw new RateLimitError(
            (data as any)?.message || "Too many requests",
            retryAfter ? parseInt(retryAfter) : undefined
          );

        case HTTP_STATUS.TIMEOUT:
          throw new TimeoutError("Request timed out");

        default:
          throw new APIError(
            (data as any)?.message || "API request failed",
            status,
            data
          );
      }
    } else if (error.request) {
      // Request made but no response received
      logError(error, "Network Error");
      throw new NetworkError("Network error. Please check your connection.");
    } else {
      // Something else happened
      logError(error, "Unknown Error");
      throw new APIError(error.message);
    }
  }
);

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except 429
      if (error instanceof APIError) {
        if (
          error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.statusCode !== 429
        ) {
          throw error;
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Retrying request... (${attempt + 1}/${maxRetries})`);
    }
  }

  throw lastError;
}

// ============================================================================
// API METHODS
// ============================================================================

export const api = {
  /**
   * GET request
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.get<T>(url, config)),

  /**
   * POST request
   */
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.post<T>(url, data, config)),

  /**
   * PUT request
   */
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.put<T>(url, data, config)),

  /**
   * PATCH request
   */
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.patch<T>(url, data, config)),

  /**
   * DELETE request
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.delete<T>(url, config)),
};

// Export the configured client
export default apiClient;
