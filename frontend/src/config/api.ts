const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const fetchApi = async <T = unknown>(endpoint: string, options?: RequestInit): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  const response = await window.fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  let payload: unknown = null;
  const rawText = await response.text();
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const errorPayload = (typeof payload === 'object' && payload !== null ? payload : null) as ApiErrorPayload | null;
    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      `API Error: ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  return payload as T;
};

export const api: {
  baseURL: string;
  fetch: <T = unknown>(endpoint: string, options?: RequestInit) => Promise<T>;
} = {
  baseURL: API_URL,
  fetch: fetchApi,
};

export default api;
