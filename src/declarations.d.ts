/// <reference types="vite-plugin-pwa/client" />

declare module '*.tflite' {
  const content: string;
  export default content;
}

declare const tf: any;
declare const tflite: any;
