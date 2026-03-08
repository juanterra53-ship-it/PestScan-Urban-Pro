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
import { 
  analyzePestImage, 
  analyzePestByName, 
  loadLocalModel, 
  isLocalModelLoaded, 
  getModelStatus, 
  analyzeOffline, 
  generatePestAudio 
} from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';

const normalizeString = (str: string) => 
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .replace(/[^a-z0-9]/g, "")
     .trim();

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'history' | 'result' | 'detail'>('splash');
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

  // Monitoramento do modelo local
  useEffect(() => {
    const checkModel = setInterval(() => {
      const ready = isLocalModelLoaded();
      const status = getModelStatus();
      setIsModelReady(ready);
      setModelStatus(status);
      if (ready) clearInterval(checkModel);
    }, 1000);
    return () => clearInterval(checkModel);
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

  // Estilos globais dinâmicos
  useEffect(() => {
    const themeColor = (view === 'splash' || view === 'auth') ? '#022c22' : '#064e3b';
    const bodyBg = (view === 'splash' || view === 'auth') ? '#022c22' : '#f8fafc';
    
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.body.style.backgroundColor = bodyBg;
    document.documentElement.style.backgroundColor = bodyBg;

    if (view === 'splash') {
      loadLocalModel();
    }
  }, [view]);

  // Inicialização do App
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        loadLocalModel().catch(e => console.warn("Modelo offline:", e));
        
        // Splash screen delay
        await new Promise(r => setTimeout(r, 2500));

        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          if (isMounted) setView('main');
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error || !data.session?.user) {
           setView('auth');
           return;
        }

        setUser({ 
          id: data.session.user.id, 
          email: data.session.user.email || '', 
          name: data.session.user.email?.split('@')[0] || 'Usuário' 
        });
        fetchHistory();
        setView('main');
      } catch (err) {
        if (isMounted) setView('auth');
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

      // Análise
      const res = await analyzePestImage(base64, canvas);
      const resultWithImage = { ...res, capturedImage: dataUrl };
      
      setCurrentResult(resultWithImage);
      setView('result');

      // Salvar histórico e upload
      if (res.pestFound && user && user.id !== 'offline') {
        try {
          let imageUrl = dataUrl;

          // Tenta upload para o Storage
          try {
            const blob = await (await fetch(dataUrl)).blob();
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest_detections')
              .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

            if (!uploadError) {
              const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
              imageUrl = data.publicUrl;
            }
          } catch (uploadErr) {
            console.warn("Upload falhou, salvando base64:", uploadErr);
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
      
      const res = await analyzePestImage(dataUrl.split(',')[1]);
      const resultWithImage = { ...res, capturedImage: dataUrl };
      
      setCurrentResult(resultWithImage);
      setView('result');

      // Salvar histórico e upload para arquivo também
      if (res.pestFound && user && user.id !== 'offline') {
        try {
          let imageUrl = dataUrl;

          try {
            const fileName = `${user.id}/${Date.now()}_file.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest_detections')
              .upload(fileName, file, { contentType: file.type, cacheControl: '3600' });

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

  if (view === 'splash') return (
    <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <Bug className="w-24 h-24 text-emerald-400 animate-bounce mb-6" />
      <h1 className="text-4xl font-black tracking-tighter">PestScan Pro</h1>
      <p className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.4em] mt-3">v2.7.2 Stable</p>
      
      <div className="mt-16 flex flex-col items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-400' : 'bg-slate-600 animate-pulse'}`} />
        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400/40">
          {isModelReady ? `Motor Local: ${modelStatus}` : `Sincronizando: ${modelStatus}`}
        </p>
      </div>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="bg-emerald-900/50 p-6 rounded-[2.5rem] mb-8 shadow-2xl">
        <Bug className="w-16 h-16 text-emerald-400" />
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
            const { error } = await supabase.auth.signInWithPassword({ email, password }); 
            if (error) throw error;
          } else {
            const { error } = await supabase.auth.signUp({ email, password }); 
            if (error) throw error;
          }
        } catch (e: any) { 
          setError(e.message); 
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
      
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-10 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:text-emerald-300 transition-colors">
        {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já possui conta? Faça Login'}
      </button>
      
      <button onClick={() => { setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' }); setView('main'); }} className="mt-6 text-slate-500 text-[10px] font-black uppercase tracking-widest underline decoration-slate-700 underline-offset-4">
        Entrar em Modo de Campo (Offline)
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-12 rounded-b-[4rem] text-white sticky top-0 z-40 shadow-2xl border-b border-emerald-800/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-400/20 p-3 rounded-2xl backdrop-blur-sm border border-emerald-400/30 shadow-inner">
              <Bug className="text-emerald-400 w-8 h-8" />
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
                onClick={() => supabase.auth.signOut()} 
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
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { setError(null); if(view === 'camera') initCamera(); }} 
                className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Tentar Novamente
              </button>
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
                className="w-full h-16 bg-white border border-slate-100 rounded-[2rem] pl-14 pr-14 text-sm font-medium outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
              {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 p-1 hover:text-slate-500"><X size={18} /></button>
              )}
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
             <div className="mb-6 flex items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Motor Local: {modelStatus}
                </span>
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
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-300" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(entry.timestamp).toLocaleDateString()}</p>
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
                <div className="absolute top-6 right-6 bg-emerald-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-white text-[11px] font-black shadow-xl">
                  {(currentResult.confidence * 100).toFixed(0)}% MATCH
                </div>
              </div>
            
            {currentResult.pestFound && currentResult.pest ? (
              <PestBioCard pest={currentResult.pest} />
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
                          
                          {isOnline && isModelReady && (
                            <button
                              onClick={async () => {
                                const img = new Image();
                                img.src = currentResult.capturedImage!;
                                await new Promise(r => img.onload = r);
                                setLoading(true);
                                try {
                                  const result = await analyzeOffline(img);
                                  setCurrentResult({ ...result, capturedImage: currentResult.capturedImage });
                                } finally { setLoading(false); }
                              }}
                              className="mt-6 w-full py-4 bg-white border-2 border-red-200 text-red-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 shadow-sm"
                            >
                              Forçar Identificação Local
                            </button>
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

      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-12 pt-5 pb-12 flex justify-around items-center z-50 rounded-t-[4rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.08)]">
        <button onClick={() => { setView('main'); stopCamera(); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'main' || view === 'detail' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <BookOpen size={26} />
          <span className="text-[9px] font-black uppercase tracking-widest">Guia</span>
        </button>
        
        <button onClick={handleCapture} className="w-20 h-20 -mt-24 bg-emerald-600 rounded-full flex items-center justify-center border-[8px] border-slate-50 shadow-2xl active:scale-90 transition-all text-white group">
          <Camera size={32} className="group-hover:scale-110 transition-transform" />
        </button>
        
        <button onClick={() => { setView('history'); stopCamera(); }} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'history' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}>
          <History size={26} />
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
        v2.7.2 Stable
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
