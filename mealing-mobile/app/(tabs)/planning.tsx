import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, FAB, IconButton, ActivityIndicator, Button, Dialog, Portal } from 'react-native-paper';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePlanStore } from '../../src/store/usePlanStore';
import { MealSlot, MealType } from '../../src/api/mealplan';

const MEAL_TYPES: { type: MealType; label: string; color: string }[] = [
  { type: 'BREAKFAST', label: 'Petit-déj.', color: '#FEF9C3' },
  { type: 'LUNCH', label: 'Déjeuner', color: '#DCFCE7' },
  { type: 'DINNER', label: 'Dîner', color: '#E0F2FE' },
  { type: 'SNACK', label: 'Collation', color: '#FEE2E2' },
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PlanningScreen() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { currentWeek, isLoading, fetchWeek } = usePlanStore();

  const monday = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const weekStart = format(monday, 'yyyy-MM-dd');

  useEffect(() => {
    fetchWeek(weekStart);
  }, [weekOffset]);

  const getDaySlots = (date: Date): MealSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return currentWeek?.slots.filter((s) => s.slotDate === dateStr) ?? [];
  };

  const getDayCalories = (date: Date): number => {
    return getDaySlots(date).reduce((sum, slot) => {
      if (slot.caloriesOverride) return sum + slot.caloriesOverride;
      // Estimation simple si pas de calcul backend disponible
      return sum;
    }, 0);
  };

  const getDayColor = (date: Date) => {
    const slots = getDaySlots(date);
    if (slots.length === 0) return '#E5E7EB';
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
        <Text variant="titleMedium" style={styles.weekLabel}>
          Semaine du {format(monday, 'd MMM', { locale: fr })} au {format(addDays(monday, 6), 'd MMM yyyy', { locale: fr })}
        </Text>
        <IconButton icon="chevron-right" onPress={() => setWeekOffset((w) => w + 1)} />
      </View>

      {/* Sélecteur de jours */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
        {DAYS.map((day, i) => {
          const date = addDays(monday, i);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isSelected = selectedDay && format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(date)}
              style={[styles.dayBtn, { backgroundColor: getDayColor(date) }, isSelected && styles.daySelected]}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayToday]}>{day}</Text>
              <Text style={[styles.dayNum, isToday && styles.dayToday]}>{format(date, 'd')}</Text>
              <Text style={styles.daySlots}>{getDaySlots(date).length} repas</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Détail du jour sélectionné */}
      <ScrollView style={styles.dayDetail}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : selectedDay ? (
          <DayDetail date={selectedDay} slots={getDaySlots(selectedDay)} weekPlanId={currentWeek?.id} />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Sélectionnez un jour pour voir les repas</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DayDetail({ date, slots, weekPlanId }: { date: Date; slots: MealSlot[]; weekPlanId?: string }) {
  const { markConsumed, deleteSlot } = usePlanStore();

  return (
    <View style={styles.dayDetailContent}>
      <Text variant="titleMedium" style={styles.dayDetailTitle}>
        {format(date, 'EEEE d MMMM', { locale: fr })}
      </Text>

      {MEAL_TYPES.map(({ type, label, color }) => {
        const typeSlots = slots.filter((s) => s.mealType === type);
        return (
          <Card key={type} style={[styles.mealCard, { backgroundColor: color }]}>
            <Card.Content>
              <View style={styles.mealHeader}>
                <Text variant="titleSmall" style={styles.mealTypeLabel}>{label}</Text>
              </View>
              {typeSlots.length === 0 ? (
                <Text style={styles.emptyMeal}>Aucun repas</Text>
              ) : (
                typeSlots.map((slot) => (
                  <View key={slot.id} style={styles.slotRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.slotName}>
                        {slot.recipe?.name ?? slot.freeLabel ?? 'Repas libre'}
                        {slot.portions !== 1 && ` × ${slot.portions}`}
                      </Text>
                      {slot.recipe && (
                        <Text style={styles.slotSub}>
                          {slot.recipe.ingredients?.length ?? 0} ingrédients
                        </Text>
                      )}
                    </View>
                    <View style={styles.slotActions}>
                      {!slot.isConsumed && (
                        <IconButton size={16} icon="check-circle-outline" onPress={() => markConsumed(slot.id)} />
                      )}
                      {slot.isConsumed && <Text style={styles.consumed}>✓ Consommé</Text>}
                      <IconButton size={16} icon="delete-outline" onPress={() => deleteSlot(slot.id)} />
                    </View>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, backgroundColor: 'white', elevation: 2 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 13 },
  daysRow: { maxHeight: 90, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 8 },
  dayBtn: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, borderRadius: 12, minWidth: 64 },
  daySelected: { borderWidth: 2, borderColor: '#2ECC71' },
  dayLabel: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  dayNum: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  dayToday: { color: '#2ECC71' },
  daySlots: { fontSize: 10, color: '#888' },
  dayDetail: { flex: 1 },
  dayDetailContent: { padding: 16 },
  dayDetailTitle: { fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' },
  mealCard: { marginBottom: 12, borderRadius: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  mealTypeLabel: { fontWeight: 'bold', color: '#2C3E50' },
  emptyMeal: { color: '#999', fontSize: 13, fontStyle: 'italic' },
  slotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  slotName: { fontWeight: '500' },
  slotSub: { color: '#666', fontSize: 12 },
  slotActions: { flexDirection: 'row', alignItems: 'center' },
  consumed: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: '#999', textAlign: 'center' },
});
