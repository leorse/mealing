import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, SegmentedButtons, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { format, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNutritionStore } from '../../src/store/useNutritionStore';

const { width } = Dimensions.get('window');

type Period = 'day' | 'week' | 'month';

export default function NutritionScreen() {
  const [period, setPeriod] = useState<Period>('day');
  const { dailyLogs, objectives, weeklyData, fetchDailyLog, fetchObjectives, fetchWeeklyData } = useNutritionStore();

  const today = format(new Date(), 'yyyy-MM-dd');
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = format(monday, 'yyyy-MM-dd');

  useEffect(() => {
    fetchObjectives();
    fetchDailyLog(today);
    fetchWeeklyData(weekStart);
  }, []);

  const todayLog = dailyLogs[today];
  const targetCalories = objectives?.targetCalories ?? 2000;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SegmentedButtons
        value={period}
        onValueChange={(v) => setPeriod(v as Period)}
        buttons={[
          { value: 'day', label: 'Jour' },
          { value: 'week', label: 'Semaine' },
          { value: 'month', label: 'Mois' },
        ]}
        style={styles.segments}
      />

      {period === 'day' && <DayView log={todayLog} objectives={objectives} />}
      {period === 'week' && <WeekView data={weeklyData} monday={monday} target={targetCalories} />}
      {period === 'month' && <MonthView target={targetCalories} />}
    </ScrollView>
  );
}

function DayView({ log, objectives }: { log: any; objectives: any }) {
  const target = objectives?.targetCalories ?? 2000;
  const calories = log?.totalCalories ?? 0;
  const progress = Math.min(calories / target, 1);

  const macros = [
    { label: 'Protéines', value: log?.totalProteins ?? 0, target: objectives?.targetProteinG ?? 0, color: '#3498DB', unit: 'g' },
    { label: 'Glucides', value: log?.totalCarbs ?? 0, target: objectives?.targetCarbsG ?? 0, color: '#F39C12', unit: 'g' },
    { label: 'Lipides', value: log?.totalFat ?? 0, target: objectives?.targetFatG ?? 0, color: '#9B59B6', unit: 'g' },
    { label: 'Fibres', value: log?.totalFiber ?? 0, target: 25, color: '#2ECC71', unit: 'g' },
  ];

  return (
    <>
      {/* Anneau de calories (simplifié) */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Calories — Aujourd'hui</Text>
          <View style={styles.circleWrapper}>
            <Text variant="displayMedium" style={styles.caloriesBig}>{Math.round(calories)}</Text>
            <Text style={styles.caloriesUnit}>kcal</Text>
            <Text style={styles.caloriesTarget}>/ {target}</Text>
          </View>
          <ProgressBar progress={progress} color={progress > 1 ? '#E74C3C' : '#2ECC71'} style={styles.bar} />
          <Text style={styles.barLabel}>
            {progress < 1 ? `Encore ${Math.round(target - calories)} kcal` : `Dépassement de ${Math.round(calories - target)} kcal`}
          </Text>
        </Card.Content>
      </Card>

      {/* Macros */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Macros</Text>
          {macros.map((m) => (
            <View key={m.label} style={styles.macroRow}>
              <Text style={styles.macroLabel}>{m.label}</Text>
              <Text style={[styles.macroValue, { color: m.color }]}>
                {Math.round(m.value)} / {m.target} {m.unit}
              </Text>
              <View style={styles.macroBarWrapper}>
                <ProgressBar
                  progress={m.target > 0 ? Math.min(m.value / m.target, 1) : 0}
                  color={m.color}
                  style={styles.macroBar}
                />
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    </>
  );
}

function WeekView({ data, monday, target }: { data: any[]; monday: Date; target: number }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const log = data.find((d) => d.logDate === dateStr);
    return { date, dateStr, calories: log?.totalCalories ?? 0 };
  });

  const maxCalories = Math.max(...days.map((d) => d.calories), target);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>Calories par jour</Text>
        {days.map(({ date, calories }) => {
          const progress = maxCalories > 0 ? calories / maxCalories : 0;
          const atTarget = calories >= target * 0.9 && calories <= target * 1.1;
          const over = calories > target * 1.1;
          const barColor = over ? '#E74C3C' : atTarget ? '#2ECC71' : '#F39C12';

          return (
            <View key={date.toISOString()} style={styles.weekDayRow}>
              <Text style={styles.weekDayLabel}>{format(date, 'EEE', { locale: fr })}</Text>
              <View style={styles.weekBarWrapper}>
                <ProgressBar progress={progress} color={barColor} style={styles.weekBar} />
              </View>
              <Text style={styles.weekDayValue}>{calories > 0 ? Math.round(calories) : '-'}</Text>
            </View>
          );
        })}

        <View style={styles.targetLine}>
          <Text style={styles.targetLabel}>Objectif : {target} kcal/jour</Text>
        </View>
      </Card.Content>
    </Card>
  );
}

function MonthView({ target }: { target: number }) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>Vue mensuelle</Text>
        <Text style={styles.comingSoon}>Données mensuelles disponibles après 30 jours de suivi</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: 16, paddingBottom: 40 },
  segments: { marginBottom: 16 },
  card: { marginBottom: 16, borderRadius: 12 },
  cardTitle: { fontWeight: 'bold', marginBottom: 12, color: '#2C3E50' },
  circleWrapper: { alignItems: 'center', paddingVertical: 16 },
  caloriesBig: { fontWeight: 'bold', color: '#2C3E50' },
  caloriesUnit: { color: '#666' },
  caloriesTarget: { color: '#999' },
  bar: { height: 10, borderRadius: 5, marginVertical: 8 },
  barLabel: { textAlign: 'center', color: '#666' },
  macroRow: { marginBottom: 12 },
  macroLabel: { fontWeight: '500', marginBottom: 4 },
  macroValue: { fontSize: 12, marginBottom: 4 },
  macroBarWrapper: {},
  macroBar: { height: 6, borderRadius: 3 },
  weekDayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  weekDayLabel: { width: 36, fontWeight: '500', color: '#666' },
  weekBarWrapper: { flex: 1, marginHorizontal: 8 },
  weekBar: { height: 16, borderRadius: 4 },
  weekDayValue: { width: 44, textAlign: 'right', fontSize: 12, color: '#555' },
  targetLine: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  targetLabel: { color: '#3498DB', textAlign: 'center', fontSize: 13 },
  comingSoon: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
