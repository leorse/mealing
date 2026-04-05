import { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, Chip, IconButton, Searchbar, Portal, Modal, Divider, Snackbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useRecipeStore } from '../../../src/store/useRecipeStore';
import { useIngredientStore } from '../../../src/store/useIngredientStore';
import { ingredientsApi, Ingredient } from '../../../src/api/ingredients';

export default function NewRecipeScreen() {
  const router = useRouter();
  const { createRecipe } = useRecipeStore();
  const { lastAdded, clearLastAdded } = useIngredientStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('1');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState<string>('EASY');
  const [ingredients, setIngredients] = useState<{ ingredientId: string; quantityG: number; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal ajout ingrédient
  const [showIngModal, setShowIngModal] = useState(false);
  const [ingSearch, setIngSearch] = useState('');
  const [ingResults, setIngResults] = useState<Ingredient[]>([]);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [qty, setQty] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quand on revient sur cette page après avoir ajouté un ingrédient à la base,
  // on pré-sélectionne automatiquement cet ingrédient dans le modal
  useFocusEffect(
    useCallback(() => {
      if (lastAdded) {
        setSelectedIng(lastAdded);
        setShowIngModal(true);
        clearLastAdded();
      }
    }, [lastAdded])
  );

  const searchIngredients = (q: string) => {
    setIngSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) { setIngResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await ingredientsApi.search(q);
        setIngResults(data);
      } catch {}
    }, 300);
  };

  const confirmIngredient = () => {
    if (!selectedIng || !qty) return;
    setIngredients((prev) => [...prev, {
      ingredientId: selectedIng.id,
      quantityG: parseFloat(qty),
      name: selectedIng.name,
    }]);
    setSelectedIng(null);
    setQty('');
    setIngSearch('');
    setIngResults([]);
    setShowIngModal(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await createRecipe({
        name,
        description,
        servings: parseInt(servings) || 1,
        prepTimeMin: parseInt(prepTime) || undefined,
        cookTimeMin: parseInt(cookTime) || undefined,
        difficulty,
        ingredients: ingredients.map(({ ingredientId, quantityG }) => ({ ingredientId, quantityG })),
      });
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Erreur lors de la sauvegarde';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.title}>Nouvelle recette</Text>
        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={!name.trim()} compact>
          Enregistrer
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput label="Nom de la recette *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" multiline style={styles.input} />

        <View style={styles.row}>
          <TextInput label="Portions" value={servings} onChangeText={setServings} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginRight: 8 }]} />
          <TextInput label="Prép. (min)" value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1, marginRight: 8 }]} />
          <TextInput label="Cuisson (min)" value={cookTime} onChangeText={setCookTime} keyboardType="numeric" mode="outlined" style={[styles.input, { flex: 1 }]} />
        </View>

        <Text style={styles.label}>Difficulté</Text>
        <View style={styles.chips}>
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
            <Chip key={d} selected={difficulty === d} onPress={() => setDifficulty(d)}>
              {d === 'EASY' ? 'Facile' : d === 'MEDIUM' ? 'Moyen' : 'Élaboré'}
            </Chip>
          ))}
        </View>

        <Text style={styles.label}>Ingrédients ({ingredients.length})</Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={styles.ingRow}>
            <Text style={{ flex: 1 }}>{ing.name}</Text>
            <Text style={styles.ingQty}>{ing.quantityG} g</Text>
            <IconButton icon="delete-outline" size={18} onPress={() => setIngredients((prev) => prev.filter((_, j) => j !== i))} />
          </View>
        ))}

        <Button mode="outlined" icon="plus" onPress={() => setShowIngModal(true)} style={styles.addIngBtn}>
          Ajouter un ingrédient
        </Button>
      </ScrollView>

      {/* Modal de sélection d'ingrédient */}
      <Portal>
        <Modal visible={showIngModal} onDismiss={() => { setShowIngModal(false); setSelectedIng(null); setIngSearch(''); setIngResults([]); }} contentContainerStyle={styles.modal}>
          {selectedIng ? (
            // Étape 2 : saisir la quantité
            <View>
              <View style={styles.modalHeader}>
                <IconButton icon="arrow-left" size={20} onPress={() => setSelectedIng(null)} />
                <Text variant="titleMedium" style={{ flex: 1 }}>Quantité</Text>
              </View>
              <Text style={styles.selectedName}>{selectedIng.name}</Text>
              <Text style={styles.selectedMeta}>{selectedIng.calories100g} kcal · {selectedIng.category}</Text>
              <TextInput
                label="Quantité (g)"
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                mode="outlined"
                style={{ marginTop: 16 }}
                autoFocus
              />
              <Button mode="contained" onPress={confirmIngredient} disabled={!qty} style={{ marginTop: 12 }}>
                Ajouter à la recette
              </Button>
            </View>
          ) : (
            // Étape 1 : chercher dans la base locale
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ marginBottom: 12 }}>Choisir un ingrédient</Text>
              <Searchbar
                placeholder="Rechercher dans ma base..."
                value={ingSearch}
                onChangeText={searchIngredients}
                autoFocus
              />
              <FlatList
                data={ingResults}
                keyExtractor={(i) => i.id}
                style={{ maxHeight: 260, marginTop: 8 }}
                ListEmptyComponent={
                  ingSearch.length > 0 ? (
                    <Text style={styles.noResult}>Introuvable dans votre base</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <View>
                    <Button
                      mode="text"
                      onPress={() => setSelectedIng(item)}
                      contentStyle={{ justifyContent: 'flex-start' }}
                    >
                      <Text style={styles.resultName}>{item.name}</Text>
                      <Text style={styles.resultMeta}>  {item.calories100g} kcal/100g</Text>
                    </Button>
                    <Divider />
                  </View>
                )}
              />

              {/* Lien vers la base d'ingrédients */}
              <Divider style={{ marginTop: 8 }} />
              <View style={styles.addToDbRow}>
                <Text style={styles.addToDbText}>Ingrédient introuvable ?</Text>
                <Button
                  mode="text"
                  icon="database-plus"
                  onPress={() => {
                    setShowIngModal(false);
                    router.push('/(tabs)/ingredients/' as any);
                  }}
                  compact
                >
                  Gérer ma base
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        style={{ backgroundColor: '#E74C3C' }}
        action={{ label: 'OK', onPress: () => setError(null) }}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'white', elevation: 2 },
  title: { flex: 1, fontWeight: 'bold' },
  content: { padding: 16, paddingBottom: 40 },
  input: { marginBottom: 12 },
  row: { flexDirection: 'row' },
  label: { fontWeight: '500', marginBottom: 8, color: '#555' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  ingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  ingQty: { color: '#666', marginRight: 4 },
  addIngBtn: { marginTop: 12 },
  modal: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 12, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: -8 },
  selectedName: { fontWeight: 'bold', fontSize: 16 },
  selectedMeta: { color: '#888', marginTop: 4 },
  noResult: { color: '#999', textAlign: 'center', padding: 16, fontStyle: 'italic' },
  resultName: { fontSize: 14 },
  resultMeta: { fontSize: 12, color: '#F39C12' },
  addToDbRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  addToDbText: { color: '#888', fontSize: 13 },
});
