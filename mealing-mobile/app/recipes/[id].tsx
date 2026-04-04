import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, IconButton, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipeStore } from '../../src/store/useRecipeStore';
import { recipesApi, NutritionResponse } from '../../src/api/recipes';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedRecipe, fetchRecipe } = useRecipeStore();
  const [nutrition, setNutrition] = useState<NutritionResponse | null>(null);

  useEffect(() => {
    if (id) {
      fetchRecipe(id);
      recipesApi.getNutrition(id).then(({ data }) => setNutrition(data)).catch(() => {});
    }
  }, [id]);

  if (!selectedRecipe) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineSmall" style={styles.title} numberOfLines={2}>{selectedRecipe.name}</Text>
      </View>

      {/* Méta */}
      <View style={styles.chips}>
        {selectedRecipe.difficulty && <Chip compact>{selectedRecipe.difficulty === 'EASY' ? 'Facile' : selectedRecipe.difficulty === 'MEDIUM' ? 'Moyen' : 'Élaboré'}</Chip>}
        {selectedRecipe.isHealthy && <Chip compact style={{ backgroundColor: '#DCFCE7' }}>Healthy 🌿</Chip>}
        <Chip compact>{selectedRecipe.servings} portion{selectedRecipe.servings > 1 ? 's' : ''}</Chip>
        {selectedRecipe.prepTimeMin && <Chip compact>Prép. {selectedRecipe.prepTimeMin} min</Chip>}
        {selectedRecipe.cookTimeMin && <Chip compact>Cuisson {selectedRecipe.cookTimeMin} min</Chip>}
      </View>

      {selectedRecipe.description && (
        <Text style={styles.description}>{selectedRecipe.description}</Text>
      )}

      {/* Ingrédients */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Ingrédients</Text>
          {selectedRecipe.ingredients.map((ri) => (
            <View key={ri.id} style={styles.ingRow}>
              <Text style={styles.ingName}>{ri.ingredient.name}</Text>
              <Text style={styles.ingQty}>{ri.quantityG} g</Text>
              <Text style={styles.ingCal}>{Math.round(ri.ingredient.calories100g * ri.quantityG / 100)} kcal</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Valeurs nutritionnelles */}
      {nutrition && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Valeurs nutritionnelles</Text>
            <Text style={styles.perServing}>par portion ({selectedRecipe.servings} portions au total)</Text>
            <View style={styles.nutritionGrid}>
              <NutItem label="Calories" value={nutrition.caloriesPerServing} unit="kcal" />
              <NutItem label="Protéines" value={nutrition.proteinsPerServing} unit="g" />
              <NutItem label="Glucides" value={nutrition.carbsPerServing} unit="g" />
              <NutItem label="Lipides" value={nutrition.fatPerServing} unit="g" />
              <NutItem label="Fibres" value={nutrition.fiberPerServing} unit="g" />
            </View>
          </Card.Content>
        </Card>
      )}

      <Button mode="outlined" icon="pencil" onPress={() => router.push(`/recipes/edit/${id}`)}>
        Modifier la recette
      </Button>
    </ScrollView>
  );
}

function NutItem({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View style={nutStyles.item}>
      <Text style={nutStyles.label}>{label}</Text>
      <Text style={nutStyles.value}>{Math.round(value * 10) / 10} {unit}</Text>
    </View>
  );
}

const nutStyles = StyleSheet.create({
  item: { width: '33%', alignItems: 'center', paddingVertical: 8 },
  label: { fontSize: 11, color: '#666' },
  value: { fontSize: 15, fontWeight: 'bold', color: '#2C3E50' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'white' },
  title: { flex: 1, fontWeight: 'bold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 8 },
  description: { paddingHorizontal: 16, color: '#666', marginBottom: 12 },
  card: { margin: 16, marginTop: 0, borderRadius: 12 },
  sectionTitle: { fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ingName: { flex: 1 },
  ingQty: { color: '#666', width: 60, textAlign: 'right' },
  ingCal: { color: '#F39C12', width: 60, textAlign: 'right', fontSize: 12 },
  perServing: { color: '#666', fontSize: 12, marginBottom: 12 },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap' },
});
