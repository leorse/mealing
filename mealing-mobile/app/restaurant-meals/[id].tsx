import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, IconButton, Divider, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { restaurantMealsApi, RestaurantMeal } from '../../src/api/restaurantMeals';

export default function RestaurantMealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<RestaurantMeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await restaurantMealsApi.getById(id);
      setMeal(data);
    } catch {}
    setIsLoading(false);
  };

  const deleteMeal = async () => {
    await restaurantMealsApi.delete(id);
    router.back();
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 80 }} color="#2ECC71" />;
  if (!meal) return null;

  const METHOD_LABELS: Record<string, string> = {
    FREE: 'Saisie directe', GUIDED: 'Plat type', RECONSTRUCTED: 'Reconstitution', MIXED: 'Mixte'
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>🍽 {meal.dishName}</Text>
        <IconButton icon="delete-outline" iconColor="#E74C3C" onPress={deleteMeal} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {meal.restaurantName && <Text style={styles.restaurant}>📍 {meal.restaurantName}</Text>}
            {meal.restaurantType && <Text style={styles.type}>{meal.restaurantType}</Text>}
            {meal.dishNotes && <Text style={styles.notes}>{meal.dishNotes}</Text>}
            <Chip compact style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#EDE9FE' }}>
              {METHOD_LABELS[meal.estimationMethod]}
            </Chip>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Valeurs nutritionnelles estimées</Text>
            <Divider style={{ marginVertical: 8 }} />
            <NutRow label="Calories" value={meal.totalCalories} unit="kcal" bold />
            <NutRow label="Protéines" value={meal.totalProteins} unit="g" color="#3498DB" />
            <NutRow label="Glucides" value={meal.totalCarbs} unit="g" color="#F39C12" />
            <NutRow label="Lipides" value={meal.totalFat} unit="g" color="#9B59B6" />
          </Card.Content>
        </Card>

        {meal.ingredients && meal.ingredients.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>Ingrédients reconstitués</Text>
              <Divider style={{ marginVertical: 8 }} />
              {meal.ingredients.map(ing => (
                <Text key={ing.id} style={styles.ingRow}>
                  • {ing.ingredient?.name} — {ing.quantityG}g
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function NutRow({ label, value, unit, bold, color }: { label: string; value?: number | null; unit: string; bold?: boolean; color?: string }) {
  if (value == null) return null;
  return (
    <View style={nutStyles.row}>
      <Text style={nutStyles.label}>{label}</Text>
      <Text style={[nutStyles.value, bold && { fontWeight: 'bold' }, color ? { color } : {}]}>
        {Math.round(Number(value))} {unit}
      </Text>
    </View>
  );
}

const nutStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { color: '#555', fontSize: 14 },
  value: { color: '#2C3E50', fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 4 },
  title: { fontWeight: 'bold', flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 12 },
  restaurant: { fontWeight: '600', marginBottom: 2 },
  type: { color: '#888', fontSize: 12 },
  notes: { color: '#555', fontStyle: 'italic', marginTop: 4 },
  sectionTitle: { fontWeight: '600', color: '#2C3E50' },
  ingRow: { color: '#555', fontSize: 13, marginVertical: 2 },
});
