import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Searchbar, Card, Chip, FAB, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '../../../src/store/useRecipeStore';
import { Recipe } from '../../../src/api/recipes';

const DIFFICULTY_LABELS: Record<string, string> = { EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Élaboré' };
const DIFFICULTY_COLORS: Record<string, string> = { EASY: '#DCFCE7', MEDIUM: '#FEF9C3', HARD: '#FEE2E2' };

export default function RecipesScreen() {
  const router = useRouter();
  const { recipes, isLoading, fetchRecipes, deleteRecipe } = useRecipeStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, []);

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (recipe: Recipe) => {
    Alert.alert('Supprimer', `Supprimer "${recipe.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteRecipe(recipe.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher une recette..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {search ? 'Aucun résultat' : 'Aucune recette. Créez-en une !'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/(tabs)/recipes/${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => router.push('/(tabs)/recipes/new')}
      />
    </View>
  );
}

function RecipeCard({ recipe, onPress, onDelete }: { recipe: Recipe; onPress: () => void; onDelete: () => void }) {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>{recipe.name}</Text>
          <IconButton icon="delete-outline" size={18} iconColor="#E74C3C" onPress={onDelete} />
        </View>
        <View style={styles.chips}>
          {recipe.difficulty && (
            <Chip compact style={[styles.chip, { backgroundColor: DIFFICULTY_COLORS[recipe.difficulty] }]}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </Chip>
          )}
          {recipe.isHealthy && <Chip compact style={[styles.chip, { backgroundColor: '#DCFCE7' }]}>Healthy 🌿</Chip>}
          <Chip compact style={styles.chip}>{recipe.servings} portion{recipe.servings > 1 ? 's' : ''}</Chip>
          {recipe.prepTimeMin && <Chip compact style={styles.chip}>{recipe.prepTimeMin} min</Chip>}
        </View>
        <Text style={styles.ingCount}>{recipe.ingredients?.length ?? 0} ingrédient{(recipe.ingredients?.length ?? 0) > 1 ? 's' : ''}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  search: { margin: 16, borderRadius: 12 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontWeight: 'bold', flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { marginRight: 4 },
  ingCount: { color: '#666', fontSize: 12, marginTop: 8 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2ECC71' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#999' },
});
