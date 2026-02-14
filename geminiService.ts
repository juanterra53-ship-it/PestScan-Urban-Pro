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

export const analyzePestImage = async (base64: string): Promise<RecognitionResult> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { text: "Identifique esta praga urbana. Se for um inseto, aracnídeo ou praga comum em cidades, preencha os dados com detalhes técnicos, incluindo medidas físicas (barreiras, limpeza) e químicas (inseticidas, iscas) separadamente. Se não for uma praga clara, defina pestFound como false. Retorne apenas JSON." },
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
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    throw new Error(`Erro na análise: ${error.message || "Falha de comunicação"}`);
  }
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
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
    console.error("Erro ao gerar áudio:", err);
    return null;
  }
};