import { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, ActivityIndicator, IconButton, Divider, Portal, Modal, TextInput, SegmentedButtons } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mealExtrasApi, MealExtra, NutritionTotal } from '../../src/api/mealExtras';
import { ingredientsApi, Ingredient } from '../../src/api/ingredients';
import { preparedMealsApi, PreparedMeal } from '../../src/api/preparedMeals';

const EXTRA_TYPES = [
  { value: 'STARTER', label: 'Entrée' },
  { value: 'SIDE', label: 'Accomp.' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'DRINK', label: 'Boisson' },
  { value: 'SNACK', label: 'En-cas' },
  { value: 'OTHER', label: 'Autre' },
];

const TYPE_EMOJI: Record<string, string> = {
  STARTER: '🥗', SIDE: '🥔', DESSERT: '🍮', DRINK: '🥤', SNACK: '🍪', OTHER: '➕'
};

type AddMode = 'ingredient' | 'prepared' | 'free';

export default function MealSlotDetailScreen() {
  const router = useRouter();
  const { id: slotId, slotInfo } = useLocalSearchParams<{ id: string; slotInfo?: string }>();

  const [extras, setExtras] = useState<MealExtra[]>([]);
  const [total, setTotal] = useState<NutritionTotal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Infos du créneau passées via params (nom plat, calories plat)
  const slotData = slotInfo ? JSON.parse(decodeURIComponent(slotInfo)) : null;

  useEffect(() => {
    if (slotId) loadExtras();
  }, [slotId]);

  const loadExtras = async () => {
    setIsLoading(true);
    try {
      const [extrasRes, totalRes] = await Promise.all([
        mealExtrasApi.getExtras(slotId),
        mealExtrasApi.getNutritionTotal(slotId),
      ]);
      setExtras(extrasRes.data);
      setTotal(totalRes.data);
    } catch {}
    setIsLoading(false);
  };

  const deleteExtra = async (extraId: string) => {
    try {
      await mealExtrasApi.deleteExtra(slotId, extraId);
      loadExtras();
    } catch {}
  };

  if (isLoading) return <ActivityIndicator style={{ marginTop: 80 }} color="#2ECC71" />;

  const targetCalories = slotData?.targetCalories ?? 650;
  const totalCal = total?.calories ?? 0;
  const isOver = totalCal > targetCalories * 1.15;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {slotData?.mealType ?? 'Repas'} — {slotData?.date ?? ''}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Plat principal */}
        {slotData?.recipeName && (
          <Card style={styles.mainCard}>
            <Card.Content>
              <Text style={styles.mainLabel}>PLAT PRINCIPAL</Text>
              <Text style={styles.mainName}>{slotData.recipeName}</Text>
              {slotData.calories != null && (
                <Text style={styles.mainCal}>{Math.round(slotData.calories)} kcal</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Extras */}
        <View style={styles.extrasHeader}>
          <Text style={styles.extrasTitle}>EXTRAS</Text>
          <Button icon="plus" mode="text" onPress={() => setShowAddModal(true)} compact>Ajouter</Button>
        </View>

        {extras.length === 0 && (
          <Text style={styles.noExtras}>Aucun extra pour ce repas</Text>
        )}

        {extras.map(extra => (
          <View key={extra.id} style={styles.extraRow}>
            <Text style={styles.extraEmoji}>{TYPE_EMOJI[extra.extraType] ?? '➕'}</Text>
            <Text style={styles.extraLabel} numberOfLines={1}>{extra.label}</Text>
            <Text style={styles.extraCal}>{formatExtraCal(extra)} kcal</Text>
            <IconButton icon="close" size={16} onPress={() => deleteExtra(extra.id)} />
          </View>
        ))}

        <Divider style={{ marginVertical: 12 }} />

        {/* Total */}
        {total && (
          <Card style={[styles.totalCard, isOver && styles.totalCardOver]}>
            <Card.Content>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={[styles.totalCal, isOver && { color: '#E74C3C' }]}>
                  {Math.round(totalCal)} kcal
                </Text>
              </View>
              {slotData?.targetCalories && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.targetLabel}>Objectif {slotData.mealType?.toLowerCase()}</Text>
                    <Text style={styles.targetCal}>{targetCalories} kcal</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.ecartLabel}>Écart</Text>
                    <Text style={[styles.ecartCal, isOver ? { color: '#E74C3C' } : { color: '#2ECC71' }]}>
                      {totalCal > targetCalories ? '+' : ''}{Math.round(totalCal - targetCalories)} kcal
                    </Text>
                  </View>
                </>
              )}
              {isOver && (
                <Button mode="outlined" icon="alert" textColor="#E74C3C" style={{ marginTop: 8 }} onPress={() => {}}>
                  Déclarer comme écart
                </Button>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Portal>
        <Modal visible={showAddModal} onDismiss={() => setShowAddModal(false)} contentContainerStyle={styles.modal}>
          <AddExtraModal
            slotId={slotId}
            onDone={() => { setShowAddModal(false); loadExtras(); }}
            onClose={() => setShowAddModal(false)}
          />
        </Modal>
      </Portal>
    </View>
  );
}

function formatExtraCal(extra: MealExtra): string {
  if (extra.caloriesFree != null) return String(Math.round(extra.caloriesFree));
  return '—';
}

// ---- Modal d'ajout d'extra ----
function AddExtraModal({ slotId, onDone, onClose }: { slotId: string; onDone: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<AddMode>('free');
  const [extraType, setExtraType] = useState('OTHER');
  const [label, setLabel] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [ingQuery, setIngQuery] = useState('');
  const [ingResults, setIngResults] = useState<Ingredient[]>([]);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [quantityG, setQuantityG] = useState('100');
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);
  const [selectedPM, setSelectedPM] = useState<PreparedMeal | null>(null);
  const [portions, setPortions] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === 'prepared') {
      preparedMealsApi.getAll().then(r => setPreparedMeals(r.data)).catch(() => {});
    }
  }, [mode]);

  const searchIng = async (q: string) => {
    setIngQuery(q);
    if (q.length < 2) return;
    try {
      const { data } = await ingredientsApi.search(q);
      setIngResults(data);
    } catch {}
  };

  const save = async () => {
    if (!label.trim() && mode === 'free') return;
    setIsSaving(true);
    try {
      const extra: Partial<MealExtra> = {
        extraType: extraType as MealExtra['extraType'],
        label: label.trim() || selectedIng?.name || selectedPM?.name || 'Extra',
      };

      if (mode === 'ingredient' && selectedIng) {
        extra.ingredientId = selectedIng.id;
        extra.quantityG = parseFloat(quantityG);
        const cal = (selectedIng.calories100g / 100) * parseFloat(quantityG);
        extra.caloriesFree = cal;
      } else if (mode === 'prepared' && selectedPM) {
        extra.preparedMealId = selectedPM.id;
        extra.portions = parseFloat(portions);
        extra.caloriesFree = selectedPM.caloriesPortion * parseFloat(portions);
      } else {
        extra.caloriesFree = parseFloat(calories) || 0;
        extra.proteinsFree = proteins ? parseFloat(proteins) : undefined;
        extra.carbsFree = carbs ? parseFloat(carbs) : undefined;
        extra.fatFree = fat ? parseFloat(fat) : undefined;
      }

      await mealExtrasApi.addExtra(slotId, extra);
      onDone();
    } catch {}
    setIsSaving(false);
  };

  return (
    <ScrollView style={styles.modalScroll}>
      <View style={styles.modalHeader}>
        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Ajouter un extra</Text>
        <IconButton icon="close" onPress={onClose} />
      </View>

      <SegmentedButtons
        value={mode}
        onValueChange={v => setMode(v as AddMode)}
        buttons={[
          { value: 'free', label: '✏️ Libre' },
          { value: 'ingredient', label: '🥗 Ingrédient' },
          { value: 'prepared', label: '📦 Plat' },
        ]}
        style={{ marginBottom: 12 }}
      />

      <Text style={styles.fieldLabel}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {EXTRA_TYPES.map(t => (
            <Chip key={t.value} selected={extraType === t.value} onPress={() => setExtraType(t.value)} compact>
              {t.label}
            </Chip>
          ))}
        </View>
      </ScrollView>

      {mode === 'free' && (
        <>
          <TextInput label="Nom *" value={label} onChangeText={setLabel} mode="outlined" dense style={styles.mInput} />
          <TextInput label="Calories (kcal) *" value={calories} onChangeText={setCalories} mode="outlined" keyboardType="numeric" dense style={styles.mInput} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput label="Prot. (g)" value={proteins} onChangeText={setProteins} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
            <TextInput label="Glu. (g)" value={carbs} onChangeText={setCarbs} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
            <TextInput label="Lip. (g)" value={fat} onChangeText={setFat} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
          </View>
        </>
      )}

      {mode === 'ingredient' && (
        <>
          <TextInput label="Rechercher un ingrédient" value={ingQuery} onChangeText={searchIng} mode="outlined" dense style={styles.mInput} />
          {selectedIng ? (
            <Chip icon="check" style={{ marginBottom: 8, backgroundColor: '#DCFCE7' }} onClose={() => setSelectedIng(null)}>
              {selectedIng.name}
            </Chip>
          ) : ingResults.slice(0, 5).map(r => (
            <Button key={r.id} mode="text" compact onPress={() => { setSelectedIng(r); setLabel(r.name); }}>
              {r.name} — {r.calories100g} kcal/100g
            </Button>
          ))}
          <TextInput label="Quantité (g)" value={quantityG} onChangeText={setQuantityG} mode="outlined" keyboardType="numeric" dense style={styles.mInput} />
        </>
      )}

      {mode === 'prepared' && (
        <>
          {selectedPM ? (
            <Chip icon="check" style={{ marginBottom: 8, backgroundColor: '#DCFCE7' }} onClose={() => setSelectedPM(null)}>
              {selectedPM.name}
            </Chip>
          ) : preparedMeals.slice(0, 8).map(pm => (
            <Button key={pm.id} mode="text" compact onPress={() => { setSelectedPM(pm); setLabel(pm.name); }}>
              {pm.isFavorite ? '⭐ ' : ''}{pm.name} — {pm.caloriesPortion} kcal/portion
            </Button>
          ))}
          <TextInput label="Portions" value={portions} onChangeText={setPortions} mode="outlined" keyboardType="numeric" dense style={styles.mInput} />
        </>
      )}

      <Button mode="contained" onPress={save} loading={isSaving} buttonColor="#2ECC71" style={{ marginTop: 12, borderRadius: 8 }}>
        Ajouter
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2 },
  title: { fontWeight: 'bold', flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  mainCard: { borderRadius: 12, marginBottom: 16, backgroundColor: '#F0FFF4' },
  mainLabel: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1 },
  mainName: { fontSize: 18, fontWeight: '600', color: '#2C3E50', marginTop: 2 },
  mainCal: { color: '#F39C12', fontWeight: 'bold', marginTop: 4 },
  extrasHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  extrasTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1 },
  noExtras: { color: '#aaa', fontStyle: 'italic', marginBottom: 8 },
  extraRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  extraEmoji: { fontSize: 16 },
  extraLabel: { flex: 1, fontSize: 14 },
  extraCal: { color: '#F39C12', fontWeight: 'bold', fontSize: 13 },
  totalCard: { borderRadius: 12, backgroundColor: '#F0FFF4' },
  totalCardOver: { backgroundColor: '#FFF1F0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontWeight: '700', color: '#888', letterSpacing: 1, fontSize: 11 },
  totalCal: { fontWeight: 'bold', fontSize: 18, color: '#2ECC71' },
  targetLabel: { color: '#555' },
  targetCal: { color: '#555' },
  ecartLabel: { color: '#555' },
  ecartCal: { fontWeight: 'bold' },
  modal: { backgroundColor: 'white', margin: 16, borderRadius: 16, maxHeight: '90%' },
  modalScroll: { padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontWeight: '600', marginBottom: 4 },
  mInput: { marginBottom: 8 },
});
