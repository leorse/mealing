import { Platform } from 'react-native';
import apiClient from './client';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8080/api'
  : 'http://10.0.2.2:8080/api';

export const backupApi = {
  exportUrl: () => `${BASE_URL}/backup/export`,

  importData: (data: object) =>
    apiClient.post('/backup/import', data),
};
