const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

export const api = {
  baseURL: API_URL,

  async fetch<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
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
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String((payload as { message: string }).message)
          : typeof payload === 'object' && payload !== null && 'error' in payload
            ? String((payload as { error: string }).error)
            : `API Error: ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    return payload as T;
  },
};

export default api;
