import api from './client';

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { email, password }),

  me: () =>
    api.get<AuthResponse>('/auth/me'),
};
