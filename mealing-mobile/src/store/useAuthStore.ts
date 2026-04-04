import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  email: null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login(email, password);
      await AsyncStorage.setItem('mealing_token', data.token);
      set({ token: data.token, userId: data.userId, email: data.email, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Erreur de connexion', isLoading: false });
      throw e;
    }
  },

  register: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.register(email, password);
      await AsyncStorage.setItem('mealing_token', data.token);
      set({ token: data.token, userId: data.userId, email: data.email, isLoading: false });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Erreur inscription', isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('mealing_token');
    set({ token: null, userId: null, email: null });
  },

  restoreSession: async () => {
    const token = await AsyncStorage.getItem('mealing_token');
    if (token) {
      try {
        const { data } = await authApi.me();
        set({ token: data.token, userId: data.userId, email: data.email });
      } catch {
        await AsyncStorage.removeItem('mealing_token');
      }
    }
  },
}));
