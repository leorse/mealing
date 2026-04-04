import { useState, useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Searchbar, Card, Chip, Button, ActivityIndicator, IconButton, Surface, Divider, Banner } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ingredientsApi, Ingredient } from '../../src/api/ingredients';
import { useIngredientStore } from '../../src/store/useIngredientStore';

export default function OFFSearchScreen() {
  const router = useRouter();
  const { addToLocal } = useIngredientStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data } = await ingredientsApi.searchOff(q);
        setResults(data);
      } catch (e: any) {
        const msg = e?.response?.data?.error
          ?? e?.message
          ?? 'Erreur lors de la recherche sur Open Food Facts';
        setError(msg);
        setResults([]);
      }
      setIsLoading(false);
    }, 500);
  };

  const handleAdd = async (ing: Ingredient) => {
    await addToLocal(ing);
    setAdded((prev) => new Set([...prev, ing.barcode ?? ing.name]));
  };

  const key = (ing: Ingredient) => ing.barcode ?? ing.name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.title}>Rechercher sur Open Food Facts</Text>
          <Text style={styles.subtitle}>Trouvez un produit et ajoutez-le à votre base</Text>
        </View>
      </View>

      <Searchbar
        placeholder="Feta, yaourt grec, céréales..."
        value={query}
        onChangeText={handleSearch}
        style={styles.search}
        autoFocus
      />

      <Banner
        visible={error !== null}
        icon="alert-circle"
        actions={[{ label: 'Fermer', onPress: () => setError(null) }]}
        style={styles.errorBanner}
      >
        {error ?? ''}
      </Banner>

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#2ECC71" />
          <Text style={styles.loadingText}>Recherche sur Open Food Facts...</Text>
        </View>
      )}

      {!isLoading && results.length > 0 && (
        <Text style={styles.count}>{results.length} produit{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => key(item)}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          !isLoading && query.length >= 2 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun résultat pour "{query}"</Text>
              <Button mode="outlined" icon="pencil-plus" onPress={() => router.push('/ingredients/new')} style={{ marginTop: 16 }}>
                Créer manuellement
              </Button>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isExpanded = expanded === key(item);
          const isAdded = added.has(key(item));

          return (
            <Card style={styles.card}>
              {/* Ligne principale */}
              <Card.Content>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={isExpanded ? undefined : 1}>{item.name}</Text>
                    {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
                    <View style={styles.chips}>
                      <Text style={styles.kcal}>{item.calories100g ?? 0} kcal/100g</Text>
                      {item.nutriScore && (
                        <Chip compact style={getNutriStyle(item.nutriScore)}>{item.nutriScore}</Chip>
                      )}
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      mode={isAdded ? 'contained' : 'outlined'}
                      icon={isAdded ? 'check' : 'plus'}
                      onPress={() => !isAdded && handleAdd(item)}
                      compact
                      style={styles.addBtn}
                      buttonColor={isAdded ? '#2ECC71' : undefined}
                    >
                      {isAdded ? 'Ajouté' : 'Ajouter'}
                    </Button>
                    <IconButton
                      icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      onPress={() => setExpanded(isExpanded ? null : key(item))}
                    />
                  </View>
                </View>

                {/* Détails nutritionnels (expandable) */}
                {isExpanded && (
                  <>
                    <Divider style={{ marginVertical: 10 }} />
                    <Text style={styles.detailTitle}>Valeurs nutritionnelles pour 100g</Text>
                    <View style={styles.nutritionGrid}>
                      <NutRow label="Calories" value={item.calories100g} unit="kcal" bold />
                      <NutRow label="Protéines" value={item.proteins100g} unit="g" color="#3498DB" />
                      <NutRow label="Glucides" value={item.carbs100g} unit="g" color="#F39C12" />
                      <NutRow label="  dont sucres" value={item.sugars100g} unit="g" indent />
                      <NutRow label="Lipides" value={item.fat100g} unit="g" color="#9B59B6" />
                      <NutRow label="  dont saturés" value={item.saturatedFat100g} unit="g" indent />
                      <NutRow label="Fibres" value={item.fiber100g} unit="g" color="#2ECC71" />
                      <NutRow label="Sel" value={item.salt100g} unit="g" />
                    </View>
                    {item.barcode && (
                      <Text style={styles.barcode}>Code-barres : {item.barcode}</Text>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

function NutRow({ label, value, unit, bold, color, indent }: {
  label: string; value?: number; unit: string; bold?: boolean; color?: string; indent?: boolean;
}) {
  if (value == null) return null;
  return (
    <View style={nutStyles.row}>
      <Text style={[nutStyles.label, indent && { color: '#aaa', fontSize: 11 }]}>{label}</Text>
      <Text style={[nutStyles.value, bold && { fontWeight: 'bold' }, color ? { color } : {}]}>
        {value} {unit}
      </Text>
    </View>
  );
}

function getNutriStyle(score: string) {
  const colors: Record<string, string> = { A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FECACA' };
  return { backgroundColor: colors[score.toUpperCase()] ?? '#F5F5F5' };
}

const nutStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: '#555', fontSize: 13 },
  value: { color: '#2C3E50', fontSize: 13 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 12, paddingVertical: 4 },
  title: { fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 12 },
  search: { margin: 12, borderRadius: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  loadingText: { color: '#666', fontSize: 13 },
  count: { paddingHorizontal: 16, paddingBottom: 4, color: '#888', fontSize: 12 },
  card: { marginBottom: 10, borderRadius: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontWeight: '600', fontSize: 14 },
  brand: { color: '#888', fontSize: 12, marginBottom: 4 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  kcal: { color: '#F39C12', fontWeight: 'bold', fontSize: 13 },
  actions: { alignItems: 'center' },
  addBtn: { minWidth: 90 },
  detailTitle: { fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  nutritionGrid: {},
  barcode: { color: '#aaa', fontSize: 11, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666' },
  errorBanner: { backgroundColor: '#FEE2E2' },
});
