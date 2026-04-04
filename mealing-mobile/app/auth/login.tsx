import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.logo}>🥗 Mealing</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Planifiez vos repas, atteignez vos objectifs</Text>
        </View>

        <Surface style={styles.card}>
          <Text variant="headlineSmall" style={styles.title}>Connexion</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
            style={styles.input}
            mode="outlined"
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || !email || !password}
            style={styles.button}
          >
            Se connecter
          </Button>

          <Button mode="text" onPress={() => router.push('/auth/register')} style={styles.link}>
            Pas encore de compte ? S'inscrire
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { color: '#2ECC71', fontWeight: 'bold' },
  subtitle: { color: '#666', marginTop: 8, textAlign: 'center' },
  card: { padding: 24, borderRadius: 16, elevation: 4 },
  title: { marginBottom: 20, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  link: { marginTop: 12 },
  error: { color: '#E74C3C', marginBottom: 12, textAlign: 'center' },
});
