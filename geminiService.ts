import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "./types";

<<<<<<< HEAD
// Declarações globais para o TensorFlow carregado via CDN no index.html
declare const tf: any;
declare const tflite: any;

=======
// Esquema simplificado e robusto para evitar erros de processamento
>>>>>>> b10237416117e42630d5207369ac05b709cf4d9e
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

// Função auxiliar para aguardar tempo determinado (Exponential Backoff)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isServiceError = error.message?.includes("503") || error.message?.includes("UNAVAILABLE") || error.message?.includes("429");
      if (isServiceError && i < retries - 1) {
        console.warn(`Tentativa ${i + 1} falhou devido à alta demanda. Tentando novamente em ${2000 * (i + 1)}ms...`);
        await delay(2000 * (i + 1));
        continue;
      }
      throw error;
    }
  }
};

let localModel: any = null;
let isModelLoading = false;

// Labels correspondentes ao seu modelo treinado no Colab
// IMPORTANTE: Ajuste esta lista se o seu modelo tiver classes diferentes
const MODEL_LABELS = [
  "Escorpião Amarelo",
  "Aranha Marrom",
  "Barata Germânica",
  "Formiga Cortadeira",
  "Caruncho-do-Feijão",
  "Nenhuma Praga"
];

export const loadLocalModel = async () => {
  if (localModel || isModelLoading) return;
  isModelLoading = true;
  try {
    console.log("Iniciando carregamento do modelo local TFLite...");
    
    // Aguarda o TensorFlow.js inicializar completamente
    await tf.ready();
    
    // Configura o caminho para os arquivos WebAssembly do TFLite (Versão alpha.9 para estabilidade)
    tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
    
    localModel = await tflite.loadTFLiteModel('/model/modelo_barata.tflite');
    console.log("Modelo local TFLite carregado com sucesso!");
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes("neither model topology or manifest") || msg.includes("Failed to fetch") || msg.includes("Unexpected token")) {
      console.log("Aviso: Modelo offline do Colab ainda não configurado. O app funcionará apenas no modo Online (Gemini).");
    } else {
      console.error("Erro ao carregar modelo local:", error);
    }
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (!localModel) {
    throw new Error("Modelo offline não carregado. Conecte-se à internet ou verifique os arquivos do modelo.");
  }

  try {
    // Pré-processamento da imagem para o TensorFlow
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224]) // Ajuste o tamanho conforme o seu modelo TFLite
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims();

    // Inferência com TFLite
    const predictions = await localModel.predict(tensor) as any;
    const scores = await predictions.data();
    
    // Converte Float32Array para Array normal para usar o Math.max
    const scoresArray = Array.from(scores) as number[];
    const maxScoreIndex = scoresArray.indexOf(Math.max(...scoresArray));
    const maxScore = scoresArray[maxScoreIndex];
    const predictedLabel = MODEL_LABELS[maxScoreIndex];

    tensor.dispose();
    predictions.dispose();

    // Formatação do Resultado Offline
    if (predictedLabel === "Nenhuma Praga" || maxScore < 0.5) { // Threshold de 50%
      return {
        pestFound: false,
        confidence: maxScore,
        message: "Nenhuma praga identificada com confiança suficiente pelo modelo offline."
      };
    }

    // Retorna um resultado básico. Para dados completos, o app precisará ficar online.
    return {
      pestFound: true,
      confidence: maxScore,
      pest: {
        name: predictedLabel,
        scientificName: "Nome Científico (Requer Internet)",
        category: "Categoria (Requer Internet)",
        riskLevel: "Moderado", // Valor padrão
        characteristics: ["Detectado offline"],
        anatomy: "Conecte-se à internet para ver detalhes da anatomia.",
        members: "N/A",
        habits: "Conecte-se à internet para ver os hábitos.",
        reproduction: "N/A",
        larvalPhase: "N/A",
        controlMethods: ["Conecte-se à internet para ver métodos de controle."],
        physicalMeasures: [],
        chemicalMeasures: [],
        healthRisks: "Conecte-se à internet para ver os riscos à saúde."
      },
      message: "Analisado offline. Conecte-se à internet para obter a ficha técnica completa."
    };

  } catch (error) {
    console.error("Erro na inferência offline:", error);
    throw new Error("Falha ao processar imagem offline.");
  }
};

export const analyzePestImage = async (base64: string, imageElement?: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  // Verificação Híbrida: Online vs Offline
  if (!navigator.onLine) {
    console.log("Dispositivo offline. Tentando análise local...");
    if (imageElement) {
      return await analyzeOffline(imageElement);
    } else {
      throw new Error("Imagem não fornecida no formato correto para análise offline.");
    }
  }

  // Lógica Online (Gemini API)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada no ambiente.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', 
      contents: {
        parts: [
          { text: "Você é um especialista em entomologia urbana. Identifique a praga ou vestígio na imagem. Se não houver praga, defina pestFound como false. Retorne JSON puro." },
          { inlineData: { mimeType: "image/jpeg", data: base64 } }
        ]
      },
      config: { 
        responseMimeType: "application/json", 
        responseSchema: PEST_SCHEMA,
        maxOutputTokens: 1000 
      }
    });
    
    const text = response.text || "{}";
    // Limpeza defensiva caso o modelo retorne markdown
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada no ambiente.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', 
      contents: `Forneça uma ficha técnica biológica completa da praga urbana chamada: "${pestName}". Inclua nome científico, hábitos, métodos de controle físico e químico. Retorne em JSON puro.`,
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanJson);
  });
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Gere uma ficha técnica biológica para a praga: "${pestName}". Use o formato JSON estrito.`,
      config: { responseMimeType: "application/json", responseSchema: PEST_SCHEMA }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    return null;
  }
};
