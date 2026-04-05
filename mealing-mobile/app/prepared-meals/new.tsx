import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, IconButton, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { preparedMealsApi } from '../../src/api/preparedMeals';

const NUTRI_SCORES = ['A', 'B', 'C', 'D', 'E'];

export default function NewPreparedMealScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [portionLabel, setPortionLabel] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [nutriScore, setNutriScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim()) { setError('Le nom est obligatoire'); return; }
    if (!calories.trim()) { setError('Les calories sont obligatoires'); return; }
    setIsSaving(true);
    setError('');
    try {
      await preparedMealsApi.create({
        name: name.trim(),
        brand: brand.trim() || undefined,
        portionLabel: portionLabel.trim() || undefined,
        caloriesPortion: parseFloat(calories),
        proteinsG: proteins ? parseFloat(proteins) : undefined,
        carbsG: carbs ? parseFloat(carbs) : undefined,
        fatG: fat ? parseFloat(fat) : undefined,
        fiberG: fiber ? parseFloat(fiber) : undefined,
        nutriScore: nutriScore || undefined,
        isFavorite: false,
      });
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Erreur lors de la sauvegarde');
    }
    setIsSaving(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Nouveau plat préparé</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput label="Nom *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Marque" value={brand} onChangeText={setBrand} mode="outlined" style={styles.input} />
        <TextInput label="Label portion (ex: 1 barquette 300g)" value={portionLabel} onChangeText={setPortionLabel} mode="outlined" style={styles.input} />

        <Text style={styles.section}>Valeurs nutritionnelles (par portion)</Text>
        <TextInput label="Calories (kcal) *" value={calories} onChangeText={setCalories} mode="outlined" keyboardType="numeric" style={styles.input} />
        <View style={styles.row}>
          <TextInput label="Protéines (g)" value={proteins} onChangeText={setProteins} mode="outlined" keyboardType="numeric" style={styles.half} />
          <TextInput label="Glucides (g)" value={carbs} onChangeText={setCarbs} mode="outlined" keyboardType="numeric" style={styles.half} />
        </View>
        <View style={styles.row}>
          <TextInput label="Lipides (g)" value={fat} onChangeText={setFat} mode="outlined" keyboardType="numeric" style={styles.half} />
          <TextInput label="Fibres (g)" value={fiber} onChangeText={setFiber} mode="outlined" keyboardType="numeric" style={styles.half} />
        </View>

        <Text style={styles.section}>Nutri-Score</Text>
        <SegmentedButtons
          value={nutriScore}
          onValueChange={setNutriScore}
          buttons={NUTRI_SCORES.map(s => ({ value: s, label: s }))}
          style={styles.input}
        />

        <Button mode="contained" onPress={save} loading={isSaving} disabled={isSaving} style={styles.btn} buttonColor="#2ECC71">
          Enregistrer
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2 },
  title: { fontWeight: 'bold', flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  section: { fontWeight: '600', color: '#2C3E50', marginTop: 8, marginBottom: 4 },
  input: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  btn: { marginTop: 16, borderRadius: 8 },
  error: { color: '#E74C3C', marginBottom: 8 },
});
