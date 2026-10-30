import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// ==================== توکن‌ها ====================
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  const access_token = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY);
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

function setTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  document.cookie = `auth_token=${tokens.access_token}; path=/; max-age=31536000; samesite=lax`;
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = "auth_token=; path=/; max-age=0";
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

// ==================== axios instance ====================
export const apiClient = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getTokens();
    if (tokens?.access_token) {
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // اگر خطا 401 باشد و این درخواست، درخواستِ refresh نباشد
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh")) {
      if (isRefreshing) {
        // منتظر refresh فعلی بمان
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: unknown) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const tokens = getTokens();
      if (!tokens?.refresh_token) {
        clearTokens();
        processQueue(error, null);
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // درخواست refresh جداگانه
        const { data } = await axios.post<Tokens>(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refresh_token: tokens.refresh_token }
        );

        setTokens(data);
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // خطا در refresh (مانند 401) => خروج از سیستم و ریدایرکت
        clearTokens();
        processQueue(refreshError as AxiosError, null);

        // تضمین ریدایرکت بعد از پردازش صف
        setTimeout(() => {
          redirectToLogin();
        }, 0);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== توابع کمکی ====================
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const items = value.map((item) => {
      if (typeof item === "object" && item !== null) {
        const maybeValue = (item as { value?: unknown }).value;
        const maybeId = (item as { id?: unknown }).id;
        return String(maybeValue ?? maybeId ?? "");
      }
      return String(item);
    });
    return items.join(",");
  }
  if (typeof value === "object") {
    const maybeValue = (value as { value?: unknown }).value;
    const maybeId = (value as { id?: unknown }).id;
    return String(maybeValue ?? maybeId ?? "");
  }
  return null;
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    const str = toStringValue(value);
    if (str !== null) {
      searchParams.set(key, str);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

// ==================== هوک Query ====================
export function useApiQuery<TData = unknown>(
  url: string,
  queryKey: string[],
  params?: Record<string, unknown>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnMount?: boolean;
  }
) {
  const fullUrl = `${url}${buildQueryString(params)}`;

  return useQuery<TData>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const response: AxiosResponse<TData> = await apiClient.get(fullUrl);
      return response.data;
    },
    staleTime: options?.staleTime ?? 0,
    refetchOnMount: options?.refetchOnMount ?? true,
    enabled: options?.enabled ?? true,
  });
}

// ==================== هوک Mutation ====================
export function useApiMutation<TData = unknown, TBody = unknown>(
  url: string,
  method: HttpMethod,
  queryKeyToInvalidate?: string[]
) {
  const queryClient = useQueryClient();

  return useMutation<TData, AxiosError, TBody>({
    mutationFn: async (body?: TBody) => {
      const config: AxiosRequestConfig = {
        method,
        url,
        data: body,
      };
      const response: AxiosResponse<TData> = await apiClient.request<TData>(config);
      return response.data;
    },
    onSuccess: () => {
      if (queryKeyToInvalidate) {
        queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        queryClient.refetchQueries({ queryKey: queryKeyToInvalidate });
      }
    },
  });
}

// ==================== کارخانه ساخت هوک‌ها ====================
export function createApiHooks(resourcePath: string) {
  const baseUrl = `/${resourcePath}`;

  return {
    useList: <T = unknown>(
      params?: Record<string, unknown>,
      options?: {
        enabled?: boolean;
        staleTime?: number;
        refetchOnMount?: boolean;
      }
    ) =>
      useApiQuery<{ data: T[]; total: number }>(baseUrl, [resourcePath], params, options),

    useGet: <T = unknown>(
      id: string | number,
      options?: {
        enabled?: boolean;
        staleTime?: number;
        refetchOnMount?: boolean;
      }
    ) =>
      useApiQuery<T>(`${baseUrl}/${id}`, [resourcePath, String(id)], undefined, options),

    useCreate: <TData = unknown, TBody = unknown>(queryKeyToInvalidate?: string[]) =>
      useApiMutation<TData, TBody>(baseUrl, "POST", queryKeyToInvalidate ?? [resourcePath]),

    useUpdate: <TData = unknown, TBody = unknown>(
      id: string | number,
      queryKeyToInvalidate?: string[]
    ) =>
      useApiMutation<TData, TBody>(`${baseUrl}/${id}`, "PUT", queryKeyToInvalidate ?? [resourcePath]),

    useDelete: <TData = unknown>(id: string | number, queryKeyToInvalidate?: string[]) =>
      useApiMutation<TData, void>(`${baseUrl}/${id}`, "DELETE", queryKeyToInvalidate ?? [resourcePath]),

    useChangeActive: <TData = unknown>(
      id: string | number,
      queryKeyToInvalidate?: string[]
    ) =>
      useApiMutation<TData, { is_active: boolean }>(
        `${baseUrl}/${id}/active`,
        "PATCH",
        queryKeyToInvalidate ?? [resourcePath]
      ),
  };
}