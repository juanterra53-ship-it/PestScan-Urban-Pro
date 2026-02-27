import { GoogleGenAI, Type } from "@google/genai";
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
      required: ["name", "scientificName", "category", "riskLevel"]
    }
  },
  required: ["pestFound", "confidence"]
};

export const analyzePestImage = async (base64: string): Promise<RecognitionResult> => {
  const apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey.length < 5) throw new Error("CHAVE_AUSENTE_V3.1 - Verifique o Vercel.");
  
  const ai = new GoogleGenAI({ apiKey });
  const model = ai.models.generateContent({
    model: 'gemini-1.5-flash', 
    contents: { parts: [{ text: "Analise a imagem e identifique a praga. Retorne estritamente JSON." }, { inlineData: { mimeType: "image/jpeg", data: base64 } }] },
    config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA, temperature: 0.1 }
  });

  try {
    const response = await model;
    let cleanJson = response.text.trim();
    const start = cleanJson.indexOf('{');
    const end = cleanJson.lastIndexOf('}');
    if (start !== -1 && end !== -1) cleanJson = cleanJson.substring(start, end + 1);
    return JSON.parse(cleanJson);
  } catch (err: any) {
    throw new Error("Falha na análise: " + err.message);
  }
};
