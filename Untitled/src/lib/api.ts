const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code: string };
}

export class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token || localStorage.getItem('token')) {
      headers['Authorization'] = `Bearer ${this.token || localStorage.getItem('token')}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // Auth endpoints
  async register(credentials: { username: string; email: string; password: string; displayName?: string }) {
    const response = await this.request<{ id: number; username: string; email: string; displayName: string; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async login(credentials: { username: string; password: string }) {
    const response = await this.request<{ id: number; username: string; email: string; displayName: string; streakDays: number; longestStreak: number; xp: number; level: number; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  // User endpoints
  async getMe() {
    return this.request('/user/me');
  }

  async getStats() {
    return this.request('/user/stats');
  }

  async checkIn() {
    return this.request('/user/check-in', { method: 'POST' });
  }

  async logRelapse(data: { trigger: string; notes?: string; mood?: string }) {
    return this.request('/relapse', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Journal endpoints
  async getJournalEntries(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.request(`/journal${query}`);
  }

  async createJournalEntry(entry: {
    type: 'trigger' | 'tackle' | 'account' | 'reward';
    title?: string;
    content: string;
    triggerTime?: string;
    triggerLocation?: string;
    triggerFeeling?: string;
  }) {
    return this.request('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  // Community endpoints
  async getCommunityPosts() {
    return this.request('/community');
  }

  async createPost(content: string, isAnonymous = true) {
    return this.request('/community', {
      method: 'POST',
      body: JSON.stringify({ content, isAnonymous }),
    });
  }

  async getAccountabilityBuddy() {
    return this.request('/community/buddy');
  }

  // Emergency endpoints
  async startEmergencySession(technique = '4-7-8 breathing') {
    return this.request('/emergency/start', {
      method: 'POST',
      body: JSON.stringify({ technique }),
    });
  }

  async completeEmergencySession(sessionId: number, wasSuccessful: boolean, durationSeconds: number) {
    return this.request(`/emergency/complete/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({ wasSuccessful, durationSeconds }),
    });
  }

  async getEmergencyTips() {
    return this.request('/emergency/tips');
  }
}

export const api = new ApiClient();
