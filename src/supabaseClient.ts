import { createClient } from '@supabase/supabase-js';

// Prioriza variáveis de ambiente do sistema (Vercel/Vite/Process)
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL').trim();
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY').trim();

// Diagnóstico de configuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ CONFIGURAÇÃO AUSENTE: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas.");
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
