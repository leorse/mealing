import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNutritionStore } from '../src/store/useNutritionStore';
import { format } from 'date-fns';

const COMMON_DEVIATIONS = [
  { label: 'Pizza', calories: 700 },
  { label: 'Burger', calories: 650 },
  { label: 'Kebab', calories: 800 },
  { label: 'Dessert', calories: 400 },
  { label: 'Apéritif', calories: 350 },
  { label: 'Restaurant (repas complet)', calories: 900 },
];

export default function DeviationScreen() {
  const router = useRouter();
  const { addDeviation } = useNutritionStore();
  const [type, setType] = useState<'PLANNED' | 'UNPLANNED'>('UNPLANNED');
  const [label, setLabel] = useState('');
  const [calories, setCalories] = useState('');
  const [spread, setSpread] = useState('2');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!calories) return;
    setIsSaving(true);
    try {
      await addDeviation({
        deviationDate: format(new Date(), 'yyyy-MM-dd'),
        type,
        label,
        caloriesExtra: parseInt(calories),
        compensationSpread: parseInt(spread) || 2,
      });
      router.back();
    } catch {}
    setIsSaving(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Déclarer un écart</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.label}>Type d'écart</Text>
            <SegmentedButtons
              value={type}
              onValueChange={(v) => setType(v as any)}
              buttons={[
                { value: 'UNPLANNED', label: 'Imprévu' },
                { value: 'PLANNED', label: 'Prévu' },
              ]}
              style={styles.segments}
            />

            <Text style={styles.label}>Repas rapides courants</Text>
            <View style={styles.commonGrid}>
              {COMMON_DEVIATIONS.map((d) => (
                <Button
                  key={d.label}
                  mode={label === d.label ? 'contained' : 'outlined'}
                  onPress={() => { setLabel(d.label); setCalories(d.calories.toString()); }}
                  compact
                  style={styles.commonBtn}
                >
                  {d.label} ({d.calories} kcal)
                </Button>
              ))}
            </View>

            <TextInput
              label="Description (optionnel)"
              value={label}
              onChangeText={setLabel}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Calories (kcal)"
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Compenser sur (jours)"
              value={spread}
              onChangeText={setSpread}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            {calories && (
              <View style={styles.preview}>
                <Text style={styles.previewTitle}>Compensation prévue</Text>
                <Text style={styles.previewText}>
                  Réduction de {Math.round(parseInt(calories) / (parseInt(spread) || 2))} kcal/jour pendant {parseInt(spread) || 2} jours
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={!calories} style={styles.saveBtn}>
          Enregistrer l'écart
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2 },
  title: { fontWeight: 'bold' },
  content: { padding: 16 },
  card: { marginBottom: 16, borderRadius: 12 },
  label: { fontWeight: '500', marginBottom: 8, color: '#555' },
  segments: { marginBottom: 16 },
  commonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  commonBtn: { marginBottom: 4 },
  input: { marginBottom: 12 },
  preview: { backgroundColor: '#FEF9C3', padding: 12, borderRadius: 8, marginTop: 4 },
  previewTitle: { fontWeight: 'bold', color: '#F39C12', marginBottom: 4 },
  previewText: { color: '#666' },
  saveBtn: {},
});
