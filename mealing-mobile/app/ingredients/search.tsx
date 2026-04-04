import { useState, useEffect, useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Searchbar, Card, Chip, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ingredientsApi, Ingredient } from '../../src/api/ingredients';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

export default function IngredientSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<Ingredient[]>([]);
  const [offResults, setOffResults] = useState<Ingredient[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [isLoadingOff, setIsLoadingOff] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < MIN_QUERY_LENGTH) {
      setLocalResults([]);
      setOffResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchAll(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const searchAll = async (q: string) => {
    // Lancer les deux recherches en parallèle
    setIsLoadingLocal(true);
    setIsLoadingOff(true);

    // Recherche locale (rapide)
    ingredientsApi.search(q)
      .then(({ data }) => setLocalResults(data))
      .catch(() => setLocalResults([]))
      .finally(() => setIsLoadingLocal(false));

    // Recherche Open Food Facts (plus lente)
    ingredientsApi.searchOff(q)
      .then(({ data }) => setOffResults(data))
      .catch(() => setOffResults([]))
      .finally(() => setIsLoadingOff(false));
  };

  const importIngredient = async (ing: Ingredient) => {
    try {
      await ingredientsApi.create({ ...ing, isCustom: true });
    } catch {}
  };

  // Dédoublonner les résultats OFF par rapport aux locaux
  const offResultsFiltered = offResults.filter(
    (off) => !localResults.some(
      (local) => local.barcode && local.barcode === off.barcode
    )
  );

  const isLoading = isLoadingLocal || isLoadingOff;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Rechercher un aliment</Text>
      </View>

      <Searchbar
        placeholder="Feta, poulet, riz, nutella..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        autoFocus
      />

      {query.length >= MIN_QUERY_LENGTH && (
        <View style={styles.statusBar}>
          {isLoading && <ActivityIndicator size="small" color="#2ECC71" style={{ marginRight: 8 }} />}
          <Text style={styles.statusText}>
            {isLoading
              ? 'Recherche en cours...'
              : `${localResults.length + offResultsFiltered.length} résultats`}
          </Text>
          <Text style={styles.offBadge}>
            {isLoadingOff ? '⏳ OFF' : `📦 ${offResultsFiltered.length} depuis Open Food Facts`}
          </Text>
        </View>
      )}

      <FlatList
        data={buildSections(localResults, offResultsFiltered)}
        keyExtractor={(item, idx) => item.id ?? item.barcode ?? idx.toString()}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          query.length >= MIN_QUERY_LENGTH && !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if ((item as any).__separator) {
            return <SectionHeader title={(item as any).title} />;
          }
          return (
            <IngCard
              ingredient={item as Ingredient}
              isLocal={localResults.some((l) => l.id === (item as Ingredient).id)}
              onImport={() => importIngredient(item as Ingredient)}
            />
          );
        }}
      />
    </View>
  );
}

function buildSections(local: Ingredient[], off: Ingredient[]): any[] {
  const items: any[] = [];
  if (local.length > 0) {
    items.push({ __separator: true, title: `Base locale (${local.length})` });
    items.push(...local);
  }
  if (off.length > 0) {
    items.push({ __separator: true, title: `Open Food Facts (${off.length})` });
    items.push(...off);
  }
  return items;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function IngCard({
  ingredient,
  isLocal,
  onImport,
}: {
  ingredient: Ingredient;
  isLocal: boolean;
  onImport: () => void;
}) {
  const [imported, setImported] = useState(false);

  const handleImport = () => {
    onImport();
    setImported(true);
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{ingredient.name}</Text>
            {ingredient.brand && (
              <Text style={styles.brand}>{ingredient.brand}</Text>
            )}
            <View style={styles.chips}>
              <Text style={styles.kcal}>
                {ingredient.calories100g ?? 0} kcal/100g
              </Text>
              {ingredient.nutriScore && (
                <Chip compact style={[styles.nutriChip, getNutriColor(ingredient.nutriScore)]}>
                  {ingredient.nutriScore}
                </Chip>
              )}
              {ingredient.category && (
                <Text style={styles.category}>{ingredient.category}</Text>
              )}
            </View>
            <View style={styles.macroRow}>
              {ingredient.proteins100g != null && (
                <Text style={styles.macro}>P: {ingredient.proteins100g}g</Text>
              )}
              {ingredient.carbs100g != null && (
                <Text style={styles.macro}>G: {ingredient.carbs100g}g</Text>
              )}
              {ingredient.fat100g != null && (
                <Text style={styles.macro}>L: {ingredient.fat100g}g</Text>
              )}
            </View>
          </View>

          {!isLocal && (
            <Button
              mode={imported ? 'contained' : 'outlined'}
              onPress={handleImport}
              compact
              style={styles.importBtn}
              icon={imported ? 'check' : 'download'}
            >
              {imported ? 'Importé' : 'Importer'}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

function getNutriColor(score: string): object {
  const colors: Record<string, string> = {
    A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FEE2E2',
  };
  return { backgroundColor: colors[score.toUpperCase()] ?? '#F5F5F5' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2 },
  title: { fontWeight: 'bold', flex: 1 },
  search: { margin: 12, borderRadius: 12 },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  statusText: { flex: 1, fontSize: 12, color: '#555' },
  offBadge: { fontSize: 11, color: '#666' },
  sectionHeader: {
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#2C3E50',
    textTransform: 'uppercase',
  },
  card: { marginHorizontal: 12, marginVertical: 4, borderRadius: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontWeight: '600', fontSize: 14 },
  brand: { color: '#888', fontSize: 12 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kcal: { color: '#F39C12', fontWeight: 'bold', fontSize: 13 },
  nutriChip: {},
  category: { color: '#888', fontSize: 11 },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  macro: { fontSize: 11, color: '#666' },
  importBtn: { minWidth: 90 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999', textAlign: 'center' },
});
