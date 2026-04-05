import api from './client';

export interface CiqualStatus {
  count: number;
}

export const ciqualApi = {
  status: () => api.get<CiqualStatus>('/ciqual/status'),
};
