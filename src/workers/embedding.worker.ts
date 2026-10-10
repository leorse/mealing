import { env, pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';
import {
  MODEL_APPROX_BYTES,
  type EmbeddingCandidate,
  type EmbeddingErrorCode,
  type EmbeddingManifest,
  type EmbeddingProgress,
  type EmbeddingRequestMessage,
  type EmbeddingResponseMessage,
  type EmbeddingStatus,
} from '../services/embedding/types';

// Le projet compile avec la seule bibliothèque DOM : on décrit ici le peu du worker dont on se sert.
const scope = self as unknown as {
  postMessage(message: EmbeddingResponseMessage): void;
  onmessage: ((event: MessageEvent<EmbeddingRequestMessage>) => void) | null;
  location: Location;
};

const MANIFEST_URL = '/seed/ciqual-index.json';
const VECTORS_URL = '/seed/ciqual-vectors.bin';
const ASSETS_CACHE = 'mealing-embedding';

// Le modèle ne vient que de Hugging Face, et le moteur WebAssembly que de l'application :
// sans ce réglage, la bibliothèque irait le chercher sur un CDN tiers.
env.allowLocalModels = false;
env.backends.onnx.wasm!.wasmPaths = {
  mjs: `${scope.location.origin}/ort/ort-wasm-simd-threaded.mjs`,
  wasm: `${scope.location.origin}/ort/ort-wasm-simd-threaded.wasm`,
};
// La page n'est pas isolée (pas d'en-têtes COOP/COEP) : pas de mémoire partagée, donc un seul fil.
env.backends.onnx.wasm!.numThreads = 1;

class EmbeddingFailure extends Error {
  code: EmbeddingErrorCode;

  constructor(code: EmbeddingErrorCode) {
    super(code);
    this.code = code;
  }
}

interface Engine {
  manifest: EmbeddingManifest;
  vectors: Int8Array;
  extractor: FeatureExtractionPipeline;
}

let engine: Promise<Engine> | null = null;

function isModelFile(url: string, model: string): boolean {
  return url.includes(`/${model}/`);
}

/** Le manifeste est petit et porte la version : on le redemande au réseau, le cache ne sert que hors ligne. */
async function loadManifest(): Promise<EmbeddingManifest> {
  const cache = await caches.open(ASSETS_CACHE);
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    await cache.put(MANIFEST_URL, res.clone());
    return (await res.json()) as EmbeddingManifest;
  } catch {
    const cached = await cache.match(MANIFEST_URL);
    if (!cached) throw new EmbeddingFailure('OFFLINE');
    return (await cached.json()) as EmbeddingManifest;
  }
}

async function loadVectors(manifest: EmbeddingManifest, report: (progress: EmbeddingProgress) => void): Promise<Int8Array> {
  const cache = await caches.open(ASSETS_CACHE);
  const key = `${VECTORS_URL}?v=${manifest.version}`;
  const expectedBytes = manifest.count * manifest.dim;

  let res = await cache.match(key);
  if (!res) {
    report({ stage: 'VECTORS', loadedBytes: 0, totalBytes: expectedBytes });
    try {
      res = await fetch(key);
    } catch {
      throw new EmbeddingFailure(navigator.onLine ? 'INTERRUPTED' : 'OFFLINE');
    }
    if (!res.ok) throw new EmbeddingFailure('INTERRUPTED');
    // Les vecteurs d'une version antérieure ne serviront plus.
    for (const request of await cache.keys()) {
      if (request.url.includes(VECTORS_URL)) await cache.delete(request);
    }
    await cache.put(key, res.clone());
  }

  const vectors = new Int8Array(await res.arrayBuffer());
  if (vectors.length !== expectedBytes || manifest.ids.length !== manifest.count) {
    // Fichier tronqué : on l'oublie pour qu'une nouvelle tentative le retélécharge.
    await cache.delete(key);
    throw new EmbeddingFailure('INTERRUPTED');
  }
  return vectors;
}

async function modelEntries(model: string): Promise<{ cache: Cache; requests: Request[] }> {
  const cache = await caches.open(env.cacheKey);
  const requests = (await cache.keys()).filter((request) => isModelFile(request.url, model));
  return { cache, requests };
}

async function isModelCached(model: string): Promise<boolean> {
  const { requests } = await modelEntries(model);
  return requests.some((request) => request.url.endsWith('.onnx'));
}

function classify(error: unknown, wasCached: boolean): EmbeddingErrorCode {
  if (error instanceof EmbeddingFailure) return error.code;
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return 'QUOTA';
  // Modèle déjà sur l'appareil : l'échec vient de son exécution, pas du réseau.
  if (wasCached) return 'UNSUPPORTED';
  if (!navigator.onLine) return 'OFFLINE';
  const message = error instanceof Error ? error.message : String(error);
  return /fetch|network|load failed|connection/i.test(message) ? 'INTERRUPTED' : 'UNSUPPORTED';
}

