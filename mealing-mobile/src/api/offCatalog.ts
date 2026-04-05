import api from './client';
import { Ingredient } from './ingredients';

export interface CatalogStatus {
  available: boolean;
  productCount: number;
  path: string;
}

export const offCatalogApi = {
  status: () =>
    api.get<CatalogStatus>('/off-catalog/status'),

  search: (q: string) =>
    api.get<Ingredient[]>('/off-catalog/search', { params: { q } }),
};
