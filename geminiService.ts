import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "./types";

declare const tf: any;
declare const tflite: any;

const PEST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    pestFound: { type: Type.BOOLEAN },
    confidence: { type: Type.NUMBER },
    pest: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        scientificName: { type: Type.STRING },
        category: { type: Type.STRING },
        riskLevel: { type: Type.STRING },
        characteristics: { type: Type.ARRAY, items: { type: Type.STRING } },
        anatomy: { type: Type.STRING },
        members: { type: Type.STRING },
        habits: { type: Type.STRING },
        reproduction: { type: Type.STRING },
        larvalPhase: { type: Type.STRING },
        controlMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
        physicalMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
        chemicalMeasures: { type: Type.ARRAY, items: { type: Type.STRING } },
        healthRisks: { type: Type.STRING },
      },
      required: ["name", "scientificName", "category", "riskLevel"]
    }
  },
  required: ["pestFound", "confidence"]
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isServiceError = error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("429");
      if (isServiceError && i < retries - 1) {
        await delay(2000 * (i + 1));
        continue;
      }
      throw error;
    }
  }
};

export const analyzePestImage = async (base64: string): Promise<RecognitionResult> => {
  const apiKey = (process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || "").trim();
  
  if (!apiKey || apiKey.length < 5) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    throw new Error(`CHAVE_AUSENTE_V2.4 - Verifique o Vercel.`);
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: {
          parts: [
            { text: "Você é um especialista em entomologia urbana. Identifique a praga na imagem. Retorne estritamente JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64 } }
          ]
        },
        config: { 
          responseMimeType: "application/json", 
          responseSchema: PEST_SCHEMA
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Resposta vazia da IA.");
      
      let cleanJson = text.trim();
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
      }
      
      return JSON.parse(cleanJson);
    } catch (err: any) {
      throw new Error("Falha na análise: " + (err.message || "Erro desconhecido"));
    }
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Ficha técnica da praga: "${pestName}". Retorne JSON puro.`,
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  });
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: { 
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    return null;
  }
};
