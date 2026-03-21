import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Bug, Camera, BookOpen, History, 
  ChevronRight, ArrowLeft, Loader2, 
  ShieldAlert, Volume2, Sparkles, 
  AlertTriangle, X, Search, Info, Key,
  Trash2, Clock, Hammer, FlaskConical,
  User, Lock, Mail, LogOut, CheckCircle,
  Database, ShieldCheck, Zap, ZapOff,
  Globe, Cpu, Image as ImageIcon, WifiOff, RefreshCw,
  ChevronDown, ChevronUp, Activity, AlertCircle
} from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { supabase } from './supabaseClient';
import PrivacyPolicy from './PrivacyPolicy';
import { 
  analyzePestImage, 
  analyzePestByName, 
  loadLocalModel, 
  isLocalModelLoaded, 
  isLocalModelLoading,
  getModelStatus, 
  analyzeOffline, 
  generatePestAudio 
} from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';
import { resizeImage, base64ToBlob } from './utils';

const normalizeString = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'history' | 'result' | 'detail' | 'privacy'>('splash');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{id: string; email: string; name: string} | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isModelReady, setIsModelReady] = useState(isLocalModelLoaded());
  const [modelStatus, setModelStatus] = useState(getModelStatus());
  const [normMode, setNormMode] = useState(2);

  const [showSkip, setShowSkip] = useState(false);

  // Monitoramento do modelo local
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 5000);
    console.log("🔍 [App] Iniciando monitoramento do modelo...");
    const checkModel = setInterval(() => {
      const ready = isLocalModelLoaded();
      const status = getModelStatus();
      
      if (ready) {
        console.log("✅ [App] Modelo Local Detectado como Ativo!");
        setIsModelReady(true);
        setModelStatus(status);
        clearInterval(checkModel);
      } else {
        setModelStatus(status);
      }
    }, 1000);
    return () => {
      clearInterval(checkModel);
      clearTimeout(skipTimer);
    };
  }, []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitoramento de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Registro do Service Worker para PWA
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerSW({
        onNeedRefresh() {
          console.log("🆕 Nova versão disponível! Recarregando...");
          window.location.reload();
        },
        onOfflineReady() {
          console.log("✅ App pronto para uso offline.");
        },
      });
    }
  }, []);

  const forceUpdate = async () => {
    setLoading(true);
    try {
      console.log("🧹 Limpando caches e forçando atualização...");
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      console.log("🔄 Recarregando página...");
      window.location.href = window.location.origin + '?v=' + Date.now();
    } catch (e) {
      console.error("Erro ao forçar atualização:", e);
      window.location.reload();
    }
  };

  // Estilos globais dinâmicos e carregamento do modelo
  useEffect(() => {
    const themeColor = (view === 'splash' || view === 'auth') ? '#022c22' : '#064e3b';
    const bodyBg = (view === 'splash' || view === 'auth') ? '#022c22' : '#f8fafc';
    
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.body.style.backgroundColor = bodyBg;
    document.documentElement.style.backgroundColor = bodyBg;

    if (view === 'splash' || (view !== 'auth' && !isLocalModelLoaded() && !isLocalModelLoading())) {
      console.log(`🔄 [App] Verificando motor local na view: ${view}`);
      loadLocalModel();
    }
  }, [view]);

  // Inicialização do App
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log("🚀 [App] Iniciando inicialização...");
        loadLocalModel().catch(e => console.warn("Modelo offline:", e));
        
        const splashPromise = new Promise(r => setTimeout(r, 2000));
        
        // Timeout de 5 segundos para o Supabase para evitar travamentos
        const sessionPromise = Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Supabase")), 5000))
        ]) as Promise<{ data: { session: any }; error: any }>;

        const [{ data, error }] = await Promise.all([sessionPromise, splashPromise]);
        
        if (!isMounted) return;

        if (error || !data.session?.user) {
           console.log("👤 [App] Sessão não encontrada ou erro, indo para Auth");
           setView('auth');
           return;
        }

        console.log("✅ [App] Sessão ativa encontrada:", data.session.user.email);
        setUser({ 
          id: data.session.user.id, 
          email: data.session.user.email || '', 
          name: data.session.user.email?.split('@')[0] || 'Usuário' 
        });
        fetchHistory();
        setView('main');
      } catch (err: any) {
        console.error("Init error:", err);
        if (isMounted) {
          setError(err?.message === "Timeout Supabase" ? "Conexão lenta detectada. Você pode entrar em modo offline." : null);
          setView('auth');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!isMounted) return;
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '', 
          name: session.user.email?.split('@')[0] || 'Usuário' 
        });
        fetchHistory();
        if (view === 'splash' || view === 'auth') setView('main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('auth');
      }
    });

    return () => { 
      isMounted = false;
      authListener?.subscription?.unsubscribe(); 
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const { data } = await supabase
        .from('pest_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        setHistory(data.map((item: any) => ({ 
          id: item.id, 
          timestamp: new Date(item.created_at).getTime(), 
          image: item.image_data, 
          result: item.analysis_result 
        })));
      }
    } catch (err) { 
      console.error("Erro ao carregar histórico:", err); 
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setFlashOn(false);
    setZoom(1);
    setZoomCaps(null);
  };

  const initCamera = useCallback(async () => {
    setError(null); 
    setHasFlash(false); 
    setFlashOn(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Câmera não suportada neste dispositivo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        const track = stream.getVideoTracks()[0];
        const caps = (track as any).getCapabilities?.() || {};
        if (caps.torch) setHasFlash(true);
        if (caps.zoom) setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max });
      }
    } catch (e: any) { 
      console.error("Erro câmera:", e);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  useEffect(() => {
    if (view === 'camera') initCamera();
    return () => stopCamera();
  }, [view, initCamera]);

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0];
      const next = !flashOn;
      try {
        await (track as any).applyConstraints({ advanced: [{ torch: next }] });
        setFlashOn(next);
      } catch (err) {
        console.warn("Flash error:", err);
      }
    }
  };

  const handleCapture = async () => {
    if (view !== 'camera') { setView('camera'); return; }
    if (!videoRef.current) return;
    
    setLoading(true); setError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];

      let res: RecognitionResult;

      // --- MOTOR HÍBRIDO SÊNIOR COM AUTO-CALIBRAÇÃO ---
      // Testamos os 3 modos e pegamos o melhor resultado
      const results = await Promise.all([
        analyzeOffline(canvas, 0),
        analyzeOffline(canvas, 1),
        analyzeOffline(canvas, 2)
      ]);
      
      // Ordena por confiança. Em caso de empate, prioriza o Modo 2 (mais estável para aranhas)
      const localRes = results.sort((a, b) => {
        if (Math.abs(b.confidence - a.confidence) < 0.01) {
          if (b.normalizationMode === 2) return 1;
          if (a.normalizationMode === 2) return -1;
        }
        return b.confidence - a.confidence;
      })[0];
      
      setNormMode(localRes.normalizationMode || 0);
      
      console.log(`🧠 [Auto-Calibração] Melhor Modo: ${localRes.normalizationMode} Confiança: ${localRes.confidence}`);

      if (localRes.pestFound && localRes.confidence > 0.20 && localRes.pest) {
        // 2. Busca no Banco de Dados por Referência
        const { data: existingData } = await supabase
          .from('pest_detections')
          .select('analysis_result')
          .ilike('pest_name', `%${localRes.pest.name}%`)
          .not('analysis_result', 'is', null)
          .order('confidence', { ascending: false })
          .limit(1);

        if (existingData && existingData.length > 0 && existingData[0].analysis_result.pestFound) {
          console.log("✅ [Senior] Referência encontrada no banco!");
          res = {
            ...existingData[0].analysis_result,
            confidence: localRes.confidence,
            message: `Identificado via Referência Local (${localRes.pest.name})`,
            source: 'Banco de Dados'
          };
        } else {
          // 3. Se não tem no banco, usa IA Online para gerar ficha técnica completa
          console.log("🌐 [Senior] Sem referência no banco. Consultando IA Online...");
          res = await analyzePestImage(base64, canvas, normMode);
        }
      } else {
        // 4. Fallback total para IA Online se o motor local falhar
        console.log("🌐 [Senior] Motor local inconclusivo. Consultando IA Online...");
        res = await analyzePestImage(base64, canvas, normMode);
      }

      // 5. Fallback de Emergência (Offline Total ou Erro de Conexão)
      const isConnectionError = res.message?.includes("Erro de Conexão") || res.message?.includes("Failed to fetch");
      
      if ((!res.pestFound || isConnectionError) && localRes.pestFound) {
        console.log("🔄 [Senior] Fallback de Emergência para Motor Local devido a erro ou falta de resultado.");
        res = {
          ...localRes,
          pestFound: true,
          message: isConnectionError 
            ? `Conexão instável. Usando IA Local: ${localRes.message}` 
            : `Modo Emergência: ${localRes.message}`
        };
      }

      const resultWithImage = { ...res, capturedImage: dataUrl };
      setCurrentResult(resultWithImage);
      setView('result');

      // Salvar histórico e upload
      if (res.pestFound && user && user.id !== 'offline') {
        try {
          let imageUrl = dataUrl;
          try {
            // Redimensiona para 800px antes do upload para economizar banda (Egress)
            const resizedBase64 = await resizeImage(dataUrl, 800);
            const blob = base64ToBlob(resizedBase64);
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest_detections')
              .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

            if (!uploadError) {
              const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
              imageUrl = data.publicUrl;
            }
          } catch (uploadErr) {
            console.warn("Upload falhou:", uploadErr);
          }

          await supabase.from('pest_detections').insert({ 
            user_id: user.id, 
            image_data: imageUrl, 
            pest_name: res.pest?.name || 'Scan', 
            confidence: res.confidence, 
            analysis_result: resultWithImage 
          });
          fetchHistory();
        } catch (e) {
          console.warn("Erro ao salvar histórico:", e);
        }
      }
    } catch (e: any) {
      console.error("Erro captura:", e);
      setError(e.message || "Erro inesperado na análise.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64 = dataUrl.split(',')[1];
      
      // 1. Identificação Local (TFLite) com Auto-Calibração
      const canvas = document.createElement('canvas');
      const imgElement = new Image();
      imgElement.src = dataUrl;
      await new Promise(r => imgElement.onload = r);
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

      const results = await Promise.all([
        analyzeOffline(canvas, 0),
        analyzeOffline(canvas, 1),
        analyzeOffline(canvas, 2)
      ]);
      
      // Ordena por confiança. Em caso de empate, prioriza o Modo 2
      const localRes = results.sort((a, b) => {
        if (Math.abs(b.confidence - a.confidence) < 0.01) {
          if (b.normalizationMode === 2) return 1;
          if (a.normalizationMode === 2) return -1;
        }
        return b.confidence - a.confidence;
      })[0];
      
      setNormMode(localRes.normalizationMode || 0);

      const resRaw = await analyzePestImage(base64, canvas, localRes.normalizationMode);
      let res = resRaw;

      // --- LÓGICA DE ECONOMIA DE API PARA UPLOAD ---
      // Se a IA Online identificou algo, vamos ver se já temos uma ficha melhor no banco
      if (res.pestFound && res.pest) {
        const { data: existingData } = await supabase
          .from('pest_detections')
          .select('analysis_result')
          .eq('pest_name', res.pest.name)
          .not('analysis_result', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingData && existingData.length > 0) {
          console.log("💰 [Economia] Usando ficha técnica otimizada do banco.");
          res = {
            ...existingData[0].analysis_result,
            confidence: res.confidence,
            message: "Ficha técnica otimizada (Cache)",
            source: 'Banco de Dados'
          };
        }
      }

      const resultWithImage = { ...res, capturedImage: dataUrl };
      
      setCurrentResult(resultWithImage);
      setView('result');

      // Salvar histórico e upload para arquivo também
      if (res.pestFound && user && user.id !== 'offline') {
        try {
          let imageUrl = dataUrl;

          try {
            // Redimensiona para 800px antes do upload para economizar banda (Egress)
            const resizedBase64 = await resizeImage(dataUrl, 800);
            const blob = base64ToBlob(resizedBase64);
            const fileName = `${user.id}/${Date.now()}_file.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest_detections')
              .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

            if (!uploadError) {
              const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
              imageUrl = data.publicUrl;
            }
          } catch (uploadErr) {
            console.warn("Upload de arquivo falhou:", uploadErr);
          }

          await supabase.from('pest_detections').insert({ 
            user_id: user.id, 
            image_data: imageUrl, 
            pest_name: res.pest?.name || 'Scan', 
            confidence: res.confidence, 
            analysis_result: resultWithImage 
          });
          fetchHistory();
        } catch (e) {
          console.warn("Erro ao salvar histórico de arquivo:", e);
        }
      }
    } catch (e: any) {
      console.error("Erro ao processar arquivo:", e);
      setError(e.message || "Erro ao processar arquivo.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAiDeepSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true); setIsAiSearching(true); setError(null);
    try {
      // 1. Tenta buscar no banco primeiro (Economia de API)
      const { data: existingData } = await supabase
        .from('pest_detections')
        .select('analysis_result')
        .ilike('pest_name', `%${searchTerm}%`)
        .not('analysis_result', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingData && existingData.length > 0 && existingData[0].analysis_result.pest) {
        console.log("💰 [Economia] Busca profunda recuperada do banco.");
        setSelectedPest(existingData[0].analysis_result.pest);
        setView('detail');
        return;
      }

      // 2. Se não tem no banco, chama a IA
      const res = await analyzePestByName(searchTerm);
      if (res.pest) {
        setSelectedPest(res.pest);
        setView('detail');
      } else {
        setError("Nenhuma informação biológica encontrada para este termo.");
      }
    } catch (e: any) {
      setError(e.message || "Erro na busca profunda.");
    } finally {
      setLoading(false); setIsAiSearching(false);
    }
  };

  const PestBioCard = ({ pest }: { pest: PestInfo }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex justify-between items-start">
         <div className="flex-1 pr-4">
           <h2 className="text-2xl font-black text-slate-900 leading-tight">{pest.name}</h2>
           <p className="text-emerald-600 font-bold italic text-sm">{pest.scientificName}</p>
           {(pest as any).maxScoreIndex !== undefined && (
             <p className="text-[10px] text-slate-400 font-bold mt-1">DEBUG ID: {(pest as any).maxScoreIndex}</p>
           )}
           {pest.source && (
             <div className="flex items-center gap-1 mt-1 opacity-50">
               <Globe size={10} />
               <span className="text-[9px] font-black uppercase tracking-wider">{pest.source}</span>
             </div>
           )}
         </div>
         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${
           pest.riskLevel === 'Crítico' ? 'bg-red-100 text-red-600' : 
           pest.riskLevel === 'Alto' ? 'bg-orange-100 text-orange-600' : 
           'bg-emerald-100 text-emerald-600'
         }`}>
           Risco {pest.riskLevel}
         </div>
       </div>

       <div className="grid grid-cols-2 gap-3">
         <div className="bg-slate-50 p-3 rounded-2xl">
           <p className="text-[10px] font-black text-slate-400 uppercase">Membros</p>
           <p className="text-sm font-bold text-slate-700">{pest.members || 'N/A'}</p>
         </div>
         <div className="bg-slate-50 p-3 rounded-2xl">
           <p className="text-[10px] font-black text-slate-400 uppercase">Reprodução</p>
           <p className="text-sm font-bold text-slate-700 truncate">{pest.reproduction || 'N/A'}</p>
         </div>
       </div>

       <div className="space-y-2">
         <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
           <Info size={14} /> Biologia e Hábitos
         </h4>
         <p className="text-sm text-slate-600 leading-relaxed">{pest.habits}</p>
       </div>

       {pest.anatomy && (
         <div className="space-y-2">
           <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
             <Activity size={14} /> Anatomia
           </h4>
           <p className="text-sm text-slate-600 leading-relaxed">{pest.anatomy}</p>
         </div>
       )}

       {pest.larvalPhase && (
         <div className="space-y-2">
           <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
             <Clock size={14} /> Fase Larval
           </h4>
           <p className="text-sm text-slate-600 leading-relaxed">{pest.larvalPhase}</p>
         </div>
       )}

       {pest.characteristics && pest.characteristics.length > 0 && (
         <div className="flex flex-wrap gap-2">
           {pest.characteristics.map((c, i) => (
             <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
               {c}
             </span>
           ))}
         </div>
       )}

       <div className="bg-emerald-900 p-5 rounded-[2rem] text-white shadow-inner space-y-5">
         <div>
           <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2">
             <ShieldCheck size={14} /> Métodos de Controle
           </h4>
           <ul className="space-y-1.5">
             {(pest.controlMethods || []).map((m, i) => (
               <li key={i} className="text-[11px] flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span> {m}
               </li>
             ))}
           </ul>
         </div>

         <div className="pt-4 border-t border-emerald-800">
           <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2">
             <Hammer size={12} /> Medidas Físicas
           </h4>
           <ul className="space-y-1.5">
             {(pest.physicalMeasures || []).map((m, i) => (
               <li key={i} className="text-[11px] flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span> {m}
               </li>
             ))}
           </ul>
         </div>

         <div className="pt-4 border-t border-emerald-800">
           <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2">
             <FlaskConical size={12} /> Medidas Químicas
           </h4>
           <ul className="space-y-1.5">
             {(pest.chemicalMeasures || []).map((m, i) => (
               <li key={i} className="text-[11px] flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span> {m}
               </li>
             ))}
           </ul>
         </div>
       </div>

       {pest.healthRisks && (
         <div className="p-4 bg-red-50 border border-red-100 rounded-3xl">
            <h4 className="text-[10px] font-black text-red-600 uppercase mb-1 flex items-center gap-2">
              <AlertCircle size={14} /> Riscos à Saúde
            </h4>
            <p className="text-xs text-red-700 leading-relaxed font-medium">{pest.healthRisks}</p>
         </div>
       )}
    </div>
  );

  if (view === 'privacy') return <PrivacyPolicy onBack={() => setView(user ? 'main' : 'auth')} />;

  if (view === 'splash') return (
    <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full"></div>
        <div className="relative bg-emerald-900/50 p-8 rounded-[3rem] border border-emerald-400/20 shadow-2xl">
          <Bug className="w-20 h-20 text-emerald-400" />
        </div>
      </div>
      <h1 className="text-5xl font-black tracking-tighter">PestScan<span className="text-emerald-400">Pro</span></h1>
      <p className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.4em] mt-4">Inteligência em Controle de Pragas</p>
      
      <div className="mt-16 flex flex-col items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-400' : (modelStatus.includes('Erro') ? 'bg-red-500' : 'bg-slate-600 animate-pulse')}`} />
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/40">
          {isModelReady ? `Motor Local: ${modelStatus}` : (modelStatus.includes('Erro') ? modelStatus : `Sincronizando: ${modelStatus}`)}
        </p>
        
        <div className="flex flex-col gap-2 mt-4">
          {modelStatus.includes('Erro') && (
            <button 
              onClick={() => loadLocalModel()}
              className="px-6 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-600/40 transition-all"
            >
              Tentar Novamente
            </button>
          )}

          <button 
            onClick={forceUpdate}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/30 hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <RefreshCw size={10} /> Forçar Atualização
          </button>

          {showSkip && !isModelReady && (
            <button 
              onClick={() => setView('auth')}
              className="px-6 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-600/40 transition-all"
            >
              Pular Carregamento
            </button>
          )}
          
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">v2.7.5 Stable</p>
          
          <button 
            onClick={() => setView('privacy')}
            className="mt-4 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-emerald-400 transition-colors"
          >
            Política de Privacidade
          </button>
        </div>
      </div>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-400/10 blur-2xl rounded-full"></div>
        <div className="relative bg-emerald-900/50 p-6 rounded-[2.5rem] shadow-2xl border border-emerald-400/10">
          <Bug className="w-16 h-16 text-emerald-400" />
        </div>
      </div>
      <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
        {authMode === 'login' ? 'Bem-vindo' : 'Novo Cadastro'}
      </h1>
      <p className="text-emerald-400/60 text-xs font-black uppercase tracking-widest mb-10">Acesse o Ecossistema Pro</p>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-8 w-full max-w-xs text-center text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={async (e) => { 
        e.preventDefault(); 
        setLoading(true); setError(null);
        try { 
          if (authMode === 'login') {
            // Timeout de 10 segundos para o login
            const loginPromise = Promise.race([
              supabase.auth.signInWithPassword({ email, password }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("O servidor demorou muito para responder. Verifique sua conexão.")), 10000))
            ]) as Promise<{ data: any; error: any }>;

            const { data, error } = await loginPromise;
            if (error) throw error;
            if (data.user) {
              setUser({ 
                id: data.user.id, 
                email: data.user.email || '', 
                name: data.user.email?.split('@')[0] || 'Usuário' 
              });
              setView('main');
            }
          } else {
            const { data, error } = await supabase.auth.signUp({ email, password }); 
            if (error) throw error;
            if (data.user) {
              setError("Cadastro realizado! Verifique seu e-mail para confirmar.");
            }
          }
        } catch (e: any) { 
          console.error("Auth error:", e);
          let msg = e.message || e.error_description || (typeof e === 'string' ? e : "Erro de autenticação");
          
          if (msg.includes("Failed to fetch")) {
            msg = "Erro de Conexão: Não foi possível alcançar o servidor. Verifique sua internet.";
          }

          setError(msg); 
        } finally { 
          setLoading(false); 
        } 
      }} className="w-full max-w-xs space-y-4">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400/40" size={18} />
          <input type="email" placeholder="E-mail profissional" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" required />
        </div>
        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-400/40" size={18} />
          <input type="password" placeholder="Senha de acesso" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all" required />
        </div>
        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl uppercase text-sm shadow-xl shadow-emerald-950/50 transition-all active:scale-95">
          {authMode === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
        </button>
      </form>
      
      <button 
        onClick={() => setView('privacy')}
        className="mt-8 text-[10px] font-black uppercase tracking-widest text-emerald-400/40 hover:text-emerald-400 transition-colors"
      >
        Política de Privacidade
      </button>
      
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:text-emerald-300 transition-colors">
        {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça Login'}
      </button>
      
      <button 
        onClick={() => { setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' }); setView('main'); }} 
        className={`mt-6 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 transition-all ${error?.includes("Erro de Conexão") || error?.includes("Conexão lenta") ? "text-emerald-400 scale-110 decoration-emerald-400" : "text-slate-500 decoration-slate-700"}`}
      >
        Entrar em Modo de Campo (Offline)
      </button>

      <button 
        onClick={forceUpdate}
        className="mt-12 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white/40 transition-all"
      >
        <RefreshCw size={10} /> Forçar Atualização do App
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-12 rounded-b-[4rem] text-white sticky top-0 z-40 shadow-2xl border-b border-emerald-800/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-400/10 p-3 rounded-2xl backdrop-blur-md border border-emerald-400/20 shadow-lg relative group">
              <div className="absolute inset-0 bg-emerald-400/5 blur-lg rounded-full group-hover:bg-emerald-400/10 transition-colors"></div>
              <Bug className="text-emerald-400 w-8 h-8 relative z-10" />
            </div>
            <div>
              <h1 className="font-black text-2xl text-white tracking-tighter">PestScan Pro</h1>
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isOnline ? 'IA ONLINE' : 'MODO OFFLINE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={() => {
                  try {
                    // Logout instantâneo para o usuário
                    setUser(null);
                    setView('auth');
                    
                    if (user.id !== 'offline') {
                      // Faz o logout no servidor em background sem travar a UI
                      supabase.auth.signOut().catch((err: any) => console.error("Erro background logout:", err));
                    }
                  } catch (err: any) {
                    setUser(null);
                    setView('auth');
                  }
                }} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/10"
                title="Sair"
              >
                <LogOut size={20} className="text-white/80" />
              </button>
            )}
            {view !== 'main' && (
              <button 
                onClick={() => { setView('main'); stopCamera(); setError(null); }} 
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/10"
              >
                <X size={20} className="text-white/80" />
              </button>
            )}
            <button 
              onClick={() => setView('privacy')}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/10"
              title="Privacidade"
            >
              <ShieldCheck size={20} className="text-white/80" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 pb-40 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-[2.5rem] mb-8 flex flex-col gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed font-bold flex-1">{error}</p>
            </div>
          </div>
        )}
        
        {view === 'main' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar praga ou caruncho..." 
                className="w-full h-16 bg-white border border-slate-100 rounded-[2rem] pl-14 pr-6 text-sm font-medium outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>

            {searchTerm.trim() !== '' && ENCYCLOPEDIA_DATA.filter(p => normalizeString(p.name).includes(normalizeString(searchTerm))).length === 0 && (
              <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 animate-in zoom-in-95">
                <div className="flex items-center gap-4 mb-5">
                  <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20"><Cpu size={24} /></div>
                  <h3 className="text-emerald-900 font-black text-sm uppercase tracking-tight">Busca Profunda IA</h3>
                </div>
                <p className="text-emerald-700 text-xs font-bold leading-relaxed mb-6">Não encontramos "{searchTerm}" no catálogo local. Deseja usar nossa IA para buscar dados técnicos em tempo real?</p>
                <button onClick={handleAiDeepSearch} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 active:scale-95 transition-all">
                  <Globe size={16} /> Consultar IA Especialista
                </button>
              </div>
            )}

            <div className="grid gap-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Enciclopédia Bio-Urbana</h3>
              {ENCYCLOPEDIA_DATA.filter(item => {
                const search = normalizeString(searchTerm);
                return normalizeString(item.name).includes(search) || normalizeString(item.category).includes(search);
              }).map(item => (
                <button key={item.id} onClick={() => { setSelectedPest(item.details); setView('detail'); }} className="flex items-center gap-5 p-6 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all hover:border-emerald-100 group">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-emerald-50 transition-colors">{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-base leading-none mb-1.5">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.category}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-200 group-hover:text-emerald-300 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95">
             <div className="mb-6 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
                   <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     Motor Local: {modelStatus}
                   </span>
                </div>
                {!isOnline && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500 text-white backdrop-blur-md rounded-2xl shadow-sm animate-pulse">
                     <WifiOff size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                  </div>
                )}
             </div>

             <div className="w-full aspect-[3/4] bg-slate-900 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                <div className="absolute top-6 left-6 flex gap-3 z-50">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-5 rounded-2xl bg-black/40 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90"
                  >
                    <ImageIcon size={24} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                </div>

                {hasFlash && (
                  <button 
                    onClick={toggleFlash} 
                    className={`absolute top-6 right-6 p-5 rounded-2xl backdrop-blur-md transition-all active:scale-90 z-50 ${
                        flashOn ? 'bg-yellow-400 text-yellow-950' : 'bg-black/40 text-white border border-white/20'
                    }`}
                  >
                    <Zap size={24} fill={flashOn ? "currentColor" : "none"} />
                  </button>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-4/5 h-4/5 border-2 border-emerald-400/30 rounded-[3rem] relative">
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />
                   </div>
                </div>
             </div>
             <p className="mt-10 text-sm font-bold text-slate-400 px-10 text-center leading-relaxed uppercase tracking-widest text-[10px]">
               Posicione a praga no centro do visor
             </p>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Scans Recentes</h3>
            <div className="grid gap-4">
              {history.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-slate-100">
                  <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-300 uppercase">Nenhum scan realizado</p>
                </div>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="bg-white p-4 rounded-[3rem] border border-slate-100 flex gap-5 items-center shadow-sm active:scale-[0.98] transition-all" onClick={() => { setCurrentResult(entry.result); setView('result'); }}>
                    <img src={entry.image} className="w-20 h-20 rounded-[2rem] object-cover shadow-inner" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black text-slate-900 truncate mb-1">{entry.result.pest?.name || "Scan Desconhecido"}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock size={10} className="text-slate-300" />
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(entry.timestamp).toLocaleDateString()}</p>
                        </div>
                        {entry.result.source && (
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                            {entry.result.source.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-200 mr-2" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-6">
              <div className="relative">
                <img 
                  src={currentResult.capturedImage} 
                  className="w-full aspect-square object-cover rounded-[4rem] border-8 border-white shadow-2xl" 
                />
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                  <div className="bg-emerald-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-[11px] font-black shadow-xl">
                    {(currentResult.confidence * 100).toFixed(0)}% MATCH
                  </div>
                  {currentResult.source && (
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-emerald-900 text-[9px] font-black shadow-lg border border-emerald-100 uppercase tracking-widest">
                      {currentResult.source}
                    </div>
                  )}
                </div>
              </div>
            
            {currentResult.pestFound && currentResult.pest ? (
              <>
                <PestBioCard pest={currentResult.pest} />
                
                {currentResult.topResults && currentResult.topResults.length > 1 && (
                  <div className="mt-8 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity size={14} /> Outras Probabilidades (IA Local)
                      </h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            // Abre a enciclopédia para seleção manual
                            setView('main');
                            setSearchTerm('');
                            setTimeout(() => {
                              const el = document.getElementById('encyclopedia-section');
                              el?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <Search size={12} /> Não é esta praga? Clique aqui
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {currentResult.topResults.map((res, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl ${idx === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className={`text-xs font-bold ${idx === 0 ? 'text-emerald-900' : 'text-slate-700'}`}>{res.label}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Índice: {res.index}</p>
                            </div>
                          </div>
                          <p className={`text-xs font-black ${idx === 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {(res.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-10 rounded-[3rem] text-center space-y-6 shadow-sm border border-slate-100">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <Bug size={40} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Não Identificado</h3>
                  <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">A imagem pode estar desfocada ou a espécie não consta no banco de dados.</p>
                  
                  {currentResult.message && (
                    <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-[2rem] text-left">
                      <div className="flex items-start gap-4">
                        <ShieldAlert className="text-red-500 w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-800 font-black text-[10px] uppercase tracking-widest mb-2">Status do Sistema</p>
                          <p className="text-red-700 text-xs leading-relaxed font-bold">{currentResult.message}</p>
                          
                          {isModelReady && (
                            <button
                              onClick={async () => {
                                const img = new Image();
                                img.src = currentResult.capturedImage!;
                                await new Promise(r => img.onload = r);
                                setLoading(true);
                                try {
                                  const result = await analyzeOffline(img, normMode);
                                  setCurrentResult({ ...result, capturedImage: currentResult.capturedImage });
                                } finally { setLoading(false); }
                              }}
                              className="mt-6 w-full py-4 bg-white border-2 border-emerald-200 text-emerald-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
                            >
                              Forçar Identificação Local
                            </button>
                          )}
                          {!isModelReady && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aguarde a sincronização do motor local</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button onClick={() => setView('main')} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase shadow-2xl active:scale-95 transition-all">Finalizar Análise</button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-left-6">
            <button onClick={() => { setView('main'); setSelectedPest(null); }} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all">
              <ArrowLeft size={18} /> Voltar ao Guia
            </button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-10 pt-5 pb-10 flex justify-between items-center z-50 rounded-t-[3.5rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.08)]">
        <button onClick={() => { setView('main'); stopCamera(); }} className={`flex flex-col items-center gap-1.5 transition-all w-20 ${view === 'main' || view === 'detail' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <BookOpen size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Guia</span>
        </button>
        
        <button onClick={handleCapture} className="w-20 h-20 -mt-20 bg-emerald-600 rounded-full flex items-center justify-center border-[6px] border-white shadow-2xl active:scale-90 transition-all text-white group">
          <Camera size={30} className="group-hover:scale-110 transition-transform" />
        </button>
        
        <button onClick={() => { setView('history'); stopCamera(); }} className={`flex flex-col items-center gap-1.5 transition-all w-20 ${view === 'history' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <History size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Scans</span>
        </button>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white p-12 text-center animate-in fade-in">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin shadow-2xl" />
            <Bug className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Acessando IA Urbana</h2>
          <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-[0.4em] max-w-[200px] leading-relaxed">
            {isAiSearching ? 'Mapeando Banco de Dados Global' : 'Analisando Estrutura Biológica'}
          </p>
          
          <button 
            onClick={() => setLoading(false)} 
            className="mt-16 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 transition-all"
          >
            Cancelar Processo
          </button>
        </div>
      )}

      <div className="fixed bottom-3 right-6 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none z-[60] opacity-50">
        v2.7.5 Stable
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  // Evita o aviso de "createRoot() on a container that has already been passed to createRoot()"
  // @ts-ignore
  if (!window.__reactRoot) {
    // @ts-ignore
    window.__reactRoot = createRoot(container);
  }
  // @ts-ignore
  window.__reactRoot.render(<App />);
}
