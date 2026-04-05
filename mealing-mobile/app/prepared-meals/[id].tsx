import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { preparedMealsApi, PreparedMeal } from '../../src/api/preparedMeals';

export default function PreparedMealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meal, setMeal] = useState<PreparedMeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    try {
      const { data } = await preparedMealsApi.getById(id);
      setMeal(data);
    } catch {}
    setIsLoading(false);
  };

  const deleteMeal = async () => {
    try {
      await preparedMealsApi.delete(id);
      router.back();
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!meal) return;
    const { data } = await preparedMealsApi.toggleFavorite(id);
    setMeal(data);
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 80 }} color="#2ECC71" />;
  if (!meal) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title} numberOfLines={1}>{meal.name}</Text>
        <IconButton
          icon={meal.isFavorite ? 'star' : 'star-outline'}
          iconColor={meal.isFavorite ? '#F39C12' : '#ccc'}
          onPress={toggleFavorite}
        />
        <IconButton icon="delete-outline" iconColor="#E74C3C" onPress={deleteMeal} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {meal.brand && <Text style={styles.brand}>{meal.brand}</Text>}
            {meal.portionLabel && <Text style={styles.portion}>Portion : {meal.portionLabel}</Text>}
            {meal.nutriScore && (
              <Chip compact style={getNutriStyle(meal.nutriScore)} textStyle={{ fontWeight: 'bold' }}>
                Nutri-Score {meal.nutriScore}
              </Chip>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>Valeurs nutritionnelles / portion</Text>
            <Divider style={{ marginVertical: 8 }} />
            <NutRow label="Calories" value={meal.caloriesPortion} unit="kcal" bold />
            <NutRow label="Protéines" value={meal.proteinsG} unit="g" color="#3498DB" />
            <NutRow label="Glucides" value={meal.carbsG} unit="g" color="#F39C12" />
            <NutRow label="Lipides" value={meal.fatG} unit="g" color="#9B59B6" />
            <NutRow label="Fibres" value={meal.fiberG} unit="g" color="#2ECC71" />
          </Card.Content>
        </Card>

        {meal.barcode && (
          <Text style={styles.barcode}>Code-barres : {meal.barcode}</Text>
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
      <Text style={[nutStyles.value, bold && { fontWeight: 'bold' }, color ? { color } : {}]}>{value} {unit}</Text>
    </View>
  );
}

function getNutriStyle(score: string) {
  const colors: Record<string, string> = { A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FECACA' };
  return { backgroundColor: colors[score.toUpperCase()] ?? '#F5F5F5', marginTop: 8 };
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
  brand: { color: '#888', fontSize: 14, marginBottom: 4 },
  portion: { color: '#555', marginBottom: 8 },
  sectionTitle: { fontWeight: '600', color: '#2C3E50' },
  barcode: { color: '#aaa', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
