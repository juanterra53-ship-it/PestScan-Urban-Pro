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

const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = error.message || "";
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServiceError = msg.includes("503") || msg.includes("UNAVAILABLE");
      
      if (isRateLimit && i < retries - 1) {
        // Para 429, esperamos um pouco mais
        const waitTime = 15000; // 15 segundos é o padrão para o free tier do Gemini
        console.warn(`Limite de quota atingido. Tentativa ${i + 1} de ${retries}. Aguardando ${waitTime/1000}s...`);
        await delay(waitTime);
        continue;
      }

      if (isServiceError && i < retries - 1) {
        const waitTime = 2000 * (i + 1);
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
// Quando você tiver o modelo universal para todas as pragas, 
// basta atualizar esta lista na mesma ordem em que as classes foram treinadas.
export const MODEL_LABELS = [
  "Aranha-armadeira",
  "Aranha-marrom",
  "Barata-americana",
  "Barata-alemã",
  "Barata-oriental",
  "Cupim-de-madeira-seca",
  "Cupim-subterrâneo",
  "Escorpião-amarelo",
  "Escorpião-marrom",
  "Formiga-carpinteira",
  "Formiga-fantasma",
  "Formiga-lava-pés",
  "Mosca-doméstica",
  "Mosca-varejeira",
  "Aedes aegypti",
  "Culex quinquefasciatus",
  "Percevejo-de-cama",
  "Rato-de-telhado",
  "Ratazana",
  "Camundongo"
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
    
    console.log("--- DEBUG OFFLINE ---");
    console.log("Output Shape:", outputTensor.shape);
    console.log("Scores Length:", scoresArray.length);
    
    // Se o modelo tiver apenas 1 ou 2 saídas, é um modelo binário (ex: Barata vs Não Barata)
    const labelsToUse = scoresArray.length === MODEL_LABELS.length ? MODEL_LABELS : 
                       scoresArray.length === 1 ? ["Praga (Modelo Local)"] :
                       scoresArray.length === 2 ? ["Praga (Modelo Local)", "Nenhuma Praga"] :
                       Array.from({length: scoresArray.length}, (_, i) => `Classe ${i}`);

    let maxScoreIndex = 0;
    let maxScore = scoresArray[0] || 0;

    if (scoresArray.length > 1) {
      maxScore = Math.max(...scoresArray);
      maxScoreIndex = scoresArray.indexOf(maxScore);
    }

    // Log dos Top 3 resultados para debug no console
    const sortedIndices = [...scoresArray.keys()].sort((a, b) => scoresArray[b] - scoresArray[a]).slice(0, 3);
    sortedIndices.forEach(idx => {
      console.log(`${labelsToUse[idx] || `Classe ${idx}`}: ${(scoresArray[idx] * 100).toFixed(2)}%`);
    });

    // Limpeza de memória
    tensor.dispose();
    if (outputTensor && outputTensor.dispose) outputTensor.dispose();
    if (predictions && predictions !== outputTensor && predictions.dispose) predictions.dispose();

    // Validação de confiança mais permissiva para modelos locais (30%)
    // Removida a trava 'allSame' pois modelos binários ou de classe única sempre retornam true para isso
    if (maxScoreIndex === -1 || maxScore < 0.30) {
      return {
        pestFound: false,
        confidence: maxScore,
        message: "Confiança insuficiente na IA local. Tente aproximar mais a câmera."
      };
    }

    let predictedLabel = labelsToUse[maxScoreIndex] || "Praga Detectada";
    
    // Se o modelo detectar "Nenhuma Praga", respeitamos
    if (predictedLabel.toLowerCase().includes("nenhuma") || predictedLabel.toLowerCase().includes("none")) {
       if (maxScore > 0.70) { // Só descarta se tiver muita certeza que não é nada
         return { 
           pestFound: false, 
           confidence: maxScore, 
           message: "Nenhuma praga detectada (IA Local)." 
         };
       } else {
         // Se a certeza for baixa, pegamos a segunda melhor opção se existir
         const secondBestIdx = sortedIndices[1];
         if (secondBestIdx !== undefined && scoresArray[secondBestIdx] > 0.20) {
            maxScoreIndex = secondBestIdx;
            maxScore = scoresArray[secondBestIdx];
            predictedLabel = labelsToUse[maxScoreIndex];
         }
       }
    }

    // Tenta encontrar na enciclopédia local (Busca mais agressiva)
    const searchName = normalizeString(predictedLabel);
    
    let localPest = ENCYCLOPEDIA_DATA.find(p => {
      const pName = normalizeString(p.name);
      const pSci = normalizeString(p.details.scientificName || "");
      return pName === searchName || 
             pName.includes(searchName) || 
             searchName.includes(pName) ||
             pSci.includes(searchName);
    });

    if (localPest) {
      return {
        pestFound: true,
        confidence: maxScore,
        pest: { 
          ...localPest.details,
          scientificName: `${localPest.details.scientificName} (IA Local)`,
          source: "Identificação Offline"
        },
        message: "Identificado via motor local."
      };
    }

    // Se não achou na enciclopédia, retorna um objeto genérico mas com o nome da praga
    return {
      pestFound: true,
      confidence: maxScore,
      pest: {
        name: predictedLabel,
        scientificName: "Análise Local",
        category: "Praga Urbana",
        riskLevel: "Moderado",
        characteristics: ["Detectado pelo modelo TFLite"],
        anatomy: "Informações detalhadas requerem conexão online.",
        members: "N/A",
        habits: "Análise offline concluída.",
        reproduction: "N/A",
        larvalPhase: "N/A",
        controlMethods: ["Utilize métodos padrão de controle para esta espécie."],
        physicalMeasures: ["Mantenha o local limpo", "Vede frestas e buracos"],
        chemicalMeasures: ["Consulte um profissional para dosagens específicas"],
        healthRisks: "Pode representar riscos à saúde."
      },
      message: "Identificado via IA Local (Base Reduzida)."
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

  // 1. MODO ONLINE: Se houver internet, usamos APENAS o Gemini
  if (navigator.onLine) {
    console.log("🌐 MODO ONLINE ATIVO: Iniciando Gemini...");
    const apiKey = (
      process.env.GEMINI_API_KEY || 
      import.meta.env.VITE_GEMINI_API_KEY || 
      (window as any).GEMINI_API_KEY ||
      ""
    ).trim();
    
    if (!apiKey || apiKey.length < 10) {
      return { 
        pestFound: false, 
        confidence: 0, 
        message: "Erro: Chave API Gemini não configurada. Configure a chave para usar o modo online." 
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      // Usamos gemini-flash-latest para maior estabilidade em momentos de pico
      const MODEL_NAME = 'gemini-flash-latest';
      
      // Tenta com Google Search primeiro (Máxima precisão)
      try {
        const onlineResult = await fetchWithRetry(async () => {
          const response = await ai.models.generateContent({
            model: MODEL_NAME, 
            contents: {
              parts: [
                { text: `Identifique a praga urbana nesta imagem. 
                Sua resposta deve ser extremamente detalhada e técnica para um profissional de controle de pragas.
                
                REQUISITOS OBRIGATÓRIOS:
                1. Use a ferramenta Google Search para encontrar dados ATUALIZADOS sobre a praga.
                2. MÉTODOS DE CONTROLE QUÍMICO: Liste princípios ativos recomendados, DOSAGENS EXATAS (ex: ml/L ou g/10L) e MÉTODOS DE APLICAÇÃO (ex: pulverização, atomização, iscagem).
                3. BIOLOGIA: Descreva ciclo de vida, hábitos alimentares e locais de refúgio.
                4. RISCOS: Mencione doenças transmitidas ou danos estruturais.
                
                Retorne um JSON estrito seguindo o esquema fornecido.` },
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
          if (!text) throw new Error("IA retornou resposta vazia.");
          
          const parsed = JSON.parse(text);
          if (parsed.pest) {
            parsed.pest.source = "IA Online (Google Search)";
          }
          return parsed;
        }, 1); // Apenas 1 tentativa com busca para não travar o usuário
        
        return onlineResult;
      } catch (searchErr: any) {
        const errorMsg = searchErr.message || "";
        const isQuota = errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
        const isServiceError = errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.toLowerCase().includes("high demand");
        
        if (isQuota || isServiceError) {
          console.warn(`⚠️ ${isQuota ? 'Cota' : 'Sobrecarga'} detectada. Tentando IA pura sem Google Search...`);
          // Fallback: IA Pura sem Google Search (Cota muito maior e menos chance de 503)
          const fallbackResult = await fetchWithRetry(async () => {
            const response = await ai.models.generateContent({
              model: MODEL_NAME, 
              contents: {
                parts: [
                  { text: `Identifique a praga urbana nesta imagem. 
                  Use seu conhecimento interno de entomologia urbana.
                  Retorne um JSON estrito seguindo o esquema fornecido.` },
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
            if (!text) throw new Error("IA retornou resposta vazia.");
            
            const parsed = JSON.parse(text);
            if (parsed.pest) {
              parsed.pest.source = "IA Online (Conhecimento Interno)";
            }
            return parsed;
          }, 2);
          return fallbackResult;
        }
        throw searchErr;
      }
    } catch (err: any) {
      console.error("❌ FALHA NO MODO ONLINE:", err);
      let errorMsg = err.message || "Falha na comunicação com a IA";
      
      // Tratamento amigável para erro de cota ou sobrecarga final
      if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Limite de uso diário atingido no Google Gemini. O Google reseta as cotas gratuitas periodicamente. Por favor, use a Identificação Local (Offline) abaixo para continuar trabalhando agora.";
      } else if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.toLowerCase().includes("high demand")) {
        errorMsg = "O servidor do Google está sobrecarregado no momento (Erro 503). Isso é temporário. Por favor, use a Identificação Local (Offline) abaixo para não parar seu trabalho.";
      }

      return { 
        pestFound: false, 
        confidence: 0, 
        message: errorMsg 
      };
    }
  }

  // 2. MODO OFFLINE: Se não houver internet, usamos o motor local
  console.log("🔌 MODO OFFLINE ATIVO: Iniciando TFLite Local...");
  if (elementToUse) {
    return await analyzeOffline(elementToUse);
  }
  
  return { 
    pestFound: false, 
    confidence: 0, 
    message: "Não foi possível analisar a imagem. Verifique sua conexão." 
  };
};

export const analyzePestByName = async (pestName: string): Promise<RecognitionResult> => {
  const apiKey = (
    process.env.GEMINI_API_KEY || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (window as any).GEMINI_API_KEY ||
    ""
  ).trim();
  
  if (!apiKey) throw new Error("Configuração: API Key não encontrada.");
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    // Tenta com busca primeiro (Máxima precisão)
    return await fetchWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
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
      
      const parsed = JSON.parse(text);
      if (parsed.pest) {
        parsed.pest.source = "Busca Profunda (Google Search)";
      }
      return parsed;
    }, 1);
  } catch (err: any) {
    const errorMsg = err.message || "";
    const isQuota = errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
    
    if (isQuota) {
      console.warn("⚠️ Cota de Busca atingida na pesquisa por nome. Tentando IA pura...");
      // Fallback sem busca
      return await fetchWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview', 
          contents: `Forneça uma ficha técnica biológica completa da praga urbana chamada: "${pestName}". Use seu conhecimento interno de entomologia urbana. Retorne em JSON puro.`,
          config: { 
            responseMimeType: "application/json", 
            responseSchema: PEST_SCHEMA as any,
            temperature: 0.1
          }
        });
        const text = response.text;
        if (!text) throw new Error("A IA não respondeu.");
        
        const parsed = JSON.parse(text);
        if (parsed.pest) {
          parsed.pest.source = "Conhecimento Interno (IA)";
        }
        return parsed;
      }, 2);
    }
    
    return {
      pestFound: false,
      confidence: 0,
      message: errorMsg.includes("429") ? "Limite de uso atingido. Tente novamente em instantes." : errorMsg
    };
  }
};

export const generatePestAudio = async (text: string): Promise<string | null> => {
  const apiKey = (
    process.env.GEMINI_API_KEY || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    (window as any).GEMINI_API_KEY ||
    ""
  ).trim();
  
  if (!apiKey || apiKey.length < 10) return null;
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
