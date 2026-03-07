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
        source: { type: Type.STRING, description: "Fonte da informação (ex: 'Pesquisa Google' ou 'Banco de Dados Local')" },
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
// Labels correspondentes ao seu modelo treinado. 
// IMPORTANTE: O modelo 'modelo_barata.tflite' parece ser focado em baratas ou ter uma ordem específica.
// Se o modelo sempre retorna o primeiro índice, precisamos de uma validação mais rigorosa.
const MODEL_LABELS = [
  "Barata-alemã",
  "Barata-americana",
  "Aranha-marrom",
  "Escorpião-amarelo",
  "Cupim-subterrâneo",
  "Formiga-lava-pés",
  "Gorgulho-do-arroz",
  "Mosca-doméstica",
  "Mosquito",
  "Rato",
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
    
    // Tentamos carregar o modelo TFLite que o usuário mencionou
    const tfliteModelUrl = '/model/modelo_barata.tflite';
    
    try {
      modelStatus = "Carregando TFLite...";
      console.log(`📡 Tentando carregar TFLite: ${tfliteModelUrl}`);
      
      if (tflite.setWasmPath) {
        const wasmPath = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/';
        tflite.setWasmPath(wasmPath);
      }

      // Timeout de 20s para o modelo
      const loadPromise = tflite.loadTFLiteModel(tfliteModelUrl);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout ao baixar modelo")), 20000)
      );

      localModel = await Promise.race([loadPromise, timeoutPromise]);
      console.log("✅ Modelo TFLite carregado com sucesso!");
      modelStatus = "Ativo (TFLite)";
      return;
    } catch (e: any) {
      console.warn("ℹ️ Falha ao carregar .tflite:", e.message);
      modelStatus = `Erro TFLite: ${e.message.substring(0, 20)}...`;
    }

    // Fallback para o TF.js GraphModel se existir
    try {
      const tfjsModelUrl = '/model/model.json';
      modelStatus = "Tentando Fallback TFJS...";
      localModel = await tf.loadGraphModel(tfjsModelUrl);
      console.log("✅ Modelo TF.js carregado com sucesso!");
      modelStatus = "Ativo (TFJS)";
    } catch (e: any) {
      console.error("❌ Erro crítico: Nenhum modelo local pôde ser carregado.", e.message);
      modelStatus = "Erro: Sem Modelo";
    }

  } catch (error: any) {
    console.error("Erro na inicialização do modelo:", error);
    modelStatus = "Erro de Inicialização";
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  if (typeof tf === 'undefined') {
    return { pestFound: false, confidence: 0, message: "Modo offline: Bibliotecas não carregadas." };
  }
  if (!localModel) {
    return { pestFound: false, confidence: 0, message: "Modo offline: Modelo não carregado." };
  }

  try {
    const tensor = tf.tidy(() => {
      return tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255.0))
        .expandDims();
    });

    let predictions: any;
    if (localModel.predict) {
      predictions = localModel.predict(tensor);
    } else if (localModel.execute) {
      predictions = localModel.execute(tensor);
    }

    // Se predictions for um objeto (comum em TFLite), pegamos o primeiro valor
    let outputTensor = predictions;
    if (predictions && typeof predictions === 'object' && !predictions.data) {
      const keys = Object.keys(predictions);
      outputTensor = predictions[keys[0]];
    }

    const scores = await outputTensor.data();
    const scoresArray = Array.from(scores) as number[];
    console.log("Scores Offline:", scoresArray);
    
    let maxScoreIndex = -1;
    let maxScore = 0;

    if (scoresArray.length > 0) {
      maxScore = Math.max(...scoresArray);
      maxScoreIndex = scoresArray.indexOf(maxScore);
    }

    // Limpeza
    tensor.dispose();
    if (outputTensor && outputTensor.dispose) outputTensor.dispose();
    if (predictions && predictions !== outputTensor && predictions.dispose) predictions.dispose();

    // Validação de confiança: se o score for muito baixo ou se todos forem iguais (erro de modelo)
    const allSame = scoresArray.every(s => s === scoresArray[0]);
    if (maxScoreIndex === -1 || maxScore < 0.40 || allSame) {
      return {
        pestFound: false,
        confidence: maxScore,
        message: "A IA local não conseguiu identificar com clareza. Tente uma foto melhor ou use a versão online."
      };
    }

    const predictedLabel = MODEL_LABELS[maxScoreIndex] || "Praga Desconhecida";
    if (predictedLabel === "Nenhuma Praga") {
      return { pestFound: false, confidence: maxScore, message: "Nenhuma praga detectada pela IA local." };
    }

    const searchName = normalizeString(predictedLabel);
    const localPest = ENCYCLOPEDIA_DATA.find(p => {
      const pName = normalizeString(p.name);
      return pName === searchName || pName.includes(searchName) || searchName.includes(pName);
    });

    if (localPest) {
      return {
        pestFound: true,
        confidence: maxScore,
        pest: { 
          ...localPest.details,
          scientificName: `${localPest.details.scientificName} (Offline)`,
          source: "Banco de Dados Local"
        },
        message: "Identificado offline via IA local."
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
        anatomy: "Dados limitados no modo offline.",
        members: "N/A",
        habits: "N/A",
        reproduction: "N/A",
        larvalPhase: "N/A",
        controlMethods: ["Consulte a enciclopédia online para detalhes."],
        physicalMeasures: [],
        chemicalMeasures: [],
        healthRisks: "N/A"
      },
      message: "Identificado offline. Conecte-se para ficha completa."
    };

  } catch (error) {
    console.error("Erro na inferência offline:", error);
    return { pestFound: false, confidence: 0, message: "Erro no processamento offline." };
  }
};

