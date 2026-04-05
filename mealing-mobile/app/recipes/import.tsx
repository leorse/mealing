import { useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { Text, Button, Card, Chip, ActivityIndicator, Banner, List, Divider, IconButton, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { recipeImportApi, RecipeImportResponse, UnresolvedIngredient, ingredientsApi, Ingredient } from '../../src/api/ingredients';

type Step = 'select' | 'resolving' | 'done';

export default function RecipeImportScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecipeImportResponse | null>(null);

  // Résolution manuelle des ingrédients non trouvés
  const [resolving, setResolving] = useState<Record<string, ResolveState>>({});

  const handlePickFile = async () => {
    if (Platform.OS !== 'web') {
      setError('Import de fichier disponible uniquement sur navigateur web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file: File = e.target.files[0];
      if (!file) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await recipeImportApi.importFile(file, false);
        setResult(data);
        if (data.unresolvedIngredients.length > 0) {
          const initial: Record<string, ResolveState> = {};
          data.unresolvedIngredients.forEach(u => {
            initial[u.tempId] = { mode: 'search', query: u.name, selected: null, manualCal: '' };
          });
          setResolving(initial);
          setStep('resolving');
        } else {
          setStep('done');
        }
      } catch (e: any) {
        setError(e?.response?.data?.error ?? 'Erreur lors de l\'import');
      }
      setIsLoading(false);
    };
    input.click();
  };

  if (step === 'resolving' && result) {
    return (
      <ResolutionScreen
        unresolved={result.unresolvedIngredients}
        resolving={resolving}
        setResolving={setResolving}
        onDone={() => setStep('done')}
        onBack={() => router.back()}
      />
    );
  }

  if (step === 'done' && result) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="titleLarge" style={styles.title}>Import terminé</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.successCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.successTitle}>
                {result.status === 'SUCCESS' ? '✅ Import réussi' : '⚠️ Import partiel'}
              </Text>
              <Text style={styles.recipeName}>{result.recipeName}</Text>
              <Text style={styles.meta}>{result.servings} portion{result.servings > 1 ? 's' : ''}</Text>
              <Divider style={{ marginVertical: 12 }} />
              <Text style={styles.stat}>✅ {result.resolvedCount} ingrédient{result.resolvedCount > 1 ? 's' : ''} résolu{result.resolvedCount > 1 ? 's' : ''}</Text>
              {result.unresolvedIngredients.length > 0 && (
                <Text style={styles.statWarn}>⚠️ {result.unresolvedIngredients.length} non résolu{result.unresolvedIngredients.length > 1 ? 's' : ''}</Text>
              )}
            </Card.Content>
          </Card>

          {result.warnings.length > 0 && (
            <Card style={styles.warnCard}>
              <Card.Content>
                <Text style={styles.warnTitle}>Avertissements</Text>
                {result.warnings.map((w, i) => (
                  <Text key={i} style={styles.warnItem}>• {w}</Text>
                ))}
              </Card.Content>
            </Card>
          )}

          <Button mode="contained" onPress={() => router.replace('/recipes')} style={styles.btn} buttonColor="#2ECC71">
            Voir mes recettes
          </Button>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Importer une recette</Text>
      </View>

      <Banner visible={!!error} icon="alert" actions={[{ label: 'Fermer', onPress: () => setError(null) }]} style={styles.errorBanner}>
        {error ?? ''}
      </Banner>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>Format JSON attendu</Text>
            <Text style={styles.code}>{JSON.stringify({
              schema: "mealing_recipe",
              version: "1.0",
              name: "Nom de la recette",
              servings: 4,
              ingredients: [
                { name: "Tomate", quantity: 200, unit: "g" },
                { name: "Feta", quantity: 100, unit: "g" }
              ]
            }, null, 2)}</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="file-upload"
          onPress={handlePickFile}
          loading={isLoading}
          disabled={isLoading}
          style={styles.btn}
          buttonColor="#2ECC71"
        >
          Choisir un fichier JSON
        </Button>
      </ScrollView>
    </View>
  );
}

// ---- Écran de résolution manuelle ----

interface ResolveState {
  mode: 'search' | 'manual';
  query: string;
  selected: Ingredient | null;
  searchResults?: Ingredient[];
  manualCal: string;
}

