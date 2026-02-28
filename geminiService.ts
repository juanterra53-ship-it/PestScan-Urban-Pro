import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "./types";

// Avisa o TypeScript que o 'tf' e 'tflite' vêm do script no index.html
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
// IMPORTANTE: O usuário precisa ajustar esta lista para bater com o modelo dele
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
    
    // Configura o caminho para os arquivos WebAssembly do TFLite
    tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
    
    localModel = await tflite.loadTFLiteModel('/model/modelo_barata.tflite');
    console.log("Modelo local TFLite carregado com sucesso!");
  } catch (error: any) {
    const msg = error.message || "";
    // Erros conhecidos que indicam que o modelo não está pronto ou é inválido
    if (msg.includes("neither model topology or manifest") || 
        msg.includes("Failed to fetch") || 
        msg.includes("Unexpected token") ||
        msg.includes("INVALID_ARGUMENT") || // Erro específico reportado pelo usuário
        msg.includes("Can't initialize model")) {
      console.warn("Aviso: Modelo offline indisponível. O app funcionará normalmente no modo Online (Gemini). Detalhe:", msg);
    } else {
      console.warn("Erro não crítico ao carregar modelo local:", error);
    }
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (!localModel) {
    console.warn("Modelo offline não carregado. Retornando resultado de fallback.");
    return {
      pestFound: false,
      confidence: 0,
      message: "Modo offline: Modelo de IA local não encontrado. Conecte-se à internet para análise precisa."
    };
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

    // 4. Formatação do Resultado
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
    return {
      pestFound: false,
      confidence: 0,
      message: "Erro ao processar imagem offline. Tente novamente."
    };
  }
};

// Função auxiliar para obter variáveis de ambiente de forma segura
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return '';
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
  const apiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ""
  ).trim();
  
  if (!apiKey || apiKey.length < 5) {
    throw new Error(`Configuração de API pendente.`);
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: {
          parts: [
            { text: "Você é um entomologista sênior. Analise a imagem e identifique a praga ou vestígio. Retorne estritamente um objeto JSON válido seguindo o schema fornecido. Não inclua explicações fora do JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64 } }
          ]
        },
        config: { 
          responseMimeType: "application/json", 
          responseSchema: PEST_SCHEMA as any,
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("A IA retornou uma resposta vazia.");
      
      // Extração robusta de JSON (Senior Pattern)
      let cleanJson = text.trim();
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
      
      try {
        const parsed = JSON.parse(cleanJson);
        // Validação mínima
        if (typeof parsed.pestFound === 'undefined') throw new Error("JSON incompleto");
        return parsed;
      } catch (parseError: any) {
        console.error("Falha crítica no parse:", cleanJson);
        throw new Error(`Erro de Processamento: A IA enviou dados malformados. Tente novamente.`);
      }
    } catch (err: any) {
      console.error("Erro Gemini Sênior:", err);
      throw new Error(err.message || "Falha na comunicação com a IA.");
    }
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
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
