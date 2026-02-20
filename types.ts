import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
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
