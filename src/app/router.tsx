import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import RequireProfile from './RequireProfile';
import ProfileSetupScreen from '../screens/onboarding/ProfileSetupScreen';
import HomeScreen from '../screens/home/HomeScreen';
import WeekPlanScreen from '../screens/planning/WeekPlanScreen';
import DayDetailScreen from '../screens/planning/DayDetailScreen';
import RecipeListScreen from '../screens/recipes/RecipeListScreen';
import RecipeDetailScreen from '../screens/recipes/RecipeDetailScreen';
import RecipeFormScreen from '../screens/recipes/RecipeFormScreen';
import DishFromTextScreen from '../screens/recipes/DishFromTextScreen';
import IngredientSearchScreen from '../screens/ingredients/IngredientSearchScreen';
import IngredientDetailScreen from '../screens/ingredients/IngredientDetailScreen';
import BarcodeScanScreen from '../screens/ingredients/BarcodeScanScreen';
import ShoppingListScreen from '../screens/shopping/ShoppingListScreen';
import DashboardScreen from '../screens/nutrition/DashboardScreen';
import DailyLogScreen from '../screens/nutrition/DailyLogScreen';
import DeviationScreen from '../screens/nutrition/DeviationScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import ExportScreen from '../screens/export/ExportScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export const router = createBrowserRouter([
  { path: '/onboarding', element: <ProfileSetupScreen /> },
  {
    element: <RequireProfile />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomeScreen /> },
          { path: '/planning', element: <WeekPlanScreen /> },
          { path: '/planning/:date', element: <DayDetailScreen /> },
          { path: '/recipes', element: <RecipeListScreen /> },
          { path: '/recipes/new', element: <RecipeFormScreen /> },
          { path: '/recipes/describe', element: <DishFromTextScreen /> },
          { path: '/recipes/:id', element: <RecipeDetailScreen /> },
          { path: '/recipes/:id/edit', element: <RecipeFormScreen /> },
          { path: '/ingredients', element: <IngredientSearchScreen /> },
          { path: '/ingredients/scan', element: <BarcodeScanScreen /> },
          { path: '/ingredients/:id', element: <IngredientDetailScreen /> },
          { path: '/shopping', element: <ShoppingListScreen /> },
          { path: '/nutrition', element: <DashboardScreen /> },
          { path: '/nutrition/log', element: <DailyLogScreen /> },
          { path: '/nutrition/deviations', element: <DeviationScreen /> },
          { path: '/analytics', element: <AnalyticsScreen /> },
          { path: '/export', element: <ExportScreen /> },
          { path: '/settings', element: <SettingsScreen /> },
        ],
      },
    ],
  },
]);
