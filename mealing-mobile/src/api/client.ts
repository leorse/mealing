import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Sur PC (web), le backend tourne sur localhost:8080
// Sur Android (émulateur), utiliser 10.0.2.2:8080
const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8080/api'
  : 'http://10.0.2.2:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur : ajouter le token JWT à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('mealing_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('mealing_token');
      // Redirection gérée par le store
    }
    return Promise.reject(error);
  }
);

export default api;
