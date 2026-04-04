import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, ActivityIndicator, Divider } from 'react-native-paper';
import { profileApi, UserProfile, Gender, ActivityLevel, Goal } from '../../src/api/profile';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Homme' },
  { value: 'FEMALE', label: 'Femme' },
  { value: 'OTHER', label: 'Autre' },
];

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: 'SEDENTARY', label: 'Sédentaire' },
  { value: 'LIGHT', label: 'Légèrement actif' },
  { value: 'MODERATE', label: 'Modérément actif' },
  { value: 'ACTIVE', label: 'Très actif' },
  { value: 'VERY_ACTIVE', label: 'Extrêmement actif' },
];

const GOALS: { value: Goal; label: string }[] = [
  { value: 'LOSE', label: 'Perdre du poids' },
  { value: 'MAINTAIN', label: 'Maintenir' },
  { value: 'GAIN', label: 'Prendre du muscle' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, email } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile>({});
  const [objectives, setObjectives] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, objRes] = await Promise.all([profileApi.get(), profileApi.getObjectives()]);
      setProfile(profileRes.data);
      setObjectives(objRes.data);
    } catch {}
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await profileApi.update(profile);
      const objRes = await profileApi.getObjectives();
      setObjectives(objRes.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Profil</Text>
          <Text style={styles.emailLabel}>{email}</Text>

          <TextInput
            label="Prénom"
            value={profile.firstName ?? ''}
            onChangeText={(v) => setProfile({ ...profile, firstName: v })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Date de naissance (YYYY-MM-DD)"
            value={profile.birthDate ?? ''}
            onChangeText={(v) => setProfile({ ...profile, birthDate: v })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Taille (cm)"
            value={profile.heightCm?.toString() ?? ''}
            onChangeText={(v) => setProfile({ ...profile, heightCm: parseFloat(v) || undefined })}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Poids (kg)"
            value={profile.weightKg?.toString() ?? ''}
            onChangeText={(v) => setProfile({ ...profile, weightKg: parseFloat(v) || undefined })}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          <Text style={styles.sectionLabel}>Sexe</Text>
          <SegmentedButtons
            value={profile.gender ?? ''}
            onValueChange={(v) => setProfile({ ...profile, gender: v as Gender })}
            buttons={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
            style={styles.segments}
          />

          <Text style={styles.sectionLabel}>Objectif</Text>
          <SegmentedButtons
            value={profile.goal ?? ''}
            onValueChange={(v) => setProfile({ ...profile, goal: v as Goal })}
            buttons={GOALS.map((g) => ({ value: g.value, label: g.label }))}
            style={styles.segments}
          />

          <Text style={styles.sectionLabel}>Niveau d'activité</Text>
          {ACTIVITY_LEVELS.map((a) => (
            <Button
              key={a.value}
              mode={profile.activityLevel === a.value ? 'contained' : 'outlined'}
              onPress={() => setProfile({ ...profile, activityLevel: a.value })}
              style={styles.activityBtn}
              compact
            >
              {a.label}
            </Button>
          ))}
        </Card.Content>
      </Card>

      {/* Open Food Facts */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Open Food Facts</Text>
          <Text style={styles.offHint}>
            Connectez votre compte Open Food Facts pour accéder à plus de produits et contribuer à la base de données.{'\n'}
            Créer un compte gratuit sur <Text style={styles.offLink}>world.openfoodfacts.org</Text>
          </Text>
          <TextInput
            label="Nom d'utilisateur OFF"
            value={profile.offUsername ?? ''}
            onChangeText={(v) => setProfile({ ...profile, offUsername: v })}
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            label="Mot de passe OFF"
            value={profile.offPassword ?? ''}
            onChangeText={(v) => setProfile({ ...profile, offPassword: v })}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="lock" />}
          />
          {profile.offUsername ? (
            <Text style={styles.offConnected}>Compte configuré : {profile.offUsername}</Text>
          ) : (
            <Text style={styles.offDisconnected}>Aucun compte configuré — les recherches fonctionnent sans compte</Text>
          )}
        </Card.Content>
      </Card>

      {/* Objectifs calculés */}
      {objectives && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>Objectifs calculés</Text>
            <View style={styles.objRow}>
              <ObjItem label="BMR" value={Math.round(objectives.bmr)} unit="kcal" />
              <ObjItem label="TDEE" value={Math.round(objectives.tdee)} unit="kcal" />
              <ObjItem label="Objectif" value={objectives.targetCalories} unit="kcal" />
            </View>
            <Divider style={{ marginVertical: 12 }} />
            <View style={styles.objRow}>
              <ObjItem label="Protéines" value={objectives.targetProteinG} unit="g" color="#3498DB" />
              <ObjItem label="Glucides" value={objectives.targetCarbsG} unit="g" color="#F39C12" />
              <ObjItem label="Lipides" value={objectives.targetFatG} unit="g" color="#9B59B6" />
            </View>
          </Card.Content>
        </Card>
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isSaving}
        style={styles.saveBtn}
        icon={saved ? 'check' : 'content-save'}
      >
        {saved ? 'Sauvegardé !' : 'Sauvegarder'}
      </Button>

      <Button mode="outlined" onPress={handleLogout} style={styles.logoutBtn} textColor="#E74C3C">
        Se déconnecter
      </Button>
    </ScrollView>
  );
}

function ObjItem({ label, value, unit, color }: { label: string; value: number; unit: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 11, color: '#666' }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: color ?? '#2C3E50' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#999' }}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, paddingBottom: 40 },
  card: { marginBottom: 16, borderRadius: 12 },
  cardTitle: { fontWeight: 'bold', marginBottom: 12, color: '#2C3E50' },
  emailLabel: { color: '#666', marginBottom: 16 },
  input: { marginBottom: 12 },
  sectionLabel: { fontWeight: '500', marginTop: 8, marginBottom: 8, color: '#555' },
  segments: { marginBottom: 12 },
  activityBtn: { marginBottom: 8 },
  objRow: { flexDirection: 'row' },
  saveBtn: { marginBottom: 12 },
  logoutBtn: { borderColor: '#E74C3C' },
  offHint: { color: '#666', fontSize: 13, marginBottom: 12, lineHeight: 18 },
  offLink: { color: '#2ECC71', fontWeight: 'bold' },
  offConnected: { color: '#27AE60', fontSize: 13, marginTop: 4 },
  offDisconnected: { color: '#999', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
});
