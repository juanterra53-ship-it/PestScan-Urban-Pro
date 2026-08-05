import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { RecognitionResult, PestInfo } from "./types";
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';
import { resizeImage } from './utils';
import { supabase } from './supabaseClient';

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
  tflite.setWasmPath('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.10/dist/');
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

const BPF_SCHEMA = {
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
      // Timeout aumentado para 45 segundos para suportar conexões 3G instáveis
      return await withTimeout(fn(i), 45000);
    } catch (error: any) {
      const msg = error.message || "";
      const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
      const isServiceError = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.toLowerCase().includes("high demand");
      const isTimeout = msg === "TIMEOUT_EXCEEDED";
      const isFetchError = msg.includes("Failed to fetch");
      
      if ((isRateLimit || isServiceError || isTimeout || isFetchError) && i < retries - 1) {
        // Espera progressiva maior para erros de rede
        const baseWait = isFetchError ? 5000 : (isRateLimit ? 3000 : 1000);
        const waitTime = Math.pow(2, i) * 1000 + baseWait + (Math.random() * 1000);
        
        console.warn(`[v2.7.3 Retry] Tentativa ${i + 1} falhou (${msg}). Aguardando ${Math.round(waitTime)}ms...`);
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
export const isLocalModelLoading = () => isModelLoading;

// Lista exata baseada no treinamento do Google Colab (Ordem Alfabética do TensorFlow)
// Importante: Manter os erros de digitação do treino para o mapeamento de índices funcionar
export const MODEL_LABELS = [
  'Aranha Marrom',                // 0
  'Aranha Armadeira',             // 1
  'Barata Oriental',              // 2
  'Barata Americana',             // 3
  'Barata Alemã',                 // 4
  'Besouro Vermelho da Farinha',  // 5
  'Broca do Trigo',               // 6
  'Escorpião Amarelo',            // 7
  'Escorpião Amarelo do Nordeste',// 8
  'Escorpião Marrom',             // 9
  'Formiga Carpinteira',          // 10
  'Formiga Fantasma',             // 11
  'Formiga Lava-pés',             // 12
  'Gorgulho do Arroz',            // 13
  'Mosca Doméstica',              // 14
  'Mosca Varejeira',              // 15
  'Mosca de Banheiro',            // 16
  'Ratazana',                     // 17
  'Rato Camundongo',              // 18
  'Rato Preto'                    // 19
];

// Mapeamento para nomes bonitos na interface (Corrige os erros de digitação do treino)
const LABEL_MAP: Record<string, string> = {
  'Aranha Armadeira': 'Aranha-armadeira',
  'Aranha Marrom': 'Aranha-marrom',
  'Barata Alemã': 'Barata-alemã',
  'Barata Americana': 'Barata-americana',
  'Barata Oriental': 'Barata-oriental',
  'Besouro Vermelho da Farinha': 'Besouro-vermelho-da-farinha',
  'Broca do Trigo': 'Broca-do-trigo',
  'Escorpião Marrom': 'Escorpião-marrom',
  'Escorpião Amarelo': 'Escorpião-amarelo',
  'Escorpião Amarelo do Nordeste': 'Escorpião-amarelo-do-nordeste',
  'Formiga Lava-pés': 'Formiga-lava-pés',
  'Formiga Fantasma': 'Formiga-fantasma',
  'Formiga Carpinteira': 'Formiga-carpinteira',
  'Mosca Doméstica': 'Mosca-doméstica',
  'Mosca de Banheiro': 'Mosca-de-banheiro',
  'Mosca Varejeira': 'Mosca-varejeira',
  'Gorgulho do Arroz': 'Gorgulho-do-arroz',
  'Rato Camundongo': 'Camundongo',
  'Rato Preto': 'Rato-de-telhado',
  'Ratazana': 'Ratazana'
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
    // Pequeno delay para estabilidade do TFJS
    await new Promise(r => setTimeout(r, 500));

    // Configuração explícita do WASM para a versão alpha.9
    if (typeof tflite !== 'undefined' && tflite.setWasmPath) {
      const wasmPath = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/';
      console.log(`📂 Configurando motor WASM: ${wasmPath}`);
      tflite.setWasmPath(wasmPath);
      // Delay essencial para o motor carregar o binário WASM
      await new Promise(r => setTimeout(r, 1000));
    }

    const universalModelUrl = `/model/modelo_universal.tflite`;
    const fallbackModelUrl = `/model/modelo_barata.tflite`;
    
    try {
      const tryLoad = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        const buffer = await response.arrayBuffer();
        console.log("🧠 Inicializando motor TFLite...");
        
        const loadPromise = tflite.loadTFLiteModel(buffer);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout na inicialização da IA")), 45000)
        );
        
        return await Promise.race([loadPromise, timeoutPromise]);
      };

      try {
        localModel = await tryLoad(universalModelUrl);
        modelStatus = "IA Local: Ativa";
        console.log("✅ Modelo Universal carregado!");
        return;
      } catch (e: any) {
        if (e.message?.includes('_malloc')) {
          console.warn("⚠️ Erro de memória, tentando novamente...");
          await new Promise(r => setTimeout(r, 2000));
          localModel = await tryLoad(universalModelUrl);
          modelStatus = "IA Local: Ativa";
          return;
        }
        
        console.warn("⚠️ Falha no modelo principal, tentando fallback...", e);
        try {
          localModel = await tryLoad(fallbackModelUrl);
          modelStatus = "IA Local: Ativa (Modo Seguro)";
        } catch (e2) {
          console.error("❌ Todos os modelos TFLite falharam:", e2);
          throw e2;
        }
      }
    } catch (innerError) {
      console.error("Erro no carregamento TFLite:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error("❌ Erro de Inicialização da IA:", error);
    modelStatus = `Erro: ${error.message || 'Falha na Inicialização'}`;
  } finally {
    isModelLoading = false;
  }
};

export const analyzeOffline = async (imageElement: HTMLImageElement | HTMLCanvasElement, normMode: number = 2): Promise<RecognitionResult> => {
  if (typeof tf === 'undefined' || !localModel) {
    return { 
      pestFound: false, 
      confidence: 0, 
      message: "Motor local não carregado. Aguarde a inicialização ou conecte-se à internet para baixar o motor de IA." 
    };
  }

  try {
    const tensor = tf.tidy(() => {
      const img = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(img, [224, 224], true);
      
      if (normMode === 1) {
        // Modo 1: [0, 1] (Padrão TFLite/Python)
        return resized.toFloat().div(tf.scalar(255)).expandDims();
      } else if (normMode === 2) {
        // Modo 2: [0, 255] (Raw)
        return resized.toFloat().expandDims();
      } else {
        // Modo 0: [-1, 1] (Padrão Teachable Machine)
        return resized.toFloat().sub(tf.scalar(127.5)).div(tf.scalar(127.5)).expandDims();
      }
    });

    let predictions = localModel.predict ? localModel.predict(tensor) : localModel.execute(tensor);
    let outputTensor = predictions;
    
    // Suporte para múltiplos outputs (pega o que tem o shape de classificação)
    if (predictions && typeof predictions === 'object' && !predictions.data) {
      const keys = Object.keys(predictions);
      // Procura por um tensor que tenha o tamanho das nossas labels (20 ou 21)
      const bestKey = keys.find(k => {
        const shape = predictions[k].shape;
        const size = shape[shape.length - 1];
        return size === 20 || size === 21 || size === MODEL_LABELS.length || size === MODEL_LABELS.length + 1;
      }) || keys[0];
      
      outputTensor = predictions[bestKey];
      console.log(`📦 Usando output tensor: ${bestKey} (Shape: ${outputTensor.shape})`);
    }

    const scores = await outputTensor.data();
    const scoresArray = Array.from(scores) as number[];
    
    // Lógica de mapeamento de labels otimizada
    let labelsToUse = MODEL_LABELS;
    if (scoresArray.length === 21) {
      // Background no INÍCIO (Índice 0) é o padrão mais comum em exportações do Colab/TM
      labelsToUse = ['Background', ...MODEL_LABELS];
      console.log("🏷️ Mapeamento: Background no início + 20 Pragas");
    } else if (scoresArray.length === 20) {
      labelsToUse = MODEL_LABELS;
      console.log("🏷️ Mapeamento: 20 Pragas (Sem Background)");
    } else {
      labelsToUse = Array.from({ length: scoresArray.length }, (_, i) => MODEL_LABELS[i] || `Classe ${i}`);
    }

    const maxScore = Math.max(...scoresArray);
    const maxScoreIndex = scoresArray.indexOf(maxScore);
    const confidencePct = (maxScore * 100).toFixed(1);

    const top5 = scoresArray
      .map((s, i) => ({ s, i }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(item => ({
        label: labelsToUse[item.i] || `Classe ${item.i}`,
        confidence: item.s,
        index: item.i
      }));
    
    console.log("-----------------------------------");
    console.log(`📊 Max Score: ${confidencePct}% no Index: ${maxScoreIndex} [Modo: ${normMode}]`);
    top5.forEach((item, i) => {
      console.log(`${i+1}. ${item.label}: ${(item.confidence * 100).toFixed(2)}% (Idx: ${item.index})`);
    });
    console.log("-----------------------------------");

    tensor.dispose();
    if (outputTensor?.dispose && outputTensor !== predictions) outputTensor.dispose();
    if (predictions?.dispose) predictions.dispose();

    const predictedLabel = labelsToUse[maxScoreIndex] || "Praga Detectada";
    
    // Se a confiança for muito baixa ou for Background, não considera como praga
    if (predictedLabel === 'Background' || maxScore < 0.50) {
      return { 
        pestFound: false, 
        confidence: maxScore, 
        message: maxScore < 0.50 ? `Confiança insuficiente (${confidencePct}%).` : "Nenhuma praga detectada (Fundo).", 
        source: 'IA Local',
        maxScoreIndex,
        topResults: top5,
        normalizationMode: normMode
      };
    }

    const cleanName = getCleanName(predictedLabel);
    const searchName = normalizeString(cleanName);
    
    // REGRA DE OURO: O Gorgulho do Arroz é um falso positivo comum.
    // Exigimos 90% de confiança para ele no motor local.
    if (cleanName === 'Gorgulho-do-arroz' && maxScore < 0.90) {
      return { 
        pestFound: false, 
        confidence: maxScore, 
        message: `Confiança insuficiente para Gorgulho (${confidencePct}%).`, 
        source: 'IA Local',
        maxScoreIndex,
        topResults: top5,
        normalizationMode: normMode
      };
    }

    const localPest = ENCYCLOPEDIA_DATA.find(p => normalizeString(p.name).includes(searchName));

    if (localPest) {
      return {
        pestFound: true,
        confidence: maxScore,
        pest: { ...localPest.details, name: cleanName, source: "IA Local", maxScoreIndex } as any,
        message: `IA Local: ${cleanName} (${confidencePct}%) [Idx: ${maxScoreIndex}]`,
        source: 'IA Local',
        maxScoreIndex,
        topResults: top5,
        normalizationMode: normMode
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
        source: "IA Local (Genérico)",
        maxScoreIndex
      } as any,
      message: `IA Local: ${cleanName} (${confidencePct}%) [Idx: ${maxScoreIndex}]`,
      source: 'IA Local',
      maxScoreIndex,
      topResults: top5,
      normalizationMode: normMode
    };
  } catch (error) {
    return { pestFound: false, confidence: 0, message: "Erro offline." };
  }
};

export const analyzePestImage = async (base64Raw: string, imageElement?: HTMLImageElement | HTMLCanvasElement, normMode: number = 0): Promise<RecognitionResult> => {
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
      console.error("❌ [v2.7.4] API Key ausente ou inválida.");
      return { 
        pestFound: false, 
        confidence: 0, 
        message: "Erro: API Key do Gemini não configurada." 
      };
    }

    try {
      // OTIMIZAÇÃO: Busca no Banco de Dados antes de chamar a API
      // Se a IA Local identificou com alta confiança, verificamos se já temos a ficha técnica no Supabase
      if (elementToUse) {
        const localRes = await analyzeOffline(elementToUse, normMode);
        if (localRes.pestFound && localRes.confidence > 0.85 && localRes.pest?.name) {
          const cleanName = localRes.pest.name;
          console.log(`🔍 [Cache] Verificando banco de dados para: ${cleanName}`);
          
          try {
            const { data: cachedPest, error: cacheError } = await supabase
              .from('pest_knowledge')
              .select('*')
              .eq('name', cleanName)
              .single();
            
            if (cachedPest && !cacheError) {
              console.log(`✅ [Cache] Ficha técnica encontrada no Banco de Dados para: ${cleanName}`);
              return {
                ...localRes,
                pest: {
                  ...cachedPest.details,
                  name: cleanName,
                  source: "Banco de Dados (Cache)"
                },
                source: 'Banco de Dados',
                message: `Identificado via Banco de Dados: ${cleanName}`
              };
            }
          } catch (dbErr) {
            console.warn("Erro ao acessar cache do banco:", dbErr);
          }
        }
      }

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
              { text: "Identifique a praga urbana nesta imagem. Forneça uma ficha técnica biológica completa incluindo: nome, nome científico, categoria, nível de risco, características, anatomia, membros, hábitos, reprodução, fase larval, métodos de controle, medidas físicas, medidas químicas (incluindo princípios ativos e dosagens recomendadas) e riscos à saúde/interesse médico. Retorne um JSON estrito seguindo o esquema." },
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
        
        if (parsed.pest) {
          parsed.pest.source = `IA Online (${currentModel})`;
          
          // SALVAR NO CACHE: Se a IA identificou uma praga nova, salvamos no banco para economizar no futuro
          if (parsed.pestFound && parsed.confidence > 0.80) {
            try {
              const { error: saveError } = await supabase
                .from('pest_knowledge')
                .upsert({
                  name: parsed.pest.name,
                  details: parsed.pest,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'name' });
              
              if (!saveError) console.log(`💾 [Cache] Ficha de ${parsed.pest.name} salva/atualizada no Banco.`);
            } catch (saveErr) {
              console.warn("Erro ao salvar no cache:", saveErr);
            }
          }
        }
        
        return {
          ...parsed,
          source: 'IA Online (Gemini)'
        };
      }, 3);
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      console.error("Erro Gemini:", errorMsg);
      
      let friendlyMsg = `[v2.7.2] Erro: ${errorMsg.substring(0, 50)}`;
      
      if (errorMsg.includes("Failed to fetch") || errorMsg.includes("TIMEOUT_EXCEEDED")) {
        console.warn("⚠️ Falha de conexão detectada. Tentando IA Local (Offline)...");
        if (elementToUse) return await analyzeOffline(elementToUse, normMode);
        friendlyMsg = "[v2.7.3] Erro de Conexão: Não foi possível alcançar os servidores da IA. Verifique sua internet ou use o Modo Offline.";
      } else if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota")) {
        friendlyMsg = "[v2.7.2] Limite de cota do Google atingido. A IA gratuita tem limites rígidos por minuto. Tente novamente em 60 segundos ou use o modo Offline.";
      } else if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE")) {
        friendlyMsg = "[v2.7.2] O servidor do Google está instável. Tente o modo Offline.";
      } else if (errorMsg === "TIMEOUT_EXCEEDED") {
        friendlyMsg = "[v2.7.2] Tempo de resposta excedido. Verifique sua conexão ou use o modo Offline.";
      }
      
      return { pestFound: false, confidence: 0, message: friendlyMsg };
    }
  }

  if (elementToUse) return await analyzeOffline(elementToUse, normMode);
  return { pestFound: false, confidence: 0, message: "Sem conexão com a internet." };
};

