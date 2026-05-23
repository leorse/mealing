import axios from 'axios';
import { Platform } from 'react-native';

// Sur émulateur Android : 10.0.2.2 = localhost du PC
// Sur vrai appareil : remplacer par l'IP locale du PC (ex: 192.168.1.42)
const DEVICE_HOST = '10.0.2.2';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8080/api'
  : `http://${DEVICE_HOST}:8080/api`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
