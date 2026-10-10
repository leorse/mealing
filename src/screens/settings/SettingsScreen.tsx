import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { clearAiApiKey, getAiSettings, saveAiSettings } from '../../db/repositories/settingsRepository';
import { AI_MODELS } from '../../services/aiReview';
import MaskIcon from '../../components/MaskIcon';

export default function SettingsScreen() {
  const settings = useLiveQuery(() => getAiSettings(), []);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (settings === undefined) return null;

  const hasKey = settings.apiKey !== undefined;
  const selectedModel = model ?? settings.model;
  // Un modèle enregistré qui ne figure plus dans la liste reste proposé tel quel.
  const models = AI_MODELS.some((m) => m.id === selectedModel)
    ? AI_MODELS
    : [...AI_MODELS, { id: selectedModel, label: selectedModel }];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await saveAiSettings({ apiKey: apiKey.trim() || undefined, model: selectedModel });
    setApiKey('');
    setIsSaved(true);
  }

  async function removeKey() {
    await clearAiApiKey();
    setIsSaved(false);
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h1>Réglages</h1>

      <fieldset className="ingredient-picker">
        <legend>Avis de l'IA</legend>

        <p className="quantity-note">
          Depuis le planning, tu peux demander à une IA de noter tes journées. Seuls les repas des jours demandés et
          ton objectif nutritionnel sont alors envoyés à 1min.AI — jamais ton prénom, ta date de naissance, ton poids
          ni ta taille. La clé reste sur cet appareil.
        </p>

        <label>
          Clé d'accès 1min.AI
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            placeholder={hasKey ? `Clé enregistrée (…${settings.apiKey!.slice(-4)})` : 'Coller la clé'}
            onChange={(e) => {
              setApiKey(e.target.value);
              setIsSaved(false);
            }}
          />
        </label>

        <label>
          Modèle
          <select
            value={selectedModel}
            onChange={(e) => {
              setModel(e.target.value);
              setIsSaved(false);
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        {hasKey && (
          <div className="button-row">
            <button type="button" onClick={removeKey}>
              Effacer la clé
            </button>
          </div>
        )}
      </fieldset>

      <button type="submit" className="button-primary button-primary--neutral">
        <MaskIcon src="/icons/common/save.svg" color="currentColor" size="1.2rem" />
        Enregistrer
      </button>

      {isSaved && <p className="empty-state">Réglages enregistrés.</p>}
    </form>
  );
}
