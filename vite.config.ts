import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  const env = loadEnv(mode, '.', '');
  
  // Ordem de prioridade robusta para a API Key
  const geminiKey = (
    process.env.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    env.VITE_GEMINI_API_KEY || 
    env.GEMINI_API_KEY || 
    ""
  ).trim();
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'model/modelo_universal.tflite', 
          'favicon.ico', 
          'robots.txt', 
          'apple-touch-icon.png'
        ],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: 'index.html',
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,tflite}'],
          maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'external-cdn-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 ano
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ]
        },
        manifest: {
          name: 'PestScan Pro',
          short_name: 'PestScan',
          description: 'IA Urbana para detecção de pragas',
          theme_color: '#022c22',
          background_color: '#022c22',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'https://picsum.photos/192/192?random=1',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://picsum.photos/512/512?random=2',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            }
          ]
        }
      })
    ],
    optimizeDeps: {
      include: ['react-leaflet', 'leaflet', 'react-signature-canvas']
    },
    ssr: {
      noExternal: ['react-leaflet', 'leaflet', 'react-signature-canvas']
    },
    resolve: {
      alias: {
        'react-leaflet': 'react-leaflet',
        'leaflet': 'leaflet',
      }
    },
    base: '/', // Standard for Vercel to avoid path issues
    server: {
      host: true,
      port: 3000,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl.trim()),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey.trim()),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey)
    }
  }
})