function ResolutionScreen({ unresolved, resolving, setResolving, onDone, onBack }: {
  unresolved: UnresolvedIngredient[];
  resolving: Record<string, ResolveState>;
  setResolving: React.Dispatch<React.SetStateAction<Record<string, ResolveState>>>;
  onDone: () => void;
  onBack: () => void;
}) {
  const resolved = Object.values(resolving).filter(r => r.selected || r.manualCal).length;

  const search = async (tempId: string, q: string) => {
    setResolving(prev => ({ ...prev, [tempId]: { ...prev[tempId], query: q } }));
    if (q.length < 2) return;
    try {
      const { data } = await ingredientsApi.search(q);
      setResolving(prev => ({ ...prev, [tempId]: { ...prev[tempId], searchResults: data } }));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={onBack} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>Résoudre les ingrédients</Text>
          <Text style={styles.subtitle}>{resolved}/{unresolved.length} résolus</Text>
        </View>
        <Button mode="contained" onPress={onDone} buttonColor="#2ECC71" compact>Terminer</Button>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        {unresolved.map(u => {
          const state = resolving[u.tempId];
          if (!state) return null;
          return (
            <Card key={u.tempId} style={styles.card}>
              <Card.Content>
                <View style={styles.row}>
                  <Text style={styles.ingName}>{u.name}</Text>
                  {u.quantity && <Text style={styles.qty}>{u.quantity} {u.unit}</Text>}
                </View>
                {state.selected && (
                  <Chip icon="check" style={styles.resolvedChip} onClose={() =>
                    setResolving(prev => ({ ...prev, [u.tempId]: { ...prev[u.tempId], selected: null } }))
                  }>
                    {state.selected.name}
                  </Chip>
                )}
                {!state.selected && state.mode === 'search' && (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Rechercher dans ma base"
                      value={state.query}
                      onChangeText={q => search(u.tempId, q)}
                      dense
                      style={{ marginVertical: 6 }}
                    />
                    {state.searchResults?.map(r => (
                      <List.Item
                        key={r.id}
                        title={r.name}
                        description={`${r.calories100g} kcal/100g`}
                        onPress={() => setResolving(prev => ({ ...prev, [u.tempId]: { ...prev[u.tempId], selected: r } }))}
                        right={() => <IconButton icon="plus-circle" />}
                        style={styles.searchResult}
                      />
                    ))}
                    <Button compact mode="text" onPress={() => setResolving(prev => ({ ...prev, [u.tempId]: { ...prev[u.tempId], mode: 'manual' } }))}>
                      Saisir manuellement
                    </Button>
                  </>
                )}
                {!state.selected && state.mode === 'manual' && (
                  <>
                    <TextInput
                      mode="outlined"
                      label="Calories (kcal/100g)"
                      value={state.manualCal}
                      onChangeText={v => setResolving(prev => ({ ...prev, [u.tempId]: { ...prev[u.tempId], manualCal: v } }))}
                      keyboardType="numeric"
                      dense
                      style={{ marginVertical: 6 }}
                    />
                    <Button compact mode="text" onPress={() => setResolving(prev => ({ ...prev, [u.tempId]: { ...prev[u.tempId], mode: 'search' } }))}>
                      ← Rechercher
                    </Button>
                  </>
                )}
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 12, paddingVertical: 4 },
  title: { fontWeight: 'bold', flex: 1 },
  subtitle: { color: '#888', fontSize: 12 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  infoCard: { borderRadius: 12 },
  successCard: { borderRadius: 12, backgroundColor: '#F0FFF4' },
  successTitle: { fontWeight: 'bold', color: '#2ECC71' },
  recipeName: { fontSize: 18, fontWeight: '600', marginTop: 4 },
  meta: { color: '#888', marginTop: 2 },
  stat: { color: '#2ECC71', marginTop: 4 },
  statWarn: { color: '#F39C12', marginTop: 4 },
  warnCard: { borderRadius: 12, backgroundColor: '#FFFBEB' },
  warnTitle: { fontWeight: '600', color: '#92400E', marginBottom: 6 },
  warnItem: { color: '#78350F', fontSize: 13, marginBottom: 2 },
  btn: { borderRadius: 8 },
  code: { fontFamily: 'monospace', fontSize: 11, color: '#555', backgroundColor: '#F5F5F5', padding: 8, borderRadius: 6 },
  errorBanner: { backgroundColor: '#FEE2E2' },
  card: { marginBottom: 10, borderRadius: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ingName: { fontWeight: '600', fontSize: 14 },
  qty: { color: '#888', fontSize: 12 },
  resolvedChip: { backgroundColor: '#DCFCE7', marginVertical: 4 },
  searchResult: { backgroundColor: '#F9F9F9', borderRadius: 8, marginBottom: 2 },
});
