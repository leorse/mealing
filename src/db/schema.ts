import Dexie, { type Table } from 'dexie';

export interface UserProfile {
  id?: number; // toujours 1 — profil unique local
  firstName: string;
  birthDate: string; // ISO date
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal: 'LOSE' | 'MAINTAIN' | 'GAIN';
  targetCalories: number | null; // null = calculé automatiquement
  macroProteinPct: number;
  macroCarbsPct: number;
  macroFatPct: number;
  compensationSpread: number; // nb de jours pour compenser un écart
  updatedAt: string;
}

export interface Ingredient {
  id?: string; // uuid généré client
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
  calories100g: number;
  proteins100g?: number;
  carbs100g?: number;
  sugars100g?: number;
  fat100g?: number;
  saturatedFat100g?: number;
  fiber100g?: number;
  salt100g?: number;
  glycemicIndex?: number;
  nutriScore?: 'A' | 'B' | 'C' | 'D' | 'E';
  // Poids estimé d'une portion ou d'une unité usuelle (« 1 saucisse = 130 g ») : une moyenne indicative.
  portionG?: number;
  portionLabel?: string;
  allergens?: string[];
  offId?: string; // Open Food Facts ID
  isCustom: boolean;
  source?: 'CIQUAL' | 'OFF' | 'CUSTOM'; // provenance de la donnée
  createdAt: string;
}

export interface Recipe {
  id?: string;
  name: string;
  description?: string;
  servings: number;
  kind: 'RECIPE' | 'PREPARED'; // RECIPE = calculée depuis les ingrédients, PREPARED = plat tout prêt (calories saisies directement)
  prepTimeMin?: number;
  cookTimeMin?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'; // sans objet pour un plat tout prêt (kind: 'PREPARED')
  isHealthy?: boolean;
  isFavorite?: boolean; // non indexé, donc sans migration : absent = non favori
  photoBlob?: Blob;
  tags?: string[];
  // Renseigné uniquement si kind === 'PREPARED' — valeurs nutritionnelles par portion, saisies à la main
  caloriesPerServing?: number;
  proteinsPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id?: string;
  recipeId: string;
  ingredientId: string;
  quantityG: number;
  // Présent quand la ligne a été saisie en unités de l'aliment. Non indexé, donc sans migration.
  // quantityG reste la vérité des calculs et vaut alors unitCount × portionG de l'aliment.
  unitCount?: number;
  unitLabel?: string;
}

export interface WeekPlan {
  id?: string;
  weekStart: string; // lundi de la semaine, ISO date
  notes?: string;
  // Avis de l'IA, par date, et bilan de la semaine. Non indexés, donc sans migration.
  aiReviews?: Record<string, AiDayReview>;
  aiSummary?: { text: string; reviewedAt: string };
}

export interface AiDayReview {
  score: number; // entier de 0 à 10
  comment: string;
  reviewedAt: string;
  // Empreinte de la journée au moment de l'avis : si elle a changé, l'avis est dépassé.
  signature: string;
}

export interface MealSlot {
  id?: string;
  weekPlanId: string;
  slotDate: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  recipeId?: string;
  freeLabel?: string;
  portions: number;
  isDeviation: boolean;
  caloriesOverride?: number;
  isConsumed: boolean;
  consumedAt?: string;
  // Non indexé, donc sans migration : absent sur les créneaux antérieurs, et lu comme non marqué.
  // Rien ne part aux courses sans un clic explicite sur la pastille du planning.
  includeInShopping?: boolean;
  // État des articles de ce plat dans la liste de courses, lui aussi non indexé. Clé : identifiant
  // d'ingrédient, ou de la recette elle-même pour un plat tout prêt. Un article absent est actif.
  shoppingItemStates?: Record<string, ShoppingItemState>;
}

/** OFF : affiché grisé, hors quantités, réactivable. DELETED : retiré de la liste. */
export type ShoppingItemState = 'OFF' | 'DELETED';

export interface DailyLog {
  id?: string;
  logDate: string;
  totalCalories?: number;
  totalProteins?: number;
  totalCarbs?: number;
  totalFat?: number;
  totalFiber?: number;
  weightKg?: number;
  notes?: string;
}

export interface Deviation {
  id?: string;
  deviationDate: string;
  mealSlotId?: string;
  type: 'PLANNED' | 'UNPLANNED';
  label: string;
  caloriesExtra: number;
  compensationSpread: number;
  notes?: string;
  createdAt: string;
}

export interface ShoppingList {
  id?: string;
  weekPlanId?: string;
  name?: string;
  createdAt: string;
}

export interface ShoppingItem {
  id?: string;
  shoppingListId: string;
  ingredientId?: string;
  label: string;
  quantityG?: number;
  unitLabel?: string;
  category?: string;
  isChecked: boolean;
  isManual: boolean;
}

export interface AppMeta {
  key: string;
  value: string;
}

class MealingDB extends Dexie {
  userProfile!: Table<UserProfile, number>;
  ingredients!: Table<Ingredient, string>;
  recipes!: Table<Recipe, string>;
  recipeIngredients!: Table<RecipeIngredient, string>;
  weekPlans!: Table<WeekPlan, string>;
  mealSlots!: Table<MealSlot, string>;
  dailyLogs!: Table<DailyLog, string>;
  deviations!: Table<Deviation, string>;
  shoppingLists!: Table<ShoppingList, string>;
  shoppingItems!: Table<ShoppingItem, string>;
  appMeta!: Table<AppMeta, string>;

  constructor() {
    super('mealing');
    this.version(1).stores({
      userProfile: '++id',
      ingredients: 'id, name, barcode, category, isCustom',
      recipes: 'id, name, difficulty, isHealthy',
      recipeIngredients: 'id, recipeId, ingredientId',
      weekPlans: 'id, weekStart',
      mealSlots: 'id, weekPlanId, slotDate, [slotDate+mealType]',
      dailyLogs: 'id, logDate',
      deviations: 'id, deviationDate',
      shoppingLists: 'id, weekPlanId',
      shoppingItems: 'id, shoppingListId, category, isChecked',
      appMeta: 'key',
    });
  }
}

export const db = new MealingDB();
