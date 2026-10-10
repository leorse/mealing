import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// onnxruntime-web référence son moteur .wasm par `import.meta.url`, donc Vite l'embarque : 26 Mio,
// au-delà des 25 Mio par fichier de Cloudflare. Le worker charge la variante servie depuis /ort/
// (scripts/copy-ort.mjs) : la copie embarquée ne sert à rien et est retirée du build.
function dropBundledOrtWasm(): Plugin {
  return {
    name: 'drop-bundled-ort-wasm',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/ort-wasm.*\.wasm$/.test(fileName)) delete bundle[fileName]
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Le worker d'embedding importe la bibliothèque par morceaux : il doit rester un module ES.
  worker: { format: 'es', plugins: () => [dropBundledOrtWasm()] },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // fourni via public/manifest.webmanifest
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Moteur ONNX de la recherche intelligente : trop lourd pour le précache, gardé après le premier usage.
            urlPattern: /\/ort\/.*\.(wasm|mjs)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'ort-engine' },
          },
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'off-api-cache',
              expiration: { maxAgeSeconds: 86400 },
            },
          },
        ],
      },
    }),
  ],
})
