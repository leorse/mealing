import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useAuthStore } from '../src/store/useAuthStore';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2ECC71',
    secondary: '#27AE60',
    background: '#F8F9FA',
    surface: '#FFFFFF',
  },
};

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" options={{ title: 'Connexion' }} />
          <Stack.Screen name="auth/register" options={{ title: 'Inscription' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="recipes" />
          <Stack.Screen name="ingredients" />
          <Stack.Screen name="deviation" options={{ title: 'Déclarer un écart', presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
