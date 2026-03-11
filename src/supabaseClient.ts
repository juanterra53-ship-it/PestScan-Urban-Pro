import { createClient } from '@supabase/supabase-js';

// Prioriza variáveis de ambiente do sistema (Vercel/Vite)
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim() || 'https://nvkufyoakhnsnvkqvhow.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim() || 'sb_publishable_4LSh4M3KWAVKl0PBuqZtlw_lCuJQeJ8';

// Diagnóstico de configuração
if (supabaseAnonKey.startsWith('sb_') || supabaseAnonKey.startsWith('pk_')) {
  console.warn("⚠️ ALERTA DE CONFIGURAÇÃO: A chave VITE_SUPABASE_ANON_KEY parece ser uma chave do Stripe (começa com sb_ ou pk_), não do Supabase. O login irá falhar. Verifique as variáveis de ambiente no menu Settings.");
}

if (!supabaseUrl.includes('supabase.co')) {
  console.warn("⚠️ ALERTA DE CONFIGURAÇÃO: A URL do Supabase parece estar incorreta. Verifique as variáveis de ambiente.");
}

let client;
try {
  client = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error("Erro fatal ao inicializar Supabase:", error);
  // Cria um cliente "mock" que falha graciosamente para não travar o app na tela branca/verde
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error("Supabase não inicializado") }),
      getUser: async () => ({ data: { user: null }, error: new Error("Supabase não inicializado") }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ error: new Error("Erro de configuração do Supabase") }),
      signUp: async () => ({ error: new Error("Erro de configuração do Supabase") }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }),
      insert: async () => ({ error: null })
    }),
    storage: {
      from: () => ({
        upload: async () => ({ error: new Error("Storage indisponível") }),
        getPublicUrl: () => ({ data: { publicUrl: "" } })
      })
    }
  } as any;
}

export const supabase = client;
