import { Platform } from 'react-native';
import api from './client';
import { shoppingDbApi } from '../db/shoppingDb';

export interface ShoppingItem {
  id: string;
  label: string;
  quantityG?: number;
  unitLabel?: string;
  category?: string;
  isChecked: boolean;
  isManual: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  weekPlanId?: string;
  items: ShoppingItem[];
}

const httpApi = {
  generateForWeek: (weekPlanId: string) => api.get<ShoppingList>('/shopping', { params: { weekPlanId } }),
  addItem: (listId: string, item: Partial<ShoppingItem>) => api.post<ShoppingItem>(`/shopping/${listId}/items`, item),
  toggleCheck: (itemId: string) => api.put<ShoppingItem>(`/shopping/items/${itemId}/check`),
  deleteItem: (itemId: string) => api.delete(`/shopping/items/${itemId}`),
  exportText: (listId: string) => api.get<string>(`/shopping/${listId}/export`),
};

export const shoppingApi = Platform.OS === 'web' ? httpApi : shoppingDbApi;
