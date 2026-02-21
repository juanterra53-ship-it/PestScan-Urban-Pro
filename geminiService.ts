export const analyzePestImage = async (base64: string): Promise<RecognitionResult> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: {
        parts: [
          { text: "Identifique a praga/vestígio (ovo, larva, fezes, adulto). Retorne JSON curto e direto." },
          { inlineData: { mimeType: "image/jpeg", data: base64 } }
        ]
      },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: PEST_SCHEMA,
        maxOutputTokens: 1000 
      }
    });
    return JSON.parse(response.text || "{}");
  });
};
