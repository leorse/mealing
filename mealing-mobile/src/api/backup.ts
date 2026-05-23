import { Platform } from 'react-native';
import apiClient from './client';
import { backupDbApi } from '../db/backupDb';

const WEB_BASE_URL = 'http://localhost:8080/api';

export const backupApi = Platform.OS === 'web'
  ? {
      exportUrl: () => `${WEB_BASE_URL}/backup/export`,
      exportData: async () => {
        const res = await fetch(`${WEB_BASE_URL}/backup/export`);
        return res.json();
      },
      importData: (data: object) => apiClient.post('/backup/import', data),
    }
  : {
      exportUrl: () => '',
      exportData: backupDbApi.exportData,
      importData: async (data: object) => {
        await backupDbApi.importData(data);
        return { data: null };
      },
    };
