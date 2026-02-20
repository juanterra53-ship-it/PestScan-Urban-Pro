import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "./types";

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
      required: ["name", "scientificName", "category", "riskLevel", "characteristics", "anatomy", "members", "habits", "reproduction", "larvalPhase", "controlMethods", "physicalMeasures", "chemicalMeasures", "healthRisks"]
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
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { text: "Identifique esta praga urbana. O scanner deve ser capaz de identificar insetos em qualquer fase da vida (ovo, larva, pupa ou adulto) e também vestígios/sinais de infestação como fezes de roedores, pombos ou morcegos. Se for um inseto, aracnídeo, praga comum ou vestígio, preencha os dados com detalhes técnicos, incluindo medidas físicas e químicas separadamente. No caso de vestígios (fezes), use o nome do vestígio no campo 'name' e 'Vestígio' no campo 'scientificName'. Retorne apenas JSON." },
          { inlineData: { mimeType: "image/jpeg", data: base64 } }
        ]
      },
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Forneça uma ficha técnica biológica completa da praga urbana chamada: "${pestName}". Inclua nome científico, hábitos, métodos de controle físico e químico. Retorne em JSON.`,
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    return JSON.parse(response.text || "{}");
  });
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
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
