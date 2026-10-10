import { useEffect, useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { clearAiApiKey, getAiSettings, saveAiSettings } from '../../db/repositories/settingsRepository';
import { AI_MODELS } from '../../services/aiReview';
import MaskIcon from '../../components/MaskIcon';
import ConfirmModal from '../../components/ConfirmModal';
import EmbeddingSetup from '../../components/EmbeddingSetup';
import { acquireEmbedding, getEmbeddingStatus, removeEmbedding } from '../../services/embedding/embeddingClient';
import type { EmbeddingStatus } from '../../services/embedding/types';

export default function SettingsScreen() {
  const settings = useLiveQuery(() => getAiSettings(), []);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  // null tant que l'état du modèle de recherche n'a pas été lu.
  const [embedding, setEmbedding] = useState<EmbeddingStatus | null>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  useEffect(() => {
    const release = acquireEmbedding();
    let cancelled = false;
    getEmbeddingStatus().then(
      (status) => !cancelled && setEmbedding(status),
      () => !cancelled && setEmbedding({ isModelCached: false, sizeBytes: 0 }),
    );
    return () => {
      cancelled = true;
      release();
    };
  }, []);

  async function refreshEmbedding() {
    setEmbedding(await getEmbeddingStatus());
  }

  async function confirmRemoveEmbedding() {
    setIsRemoveOpen(false);
    await removeEmbedding();
    await refreshEmbedding();
  }

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
          ni ta taille. La même clé sert à analyser un plat décrit en texte libre : seul ce texte est alors envoyé.
          La clé reste sur cet appareil.
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

      <fieldset className="ingredient-picker">
        <legend>Recherche intelligente</legend>

        {embedding?.isModelCached && (
          <>
            <p className="quantity-note">
              Installée sur cet appareil ({Math.round(embedding.sizeBytes / (1024 * 1024))} Mo). Elle retrouve les
              aliments d'un plat décrit en texte libre, sans rien envoyer : le calcul se fait ici.
            </p>
            <div className="button-row">
              <button type="button" onClick={() => setIsRemoveOpen(true)}>
                Supprimer le modèle
              </button>
            </div>
          </>
        )}

        {embedding && !embedding.isModelCached && (
          <>
            <p className="quantity-note">Pas encore installée sur cet appareil.</p>
            <EmbeddingSetup onReady={refreshEmbedding} />
          </>
        )}
      </fieldset>

      <button type="submit" className="button-primary button-primary--neutral">
        <MaskIcon src="/icons/common/save.svg" color="currentColor" size="1.2rem" />
        Enregistrer
      </button>

      {isSaved && <p className="empty-state">Réglages enregistrés.</p>}

      <ConfirmModal
        open={isRemoveOpen}
        message="Supprimer le modèle de recherche intelligente ? Tes plats, tes aliments et ton planning ne changent pas."
        onConfirm={confirmRemoveEmbedding}
        onCancel={() => setIsRemoveOpen(false)}
      />
    </form>
  );
}
