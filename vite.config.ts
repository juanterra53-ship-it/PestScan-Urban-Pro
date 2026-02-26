import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  const apiKey = process.env.API_KEY || env.VITE_API_KEY || env.API_KEY || "";
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "https://nvkufyoakhnsnvkqvhow.supabase.co";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4LSh4M3KWAVKl0PBuqZtlw_lCuJQeJ8";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,tflite}'],
          maximumFileSizeToCacheInBytes: 10000000 // 10MB para permitir o modelo tflite
        },
        manifest: {
          name: 'PestScan Pro',
          short_name: 'PestScan',
          description: 'IA Urbana para detecção de pragas',
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
    base: './',
    server: {
      host: true,
      port: 3000,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    define: {
      'process.env': {},
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || env.VITE_API_KEY || ""),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl.trim()),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey.trim())
    }
  }
})
