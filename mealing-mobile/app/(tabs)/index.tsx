import { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar, Chip, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNutritionStore } from '../../src/store/useNutritionStore';
import { usePlanStore } from '../../src/store/usePlanStore';
export default function HomeScreen() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { dailyLogs, objectives, fetchDailyLog, fetchObjectives } = useNutritionStore();
  const { currentWeek, fetchCurrentWeek } = usePlanStore();

  const log = dailyLogs[today];

  useEffect(() => {
    fetchDailyLog(today);
    fetchObjectives();
    fetchCurrentWeek();
  }, []);

  const targetCalories = objectives?.targetCalories ?? 2000;
  const consumed = log?.totalCalories ?? 0;
  const progress = Math.min(consumed / targetCalories, 1);

  const getProgressColor = () => {
    if (progress < 0.9) return '#2ECC71';
    if (progress < 1.1) return '#F39C12';
    return '#E74C3C';
  };

  const todaySlots = currentWeek?.slots.filter(
    (s) => s.slotDate === today
  ) ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.greeting}>
        Bonjour !
      </Text>
      <Text variant="bodyMedium" style={styles.date}>
        {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
      </Text>

      {/* Résumé calorique */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Calories aujourd'hui</Text>
          <View style={styles.caloriesRow}>
            <Text variant="displaySmall" style={{ color: getProgressColor(), fontWeight: 'bold' }}>
              {Math.round(consumed)}
            </Text>
            <Text variant="titleLarge" style={styles.target}> / {targetCalories} kcal</Text>
          </View>
          <ProgressBar
            progress={progress}
            color={getProgressColor()}
            style={styles.progress}
          />
          <Text variant="bodySmall" style={styles.remaining}>
            Restant : {Math.max(0, targetCalories - Math.round(consumed))} kcal
          </Text>

          {objectives && (
            <View style={styles.macros}>
              <MacroChip label="Prot." value={log?.totalProteins ?? 0} target={objectives.targetProteinG} unit="g" color="#3498DB" />
              <MacroChip label="Glucides" value={log?.totalCarbs ?? 0} target={objectives.targetCarbsG} unit="g" color="#F39C12" />
              <MacroChip label="Lipides" value={log?.totalFat ?? 0} target={objectives.targetFatG} unit="g" color="#9B59B6" />
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Repas du jour */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Repas d'aujourd'hui</Text>
          {todaySlots.length === 0 ? (
            <Text style={styles.empty}>Aucun repas planifié</Text>
          ) : (
            todaySlots.map((slot) => (
              <View key={slot.id} style={styles.mealRow}>
                <Chip compact style={{ marginRight: 8, backgroundColor: getMealColor(slot.mealType) }}>
                  {getMealLabel(slot.mealType)}
                </Chip>
                <Text style={{ flex: 1 }} numberOfLines={1}>
                  {slot.recipe?.name ?? slot.freeLabel ?? 'Repas libre'}
                </Text>
                {slot.isConsumed && <Text style={styles.consumed}>✓</Text>}
              </View>
            ))
          )}
          <Button mode="text" onPress={() => router.push('/(tabs)/planning')} style={{ marginTop: 8 }}>
            Voir le planning
          </Button>
        </Card.Content>
      </Card>

      {/* Accès rapides */}
      <View style={styles.quickAccess}>
        <Button mode="outlined" icon="plus" onPress={() => router.push('/recipes/new')} style={styles.quickBtn}>
          Nouvelle recette
        </Button>
        <Button mode="outlined" icon="alert" onPress={() => router.push('/deviation')} style={styles.quickBtn}>
          Déclarer un écart
        </Button>
      </View>
    </ScrollView>
  );
}

function MacroChip({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  return (
    <View style={macroStyles.chip}>
      <Text style={[macroStyles.label, { color }]}>{label}</Text>
      <Text style={macroStyles.value}>{Math.round(value)}<Text style={macroStyles.unit}>/{target}{unit}</Text></Text>
    </View>
  );
}

const macroStyles = StyleSheet.create({
  chip: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 11, fontWeight: 'bold' },
  value: { fontSize: 14, fontWeight: 'bold' },
  unit: { fontSize: 10, color: '#999', fontWeight: 'normal' },
});

function getMealLabel(type: string) {
  const labels: Record<string, string> = { BREAKFAST: 'Matin', LUNCH: 'Midi', DINNER: 'Soir', SNACK: 'Collation' };
  return labels[type] ?? type;
}

function getMealColor(type: string) {
  const colors: Record<string, string> = { BREAKFAST: '#FEF9C3', LUNCH: '#DCFCE7', DINNER: '#E0F2FE', SNACK: '#FEE2E2' };
  return colors[type] ?? '#F5F5F5';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16 },
  greeting: { fontWeight: 'bold', marginBottom: 4 },
  date: { color: '#666', marginBottom: 16, textTransform: 'capitalize' },
  card: { marginBottom: 16, borderRadius: 12 },
  cardTitle: { fontWeight: 'bold', marginBottom: 12, color: '#2C3E50' },
  caloriesRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  target: { color: '#666' },
  progress: { height: 8, borderRadius: 4, marginBottom: 8 },
  remaining: { color: '#666', textAlign: 'right' },
  macros: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  consumed: { color: '#2ECC71', fontWeight: 'bold' },
  empty: { color: '#999', fontStyle: 'italic' },
  quickAccess: { flexDirection: 'row', gap: 8 },
  quickBtn: { flex: 1 },
});
