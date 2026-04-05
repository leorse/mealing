import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Text, Card, TextInput, Button, SegmentedButtons, ActivityIndicator, Divider } from 'react-native-paper';
import { profileApi, UserProfile, Gender, ActivityLevel, Goal } from '../../src/api/profile';
import { offCatalogApi, CatalogStatus } from '../../src/api/offCatalog';
import { ciqualApi, CiqualStatus } from '../../src/api/ciqual';
import { backupApi } from '../../src/api/backup';
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
  const [profile, setProfile] = useState<UserProfile>({});
  const [objectives, setObjectives] = useState<any>(null);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus | null>(null);
  const [ciqualStatus, setCiqualStatus] = useState<CiqualStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, objRes, catalogRes, ciqualRes] = await Promise.all([
        profileApi.get(),
        profileApi.getObjectives(),
        offCatalogApi.status().catch(() => null),
        ciqualApi.status().catch(() => null),
      ]);
      setProfile(profileRes.data);
      setObjectives(objRes.data);
      if (catalogRes) setCatalogStatus(catalogRes.data);
      if (ciqualRes) setCiqualStatus(ciqualRes.data);
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

  const handleExport = async () => {
    if (Platform.OS !== 'web') {
      setBackupStatus({ type: 'error', msg: 'Export disponible uniquement sur la version web pour l\'instant.' });
      return;
    }
    try {
      const res = await fetch(backupApi.exportUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `mealing-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus({ type: 'success', msg: 'Export téléchargé avec succès.' });
    } catch (e: any) {
      setBackupStatus({ type: 'error', msg: `Erreur export : ${e.message}` });
    }
  };

  const handleImport = () => {
    if (Platform.OS !== 'web') {
      setBackupStatus({ type: 'error', msg: 'Import disponible uniquement sur la version web pour l\'instant.' });
      return;
    }
    // Le file picker DOIT être déclenché synchronement dans le onPress (geste utilisateur direct)
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      // window.confirm est synchrone et accepté après sélection de fichier
      if (!window.confirm('Cette action remplacera toutes vos données actuelles (recettes, planning, ingrédients créés…). Continuer ?')) return;
      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await backupApi.importData(data);
        setBackupStatus({ type: 'success', msg: 'Import réussi ! Rechargez la page pour voir les données.' });
      } catch (err: any) {
        setBackupStatus({ type: 'error', msg: `Erreur import : ${err?.response?.data?.error ?? err.message}` });
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Profil</Text>
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

      {/* Catalogue Open Food Facts */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Catalogue Open Food Facts</Text>
          {catalogStatus == null ? (
            <ActivityIndicator size="small" style={{ alignSelf: 'flex-start', marginVertical: 4 }} />
          ) : catalogStatus.available ? (
            <>
              <View style={styles.catalogRow}>
                <Text style={styles.catalogIcon}>✅</Text>
                <View>
                  <Text style={styles.catalogPresent}>Catalogue présent</Text>
                  <Text style={styles.catalogCount}>
                    {catalogStatus.productCount.toLocaleString('fr-FR')} produits disponibles
                  </Text>
                </View>
              </View>
              <Text style={styles.catalogHint}>
                La recherche d'ingrédients utilise le catalogue local OFF.
              </Text>
            </>
          ) : (
            <>
              <View style={styles.catalogRow}>
                <Text style={styles.catalogIcon}>⚠️</Text>
                <View>
                  <Text style={styles.catalogAbsent}>Catalogue absent</Text>
                  <Text style={styles.catalogCount}>Aucune recherche OFF disponible</Text>
                </View>
              </View>
              <Text style={styles.catalogHint}>
                Pour activer la recherche, générez le fichier <Text style={{ fontWeight: 'bold' }}>off_catalog.db</Text> à la racine du projet (voir README).
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Base Ciqual */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Base Ciqual (ANSES)</Text>
          <Text style={styles.catalogHint}>
            Base de données nutritionnelles française (~2 800 aliments génériques). Utilisée pour la recherche d'ingrédients non-marqués (pain, riz, poulet…).
          </Text>
          {ciqualStatus == null ? (
            <ActivityIndicator size="small" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
          ) : (
            <View style={[styles.catalogRow, { marginTop: 10 }]}>
              <Text style={styles.catalogIcon}>{ciqualStatus.count > 0 ? '✅' : '⚠️'}</Text>
              <View style={{ flex: 1 }}>
                {ciqualStatus.count > 0 ? (
                  <>
                    <Text style={styles.catalogPresent}>Base Ciqual disponible</Text>
                    <Text style={styles.catalogCount}>
                      {ciqualStatus.count.toLocaleString('fr-FR')} aliments génériques
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.catalogAbsent}>Base Ciqual non importée</Text>
                    <Text style={styles.catalogCount}>
                      Lancez <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>ciqual-import.jar</Text> pour l'importer (voir README)
                    </Text>
                  </>
                )}
              </View>
            </View>
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

      {/* Sauvegarde / Restauration */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Sauvegarde & Restauration</Text>
          <Text style={styles.catalogHint}>
            Exporte vos données personnelles (recettes, planning, ingrédients créés, plats, etc.) dans un fichier JSON.
            N'inclut pas les bases CIQUAL et Open Food Facts.
          </Text>
          <View style={styles.backupRow}>
            <Button
              mode="outlined"
              icon="download"
              onPress={handleExport}
              style={{ flex: 1, marginRight: 8 }}
              compact
            >
              Exporter
            </Button>
            <Button
              mode="outlined"
              icon="upload"
              onPress={handleImport}
              loading={isImporting}
              style={{ flex: 1 }}
              compact
            >
              Importer
            </Button>
          </View>
          {backupStatus && (
            <Text style={backupStatus.type === 'success' ? styles.importSuccess : styles.importError}>
              {backupStatus.msg}
            </Text>
          )}
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isSaving}
        style={styles.saveBtn}
        icon={saved ? 'check' : 'content-save'}
      >
        {saved ? 'Sauvegardé !' : 'Sauvegarder'}
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
  input: { marginBottom: 12 },
  sectionLabel: { fontWeight: '500', marginTop: 8, marginBottom: 8, color: '#555' },
  segments: { marginBottom: 12 },
  activityBtn: { marginBottom: 8 },
  objRow: { flexDirection: 'row' },
  saveBtn: { marginBottom: 12 },
  backupRow: { flexDirection: 'row', marginTop: 12 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  catalogIcon: { fontSize: 22 },
  catalogPresent: { color: '#27AE60', fontWeight: '600', fontSize: 14 },
  catalogAbsent: { color: '#E67E22', fontWeight: '600', fontSize: 14 },
  catalogCount: { color: '#666', fontSize: 13, marginTop: 2 },
  catalogHint: { color: '#888', fontSize: 12, lineHeight: 17, marginTop: 4 },
  importError: { color: '#E74C3C', fontSize: 12, marginTop: 6 },
  importSuccess: { color: '#27AE60', fontSize: 12, marginTop: 6 },
});
