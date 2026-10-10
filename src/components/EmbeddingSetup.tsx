import { useEffect, useState } from 'react';
import {
  EmbeddingError,
  acquireEmbedding,
  embeddingErrorMessage,
  prepareEmbedding,
} from '../services/embedding/embeddingClient';
import { MODEL_APPROX_BYTES, type EmbeddingProgress } from '../services/embedding/types';

interface EmbeddingSetupProps {
  /** Le modèle est téléchargé et chargé : la recherche intelligente est utilisable. */
  onReady: () => void;
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} Mo`;
}

const STAGE_LABELS: Record<EmbeddingProgress['stage'], string> = {
  VECTORS: 'Téléchargement des aliments…',
  MODEL: 'Téléchargement du modèle…',
  LOADING: 'Dernière étape : mise en route du modèle…',
};

/** Téléchargement accompagné du modèle de recherche intelligente : annonce, progression, reprise après échec. */
export default function EmbeddingSetup({ onReady }: EmbeddingSetupProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<EmbeddingProgress | null>(null);
  const [failure, setFailure] = useState<EmbeddingError | null>(null);

  // Le téléchargement doit survivre aux rendus : le composant tient le worker tant qu'il est affiché.
  useEffect(() => acquireEmbedding(), []);

  async function start() {
    if (!navigator.onLine) {
      setFailure(new EmbeddingError('OFFLINE', 'Le navigateur se déclare hors ligne (navigator.onLine).'));
      return;
    }
    setIsRunning(true);
    setFailure(null);
    setProgress(null);
    try {
      await prepareEmbedding(setProgress);
      onReady();
    } catch (error) {
      setFailure(error instanceof EmbeddingError ? error : new EmbeddingError('UNSUPPORTED', String(error)));
    } finally {
      setIsRunning(false);
    }
  }

  // Seul le modèle est assez gros pour qu'on en compte les octets ; les autres étapes restent en attente indéterminée.
  const isDownloading = progress !== null && progress.stage === 'MODEL' && progress.totalBytes > 0;

  return (
    <>
      <p className="quantity-note">
        La recherche intelligente retrouve les aliments à partir d'une description libre. Elle fonctionne sur cet
        appareil et demande un téléchargement d'environ {megabytes(MODEL_APPROX_BYTES)}, une seule fois. Préfère le
        Wi-Fi.
      </p>

      {isRunning && (
        <>
          {isDownloading ? (
            <progress
              className="progress-bar"
              value={progress.loadedBytes}
              max={progress.totalBytes}
              aria-label="Téléchargement de la recherche intelligente"
            />
          ) : (
            <progress className="progress-bar" aria-label="Préparation de la recherche intelligente" />
          )}
          <p className="quantity-note" role="status">
            {progress ? STAGE_LABELS[progress.stage] : 'Préparation…'}
            {isDownloading && ` ${megabytes(progress.loadedBytes)} sur ${megabytes(progress.totalBytes)}`}
          </p>
        </>
      )}

      {failure && (
        <>
          <p className="quantity-note" role="alert">
            {embeddingErrorMessage(failure.code)}
          </p>
          {failure.detail && (
            <details className="quantity-note">
              <summary>Détail technique</summary>
              <p className="error-detail">{failure.detail}</p>
            </details>
          )}
        </>
      )}

      {!isRunning && failure?.code !== 'UNSUPPORTED' && (
        <div className="button-row">
          <button type="button" onClick={start}>
            {failure ? 'Réessayer' : `Télécharger (≈ ${megabytes(MODEL_APPROX_BYTES)})`}
          </button>
        </div>
      )}
    </>
  );
}
