import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Searchbar, Card, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ingredientsApi, Ingredient } from '../../src/api/ingredients';

const CATEGORIES = ['Tous', 'Légumes', 'Fruits', 'Viandes & Poissons', 'Produits laitiers', 'Féculents', 'Matières grasses', 'Boissons', 'Épicerie', 'Autres'];

export default function IngredientsTabScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [fabOpen, setFabOpen] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await ingredientsApi.search('');
      setIngredients(data);
    } catch {}
    setIsLoading(false);
  }, []);

  // Recharge quand on revient sur cet onglet (ex: après ajout via OFF)
  useFocusEffect(useCallback(() => {
    loadAll();
  }, [loadAll]));

  const handleSearch = async (q: string) => {
    setQuery(q);
    try {
      const { data } = await ingredientsApi.search(q);
      setIngredients(data);
    } catch {}
  };

  const filtered = selectedCategory === 'Tous'
    ? ingredients
    : ingredients.filter((i) => i.category === selectedCategory);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher dans ma base..."
        value={query}
        onChangeText={handleSearch}
        style={styles.search}
      />

      {/* Filtre par catégorie */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        contentContainerStyle={{ paddingHorizontal: 12 }}
        renderItem={({ item }) => (
          <Chip
            selected={selectedCategory === item}
            onPress={() => setSelectedCategory(item)}
            style={styles.categoryChip}
            compact
          >
            {item}
          </Chip>
        )}
      />

      <Text style={styles.count}>{filtered.length} ingrédient{filtered.length !== 1 ? 's' : ''}</Text>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2ECC71" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {query ? `Aucun résultat pour "${query}"` : 'Votre base est vide'}
              </Text>
              <Text style={styles.emptyHint}>Utilisez le bouton + pour ajouter des ingrédients</Text>
            </View>
          }
          renderItem={({ item }) => (
            <IngredientRow
              ingredient={item}
              onPress={() => router.push(`/ingredients/${item.id}` as any)}
            />
          )}
        />
      )}

      <FAB.Group
        open={fabOpen}
        visible
        icon={fabOpen ? 'close' : 'plus'}
        color="white"
        fabStyle={styles.fab}
        actions={[
          {
            icon: 'earth',
            label: 'Rechercher sur Open Food Facts',
            onPress: () => { setFabOpen(false); router.push('/ingredients/off-search' as any); },
          },
          {
            icon: 'pencil-plus',
            label: 'Créer manuellement',
            onPress: () => { setFabOpen(false); router.push('/ingredients/new' as any); },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
      />
    </View>
  );
}

function IngredientRow({ ingredient, onPress }: { ingredient: Ingredient; onPress: () => void }) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.ingName} numberOfLines={1}>{ingredient.name}</Text>
          {ingredient.brand && <Text style={styles.ingBrand}>{ingredient.brand}</Text>}
          <View style={styles.ingMeta}>
            <Text style={styles.kcal}>{ingredient.calories100g} kcal/100g</Text>
            {ingredient.category && <Text style={styles.cat}> · {ingredient.category}</Text>}
          </View>
        </View>
        <View style={styles.badges}>
          {ingredient.nutriScore && (
            <Chip compact style={getNutriStyle(ingredient.nutriScore)}>{ingredient.nutriScore}</Chip>
          )}
          {ingredient.isCustom && (
            <Chip compact style={styles.customChip}>Perso.</Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

function getNutriStyle(score: string) {
  const colors: Record<string, string> = { A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FECACA' };
  return { backgroundColor: colors[score.toUpperCase()] ?? '#F5F5F5' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  search: { margin: 12, borderRadius: 12, backgroundColor: 'white' },
  categoryRow: { maxHeight: 44, marginBottom: 4 },
  categoryChip: { marginRight: 8 },
  count: { paddingHorizontal: 16, paddingBottom: 4, color: '#888', fontSize: 12 },
  card: { marginBottom: 8, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  ingName: { fontWeight: '600', fontSize: 14 },
  ingBrand: { color: '#888', fontSize: 12 },
  ingMeta: { flexDirection: 'row', marginTop: 2 },
  kcal: { color: '#F39C12', fontSize: 12, fontWeight: 'bold' },
  cat: { color: '#888', fontSize: 12 },
  badges: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  customChip: { backgroundColor: '#EDE9FE' },
  fab: { backgroundColor: '#2ECC71' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { color: '#666' },
  emptyHint: { color: '#999', fontSize: 12 },
});
