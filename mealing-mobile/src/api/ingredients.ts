import api from './client';

export interface Ingredient {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category?: string;
  calories100g: number;
  proteins100g?: number;
  carbs100g?: number;
  sugars100g?: number;
  fat100g?: number;
  saturatedFat100g?: number;
  fiber100g?: number;
  salt100g?: number;
  glycemicIndex?: number;
  nutriScore?: string;
  isCustom: boolean;
}

export const ingredientsApi = {
  search: (q: string) =>
    api.get<Ingredient[]>('/ingredients', { params: { q } }),

  getById: (id: string) =>
    api.get<Ingredient>(`/ingredients/${id}`),

  findByBarcode: (ean: string) =>
    api.get<Ingredient>(`/ingredients/barcode/${ean}`),

  create: (ingredient: Partial<Ingredient>) =>
    api.post<Ingredient>('/ingredients', ingredient),

  update: (id: string, ingredient: Partial<Ingredient>) =>
    api.put<Ingredient>(`/ingredients/${id}`, ingredient),

  delete: (id: string) =>
    api.delete(`/ingredients/${id}`),

  searchOff: (q: string) =>
    api.get<Ingredient[]>('/ingredients/import/off', { params: { q } }),

  importByBarcode: (ean: string) =>
    api.get<Ingredient>(`/ingredients/import/barcode/${ean}`),
};
