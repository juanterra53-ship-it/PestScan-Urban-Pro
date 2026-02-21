import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "./types";

// Esquema simplificado e robusto para evitar erros de processamento
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
      required: ["name", "scientificName", "category", "riskLevel", "members", "habits", "controlMethods", "physicalMeasures", "chemicalMeasures"]
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
      if ((error.message?.includes("503") || error.message?.includes("429")) && i < retries - 1) {
        await delay(2000 * (i + 1));
        continue;
      }
      throw error;
    }
  }
};

export const analyzePestImage = async (base64: string): Promise<RecognitionResult> => {
  // Busca a chave de forma exaustiva para não falhar no Vercel
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 process.env.GEMINI_API_KEY || 
                 process.env.API_KEY || 
                 "";

  if (!apiKey) {
    console.error("ERRO: Chave da API não encontrada nas variáveis de ambiente.");
    throw new Error("API Key não configurada no Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { text: "Identifique a praga ou vestígio na imagem. Retorne obrigatoriamente um JSON completo seguindo o esquema fornecido. Se não tiver certeza, marque pestFound como false." },
          { inlineData: { mimeType: "image/jpeg", data: base64 } }
        ]
      },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: PEST_SCHEMA 
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");
    
    return JSON.parse(text);
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Gere uma ficha técnica biológica para a praga: "${pestName}". Use o formato JSON estrito.`,
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    return JSON.parse(response.text || "{}");
  });
};

// Função de áudio removida temporariamente para evitar conflitos de tipos se não estiver sendo usada
export const generatePestAudio = async (text: string): Promise<string | null> => {
  return null; 
};