export const analyzeBpfImage = async (base64Raw: string, imageElement?: HTMLImageElement | HTMLCanvasElement, normMode: number = 0): Promise<RecognitionResult> => {
  const base64 = await resizeImage(base64Raw, 512);
  
  if (navigator.onLine) {
    const apiKey = getApiKey();
    if (!apiKey || apiKey.length < 10) {
      console.error("❌ API Key ausente para BPF.");
      return { 
        pestFound: false, 
        confidence: 0, 
        message: "Erro: API Key do Gemini não configurada." 
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const MODELS = ['gemini-3.1-flash-lite-preview', 'gemini-3-flash-preview', 'gemini-flash-latest'];

      return await fetchWithRetry<RecognitionResult>(async (attempt) => {
        const currentModel = MODELS[attempt % MODELS.length];
        console.log(`🚀 Analisando Não Conformidade BPF com ${currentModel}...`);
        
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: {
            parts: [
              { text: `Você é um especialista em Controle de Qualidade, Vigilância Sanitária e Boas Práticas de Fabricação (BPF). 
Análise esta imagem para identificar NÃO CONFORMIDADES físicas, estruturais, de higiene ou de processos (ex: portas abertas, frestas, sujidades, ferrugem, goteiras, lixo destampado, fiação exposta, etc.). 
Forneça um laudo técnico completo contendo:
- name: Nome claro da não conformidade (ex: "Fresta na base da porta", "Sujidade acumulada", "Porta corta-fogo aberta").
- scientificName: Classificação técnica (ex: "Não Conformidade BPF - Acesso Física", "Higiene Operacional").
- category: Deve ser obrigatoriamente "Não Conformidade".
- riskLevel: Grau de risco ("Baixo", "Moderado", "Alto", "Crítico").
- characteristics: Principais perigos associados (ex: ["Acesso de pragas", "Contaminação cruzada"]).
- anatomy: Descrição detalhada do problema observado na imagem e possíveis causas raiz.
- members: Gravidade / Setor afetado.
- habits: Comportamento operacional recomendado para evitar reincidência.
- reproduction: Potencial de contaminação ou agravamento se não corrigido.
- larvalPhase: Sinais precoces a monitorar na rotina de inspeção.
- controlMethods: Soluções / Ações corretivas para sanar o problema (métodos de controle).
- physicalMeasures: Medidas físicas e corretivas necessárias (instalação de dispositivos, barreiras físicas, reparo civil, etc.).
- chemicalMeasures: Medidas químicas, de sanitização ou desinfecção aplicáveis (ex: cloro 200ppm, detergente alcalino).
- healthRisks: Riscos sanitários ou de contaminação cruzada associados.

Retorne um JSON estrito seguindo o esquema estrutural compatível para que o app renderize sem problemas.` },
              { inlineData: { mimeType: "image/jpeg", data: base64 } }
            ]
          },
          config: { 
            responseMimeType: "application/json",
            responseSchema: BPF_SCHEMA as any,
            temperature: 0.1
          }
        });

        const text = response.text;
        if (!text) throw new Error("Resposta vazia da IA.");
        const parsed = JSON.parse(text);
        
        if (parsed.pest) {
          parsed.pest.source = `IA Online (${currentModel})`;
          parsed.scanType = 'bpf';
        }
        
        return {
          ...parsed,
          scanType: 'bpf',
          source: 'IA Online (Gemini)'
        };
      }, 3);
    } catch (err: any) {
      const errorMsg = err.message || JSON.stringify(err);
      console.error("Erro Gemini BPF:", errorMsg);
      return { pestFound: false, confidence: 0, message: `Erro ao analisar BPF: ${errorMsg.substring(0, 50)}` };
    }
  }

  return { pestFound: false, confidence: 0, message: "Sem conexão com a internet para análise por IA online." };
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
      contents: `Forneça uma ficha técnica biológica completa da praga urbana: "${pestName}". Inclua detalhes sobre anatomia, hábitos, reprodução, fase larval, métodos de controle, medidas físicas, medidas químicas (com princípios ativos e dosagens) e riscos à saúde. ${useSearch ? 'Use o Google Search para dados reais e atualizados.' : 'Use seu conhecimento interno.'} Retorne JSON.`,
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
      let msg = err2.message || "Erro desconhecido";
      if (msg.includes("Failed to fetch")) {
        msg = "Erro de Conexão: Falha ao buscar dados da praga. Verifique sua internet.";
      }
      return { pestFound: false, confidence: 0, message: `[v2.7.2] ${msg}` };
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
