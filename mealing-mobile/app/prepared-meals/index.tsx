import { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Chip, FAB, ActivityIndicator, IconButton, Searchbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { preparedMealsApi, PreparedMeal } from '../../src/api/preparedMeals';

export default function PreparedMealsScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<PreparedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await preparedMealsApi.getAll();
      setMeals(data);
    } catch {}
    setIsLoading(false);
  };

  const toggleFavorite = async (id: string) => {
    try {
      const { data } = await preparedMealsApi.toggleFavorite(id);
      setMeals(prev => prev.map(m => m.id === id ? data : m));
    } catch {}
  };

  const filtered = meals.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.brand ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const favorites = filtered.filter(m => m.isFavorite);
  const others = filtered.filter(m => !m.isFavorite);

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un plat..."
        value={query}
        onChangeText={setQuery}
        style={styles.search}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2ECC71" />
      ) : (
        <FlatList
          data={[
            ...(favorites.length > 0 ? [{ type: 'section', label: '⭐ Favoris' } as any] : []),
            ...favorites,
            ...(others.length > 0 ? [{ type: 'section', label: '📦 Tous les plats' } as any] : []),
            ...others,
          ]}
          keyExtractor={(item) => item.id ?? item.label}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Aucun plat préparé</Text>
              <Text style={styles.emptyHint}>Utilisez le + pour en ajouter</Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return <Text style={styles.sectionLabel}>{item.label}</Text>;
            }
            return (
              <MealCard
                meal={item}
                onPress={() => router.push(`/prepared-meals/${item.id}` as any)}
                onFavorite={() => toggleFavorite(item.id)}
              />
            );
          }}
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
            icon: 'barcode-scan',
            label: 'Scanner un code-barres',
            onPress: () => { setFabOpen(false); router.push('/prepared-meals/barcode' as any); },
          },
          {
            icon: 'pencil-plus',
            label: 'Saisir manuellement',
            onPress: () => { setFabOpen(false); router.push('/prepared-meals/new' as any); },
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
      />
    </View>
  );
}

function MealCard({ meal, onPress, onFavorite }: { meal: PreparedMeal; onPress: () => void; onFavorite: () => void }) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
          {meal.brand && <Text style={styles.brand}>{meal.brand}</Text>}
          <View style={styles.meta}>
            <Text style={styles.kcal}>{meal.caloriesPortion} kcal/portion</Text>
            {meal.portionLabel && <Text style={styles.portion}> · {meal.portionLabel}</Text>}
          </View>
        </View>
        <View style={styles.actions}>
          {meal.nutriScore && (
            <Chip compact style={getNutriStyle(meal.nutriScore)}>{meal.nutriScore}</Chip>
          )}
          <IconButton
            icon={meal.isFavorite ? 'star' : 'star-outline'}
            iconColor={meal.isFavorite ? '#F39C12' : '#ccc'}
            size={20}
            onPress={onFavorite}
          />
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
  search: { margin: 12, borderRadius: 12 },
  sectionLabel: { fontWeight: '700', color: '#444', marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  card: { marginBottom: 8, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '600', fontSize: 14 },
  brand: { color: '#888', fontSize: 12 },
  meta: { flexDirection: 'row', marginTop: 2 },
  kcal: { color: '#F39C12', fontSize: 12, fontWeight: 'bold' },
  portion: { color: '#888', fontSize: 12 },
  actions: { alignItems: 'center', gap: 4 },
  fab: { backgroundColor: '#2ECC71' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { color: '#666' },
  emptyHint: { color: '#999', fontSize: 12 },
});
