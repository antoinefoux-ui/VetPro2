const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  || 'https://angelic-joy-production.up.railway.app';

export const api = {
  baseURL: API_URL,
  
  // Helper function for API calls
  async fetch(endpoint: string, options?: RequestInit) {
    const url = `${API_URL}${endpoint}`;
    console.log('🔍 API Request to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    console.log('📡 API Response:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },
};

export default api;