async function createEngine(report: (progress: EmbeddingProgress) => void): Promise<Engine> {
  const manifest = await loadManifest();
  const vectors = await loadVectors(manifest, report);
  const wasCached = await isModelCached(manifest.model);

  try {
    if (!wasCached) {
      // Un refus du stockage persistant ne bloque rien : le système pourra seulement purger le modèle.
      await navigator.storage?.persist?.();
      const estimate = await navigator.storage?.estimate?.();
      const freeBytes = estimate?.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : Infinity;
      if (freeBytes < MODEL_APPROX_BYTES) throw new EmbeddingFailure('QUOTA');
    } else {
      report({ stage: 'LOADING', loadedBytes: 0, totalBytes: 0 });
    }

    const extractor = await pipeline('feature-extraction', manifest.model, {
      dtype: manifest.dtype as 'q8',
      device: 'wasm',
      // Pas de suivi pour un modèle déjà sur l'appareil : la bibliothèque interrogerait le réseau
      // pour connaître la taille des fichiers, ce qui bloquerait le chargement hors ligne.
      progress_callback: wasCached
        ? undefined
        : (info) => {
            if (info.status !== 'progress_total') return;
            const isDone = info.total > 0 && info.loaded >= info.total;
            report({ stage: isDone ? 'LOADING' : 'MODEL', loadedBytes: info.loaded, totalBytes: info.total });
          },
    });
    return { manifest, vectors, extractor };
  } catch (error) {
    console.error('[Recherche intelligente] Préparation impossible :', error);
    throw new EmbeddingFailure(classify(error, wasCached));
  }
}

function prepare(report: (progress: EmbeddingProgress) => void): Promise<Engine> {
  if (!engine) {
    engine = createEngine(report);
    // Un échec ne doit pas rester en mémoire : « Réessayer » repart de zéro.
    engine.catch(() => {
      engine = null;
    });
  }
  return engine;
}

/** Les `topK` vecteurs Ciqual au plus grand produit scalaire avec la requête, du plus proche au plus éloigné. */
function nearest(query: Float32Array, { manifest, vectors }: Engine, topK: number): EmbeddingCandidate[] {
  const { dim, count, ids } = manifest;
  const best: { index: number; score: number }[] = [];

  for (let row = 0; row < count; row++) {
    const offset = row * dim;
    let score = 0;
    for (let d = 0; d < dim; d++) score += query[d] * vectors[offset + d];

    if (best.length === topK && score <= best[topK - 1].score) continue;
    let position = best.length;
    while (position > 0 && best[position - 1].score < score) position--;
    best.splice(position, 0, { index: row, score });
    if (best.length > topK) best.pop();
  }

  // Les vecteurs livrés valent le vecteur unitaire × 127 : on revient à l'échelle du cosinus.
  return best.map(({ index, score }) => ({ id: ids[index], score: score / 127 }));
}

async function search(texts: string[], topK: number): Promise<EmbeddingCandidate[][]> {
  const current = await prepare(() => {});
  const results: EmbeddingCandidate[][] = texts.map(() => []);
  const filled = texts.map((text, index) => ({ text: text.trim(), index })).filter(({ text }) => text.length > 0);
  if (filled.length === 0 || topK <= 0) return results;

  const { dim, prefix, pooling } = current.manifest;
  const output = await current.extractor(
    filled.map(({ text }) => `${prefix}${text}`),
    { pooling: pooling as 'mean', normalize: true },
  );
  const data = output.data as Float32Array;
  filled.forEach(({ index }, row) => {
    results[index] = nearest(data.subarray(row * dim, (row + 1) * dim), current, topK);
  });
  return results;
}

async function status(): Promise<EmbeddingStatus> {
  let model: string;
  try {
    model = (await loadManifest()).model;
  } catch {
    return { isModelCached: false, sizeBytes: 0 };
  }

  const { cache, requests } = await modelEntries(model);
  let sizeBytes = 0;
  for (const request of requests) {
    const res = await cache.match(request);
    if (!res) continue;
    const declared = Number(res.headers.get('content-length'));
    sizeBytes += declared > 0 ? declared : (await res.blob()).size;
  }
  return { isModelCached: requests.some((request) => request.url.endsWith('.onnx')), sizeBytes };
}

async function remove(): Promise<void> {
  const current = engine;
  engine = null;
  const loaded = await current?.catch(() => null);
  await loaded?.extractor.dispose();

  let model: string | null = loaded?.manifest.model ?? null;
  if (!model) model = await loadManifest().then((m) => m.model, () => null);
  if (model) {
    const { cache, requests } = await modelEntries(model);
    for (const request of requests) await cache.delete(request);
  }
  await caches.delete(ASSETS_CACHE);
}

scope.onmessage = async ({ data }) => {
  const { requestId } = data;
  try {
    let value: unknown;
    if (data.type === 'status') value = await status();
    else if (data.type === 'remove') value = await remove();
    else if (data.type === 'search') value = await search(data.texts, data.topK);
    else {
      const current = await prepare((progress) => scope.postMessage({ requestId, type: 'progress', progress }));
      value = current.manifest.version;
    }
    scope.postMessage({ requestId, type: 'result', value });
  } catch (error) {
    scope.postMessage({ requestId, type: 'error', code: classify(error, true) });
  }
};
