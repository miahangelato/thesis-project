import { useState, useCallback } from "react";
import { AxiosRequestConfig } from "axios";
import { api } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (config?: AxiosRequestConfig) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  url: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    error: null,
    loading: false,
  });

  const execute = useCallback(
    async (config?: AxiosRequestConfig) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let response;
        const requestConfig = { ...config };

        switch (method) {
          case "GET":
            response = await api.get<T>(url, requestConfig);
            break;
          case "POST":
            response = await api.post<T>(url, config?.data, requestConfig);
            break;
          case "PUT":
            response = await api.put<T>(url, config?.data, requestConfig);
            break;
          case "DELETE":
            response = await api.delete<T>(url, requestConfig);
            break;
        }

        setState({
          data: response.data,
          error: null,
          loading: false,
        });

        return response.data;
      } catch (err) {
        const message = getErrorMessage(err);
        setState((prev) => ({
          ...prev,
          error: message,
          loading: false,
        }));
        return null;
      }
    },
    [url, method]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      loading: false,
    });
  }, [initialData]);

  return { ...state, execute, reset };
}
