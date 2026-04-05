import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, SectionList } from 'react-native';
import { Text, Checkbox, FAB, ActivityIndicator, Searchbar, Chip, Divider, Button } from 'react-native-paper';
import { shoppingApi, ShoppingList, ShoppingItem } from '../../src/api/shopping';
import { usePlanStore } from '../../src/store/usePlanStore';

export default function ShoppingScreen() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { currentWeek, fetchCurrentWeek } = usePlanStore();

  useEffect(() => {
    if (!currentWeek) {
      fetchCurrentWeek();
    }
  }, []);

  useEffect(() => {
    if (currentWeek?.id) {
      loadList(currentWeek.id);
    }
  }, [currentWeek?.id]);

  const loadList = async (weekPlanId: string) => {
    setIsLoading(true);
    try {
      const { data } = await shoppingApi.generateForWeek(weekPlanId);
      setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    if (!list) return;
    try {
      const { data } = await shoppingApi.toggleCheck(item.id);
      setList({
        ...list,
        items: list.items.map((i) => (i.id === item.id ? data : i)),
      });
    } catch {}
  };

  const sections = groupByCategory(list?.items ?? []);
  const checkedCount = list?.items.filter((i) => i.isChecked).length ?? 0;
  const totalCount = list?.items.length ?? 0;

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>{list?.name ?? 'Liste de courses'}</Text>
        <Text variant="bodyMedium" style={styles.progress}>
          {checkedCount}/{totalCount} articles cochés
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} />
      ) : !list ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Créez un planning pour générer votre liste de courses
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleToggle(item)} style={styles.itemRow}>
              <Checkbox status={item.isChecked ? 'checked' : 'unchecked'} color="#2ECC71" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemLabel, item.isChecked && styles.itemChecked]}>
                  {item.label}
                </Text>
                {item.quantityG != null && (
                  <Text style={styles.itemQty}>{Math.round(item.quantityG)} g</Text>
                )}
              </View>
              {item.isManual && <Chip compact style={styles.manualChip}>Manuel</Chip>}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

function groupByCategory(items: ShoppingItem[]) {
  const map: Record<string, ShoppingItem[]> = {};
  for (const item of items) {
    const cat = item.category ?? 'Autres';
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, data]) => ({ title, data }));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: 'white', padding: 16, elevation: 2 },
  title: { fontWeight: 'bold', color: '#2C3E50' },
  progress: { color: '#666', marginTop: 4 },
  sectionHeader: { backgroundColor: '#ECF0F1', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontWeight: 'bold', color: '#2C3E50', textTransform: 'uppercase', fontSize: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'white' },
  itemLabel: { fontSize: 15 },
  itemChecked: { textDecorationLine: 'line-through', color: '#999' },
  itemQty: { color: '#666', fontSize: 12 },
  manualChip: { backgroundColor: '#E0F2FE' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', color: '#666' },
});
