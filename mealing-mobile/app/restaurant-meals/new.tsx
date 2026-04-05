import { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, IconButton, SegmentedButtons, Card, Chip, Searchbar, RadioButton, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { restaurantMealsApi, DishTemplate, RestaurantMeal } from '../../src/api/restaurantMeals';

type Step = 'info' | 'method' | 'details' | 'summary';
type Method = 'FREE' | 'GUIDED' | 'RECONSTRUCTED';

const RESTAURANT_TYPES = ['FRENCH', 'ITALIAN', 'JAPANESE', 'CHINESE', 'THAI', 'INDIAN', 'MOROCCAN', 'AMERICAN', 'OTHER'];
const RESTAURANT_LABELS: Record<string, string> = {
  FRENCH: '🇫🇷 Français', ITALIAN: '🇮🇹 Italien', JAPANESE: '🇯🇵 Japonais',
  CHINESE: '🇨🇳 Chinois', THAI: '🇹🇭 Thaï', INDIAN: '🇮🇳 Indien',
  MOROCCAN: '🇲🇦 Marocain', AMERICAN: '🇺🇸 Américain', OTHER: '🌍 Autre',
};

export default function NewRestaurantMealScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [method, setMethod] = useState<Method>('FREE');

  // Infos restaurant
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantType, setRestaurantType] = useState('');
  const [dishName, setDishName] = useState('');
  const [dishNotes, setDishNotes] = useState('');

  // Méthode FREE
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Méthode GUIDED
  const [templateQuery, setTemplateQuery] = useState('');
  const [templates, setTemplates] = useState<DishTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DishTemplate | null>(null);
  const [portionSize, setPortionSize] = useState<'SMALL' | 'NORMAL' | 'LARGE'>('NORMAL');

  const [isSaving, setIsSaving] = useState(false);

  const searchTemplates = async (q: string) => {
    setTemplateQuery(q);
    try {
      const { data } = await restaurantMealsApi.searchTemplates(q);
      setTemplates(data);
    } catch {}
  };

  useEffect(() => {
    restaurantMealsApi.searchTemplates('').then(r => setTemplates(r.data)).catch(() => {});
  }, []);

  const computeCalories = (): number => {
    if (method === 'FREE') return parseFloat(calories) || 0;
    if (method === 'GUIDED' && selectedTemplate) {
      return portionSize === 'SMALL' ? (selectedTemplate.caloriesSmall ?? selectedTemplate.caloriesNormal)
        : portionSize === 'LARGE' ? (selectedTemplate.caloriesLarge ?? selectedTemplate.caloriesNormal)
        : selectedTemplate.caloriesNormal;
    }
    return 0;
  };

  const save = async () => {
    if (!dishName.trim()) return;
    setIsSaving(true);
    try {
      const meal: Partial<RestaurantMeal> = {
        restaurantName: restaurantName.trim() || undefined,
        restaurantType: restaurantType || undefined,
        dishName: dishName.trim(),
        dishNotes: dishNotes.trim() || undefined,
        estimationMethod: method,
        portionSize: method === 'GUIDED' ? portionSize : undefined,
        dishTemplate: method === 'GUIDED' && selectedTemplate ? selectedTemplate : undefined,
        caloriesFree: method === 'FREE' ? (parseFloat(calories) || undefined) : undefined,
        proteinsFree: method === 'FREE' ? (parseFloat(proteins) || undefined) : undefined,
        carbsFree: method === 'FREE' ? (parseFloat(carbs) || undefined) : undefined,
        fatFree: method === 'FREE' ? (parseFloat(fat) || undefined) : undefined,
      };
      await restaurantMealsApi.create(meal);
      router.back();
    } catch {}
    setIsSaving(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => step === 'info' ? router.back() : setStep(step === 'method' ? 'info' : step === 'details' ? 'method' : 'details')} />
        <Text variant="titleMedium" style={styles.title}>Repas restaurant</Text>
        <Text style={styles.stepIndicator}>Étape {['info','method','details','summary'].indexOf(step)+1}/4</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Étape 1 : Infos du restaurant */}
        {step === 'info' && (
          <>
            <Text style={styles.stepTitle}>1. Le restaurant</Text>
            <TextInput label="Nom du restaurant (optionnel)" value={restaurantName} onChangeText={setRestaurantName} mode="outlined" style={styles.input} />
            <TextInput label="Nom du plat *" value={dishName} onChangeText={setDishName} mode="outlined" style={styles.input} />
            <TextInput label="Notes (accompagnements, sauce...)" value={dishNotes} onChangeText={setDishNotes} mode="outlined" style={styles.input} />
            <Text style={styles.fieldLabel}>Type de cuisine</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {RESTAURANT_TYPES.map(t => (
                  <Chip key={t} selected={restaurantType === t} onPress={() => setRestaurantType(restaurantType === t ? '' : t)} compact>
                    {RESTAURANT_LABELS[t]}
                  </Chip>
                ))}
              </View>
            </ScrollView>
            <Button mode="contained" onPress={() => setStep('method')} disabled={!dishName.trim()} buttonColor="#2ECC71" style={styles.btn}>
              Suivant →
            </Button>
          </>
        )}

        {/* Étape 2 : Méthode */}
        {step === 'method' && (
          <>
            <Text style={styles.stepTitle}>2. Comment estimer ?</Text>
            {[
              { value: 'FREE', icon: '✏️', title: 'Saisie directe', desc: 'Je connais le nombre de calories approximatif' },
              { value: 'GUIDED', icon: '📋', title: 'Plat type', desc: 'Je choisis dans une bibliothèque de ~80 plats courants' },
              { value: 'RECONSTRUCTED', icon: '🔍', title: 'Reconstitution', desc: 'Je liste les ingrédients un par un (plus précis)' },
            ].map(opt => (
              <Card key={opt.value} style={[styles.methodCard, method === opt.value && styles.methodCardSelected]}
                onPress={() => setMethod(opt.value as Method)}>
                <Card.Content style={styles.methodContent}>
                  <Text style={styles.methodIcon}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodTitle}>{opt.title}</Text>
                    <Text style={styles.methodDesc}>{opt.desc}</Text>
                  </View>
                  <RadioButton value={opt.value} status={method === opt.value ? 'checked' : 'unchecked'} />
                </Card.Content>
              </Card>
            ))}
            {method === 'RECONSTRUCTED' && (
              <Text style={styles.hint}>La reconstitution par ingrédients sera disponible après création du repas.</Text>
            )}
            <Button mode="contained" onPress={() => setStep('details')} buttonColor="#2ECC71" style={styles.btn}>
              Suivant →
            </Button>
          </>
        )}

        {/* Étape 3 : Détails selon la méthode */}
        {step === 'details' && (
          <>
            <Text style={styles.stepTitle}>3. {method === 'FREE' ? 'Saisir les calories' : method === 'GUIDED' ? 'Choisir un plat type' : 'Confirmer'}</Text>

            {method === 'FREE' && (
              <>
                <TextInput label="Calories estimées (kcal) *" value={calories} onChangeText={setCalories} mode="outlined" keyboardType="numeric" style={styles.input} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput label="Prot. (g)" value={proteins} onChangeText={setProteins} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
                  <TextInput label="Glu. (g)" value={carbs} onChangeText={setCarbs} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
                  <TextInput label="Lip. (g)" value={fat} onChangeText={setFat} mode="outlined" keyboardType="numeric" dense style={{ flex: 1 }} />
                </View>
              </>
            )}

            {method === 'GUIDED' && (
              <>
                <Searchbar placeholder="Pizza, steak, ramen..." value={templateQuery} onChangeText={searchTemplates} style={{ marginBottom: 12 }} />
                {selectedTemplate ? (
                  <Card style={styles.selectedTemplateCard}>
                    <Card.Content>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.templateName}>{selectedTemplate.name}</Text>
                        <IconButton icon="close" size={16} onPress={() => setSelectedTemplate(null)} />
                      </View>
                      <Text style={styles.templateCal}>{computeCalories()} kcal</Text>
                      <SegmentedButtons
                        value={portionSize}
                        onValueChange={v => setPortionSize(v as any)}
                        buttons={[
                          { value: 'SMALL', label: `Petite${selectedTemplate.caloriesSmall ? ` (${selectedTemplate.caloriesSmall})` : ''}` },
                          { value: 'NORMAL', label: `Normale (${selectedTemplate.caloriesNormal})` },
                          { value: 'LARGE', label: `Grande${selectedTemplate.caloriesLarge ? ` (${selectedTemplate.caloriesLarge})` : ''}` },
                        ]}
                        style={{ marginTop: 8 }}
                      />
                    </Card.Content>
                  </Card>
                ) : (
                  templates.slice(0, 12).map(t => (
                    <Card key={t.id} style={styles.templateCard} onPress={() => setSelectedTemplate(t)}>
                      <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                          <Text style={styles.templateName}>{t.name}</Text>
                          {t.category && <Text style={styles.templateCat}>{t.category}</Text>}
                        </View>
                        <Text style={styles.templateCal}>{t.caloriesNormal} kcal</Text>
                      </Card.Content>
                    </Card>
                  ))
                )}
              </>
            )}

            {method === 'RECONSTRUCTED' && (
              <Text style={styles.hint}>Vous pourrez ajouter les ingrédients depuis la fiche du repas après création.</Text>
            )}

            <Button mode="contained" onPress={() => setStep('summary')} buttonColor="#2ECC71" style={styles.btn}
              disabled={method === 'FREE' && !calories}>
              Suivant →
            </Button>
          </>
        )}

        {/* Étape 4 : Résumé */}
        {step === 'summary' && (
          <>
            <Text style={styles.stepTitle}>4. Résumé</Text>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text style={styles.summaryDish}>🍽 {dishName}</Text>
                {restaurantName ? <Text style={styles.summaryRestaurant}>{restaurantName}{restaurantType ? ` · ${RESTAURANT_LABELS[restaurantType]}` : ''}</Text> : null}
                {dishNotes ? <Text style={styles.summaryNotes}>{dishNotes}</Text> : null}
                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.summaryCal}>{computeCalories()} kcal estimées</Text>
                <Text style={styles.summaryMethod}>Méthode : {
                  method === 'FREE' ? 'Saisie directe' : method === 'GUIDED' ? `Plat type (${selectedTemplate?.name ?? ''})` : 'Reconstitution'
                }</Text>
              </Card.Content>
            </Card>

            <Button mode="contained" onPress={save} loading={isSaving} buttonColor="#2ECC71" style={styles.btn}>
              Enregistrer le repas
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', elevation: 2, paddingRight: 12 },
  title: { fontWeight: 'bold', flex: 1 },
  stepIndicator: { color: '#888', fontSize: 12 },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  stepTitle: { fontWeight: '700', fontSize: 16, color: '#2C3E50', marginBottom: 12 },
  fieldLabel: { fontWeight: '600', color: '#555', marginBottom: 4 },
  input: { marginBottom: 8 },
  btn: { marginTop: 16, borderRadius: 8 },
  hint: { color: '#888', fontStyle: 'italic', fontSize: 13, marginBottom: 8 },
  methodCard: { borderRadius: 12, marginBottom: 8 },
  methodCardSelected: { borderColor: '#2ECC71', borderWidth: 2 },
  methodContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodIcon: { fontSize: 24 },
  methodTitle: { fontWeight: '600' },
  methodDesc: { color: '#888', fontSize: 12 },
  templateCard: { borderRadius: 10, marginBottom: 6 },
  selectedTemplateCard: { borderRadius: 12, backgroundColor: '#F0FFF4', marginBottom: 12 },
  templateName: { fontWeight: '600' },
  templateCat: { color: '#888', fontSize: 12 },
  templateCal: { color: '#F39C12', fontWeight: 'bold' },
  summaryCard: { borderRadius: 12, backgroundColor: '#F8F9FA' },
  summaryDish: { fontSize: 18, fontWeight: '700' },
  summaryRestaurant: { color: '#888', marginTop: 2 },
  summaryNotes: { color: '#555', fontStyle: 'italic', marginTop: 2 },
  summaryCal: { fontSize: 22, fontWeight: 'bold', color: '#F39C12', marginTop: 4 },
  summaryMethod: { color: '#888', fontSize: 12 },
});