// Função auxiliar para obter variáveis de ambiente de forma segura
export const analyzePestImage = async (base64: string, imageElement?: HTMLImageElement | HTMLCanvasElement): Promise<RecognitionResult> => {
  let elementToUse = imageElement;
  
  if (!elementToUse) {
    try {
      elementToUse = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64}`;
      });
    } catch (e) {
      console.error("Erro ao preparar imagem:", e);
    }
  }

  // Prioridade Online: Se houver internet, tentamos SEMPRE o Gemini primeiro
  if (navigator.onLine) {
    // Tenta obter a chave de múltiplas fontes (Vite, Process, ou Injeção Direta)
    const apiKey = (
      import.meta.env.VITE_GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      (window as any).GEMINI_API_KEY ||
      ""
    ).trim();
    
    console.log("DEBUG IA: Verificando disponibilidade de chave online...");
    console.log("DEBUG IA: Chave detectada?", apiKey ? `Sim (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})` : "Não");

    if (apiKey && apiKey.length > 10) {
      try {
        console.log("DEBUG IA: Iniciando análise ONLINE com Gemini 3 Flash...");
        const ai = new GoogleGenAI({ apiKey });
        
        return await fetchWithRetry(async () => {
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Modelo mais estável e rápido para uso geral
            contents: {
              parts: [
                { text: "Identifique a praga urbana nesta imagem. Use obrigatoriamente a ferramenta Google Search para buscar informações biológicas ATUALIZADAS, hábitos, reprodução e métodos de controle detalhados (físicos e químicos com dosagens por 10L). Retorne um JSON estrito seguindo o esquema fornecido." },
                { inlineData: { mimeType: "image/jpeg", data: base64 } }
              ]
            },
            config: { 
              responseMimeType: "application/json", 
              responseSchema: PEST_SCHEMA as any,
              temperature: 0.1,
              tools: [{ googleSearch: {} }]
            }
          });

          const text = response.text;
          if (!text) throw new Error("Sem resposta da IA.");
          
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("Formato JSON inválido.");
          
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.pest) {
            parsed.pest.source = "IA Online (Gemini + Google Search)";
          }
          console.log("✅ Sucesso Online:", parsed.pest?.name);
          return parsed;
        }, 2); // 2 tentativas para evitar lentidão excessiva
      } catch (err: any) {
        console.warn("⚠️ Falha na análise online (pode ser cota ou chave):", err.message);
        // Se falhar o online, continua para o offline abaixo
      }
    } else {
      console.warn("⚠️ API Key não detectada. Certifique-se de configurá-la nas variáveis de ambiente.");
    }
  }

  // Fallback ou Modo Offline
  if (elementToUse) {
    console.log("ℹ️ Usando motor de IA local (Offline)...");
    return await analyzeOffline(elementToUse);
  }
  
  return { 
    pestFound: false, 
    confidence: 0, 
    message: "Não foi possível analisar a imagem. Verifique sua conexão ou configure a chave API." 
  };
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  return fetchWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview', 
      contents: `Forneça uma ficha técnica biológica completa da praga urbana chamada: "${pestName}". Use o Google Search para encontrar dados precisos sobre: nome científico, hábitos, reprodução, membros, métodos de controle físico e químico. IMPORTANTE: Na seção 'chemicalMeasures', forneça o nome do princípio ativo ou produto seguido da dosagem exata por 10 litros de água (ex: 'Bifentrina: 30ml/10L água'). Retorne em JSON puro.`,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: PEST_SCHEMA as any,
        temperature: 0.1,
        tools: [{ googleSearch: {} }]
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
      parsed.pest.source = "Pesquisa Google";
    }
    return parsed;
  });
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
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
