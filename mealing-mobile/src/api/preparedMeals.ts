import api from './client';

export interface PreparedMeal {
  id: string;
  userId: string;
  name: string;
  brand?: string;
  photoUrl?: string;
  barcode?: string;
  nutriScore?: string;
  caloriesPortion: number;
  proteinsG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  portionLabel?: string;
  offId?: string;
  isFavorite: boolean;
  createdAt?: string;
}

export const preparedMealsApi = {
  getAll: () => api.get<PreparedMeal[]>('/prepared-meals'),
  getFavorites: () => api.get<PreparedMeal[]>('/prepared-meals/favorites'),
  getById: (id: string) => api.get<PreparedMeal>(`/prepared-meals/${id}`),
  create: (meal: Partial<PreparedMeal>) => api.post<PreparedMeal>('/prepared-meals', meal),
  createFromBarcode: (ean: string) => api.post<PreparedMeal>(`/prepared-meals/from-barcode/${ean}`),
  update: (id: string, meal: Partial<PreparedMeal>) => api.put<PreparedMeal>(`/prepared-meals/${id}`, meal),
  toggleFavorite: (id: string) => api.put<PreparedMeal>(`/prepared-meals/${id}/favorite`),
  delete: (id: string) => api.delete(`/prepared-meals/${id}`),
};
