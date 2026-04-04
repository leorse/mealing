import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Index() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth/login');
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [token]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2ECC71' }}>
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}
