import { createClient } from '@supabase/supabase-js';

// Função auxiliar para obter variáveis de ambiente de forma segura (Vite/Process)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
};

// Prioriza variáveis de ambiente do sistema (Vercel/Vite) e usa as atuais como fallback
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://nvkufyoakhnsnvkqvhow.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_4LSh4M3KWAVKl0PBuqZtlw_lCuJQeJ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);