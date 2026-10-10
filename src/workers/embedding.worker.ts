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
// Hugging Face répond 404, sans en-têtes CORS, à toute requête dont le référent est un site *.workers.dev
// (l'hébergement de l'application) : le navigateur refuse alors la réponse. On n'envoie donc jamais de référent.
function fetchWithoutReferrer(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, referrerPolicy: 'no-referrer' });
}
env.fetch = fetchWithoutReferrer;
// La page n'est pas isolée (pas d'en-têtes COOP/COEP) : pas de mémoire partagée, donc un seul fil.
env.backends.onnx.wasm!.numThreads = 1;

class EmbeddingFailure extends Error {
  code: EmbeddingErrorCode;
  /** Ce qui s'est réellement passé, pour l'afficher à qui veut comprendre l'échec. */
  detail: string;

  constructor(code: EmbeddingErrorCode, detail: string) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

function megabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} Mo`;
}

function describe(error: unknown): string {
  if (error instanceof EmbeddingFailure) return error.detail;
  return error instanceof Error ? `${error.name} : ${error.message}` : String(error);
}

/** L'appareil et son stockage, joints au détail d'un échec : la cause en dépend souvent. */
async function environment(): Promise<string> {
  const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
  const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  return [
    `En ligne : ${navigator.onLine ? 'oui' : 'non'}`,
    estimate ? `Stockage : ${megabytes(estimate.usage ?? 0)} utilisés sur ${megabytes(estimate.quota ?? 0)}` : 'Stockage : inconnu',
    `Stockage persistant : ${persisted === undefined ? 'inconnu' : persisted ? 'oui' : 'non'}`,
    memory ? `Mémoire de l'appareil : ${memory} Go` : null,
    `Navigateur : ${navigator.userAgent}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
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
  } catch (error) {
    const cached = await cache.match(MANIFEST_URL);
    if (!cached) throw new EmbeddingFailure('OFFLINE', `Manifeste des vecteurs (${MANIFEST_URL}) : ${describe(error)}`);
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
    } catch (error) {
      throw new EmbeddingFailure(navigator.onLine ? 'INTERRUPTED' : 'OFFLINE', `Vecteurs (${key}) : ${describe(error)}`);
    }
    if (!res.ok) throw new EmbeddingFailure('INTERRUPTED', `Vecteurs (${key}) : réponse HTTP ${res.status}`);
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
    throw new EmbeddingFailure(
      'INTERRUPTED',
      `Vecteurs (${key}) : ${vectors.length} octets reçus (type ${res.headers.get('content-type')}), ${expectedBytes} attendus pour ${manifest.count} aliments ; le manifeste liste ${manifest.ids.length} identifiants`,
    );
  }
  return vectors;
}

async function modelEntries(model: string): Promise<{ cache: Cache; requests: Request[] }> {
  const cache = await caches.open(env.cacheKey);
  const requests = (await cache.keys()).filter((request) => isModelFile(request.url, model));
  return { cache, requests };
}

// Suffixe du fichier ONNX selon la quantification, tel que la bibliothèque le cherche.
const ONNX_SUFFIX: Record<string, string> = { fp32: '', fp16: '_fp16', q8: '_quantized', q4: '_q4' };

/** Les fichiers dont la bibliothèque a besoin pour ce modèle : configuration, tokeniseur, réseau. */
function modelFiles(manifest: EmbeddingManifest): string[] {
  return ['config.json', 'tokenizer_config.json', 'tokenizer.json', `onnx/model${ONNX_SUFFIX[manifest.dtype] ?? ''}.onnx`];
}

/** L'adresse d'un fichier du modèle : c'est aussi la clé sous laquelle la bibliothèque le cherche en cache. */
function modelFileUrl(model: string, file: string): string {
  return `${env.remoteHost}${env.remotePathTemplate.replaceAll('{model}', model).replaceAll('{revision}', 'main')}${file}`;
}

async function missingModelFiles(manifest: EmbeddingManifest): Promise<string[]> {
  const cache = await caches.open(env.cacheKey);
  const missing: string[] = [];
  for (const file of modelFiles(manifest)) {
    if (!(await cache.match(modelFileUrl(manifest.model, file)))) missing.push(file);
  }
  return missing;
}

async function isModelCached(manifest: EmbeddingManifest): Promise<boolean> {
  return (await missingModelFiles(manifest)).length === 0;
}

/**
 * Distingue un serveur injoignable d'une réponse que le navigateur refuse : sans CORS, la requête
 * aboutit dès que le serveur répond, quoi qu'il réponde.
 */
async function reachability(url: string): Promise<string> {
  try {
    await fetchWithoutReferrer(url, { mode: 'no-cors', cache: 'no-store' });
    return 'le serveur répond, mais sa réponse est refusée par le navigateur (CORS, redirection ou page de blocage)';
  } catch {
    return 'le serveur est injoignable depuis cet appareil (réseau, DNS, pare-feu ou bloqueur de contenu)';
  }
}

/**
 * Télécharge les fichiers manquants du modèle droit dans le cache de la bibliothèque, qui les y trouvera.
 * On ne passe pas par elle pour deux raisons : elle garde chaque fichier entier en mémoire avant de
 * l'écrire (118 Mo, lourd pour un téléphone), et ses échecs ne disent ni quel fichier ni quel serveur.
 * Ici chaque fichier est écrit au fil de l'eau, et un fichier complet n'est jamais retéléchargé.
 */
async function downloadModel(manifest: EmbeddingManifest, report: (progress: EmbeddingProgress) => void): Promise<void> {
  const cache = await caches.open(env.cacheKey);
  const files = await missingModelFiles(manifest);
  const received = new Map<string, number>();
  const totals = new Map<string, number>();

  function reportTotal() {
    const sum = (map: Map<string, number>) => [...map.values()].reduce((a, n) => a + n, 0);
    report({ stage: 'MODEL', loadedBytes: sum(received), totalBytes: Math.max(sum(totals), sum(received)) });
  }

  async function download(file: string): Promise<void> {
    const url = modelFileUrl(manifest.model, file);
    let res: Response;
    try {
      res = await fetchWithoutReferrer(url);
    } catch (error) {
      throw new EmbeddingFailure(
        navigator.onLine ? 'INTERRUPTED' : 'OFFLINE',
        `Fichier ${file} : la requête n'a reçu aucune réponse (${describe(error)})\nAdresse : ${url}\nDiagnostic : ${await reachability(url)}`,
      );
    }
    const host = new URL(res.url || url).host;
    if (!res.ok || !res.body) {
      throw new EmbeddingFailure('INTERRUPTED', `Fichier ${file} : réponse HTTP ${res.status} de ${host}\nAdresse : ${url}`);
    }

    // Taille annoncée : exacte pour un fichier brut, plus petite que le contenu pour une réponse compressée
    // (et le navigateur ne dit pas toujours laquelle des deux). Elle sert à la barre et à repérer une troncature.
    const declared = Number(res.headers.get('content-length')) || 0;
    totals.set(file, declared);
    received.set(file, 0);
    const counted = res.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          received.set(file, (received.get(file) ?? 0) + chunk.byteLength);
          reportTotal();
          controller.enqueue(chunk);
        },
      }),
    );
    const headers = new Headers({ 'content-type': res.headers.get('content-type') ?? 'application/octet-stream' });

    try {
      await cache.put(url, new Response(counted, { headers }));
    } catch (error) {
      await cache.delete(url).catch(() => {});
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new EmbeddingFailure('QUOTA', `Fichier ${file} : ${describe(error)} après ${megabytes(received.get(file) ?? 0)}`);
      }
      throw new EmbeddingFailure(
        navigator.onLine ? 'INTERRUPTED' : 'OFFLINE',
        `Fichier ${file} : ${megabytes(received.get(file) ?? 0)} reçus sur ${megabytes(declared)} depuis ${host}, puis ${describe(error)}`,
      );
    }
    if ((received.get(file) ?? 0) < declared) {
      await cache.delete(url);
      throw new EmbeddingFailure('INTERRUPTED', `Fichier ${file} : ${received.get(file)} octets reçus de ${host}, ${declared} annoncés`);
    }
  }

  // Tous ensemble : les tailles sont connues presque aussitôt, et la barre avance sur un total stable.
  const outcomes = await Promise.allSettled(files.map(download));
  const failed = outcomes.filter((o): o is PromiseRejectedResult => o.status === 'rejected').map((o) => o.reason);
  if (failed.length === 0) return;
  const first = failed.find((f) => f instanceof EmbeddingFailure) as EmbeddingFailure | undefined;
  throw new EmbeddingFailure(first?.code ?? 'INTERRUPTED', failed.map(describe).join('\n'));
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
  const wasCached = await isModelCached(manifest);
  // Où en était la préparation au moment d'un échec : c'est la première chose à savoir pour le comprendre.
  let step = 'Vérification du stockage';

  try {
    if (!wasCached) {
      // Un refus du stockage persistant ne bloque rien : le système pourra seulement purger le modèle.
      await navigator.storage?.persist?.();
      const estimate = await navigator.storage?.estimate?.();
      const freeBytes = estimate?.quota !== undefined ? estimate.quota - (estimate.usage ?? 0) : Infinity;
      if (freeBytes < MODEL_APPROX_BYTES) {
        throw new EmbeddingFailure('QUOTA', `${megabytes(freeBytes)} libres, ${megabytes(MODEL_APPROX_BYTES)} nécessaires`);
      }
      step = 'Téléchargement du modèle';
      await downloadModel(manifest, report);
    }

    // Le modèle est maintenant dans le cache : la bibliothèque le charge sans réseau. On ne lui passe pas
    // de suivi de progression, qui la ferait interroger Hugging Face pour connaître la taille des fichiers.
    step = 'Mise en route du modèle (fichiers tous présents sur l\'appareil)';
    report({ stage: 'LOADING', loadedBytes: 0, totalBytes: 0 });
    const extractor = await pipeline('feature-extraction', manifest.model, {
      dtype: manifest.dtype as 'q8',
      device: 'wasm',
    });
    return { manifest, vectors, extractor };
  } catch (error) {
    console.error('[Recherche intelligente] Préparation impossible :', error);
    throw new EmbeddingFailure(classify(error, step.startsWith('Mise en route')), `Étape : ${step}\n${describe(error)}`);
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
  let manifest: EmbeddingManifest;
  try {
    manifest = await loadManifest();
  } catch {
    return { isModelCached: false, sizeBytes: 0 };
  }

  const { cache, requests } = await modelEntries(manifest.model);
  let sizeBytes = 0;
  for (const request of requests) {
    const res = await cache.match(request);
    if (!res) continue;
    const declared = Number(res.headers.get('content-length'));
    sizeBytes += declared > 0 ? declared : (await res.blob()).size;
  }
  return { isModelCached: await isModelCached(manifest), sizeBytes };
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
    const detail = `${describe(error)}\n${await environment().catch(() => '')}`.trim();
    scope.postMessage({ requestId, type: 'error', code: classify(error, true), detail });
  }
};
