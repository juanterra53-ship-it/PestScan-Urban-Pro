/// <reference types="vite-plugin-pwa/client" />

declare module '*.tflite' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const tf: any;
declare const tflite: any;
