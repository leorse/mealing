import { useEffect, useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import {
  Text, Card, IconButton, ActivityIndicator, Button,
  Portal, Modal, TextInput, SegmentedButtons, Searchbar, Divider, Chip,
} from 'react-native-paper';
import { format, startOfWeek, addDays, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { usePlanStore } from '../../src/store/usePlanStore';
import { MealSlot, MealType } from '../../src/api/mealplan';
import { recipesApi, Recipe } from '../../src/api/recipes';
import { preparedMealsApi, PreparedMeal } from '../../src/api/preparedMeals';

const MEAL_TYPES: { type: MealType; label: string; emoji: string; color: string }[] = [
  { type: 'BREAKFAST', label: 'Petit-déjeuner', emoji: '🌅', color: '#FEF9C3' },
  { type: 'LUNCH',     label: 'Déjeuner',       emoji: '🍽️', color: '#DCFCE7' },
  { type: 'DINNER',   label: 'Dîner',           emoji: '🌙', color: '#E0F2FE' },
  { type: 'SNACK',    label: 'Collation',        emoji: '🍎', color: '#FEE2E2' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ---------------------------------------------------------------------------

export default function PlanningScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const { currentWeek, isLoading, fetchWeek } = usePlanStore();

  const monday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const weekStart = format(monday, 'yyyy-MM-dd');

  useEffect(() => { fetchWeek(weekStart); }, [weekOffset]);

  const getDaySlots = (date: Date): MealSlot[] => {
    const d = format(date, 'yyyy-MM-dd');
    return currentWeek?.slots.filter((s) => s.slotDate === d) ?? [];
  };

  const getDayColor = (date: Date) => {
    const slots = getDaySlots(date);
    if (slots.length === 0) return '#F3F4F6';
    const consumed = slots.filter((s) => s.isConsumed).length;
    if (consumed === slots.length) return '#DCFCE7';
    if (consumed > 0) return '#FEF9C3';
    return '#E0F2FE';
  };

  return (
    <View style={styles.container}>
      {/* Navigation semaine */}
      <View style={styles.weekNav}>
        <IconButton icon="chevron-left" onPress={() => setWeekOffset((w) => w - 1)} />
        <Text variant="titleSmall" style={styles.weekLabel}>
          Semaine du {format(monday, 'd MMM', { locale: fr })} au {format(addDays(monday, 6), 'd MMM yyyy', { locale: fr })}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setWeekOffset((w) => w + 1)} />
      </View>

      {/* Sélecteur de jours */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
        {DAYS.map((day, i) => {
          const date = addDays(monday, i);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          const slots = getDaySlots(date);
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(date)}
              style={[styles.dayBtn, { backgroundColor: getDayColor(date) }, isSelected && styles.daySelected]}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayToday]}>{day}</Text>
              <Text style={[styles.dayNum, isToday && styles.dayToday]}>{format(date, 'd')}</Text>
              <Text style={styles.daySlots}>{slots.length > 0 ? `${slots.length} plat${slots.length > 1 ? 's' : ''}` : '—'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Détail du jour */}
      <ScrollView style={styles.dayDetail} contentContainerStyle={{ paddingBottom: 40 }}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2ECC71" />
        ) : (
          <DayDetail
            date={selectedDay}
            slots={getDaySlots(selectedDay)}
            weekPlanId={currentWeek?.id}
            weekStart={weekStart}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------

function DayDetail({ date, slots, weekPlanId, weekStart }: {
  date: Date;
  slots: MealSlot[];
  weekPlanId?: string;
  weekStart: string;
}) {
  const router = useRouter();
  const { markConsumed, deleteSlot, addSlot, fetchWeek } = usePlanStore();
  const [addingFor, setAddingFor] = useState<MealType | null>(null);

  const handleAdd = async (payload: AddSlotPayload) => {
    if (!weekPlanId) return;
    await addSlot(weekPlanId, {
      slotDate: format(date, 'yyyy-MM-dd'),
      mealType: addingFor!,
      recipeId: payload.recipeId,
      preparedMealId: payload.preparedMealId,
      freeLabel: payload.freeLabel,
      caloriesOverride: payload.caloriesOverride,
      portions: payload.portions ?? 1,
    });
    await fetchWeek(weekStart);
    setAddingFor(null);
  };

  const openSlotDetail = (slot: MealSlot) => {
    const slotInfo = encodeURIComponent(JSON.stringify({
      name: slot.recipe?.name ?? slot.freeLabel ?? 'Repas libre',
      mealType: slot.mealType,
      calories: slot.caloriesOverride,
    }));
    router.push(`/meal-slots/${slot.id}?slotInfo=${slotInfo}` as any);
  };

  return (
    <View style={styles.dayDetailContent}>
      <Text variant="titleMedium" style={styles.dayDetailTitle}>
        {format(date, 'EEEE d MMMM', { locale: fr })}
      </Text>

      {MEAL_TYPES.map(({ type, label, emoji, color }) => {
        const typeSlots = slots.filter((s) => s.mealType === type);
        return (
          <Card key={type} style={[styles.mealCard, { backgroundColor: color }]}>
            <Card.Content>
              {/* Header */}
              <View style={styles.mealHeader}>
                <Text style={styles.mealTypeLabel}>{emoji} {label}</Text>
                <Button
                  mode="text"
                  icon="plus"
                  compact
                  textColor="#2ECC71"
                  onPress={() => setAddingFor(type)}
                >
                  Ajouter
                </Button>
              </View>

              {typeSlots.length === 0 ? (
                <TouchableOpacity onPress={() => setAddingFor(type)} style={styles.emptyMealTap}>
                  <Text style={styles.emptyMeal}>Appuyer pour ajouter un repas</Text>
                </TouchableOpacity>
              ) : (
                typeSlots.map((slot) => (
                  <TouchableOpacity key={slot.id} onPress={() => openSlotDetail(slot)} activeOpacity={0.7}>
                    <View style={styles.slotRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.slotName}>
                          {slot.recipe?.name ?? slot.freeLabel ?? 'Repas libre'}
                          {slot.portions !== 1 && <Text style={styles.slotPortions}> × {slot.portions}</Text>}
                        </Text>
                        <View style={styles.slotMeta}>
                          {slot.caloriesOverride ? (
                            <Text style={styles.slotKcal}>{slot.caloriesOverride} kcal</Text>
                          ) : slot.recipe ? (
                            <Text style={styles.slotHint}>recette · voir détail</Text>
                          ) : null}
                          <Text style={styles.slotExtrasHint}> · appuyer pour extras</Text>
                        </View>
                      </View>
                      <View style={styles.slotActions}>
                        {slot.isConsumed ? (
                          <Chip compact style={styles.consumedChip} textStyle={{ fontSize: 10 }}>✓</Chip>
                        ) : (
                          <IconButton size={18} icon="check-circle-outline" iconColor="#2ECC71" onPress={() => markConsumed(slot.id)} />
                        )}
                        <IconButton size={18} icon="delete-outline" iconColor="#E74C3C" onPress={() => deleteSlot(slot.id)} />
                      </View>
                    </View>
                    <Divider style={{ marginVertical: 2 }} />
                  </TouchableOpacity>
                ))
              )}
            </Card.Content>
          </Card>
        );
      })}

      <Portal>
        {addingFor && (
          <AddSlotModal
            mealType={addingFor}
            onClose={() => setAddingFor(null)}
            onAdd={handleAdd}
          />
        )}
      </Portal>
    </View>
  );
}

// ---------------------------------------------------------------------------

type SourceType = 'recipe' | 'prepared' | 'free';

interface AddSlotPayload {
  recipeId?: string;
  preparedMealId?: string;
  freeLabel?: string;
  caloriesOverride?: number;
  portions?: number;
}

function AddSlotModal({ mealType, onClose, onAdd }: {
  mealType: MealType;
  onClose: () => void;
  onAdd: (p: AddSlotPayload) => Promise<void>;
}) {
  const [source, setSource] = useState<SourceType>('recipe');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [preparedMeals, setPreparedMeals] = useState<PreparedMeal[]>([]);
  const [query, setQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedPrepared, setSelectedPrepared] = useState<PreparedMeal | null>(null);
  const [freeLabel, setFreeLabel] = useState('');
  const [freeCalories, setFreeCalories] = useState('');
  const [portions, setPortions] = useState('1');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    recipesApi.getAll().then((r) => setRecipes(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    preparedMealsApi.getAll().then((r) => setPreparedMeals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const MEAL_LABEL: Record<MealType, string> = {
    BREAKFAST: 'Petit-déjeuner', LUNCH: 'Déjeuner', DINNER: 'Dîner', SNACK: 'Collation'
  };

  const filteredRecipes = recipes.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));
  const filteredPrepared = preparedMeals.filter((m) =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    (m.brand ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const canSave = source === 'recipe' ? !!selectedRecipe
    : source === 'prepared' ? !!selectedPrepared
    : !!freeCalories || !!freeLabel;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onAdd({
        recipeId: source === 'recipe' ? selectedRecipe?.id : undefined,
        preparedMealId: source === 'prepared' ? selectedPrepared?.id : undefined,
        freeLabel: source === 'free' ? (freeLabel || 'Repas libre') : undefined,
        caloriesOverride: source === 'free' ? (parseInt(freeCalories) || undefined) : undefined,
        portions: parseFloat(portions) || 1,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible onDismiss={onClose} contentContainerStyle={styles.modal}>
      <View style={styles.modalHeader}>
        <Text variant="titleMedium" style={styles.modalTitle}>
          Ajouter — {MEAL_LABEL[mealType]}
        </Text>
        <IconButton icon="close" size={20} onPress={onClose} />
      </View>

      {/* Type de source */}
      <SegmentedButtons
        value={source}
        onValueChange={(v) => { setSource(v as SourceType); setQuery(''); setSelectedRecipe(null); setSelectedPrepared(null); }}
        buttons={[
          { value: 'recipe', label: 'Recette', icon: 'book-open-variant' },
          { value: 'prepared', label: 'Plat préparé', icon: 'package-variant' },
          { value: 'free', label: 'Libre', icon: 'pencil' },
        ]}
        style={styles.sourceToggle}
      />

      {/* Recette */}
      {source === 'recipe' && (
        <>
          <Searchbar placeholder="Rechercher une recette..." value={query} onChangeText={setQuery} style={styles.search} />
          <FlatList
            data={filteredRecipes}
            keyExtractor={(r) => r.id}
            style={styles.pickerList}
            ListEmptyComponent={<Text style={styles.emptyPicker}>Aucune recette — créez-en une d'abord</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedRecipe(item)}
                style={[styles.pickerItem, selectedRecipe?.id === item.id && styles.pickerItemSelected]}
              >
                <Text style={styles.pickerItemName}>{item.name}</Text>
                <Text style={styles.pickerItemSub}>{item.servings} portion{item.servings > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Plat préparé */}
      {source === 'prepared' && (
        <>
          <Searchbar placeholder="Rechercher un plat préparé..." value={query} onChangeText={setQuery} style={styles.search} />
          <FlatList
            data={filteredPrepared}
            keyExtractor={(m) => m.id}
            style={styles.pickerList}
            ListEmptyComponent={<Text style={styles.emptyPicker}>Aucun plat préparé — ajoutez-en depuis l'onglet Plats</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedPrepared(item)}
                style={[styles.pickerItem, selectedPrepared?.id === item.id && styles.pickerItemSelected]}
              >
                <Text style={styles.pickerItemName}>{item.name}</Text>
                <Text style={styles.pickerItemSub}>
                  {item.brand ? `${item.brand} · ` : ''}{item.caloriesPortion} kcal/portion
                </Text>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Saisie libre */}
      {source === 'free' && (
        <View style={styles.freeForm}>
          <TextInput
            label="Description (ex: Pizza jambon)"
            value={freeLabel}
            onChangeText={setFreeLabel}
            mode="outlined"
            style={styles.freeInput}
          />
          <TextInput
            label="Calories estimées (kcal)"
            value={freeCalories}
            onChangeText={setFreeCalories}
            keyboardType="numeric"
            mode="outlined"
            style={styles.freeInput}
          />
          <Text style={styles.freeHint}>
            💡 Pas sûr des calories ? Saisissez quand même un label et ajustez plus tard via les extras.
          </Text>
        </View>
      )}

      {/* Portions */}
      <View style={styles.portionsRow}>
        <Text style={styles.portionsLabel}>Portions :</Text>
        {['0.5', '1', '1.5', '2', '3'].map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPortions(p)}
            style={[styles.portionBtn, portions === p && styles.portionBtnSelected]}
          >
            <Text style={[styles.portionBtnLabel, portions === p && { color: 'white' }]}>{p}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          value={portions}
          onChangeText={setPortions}
          keyboardType="numeric"
          mode="outlined"
          style={styles.portionsInput}
          dense
        />
      </View>

      <Button
        mode="contained"
        onPress={handleSave}
        disabled={!canSave || isSaving}
        loading={isSaving}
        buttonColor="#2ECC71"
        style={styles.saveBtn}
      >
        Ajouter au planning
      </Button>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, backgroundColor: 'white', elevation: 2 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12 },
  daysRow: { maxHeight: 90, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 8 },
  dayBtn: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, borderRadius: 12, minWidth: 60 },
  daySelected: { borderWidth: 2, borderColor: '#2ECC71' },
  dayLabel: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  dayNum: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  dayToday: { color: '#2ECC71' },
  daySlots: { fontSize: 9, color: '#888' },
  dayDetail: { flex: 1 },
  dayDetailContent: { padding: 12 },
  dayDetailTitle: { fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' },

  mealCard: { marginBottom: 12, borderRadius: 12 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  mealTypeLabel: { fontWeight: 'bold', color: '#2C3E50', fontSize: 14 },

  emptyMealTap: { paddingVertical: 12, alignItems: 'center' },
  emptyMeal: { color: '#bbb', fontSize: 13, fontStyle: 'italic' },

  slotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  slotName: { fontWeight: '500', fontSize: 14 },
  slotPortions: { color: '#888', fontWeight: 'normal' },
  slotMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  slotKcal: { color: '#F39C12', fontSize: 12, fontWeight: 'bold' },
  slotHint: { color: '#888', fontSize: 11 },
  slotExtrasHint: { color: '#aaa', fontSize: 11 },
  slotActions: { flexDirection: 'row', alignItems: 'center' },
  consumedChip: { backgroundColor: '#DCFCE7' },

  // Modal
  modal: { backgroundColor: 'white', margin: 16, borderRadius: 16, maxHeight: '85%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8 },
  modalTitle: { fontWeight: 'bold', color: '#2C3E50' },
  sourceToggle: { marginHorizontal: 16, marginBottom: 8 },
  search: { margin: 12, marginTop: 4, borderRadius: 10 },
  pickerList: { maxHeight: 220, marginHorizontal: 12 },
  pickerItem: { padding: 12, borderRadius: 8, marginBottom: 4, backgroundColor: '#F8F9FA' },
  pickerItemSelected: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#2ECC71' },
  pickerItemName: { fontWeight: '600', fontSize: 14 },
  pickerItemSub: { color: '#888', fontSize: 12, marginTop: 2 },
  emptyPicker: { color: '#999', textAlign: 'center', padding: 20, fontStyle: 'italic' },

  freeForm: { marginHorizontal: 16, marginBottom: 8 },
  freeInput: { marginBottom: 10 },
  freeHint: { color: '#888', fontSize: 12, lineHeight: 17, marginTop: 4 },

  portionsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 8, gap: 6 },
  portionsLabel: { color: '#666', fontSize: 13, marginRight: 4 },
  portionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  portionBtnSelected: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
  portionBtnLabel: { fontWeight: '600', color: '#444', fontSize: 13 },
  portionsInput: { width: 56, height: 36 },

  saveBtn: { margin: 16, marginTop: 8, borderRadius: 8 },
});
