import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvkufyoakhnsnvkqvhow.supabase.co';
const supabaseAnonKey = 'sb_publishable_4LSh4M3KWAVKl0PBuqZtlw_lCuJQeJ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);