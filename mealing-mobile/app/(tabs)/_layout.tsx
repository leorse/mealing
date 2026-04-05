import { Tabs } from 'expo-router';

export default function TabsLayout() {
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
      <Tabs.Screen name="index"      options={{ title: 'Accueil',        tabBarLabel: '🏠 Accueil' }} />
      <Tabs.Screen name="planning"   options={{ title: 'Planning',        tabBarLabel: '📅 Planning' }} />
      <Tabs.Screen name="shopping"   options={{ title: 'Courses',         tabBarLabel: '🛒 Courses' }} />
      <Tabs.Screen name="nutrition"  options={{ title: 'Suivi',           tabBarLabel: '📊 Suivi' }} />
      <Tabs.Screen name="ingredients" options={{ title: 'Ingrédients',   tabBarLabel: '🥦 Ingrédients' }} />
      <Tabs.Screen name="prepared"   options={{ title: 'Plats préparés', tabBarLabel: '📦 Plats' }} />
      <Tabs.Screen name="settings"   options={{ title: 'Paramètres',     tabBarLabel: '⚙️ Paramètres' }} />
    </Tabs>
  );
}
