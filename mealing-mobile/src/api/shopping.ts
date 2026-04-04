import api from './client';

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

export const shoppingApi = {
  generateForWeek: (weekPlanId: string) =>
    api.get<ShoppingList>('/shopping', { params: { weekPlanId } }),

  addItem: (listId: string, item: Partial<ShoppingItem>) =>
    api.post<ShoppingItem>(`/shopping/${listId}/items`, item),

  toggleCheck: (itemId: string) =>
    api.put<ShoppingItem>(`/shopping/items/${itemId}/check`),

  deleteItem: (itemId: string) =>
    api.delete(`/shopping/items/${itemId}`),

  exportText: (listId: string) =>
    api.get<string>(`/shopping/${listId}/export`),
};
