import { Tabs } from 'expo-router';
import { TabIcon } from '../../src/components/TabIcon';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: '#2ECC71' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="planning"
        options={{
          title: 'Planning',
          tabBarIcon: ({ color, size }) => <TabIcon name="planning" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="recipes"
        options={{
          title: 'Recettes',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <TabIcon name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="shopping"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => <TabIcon name="caddie" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="nutrition"
        options={{
          title: 'Suivi',
          tabBarIcon: ({ color, size }) => <TabIcon name="suivi" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="ingredients"
        options={{
          title: 'Ingrédients',
          tabBarIcon: ({ color, size }) => <TabIcon name="legume" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="prepared"
        options={{
          title: 'Plats préparés',
          tabBarIcon: ({ color, size }) => <TabIcon name="plats" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <TabIcon name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
