import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { RecognitionResult } from "./types";
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';

/**
 * PESTSCAN PRO - SERVICE LAYER v2.7.1
 * Otimizado para máxima resiliência, diagnóstico de cota e velocidade
 */

declare const tf: any;
declare const tflite: any;

const normalizeString = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

if (typeof tflite !== 'undefined' && tflite.setWasmPath) {
  tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
}

const getApiKey = (): string => {
  try {
    // @ts-ignore
    const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
    // @ts-ignore
    const processKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '';
    
    const key = (
      viteKey || 
      processKey ||
      (window as any).VITE_GEMINI_API_KEY ||
      (window as any).GEMINI_API_KEY ||
      ""
    ).trim();
    
    return key;
  } catch (e) {
    return "";
  }
};

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
        source: { type: Type.STRING },
      },
      required: ["name", "scientificName", "category", "riskLevel"]
    }
  },
  required: ["pestFound", "confidence"]
};

const resizeImage = async (base64: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Timeout wrapper para chamadas de API
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_EXCEEDED")), timeoutMs))
  ]);
}

async function fetchWithRetry<T>(fn: (attempt: number) => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      // Timeout de 25 segundos por tentativa
      return await withTimeout(fn(i), 25000);
    } catch (error: any) {
      const msg = error.message || "";
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServiceError = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.toLowerCase().includes("high demand");
      const isTimeout = msg === "TIMEOUT_EXCEEDED";
      
      if ((isRateLimit || isServiceError || isTimeout) && i < retries - 1) {
        // Reduzido o tempo de espera para melhorar a percepção de velocidade
        const baseWait = isRateLimit ? 3000 : 1000;
        const waitTime = Math.pow(1.5, i) * 1000 + baseWait + (Math.random() * 500);
        
        console.warn(`[v2.7.1 Retry] Tentativa ${i + 1} falhou. Aguardando ${Math.round(waitTime)}ms...`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Falha após múltiplas tentativas de conexão.");
}

let localModel: any = null;
let isModelLoading = false;
let modelStatus = "Inativo";

export const getModelStatus = () => modelStatus;
export const isLocalModelLoaded = () => !!localModel;

// Lista exata baseada no treinamento do Google Colab (Ordem Alfabética do TensorFlow)
// Importante: Manter os erros de digitação do treino para o mapeamento de índices funcionar
export const MODEL_LABELS = [
  'Aranha Marron',                // Índice 0
  'Aranha armadeira',             // Índice 1
  'Barata Oriental',              // Índice 2
  'Barata Periplaneta Americana', // Índice 3
  'Barata germanica',             // Índice 4
  'Besouro vermelho da farinha',  // Índice 5
  'Broca do Trigo',               // Índice 6
  'Escorpião Amarelo',            // Índice 7
  'Escorpião Amarelo do Nordeste',// Índice 8
  'Escorpíão Marrom',             // Índice 9
  'Formiga Carpinteira',          // Índice 10
  'Formiga Fantasma',             // Índice 11
  'Formiga lava pés',             // Índice 12
  'Gorgulho do Arroz',            // Índice 13
  'Mosca Domestica',              // Índice 14
  'Mosca Varejeira',              // Índice 15
  'Mosca de Banheiro',            // Índice 16
  'Ratazana',                     // Índice 17
  'Rato Camundongo',              // Índice 18
  'Rato Preto'                    // Índice 19
];

// Mapeamento para nomes bonitos na interface (Corrige os erros de digitação do treino)
const LABEL_MAP: Record<string, string> = {
  'Aranha Marron': 'Aranha Marrom',
  'Aranha armadeira': 'Aranha Armadeira',
  'Barata germanica': 'Barata Germânica',
  'Escorpíão Marrom': 'Escorpião Marrom',
  'Formiga lava pés': 'Formiga Lava-pés',
  'Mosca Domestica': 'Mosca Doméstica'
};

const getCleanName = (label: string) => LABEL_MAP[label] || label;

export const loadLocalModel = async () => {
  if (typeof tf === 'undefined' || typeof tflite === 'undefined') {
    modelStatus = "Erro: Bibliotecas não carregadas";
    return;
  }
  if (localModel || isModelLoading) return;
  isModelLoading = true;
  modelStatus = "Carregando...";
  
  try {
    await tf.ready();
    // Priorizamos o modelo universal de 20 pragas que o usuário está treinando
    // Adicionamos um timestamp para evitar cache de versões antigas do arquivo
    const version = Date.now();
    const universalModelUrl = `/model/modelo_universal.tflite?v=${version}`;
    const fallbackModelUrl = `/model/modelo_barata.tflite?v=${version}`;
    
    try {
      if (tflite.setWasmPath) {
        tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/');
      }
      
      console.log(`📡 Tentando carregar Modelo Universal de: ${universalModelUrl}`);
      let loadPromise = tflite.loadTFLiteModel(universalModelUrl);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
      
      try {
        localModel = await Promise.race([loadPromise, timeoutPromise]);
        modelStatus = "Ativo (Universal)";
        console.log("✅ Modelo Universal carregado!");
        return;
      } catch (e) {
        console.warn("⚠️ Modelo Universal não encontrado, tentando fallback...");
        loadPromise = tflite.loadTFLiteModel(fallbackModelUrl);
        localModel = await Promise.race([loadPromise, timeoutPromise]);
        modelStatus = "Ativo (Local)";
      }
      return;
    } catch (e) {
      console.warn("TFLite Load Error:", e);
    }

    try {
      localModel = await tf.loadGraphModel('/model/model.json');
      modelStatus = "Ativo (TFJS)";
    } catch (e) {
      modelStatus = "Erro: Sem Modelo";
    }
  } catch (error) {
    modelStatus = "Erro de Inicialização";
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (typeof tf === 'undefined' || !localModel) {
    return { pestFound: false, confidence: 0, message: "Modo offline indisponível." };
  }

  try {
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();
    });

    let predictions = localModel.predict ? localModel.predict(tensor) : localModel.execute(tensor);
    let outputTensor = predictions;
    if (predictions && typeof predictions === 'object' && !predictions.data) {
      outputTensor = predictions[Object.keys(predictions)[0]];
    }

    const scores = await outputTensor.data();
    const scoresArray = Array.from(scores) as number[];
    console.log(`📊 TFLite Output Length: ${scoresArray.length}`);
    
    // Se o tamanho não bater, tentamos mapear o que for possível ou avisamos
    let labelsToUse = MODEL_LABELS;
    if (scoresArray.length !== MODEL_LABELS.length) {
      console.warn(`⚠️ Tamanho do output (${scoresArray.length}) diferente do esperado (${MODEL_LABELS.length})`);
      
      if (scoresArray.length === 21) {
        // Provável classe 'background' no índice 0
        labelsToUse = ['Background', ...MODEL_LABELS];
      } else if (scoresArray.length > 0) {
        // Fallback: tenta usar os nomes disponíveis ou gera genéricos
        labelsToUse = Array.from({ length: scoresArray.length }, (_, i) => MODEL_LABELS[i] || `Classe ${i}`);
      }
    }

    const maxScore = Math.max(...scoresArray);
    const maxScoreIndex = scoresArray.indexOf(maxScore);

    tensor.dispose();
    if (outputTensor?.dispose) outputTensor.dispose();

    if (maxScore < 0.25) {
      return { pestFound: false, confidence: maxScore, message: "Confiança insuficiente.", source: 'IA Local' };
    }

    const predictedLabel = labelsToUse[maxScoreIndex] || "Praga Detectada";
    if (predictedLabel === 'Background') {
      return { pestFound: false, confidence: maxScore, message: "Nenhuma praga identificada com clareza.", source: 'IA Local' };
    }

    const cleanName = getCleanName(predictedLabel);
    const searchName = normalizeString(cleanName);
    const localPest = ENCYCLOPEDIA_DATA.find(p => normalizeString(p.name).includes(searchName));

    if (localPest) {
      return {
        pestFound: true,
        confidence: maxScore,
        pest: { ...localPest.details, name: cleanName, source: "IA Local" },
        message: "Identificado via motor local.",
        source: 'IA Local'
      };
    }

    return {
      pestFound: true,
      confidence: maxScore,
      pest: {
        name: cleanName,
        scientificName: "Análise Local",
        category: "Praga Urbana",
        riskLevel: "Moderado",
        characteristics: ["Detectado localmente"],
        anatomy: "Conecte-se para mais detalhes.",
        members: "N/A",
        habits: "N/A",
        reproduction: "N/A",
        larvalPhase: "N/A",
        controlMethods: ["Consulte um profissional"],
        physicalMeasures: ["Limpeza do local"],
        chemicalMeasures: ["Uso de inseticidas"],
        healthRisks: "Variável",
        source: "IA Local (Genérico)"
      },
      message: "Praga reconhecida, mas sem ficha técnica local completa.",
      source: 'IA Local'
    };
  } catch (error) {
    return { pestFound: false, confidence: 0, message: "Erro offline." };
  }
};

export const analyzePestImage = async (base64Raw: string, imageElement?: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  const base64 = await resizeImage(base64Raw, 512);
  let elementToUse = imageElement;
  
  if (!elementToUse) {
    try {
      elementToUse = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64}`;
      });
    } catch (e) {}
  }

  if (navigator.onLine) {
    const apiKey = getApiKey();
    if (!apiKey || apiKey.length < 10) {
      return { pestFound: false, confidence: 0, message: "Erro: API Key ausente no ambiente." };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      // gemini-3.1-flash-lite-preview costuma ter limites mais generosos e maior estabilidade
      const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview', 'gemini-flash-latest'];

      return await fetchWithRetry<RecognitionResult>(async (attempt) => {
        const currentModel = MODELS[attempt % MODELS.length];
        console.log(`🚀 [v2.7.2] Analisando com ${currentModel}...`);
        
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: {
            parts: [
              { text: "Identifique a praga urbana nesta imagem. Forneça uma ficha técnica biológica completa (nome, científico, hábitos, controle, riscos). Retorne um JSON estrito seguindo o esquema." },
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
        if (!text) throw new Error("Resposta vazia da IA.");
        const parsed = JSON.parse(text);
        if (parsed.pest) parsed.pest.source = `IA Online (${currentModel})`;
        return {
          ...parsed,
          source: 'IA Online (Gemini)'
        };
      }, 3);
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      console.error("Erro Gemini:", errorMsg);
      
      let friendlyMsg = `[v2.7.2] Erro: ${errorMsg.substring(0, 50)}`;
      
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        friendlyMsg = "[v2.7.2] Limite de cota do Google atingido. A IA gratuita tem limites rígidos por minuto. Tente novamente em 60 segundos ou use o modo Offline.";
      } else if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
        friendlyMsg = "[v2.7.2] O servidor do Google está instável. Tente o modo Offline.";
      } else if (errorMsg === "TIMEOUT_EXCEEDED") {
        friendlyMsg = "[v2.7.2] Tempo de resposta excedido. Verifique sua conexão ou use o modo Offline.";
      }
      
      return { pestFound: false, confidence: 0, message: friendlyMsg };
    }
  }

  if (elementToUse) return await analyzeOffline(elementToUse);
  return { pestFound: false, confidence: 0, message: "Sem conexão com a internet." };
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key ausente.");
  const ai = new GoogleGenAI({ apiKey });
  
  // Lista de modelos para fallback
  const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview'];

  const trySearch = async (model: string, useSearch: boolean): Promise<RecognitionResult> => {
    const config: any = { 
      responseMimeType: "application/json", 
      responseSchema: PEST_SCHEMA as any,
      temperature: 0.1
    };
    
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: model, 
      contents: `Forneça uma ficha técnica biológica completa da praga urbana: "${pestName}". ${useSearch ? 'Use o Google Search para dados reais.' : 'Use seu conhecimento interno.'} Retorne JSON.`,
      config: config
    });
    
    const text = response.text;
    if (!text) throw new Error("Resposta vazia.");
    const parsed = JSON.parse(text);
    if (parsed.pest) parsed.pest.source = useSearch ? "Google Search" : "Conhecimento IA";
    return parsed;
  };

  try {
    // Tentativa 1: Com busca (mais lenta, mais precisa, gasta mais cota)
    console.log("🔍 [v2.7.2] Buscando com Google Search...");
    return await fetchWithRetry<RecognitionResult>(() => trySearch(MODELS[0], true), 1);
  } catch (err: any) {
    console.warn("⚠️ [v2.7.2] Busca com Google Search falhou ou atingiu cota. Tentando IA pura...");
    try {
      // Tentativa 2: Sem busca (mais rápida, evita erro 429 de busca)
      return await fetchWithRetry<RecognitionResult>(() => trySearch(MODELS[0], false), 2);
    } catch (err2: any) {
      return { pestFound: false, confidence: 0, message: `[v2.7.2] Erro de Cota: ${err2.message}` };
    }
  }
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = getApiKey();
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
    return (response as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    return null;
  }
};
