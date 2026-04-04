import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, IconButton, SegmentedButtons, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useIngredientStore } from '../../src/store/useIngredientStore';

const CATEGORIES = ['Légumes', 'Fruits', 'Viandes & Poissons', 'Produits laitiers', 'Féculents', 'Matières grasses', 'Boissons', 'Épicerie', 'Autres'];
const NUTRI_SCORES = ['A', 'B', 'C', 'D', 'E'];

export default function NewIngredientScreen() {
  const router = useRouter();
  const { addToLocal } = useIngredientStore();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('Autres');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [sugars, setSugars] = useState('');
  const [fat, setFat] = useState('');
  const [saturatedFat, setSaturatedFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [salt, setSalt] = useState('');
  const [nutriScore, setNutriScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isValid = name.trim().length > 0 && calories.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      await addToLocal({
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        calories100g: parseFloat(calories),
        proteins100g: proteins ? parseFloat(proteins) : undefined,
        carbs100g: carbs ? parseFloat(carbs) : undefined,
        sugars100g: sugars ? parseFloat(sugars) : undefined,
        fat100g: fat ? parseFloat(fat) : undefined,
        saturatedFat100g: saturatedFat ? parseFloat(saturatedFat) : undefined,
        fiber100g: fiber ? parseFloat(fiber) : undefined,
        salt100g: salt ? parseFloat(salt) : undefined,
        nutriScore: nutriScore || undefined,
      });
      router.back();
    } catch (e) {
      console.error(e);
    }
    setIsSaving(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Nouvel ingrédient</Text>
        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={!isValid} compact>
          Enregistrer
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Informations générales */}
        <Text style={styles.sectionLabel}>Informations générales</Text>
        <TextInput label="Nom *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Marque (optionnel)" value={brand} onChangeText={setBrand} mode="outlined" style={styles.input} />

        <Text style={styles.sectionLabel}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              mode={category === cat ? 'contained' : 'outlined'}
              onPress={() => setCategory(cat)}
              compact
              style={styles.catBtn}
            >
              {cat}
            </Button>
          ))}
        </ScrollView>

        {/* Valeurs nutritionnelles */}
        <Text style={styles.sectionLabel}>Valeurs nutritionnelles (pour 100g) *</Text>

        <TextInput
          label="Calories (kcal) *"
          value={calories}
          onChangeText={setCalories}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="fire" />}
        />
        <HelperText type="info" visible>Seules les calories sont obligatoires</HelperText>

        <View style={styles.row}>
          <TextInput label="Protéines (g)" value={proteins} onChangeText={setProteins} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
          <TextInput label="Glucides (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
        </View>
        <View style={styles.row}>
          <TextInput label="dont sucres (g)" value={sugars} onChangeText={setSugars} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
          <TextInput label="Lipides (g)" value={fat} onChangeText={setFat} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
        </View>
        <View style={styles.row}>
          <TextInput label="dont saturés (g)" value={saturatedFat} onChangeText={setSaturatedFat} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
          <TextInput label="Fibres (g)" value={fiber} onChangeText={setFiber} keyboardType="numeric" mode="outlined" style={[styles.input, styles.half]} />
        </View>
        <TextInput label="Sel (g)" value={salt} onChangeText={setSalt} keyboardType="numeric" mode="outlined" style={styles.input} />

        {/* Nutri-Score */}
        <Text style={styles.sectionLabel}>Nutri-Score (optionnel)</Text>
        <View style={styles.nutriRow}>
          {['', ...NUTRI_SCORES].map((s) => (
            <Button
              key={s || 'none'}
              mode={nutriScore === s ? 'contained' : 'outlined'}
              onPress={() => setNutriScore(s)}
              compact
              style={[styles.nutriBtn, s ? getNutriStyle(s) : {}]}
              labelStyle={s ? { fontWeight: 'bold' } : {}}
            >
              {s || 'Aucun'}
            </Button>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getNutriStyle(score: string): object {
  const colors: Record<string, string> = { A: '#DCFCE7', B: '#D1FAE5', C: '#FEF9C3', D: '#FEE2E2', E: '#FECACA' };
  return { backgroundColor: colors[score] ?? undefined };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 8 },
  title: { flex: 1, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontWeight: '600', color: '#2C3E50', marginTop: 16, marginBottom: 8 },
  input: { marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  catRow: { marginBottom: 12 },
  catBtn: { marginRight: 8 },
  nutriRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutriBtn: {},
});
