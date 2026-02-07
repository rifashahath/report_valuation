import { apiClient } from '../services/apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    roles: string[];
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  login: (credentials: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/v1/auth/login', credentials),

  register: (data: RegisterRequest) =>
    apiClient.post<LoginResponse>('/api/v1/auth/register', data),

  logout: async () => {
    await apiClient.post('/api/v1/auth/logout');
    localStorage.removeItem('auth_token');
  },

  refreshToken: () =>
    apiClient.post<{ access_token: string }>('/api/v1/auth/refresh'),

  getCurrentUser: () =>
    apiClient.get<LoginResponse['user']>('/api/v1/auth/me'),
};

export default authApi;
