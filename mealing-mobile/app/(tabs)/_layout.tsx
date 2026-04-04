import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// Icônes texte pour la compatibilité web sans assets natifs
function icon(emoji: string) {
  return () => null; // Utilise les emojis dans les labels
}

export default function TabsLayout() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
    }
  }, [token]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#95A5A6',
        headerStyle: { backgroundColor: '#2ECC71' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarLabel: '🏠 Accueil',
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: 'Planning',
          tabBarLabel: '📅 Planning',
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Courses',
          tabBarLabel: '🛒 Courses',
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Suivi',
          tabBarLabel: '📊 Suivi',
        }}
      />
      <Tabs.Screen
        name="ingredients"
        options={{
          title: 'Ingrédients',
          tabBarLabel: '🥦 Ingrédients',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarLabel: '⚙️ Paramètres',
        }}
      />
    </Tabs>
  );
}
