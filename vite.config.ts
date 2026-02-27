import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "https://nvkufyoakhnsnvkqvhow.supabase.co";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4LSh4M3KWAVKl0PBuqZtlw_lCuJQeJ8";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,tflite}'],
          maximumFileSizeToCacheInBytes: 10000000 // 10MB para permitir o modelo tflite
        },
        manifest: {
          name: 'PestScan Pro v4.2 MASTER-FINAL',
          short_name: 'PestScan',
          description: 'IA Urbana para detecção de pragas - v4.2 MASTER-FINAL',
          theme_color: '#022c22',
          background_color: '#022c22',
          display: 'standalone',
          icons: [
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    base: './', // Melhor compatibilidade para GitHub Pages e caminhos relativos
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
