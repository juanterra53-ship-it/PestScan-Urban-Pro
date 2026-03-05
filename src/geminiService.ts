import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "./types";
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';

// Avisa o TypeScript que o 'tf' e 'tflite' vêm do script no index.html
declare const tf: any;
declare const tflite: any;

const normalizeString = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

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
let modelStatus = "Inativo";

export const getModelStatus = () => modelStatus;
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
  if (typeof tf === 'undefined' || typeof tflite === 'undefined') {
    modelStatus = "Erro: Bibliotecas não carregadas";
    console.warn("TensorFlow.js não carregado. Verifique a conexão.");
    return;
  }
  if (localModel || isModelLoading) return;
  isModelLoading = true;
  modelStatus = "Carregando...";
  
  try {
    console.log("Iniciando carregamento do modelo local...");
    await tf.ready();
    
    const tfliteModelUrl = '/model/modelo_barata.tflite';
    const tfjsModelUrl = '/model/model.json';
    
    // Tenta carregar o TFLite primeiro
    try {
      modelStatus = "Carregando TFLite...";
      console.log(`📡 Tentando carregar TFLite: ${tfliteModelUrl}`);
      
      if (tflite.setWasmPath) {
        const wasmPath = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/';
        console.log(`🔗 Configurando WASM Path: ${wasmPath}`);
        tflite.setWasmPath(wasmPath);
      }

      // Adiciona um timeout real para o carregamento do modelo
      const loadPromise = tflite.loadTFLiteModel(tfliteModelUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout ao baixar modelo")), 15000)
      );

      localModel = await Promise.race([loadPromise, timeoutPromise]);
      console.log("✅ Modelo TFLite carregado com sucesso!");
      modelStatus = "Ativo (TFLite)";
      return;
    } catch (e: any) {
      console.warn("ℹ️ Falha ao carregar .tflite:", e.message);
      modelStatus = `Erro TFLite: ${e.message.substring(0, 20)}...`;
    }

    // Fallback para o TF.js GraphModel
    try {
      modelStatus = "Tentando Fallback TFJS...";
      console.log(`📡 Tentando fallback para TF.js: ${tfjsModelUrl}`);
      localModel = await tf.loadGraphModel(tfjsModelUrl);
      console.log("✅ Modelo TF.js carregado com sucesso!");
      modelStatus = "Ativo (TFJS)";
    } catch (e: any) {
      console.error("❌ Erro crítico: Nenhum modelo local pôde ser carregado offline.", e.message);
      modelStatus = "Erro: Falha Total";
    }

  } catch (error: any) {
    const msg = error.message || "";
    console.warn("Aviso: Não foi possível inicializar o modelo offline:", msg);
    console.error("Erro detalhado:", error);
    modelStatus = "Erro de Inicialização";
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (typeof tf === 'undefined') {
    return {
      pestFound: false,
      confidence: 0,
      message: "Modo offline: TensorFlow.js não carregado. Conecte-se à internet para análise."
    };
  }
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
    console.log("Scores Offline:", scoresArray);
    
    let maxScoreIndex = 0;
    let maxScore = 0;
    let predictedLabel = "Nenhuma Praga";

    if (scoresArray.length > 0) {
      maxScore = Math.max(...scoresArray);
      maxScoreIndex = scoresArray.indexOf(maxScore);
      
      // Garante que o index existe no MODEL_LABELS
      if (maxScoreIndex < MODEL_LABELS.length) {
        predictedLabel = MODEL_LABELS[maxScoreIndex].trim();
      } else {
        console.warn(`Index ${maxScoreIndex} fora do limite de MODEL_LABELS (${MODEL_LABELS.length})`);
        predictedLabel = "Praga Desconhecida";
      }
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

    // Busca dados completos na enciclopédia local
    const searchName = normalizeString(predictedLabel);
    console.log(`🔍 Buscando dados locais para: "${predictedLabel}" (Normalizado: "${searchName}")`);
    
    const localPest = ENCYCLOPEDIA_DATA.find(p => {
      const pName = normalizeString(p.name);
      const pSci = normalizeString(p.details.scientificName);
      return pName === searchName || pName.includes(searchName) || searchName.includes(pName) || pSci.includes(searchName);
    });

    if (localPest) {
      console.log(`✅ Dados encontrados para: ${localPest.name}`);
      return {
        pestFound: true,
        confidence: maxScore,
        pest: { 
          ...localPest.details,
          scientificName: `${localPest.details.scientificName} (Offline)`
        },
        message: "Analisado offline com dados da enciclopédia local."
      };
    }

    console.warn(`❌ Nenhum dado local encontrado para: ${predictedLabel}`);

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
  // Prepara o elemento para análise (seja online ou offline)
  let elementToUse = imageElement;
  
  // Se não temos o elemento, criamos um a partir do base64
  if (!elementToUse) {
    try {
      elementToUse = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64}`;
      });
    } catch (e) {
      console.error("Erro ao converter base64 para imagem:", e);
    }
  }

  // Verificação Híbrida: Online vs Offline
  if (!navigator.onLine) {
    console.log("Dispositivo offline. Tentando análise local...");
    if (!elementToUse) {
      return {
        pestFound: false,
        confidence: 0,
        message: "Erro ao processar imagem para análise offline."
      };
    }
    return await analyzeOffline(elementToUse);
  }

  // Lógica Online (Gemini API)
  const apiKey = (
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    ""
  ).trim();
  
  if (!apiKey || apiKey.length < 5) {
    // Se não tem API Key, tenta offline direto
    if (!elementToUse) {
      return {
        pestFound: false,
        confidence: 0,
        message: "Erro ao processar imagem para análise offline (API Key ausente)."
      };
    }
    return await analyzeOffline(elementToUse);
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    return await fetchWithRetry(async () => {
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
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("A IA enviou dados em formato inválido.");
      
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.pest) {
          parsed.pest.controlMethods = parsed.pest.controlMethods || [];
          parsed.pest.physicalMeasures = parsed.pest.physicalMeasures || [];
          parsed.pest.chemicalMeasures = parsed.pest.chemicalMeasures || [];
          parsed.pest.characteristics = parsed.pest.characteristics || [];
        }
        return parsed;
      } catch (e) {
        const cleaned = jsonMatch[0].replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleaned);
      }
    });
  } catch (err: any) {
    // Se falhar online (ex: sem internet real mas onLine=true), tenta offline
    console.warn("Falha online, tentando offline...", err.message);
    if (err.message?.includes("fetch") || !navigator.onLine) {
       if (!elementToUse) throw err; // Se nem temos a imagem, repassa o erro original
       return await analyzeOffline(elementToUse);
    }
    throw err;
  }
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
