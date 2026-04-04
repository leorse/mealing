import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, IconButton, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ingredientsApi, Ingredient } from '../../src/api/ingredients';

export default function IngredientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);

  useEffect(() => {
    if (id) {
      ingredientsApi.getById(id)
        .then(({ data }) => setIngredient(data))
        .catch(() => {});
    }
  }, [id]);

  if (!ingredient) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title} numberOfLines={2}>{ingredient.name}</Text>
      </View>

      {/* Meta */}
      <View style={styles.chips}>
        {ingredient.brand && <Chip compact>{ingredient.brand}</Chip>}
        {ingredient.category && <Chip compact style={{ backgroundColor: '#E0F2FE' }}>{ingredient.category}</Chip>}
        {ingredient.nutriScore && <Chip compact style={getNutriStyle(ingredient.nutriScore)}>Nutri-Score {ingredient.nutriScore}</Chip>}
        {ingredient.isCustom && <Chip compact style={{ backgroundColor: '#EDE9FE' }}>Ingrédient perso.</Chip>}
      </View>

      {/* Valeurs nutritionnelles */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Valeurs nutritionnelles pour 100g</Text>

          <View style={styles.caloriesBig}>
            <Text variant="displaySmall" style={styles.caloriesNum}>{ingredient.calories100g}</Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <NutRow label="Protéines" value={ingredient.proteins100g} unit="g" color="#3498DB" />
          <NutRow label="Glucides" value={ingredient.carbs100g} unit="g" color="#F39C12" />
          <NutRow label="  dont sucres" value={ingredient.sugars100g} unit="g" indent />
          <NutRow label="Lipides" value={ingredient.fat100g} unit="g" color="#9B59B6" />
          <NutRow label="  dont acides gras saturés" value={ingredient.saturatedFat100g} unit="g" indent />
          <NutRow label="Fibres" value={ingredient.fiber100g} unit="g" color="#2ECC71" />
          <NutRow label="Sel" value={ingredient.salt100g} unit="g" />
          {ingredient.glycemicIndex != null && (
            <NutRow label="Indice glycémique" value={ingredient.glycemicIndex} unit="" />
          )}
        </Card.Content>
      </Card>

      {/* Infos supplémentaires */}
      {(ingredient.barcode || ingredient.offId) && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Informations produit</Text>
            {ingredient.barcode && <Text style={styles.info}>Code-barres : {ingredient.barcode}</Text>}
            {ingredient.offId && <Text style={styles.info}>ID Open Food Facts : {ingredient.offId}</Text>}
          </Card.Content>
        </Card>
      )}

      {ingredient.isCustom && (
        <Button mode="outlined" icon="delete" textColor="#E74C3C" style={styles.deleteBtn}
          onPress={() => {
            ingredientsApi.delete(ingredient.id)
              .then(() => router.back())
              .catch(() => {});
          }}>
          Supprimer cet ingrédient
        </Button>
      )}
    </ScrollView>
  );
}

function NutRow({ label, value, unit, color, indent }: {
  label: string; value?: number; unit: string; color?: string; indent?: boolean;
}) {
  if (value == null) return null;
  return (
    <View style={nutStyles.row}>
      <Text style={[nutStyles.label, indent && nutStyles.indent]}>{label}</Text>
      <Text style={[nutStyles.value, color ? { color } : {}]}>{value} {unit}</Text>
    </View>
  );
}

function getNutriStyle(score: string): object {
  const colors: Record<string, string> = { A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FECACA' };
  return { backgroundColor: colors[score.toUpperCase()] ?? '#F5F5F5' };
}

const nutStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  label: { color: '#555', fontSize: 13, flex: 1 },
  indent: { color: '#aaa', fontSize: 12, paddingLeft: 12 },
  value: { fontWeight: '600', fontSize: 13, color: '#2C3E50' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 12 },
  title: { flex: 1, fontWeight: 'bold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  card: { margin: 16, marginTop: 0, borderRadius: 12 },
  sectionTitle: { fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  caloriesBig: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingVertical: 12 },
  caloriesNum: { fontWeight: 'bold', color: '#F39C12' },
  caloriesUnit: { color: '#888', marginLeft: 4, fontSize: 18 },
  info: { color: '#666', fontSize: 13, marginBottom: 4 },
  deleteBtn: { margin: 16, borderColor: '#E74C3C' },
});
