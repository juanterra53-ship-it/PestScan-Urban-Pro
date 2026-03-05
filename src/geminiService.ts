import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "./types";

// Avisa o TypeScript que o 'tf' e 'tflite' vêm do script no index.html
declare const tf: any;
declare const tflite: any;

// Configura o caminho para os arquivos WebAssembly do TFLite (necessário para .tflite)
if (typeof tflite !== 'undefined' && tflite.setWasmPath) {
  tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
}

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

const fetchWithRetry = async (fn: () => Promise<any>, retries = 5): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = error.message || "";
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServiceError = msg.includes("503") || msg.includes("UNAVAILABLE");
      
      if ((isRateLimit || isServiceError) && i < retries - 1) {
        let waitTime = isRateLimit ? 5000 * (i + 1) : 2000 * (i + 1);
        
        // Tenta extrair o tempo de espera sugerido pelo Gemini (ex: "Please retry in 42.089s")
        const retryMatch = msg.match(/retry in ([\d.]+)s/);
        if (retryMatch && retryMatch[1]) {
          waitTime = (parseFloat(retryMatch[1]) + 1) * 1000; // Adiciona 1s de margem
        }

        console.warn(`IA Ocupada. Tentativa ${i + 1} de ${retries}. Aguardando ${Math.round(waitTime/1000)}s...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
};

let localModel: any = null;
let isModelLoading = false;

export const isLocalModelLoaded = () => !!localModel;

// Labels correspondentes ao seu modelo treinado. 
// IMPORTANTE: Ajuste esta lista para que os nomes sejam EXATAMENTE iguais aos da ENCYCLOPEDIA_DATA no index.tsx
const MODEL_LABELS = [
  "Barata-alemã",
  "Escorpião-amarelo",
  "Aranha-marrom",
  "Formiga-lava-pés",
  "Gorgulho-do-arroz",
  "Nenhuma Praga"
];

export const loadLocalModel = async () => {
  if (localModel || isModelLoading) return;
  isModelLoading = true;
  try {
    console.log("Iniciando carregamento do modelo local (Caminho 1)...");
    
    // Aguarda o TensorFlow.js inicializar completamente
    await tf.ready();
    
    // Tenta carregar o modelo. 
    // Prioridade 1: model.json (formato TF.js nativo - mais estável)
    // Prioridade 2: modelo_barata.tflite (formato TFLite direto)
    
    const tfjsModelUrl = '/model/model.json';
    const tfliteModelUrl = '/model/modelo_barata.tflite';
    
    try {
      // Verifica se o model.json existe
      const checkTfjs = await fetch(tfjsModelUrl, { method: 'HEAD' });
      if (checkTfjs.ok) {
        console.log("📡 Detectado model.json. Carregando via tf.loadGraphModel...");
        localModel = await tf.loadGraphModel(tfjsModelUrl);
        console.log("✅ Modelo TF.js carregado com sucesso!");
        isModelLoading = false;
        return;
      }
    } catch (e) {
      console.log("ℹ️ model.json não encontrado, tentando .tflite...");
    }

    // Fallback para o .tflite
    try {
      const checkTflite = await fetch(tfliteModelUrl, { method: 'HEAD' });
      if (checkTflite.ok) {
        console.log(`📡 Detectado .tflite em ${tfliteModelUrl}. Carregando...`);
        localModel = await tflite.loadTFLiteModel(tfliteModelUrl);
        console.log("✅ Modelo TFLite carregado com sucesso!");
      } else {
        console.warn("⚠️ Nenhum modelo encontrado. Por favor, coloque o arquivo 'modelo_barata.tflite' na pasta /public/model/");
      }
    } catch (e) {
      console.warn("❌ Erro ao carregar arquivo .tflite:", e);
    }

  } catch (error: any) {
    const msg = error.message || "";
    console.warn("Aviso: Não foi possível inicializar o modelo offline:", msg);
    console.error("Erro detalhado:", error);
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (!localModel) {
    console.warn("Modelo offline não carregado.");
    return {
      pestFound: false,
      confidence: 0,
      message: "Modo offline: Modelo de IA local não encontrado. Conecte-se à internet para análise."
    };
  }

  try {
    // Pré-processamento da imagem
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();
    });

    // Inferência (detecta se é GraphModel ou TFLiteModel automaticamente)
    let predictions: any;
    if (localModel.predict) {
      predictions = await localModel.predict(tensor);
    } else if (localModel.execute) {
      predictions = await localModel.execute(tensor);
    }

    const scores = await predictions.data();
    const scoresArray = Array.from(scores) as number[];
    
    let maxScoreIndex = 0;
    let maxScore = 0;
    let predictedLabel = "Nenhuma Praga";

    if (scoresArray.length === 1) {
      maxScore = scoresArray[0];
      if (maxScore > 0.5) {
        maxScoreIndex = 0;
        predictedLabel = MODEL_LABELS[0];
      }
    } else {
      maxScoreIndex = scoresArray.indexOf(Math.max(...scoresArray));
      maxScore = scoresArray[maxScoreIndex];
      predictedLabel = MODEL_LABELS[maxScoreIndex];
    }

    // Limpeza de memória
    tensor.dispose();
    if (predictions.dispose) predictions.dispose();

    if (predictedLabel === "Nenhuma Praga" || maxScore < 0.4) {
      return {
        pestFound: false,
        confidence: maxScore,
        message: "Nenhuma praga identificada com confiança suficiente offline."
      };
    }

    return {
      pestFound: true,
      confidence: maxScore,
      pest: {
        name: predictedLabel,
        scientificName: "Identificado Offline",
        category: "PestScan Offline",
        riskLevel: "Moderado",
        characteristics: ["Detectado via IA local"],
        anatomy: "Conecte-se à internet para ficha técnica completa.",
        members: "N/A",
        habits: "N/A",
        reproduction: "N/A",
        larvalPhase: "N/A",
        controlMethods: ["Consulte um especialista ou conecte-se à internet."],
        physicalMeasures: [],
        chemicalMeasures: [],
        healthRisks: "N/A"
      },
      message: "Analisado offline. Dados técnicos limitados."
    };

  } catch (error) {
    console.error("Erro na inferência offline:", error);
    return {
      pestFound: false,
      confidence: 0,
      message: "Erro no processamento offline."
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
    
    let elementToUse = imageElement;
    
    // Se não temos o elemento, criamos um a partir do base64
    if (!elementToUse) {
      elementToUse = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64}`;
      });
    }

    return await analyzeOffline(elementToUse!);
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
            { text: "Analise esta imagem e identifique a praga urbana. Forneça uma ficha técnica biológica completa. IMPORTANTE: Preencha TODOS os campos do JSON, especialmente 'members', 'reproduction', 'habits', 'controlMethods', 'physicalMeasures' e 'chemicalMeasures'. Nas medidas químicas, inclua dosagens por 10L de água. Se não encontrar praga, defina 'pestFound' como false." },
            { inlineData: { mimeType: "image/jpeg", data: base64 } }
          ]
        },
        config: { 
          responseMimeType: "application/json", 
          responseSchema: PEST_SCHEMA as any,
          temperature: 0.1
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("A IA não respondeu.");
      
      // Extração ultra-robusta via Regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("A IA enviou dados em formato inválido.");
      
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        // Garante que campos de array existam para evitar erros no .map()
        if (parsed.pest) {
          parsed.pest.controlMethods = parsed.pest.controlMethods || [];
          parsed.pest.physicalMeasures = parsed.pest.physicalMeasures || [];
          parsed.pest.chemicalMeasures = parsed.pest.chemicalMeasures || [];
          parsed.pest.characteristics = parsed.pest.characteristics || [];
        }
        return parsed;
      } catch (e) {
        // Tenta limpar possíveis vírgulas extras ou caracteres invisíveis
        const cleaned = jsonMatch[0].replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleaned);
      }
    } catch (err: any) {
      console.error("Erro Gemini Sênior:", err);
      throw new Error(err.message || "Falha na comunicação com a IA.");
    }
  });
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ""
  ).trim();
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `Forneça uma ficha técnica biológica completa da praga urbana chamada: "${pestName}". Preencha TODOS os campos do JSON: nome científico, hábitos, reprodução, membros, métodos de controle físico e químico. IMPORTANTE: Na seção 'chemicalMeasures', forneça o nome do princípio ativo ou produto seguido da dosagem exata por 10 litros de água (ex: 'Bifentrina: 30ml/10L água (Aplicação perimetral)'). Retorne em JSON puro.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: PEST_SCHEMA as any,
        temperature: 0.1
      }
    });
    const text = response.text;
    if (!text) throw new Error("A IA não respondeu.");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Dados inválidos.");
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.pest) {
      parsed.pest.controlMethods = parsed.pest.controlMethods || [];
      parsed.pest.physicalMeasures = parsed.pest.physicalMeasures || [];
      parsed.pest.chemicalMeasures = parsed.pest.chemicalMeasures || [];
    }
    return parsed;
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
