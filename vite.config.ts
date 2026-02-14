import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  const env = loadEnv(mode, '.', '');
  
  // Prioriza a variável do sistema (Vercel) e depois tenta o arquivo .env local
  const key = process.env.API_KEY || env.API_KEY || env.GEMINI_API_KEY || "";
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";

  return {
    plugins: [react()],
    base: '/', 
    server: {
      host: true,
      port: 5173,
    },
    define: {
      // Previne erro 'process is not defined' no navegador definindo um objeto vazio
      'process.env': {},
      // Injeta a chave de API especificamente onde for solicitada
      'process.env.API_KEY': JSON.stringify(key.trim()),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl.trim()),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey.trim())
    }
  }
})