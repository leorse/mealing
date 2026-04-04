import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleRegister = async () => {
    if (password !== confirm) return;
    try {
      await register(email, password);
      router.replace('/(tabs)/planning');
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Surface style={styles.card}>
          <Button icon="arrow-left" mode="text" onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginLeft: -8 }}>
            Retour
          </Button>
          <Text variant="headlineSmall" style={styles.title}>Créer un compte</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} mode="outlined" />
          <TextInput label="Mot de passe (8 car. min.)" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} mode="outlined" />
          <TextInput
            label="Confirmer le mot de passe"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            error={confirm.length > 0 && password !== confirm}
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading || !email || password.length < 8 || password !== confirm}
            style={styles.button}
          >
            S'inscrire
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FDF4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { padding: 24, borderRadius: 16, elevation: 4 },
  title: { marginBottom: 20, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
  error: { color: '#E74C3C', marginBottom: 12, textAlign: 'center' },
});
