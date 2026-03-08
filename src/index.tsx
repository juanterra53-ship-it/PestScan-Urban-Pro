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
  Globe, Cpu, Image as ImageIcon, WifiOff, RefreshCw
} from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { supabase } from './supabaseClient';
import { analyzePestImage, analyzePestByName, loadLocalModel, isLocalModelLoaded, getModelStatus, analyzeOffline, generatePestAudio } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';
import { ENCYCLOPEDIA_DATA } from './data/encyclopedia';

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

  useEffect(() => {
    const checkModel = setInterval(() => {
      const ready = isLocalModelLoaded();
      const status = getModelStatus();
      setIsModelReady(ready);
      setModelStatus(status);
      if (ready) {
        clearInterval(checkModel);
      }
    }, 1000);
    return () => clearInterval(checkModel);
  }, []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const themeColor = (view === 'splash' || view === 'auth') ? '#022c22' : '#064e3b';
    const bodyBg = (view === 'splash' || view === 'auth') ? '#022c22' : '#f8fafc';
    
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.querySelector('meta[name="msapplication-navbutton-color"]')?.setAttribute('content', themeColor);
    document.body.style.backgroundColor = bodyBg;
    document.documentElement.style.backgroundColor = bodyBg;

    loadLocalModel();
  }, [view]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        loadLocalModel().catch(e => console.warn("Modelo offline:", e));
        await new Promise(r => setTimeout(r, 2500));

        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          if (isMounted) setView('main');
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error) {
           setView('auth');
           return;
        }

        if (data.session?.user) {
          setUser({ 
            id: data.session.user.id, 
            email: data.session.user.email || '', 
            name: data.session.user.email?.split('@')[0] || 'Usuário' 
          });
          fetchHistory();
          setView('main');
        } else {
          setView('auth');
        }
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
      const { data } = await supabase.from('pest_detections').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) setHistory(data.map((item: any) => ({ id: item.id, timestamp: new Date(item.created_at).getTime(), image: item.image_data, result: item.analysis_result })));
    } catch (err) { console.error(err); }
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
      setError("Câmera não suportada.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
      setError("Erro ao iniciar câmera.");
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
      } catch (err) {}
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
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64 = dataUrl.split(',')[1];

      const res = await analyzePestImage(base64, canvas);
      setCurrentResult({ ...res, capturedImage: dataUrl });
      setView('result');

      if (res.pestFound && user && user.id !== 'offline') {
        await supabase.from('pest_detections').insert({ 
          user_id: user.id, 
          image_data: dataUrl, 
          pest_name: res.pest?.name || 'Scan', 
          confidence: res.confidence, 
          analysis_result: res 
        });
        fetchHistory();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const res = await analyzePestImage(dataUrl.split(',')[1]);
      setCurrentResult({ ...res, capturedImage: dataUrl });
      setView('result');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAiDeepSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true); setIsAiSearching(true);
    try {
      const res = await analyzePestByName(searchTerm);
      if (res.pest) {
        setSelectedPest(res.pest);
        setView('detail');
      } else {
        setError("Não encontrado.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false); setIsAiSearching(false);
    }
  };

  const PestBioCard = ({ pest }: { pest: PestInfo }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
       <div className="flex justify-between items-start mb-4">
         <div>
           <h2 className="text-2xl font-black text-slate-900">{pest.name}</h2>
           <p className="text-emerald-600 font-bold italic text-sm">{pest.scientificName}</p>
         </div>
         <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Risco {pest.riskLevel}</div>
       </div>
       <div className="space-y-4">
         <p className="text-sm text-slate-600">{pest.habits}</p>
         <div className="bg-emerald-900 p-5 rounded-[2rem] text-white space-y-4">
           <div>
             <h4 className="font-black text-[10px] uppercase text-emerald-300">Controle</h4>
             <ul className="text-[11px] mt-2">{(pest.controlMethods || []).map((m, i) => <li key={i}>• {m}</li>)}</ul>
           </div>
           <div>
             <h4 className="font-black text-[10px] uppercase text-emerald-300">Medidas Químicas</h4>
             <ul className="text-[11px] mt-2">{(pest.chemicalMeasures || []).map((m, i) => <li key={i}>• {m}</li>)}</ul>
           </div>
         </div>
       </div>
    </div>
  );

  if (view === 'splash') return (
    <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <Bug className="w-20 h-20 text-emerald-400 animate-bounce mb-4" />
      <h1 className="text-3xl font-black">PestScan Pro</h1>
      <p className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.3em] mt-2">v2.7 Stable</p>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8">
      <Bug className="w-12 h-12 text-emerald-400 mb-6" />
      <form onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          if (authMode === 'login') await supabase.auth.signInWithPassword({ email, password });
          else await supabase.auth.signUp({ email, password });
        } catch (e: any) { setError(e.message); }
        finally { setLoading(false); }
      }} className="w-full max-w-xs space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white" />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white" />
        <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl uppercase">Entrar</button>
      </form>
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-emerald-400 text-xs font-bold uppercase">Trocar para {authMode === 'login' ? 'Cadastro' : 'Login'}</button>
      <button onClick={() => { setUser({id:'off', email:'off', name:'Offline'}); setView('main'); }} className="mt-4 text-slate-400 text-xs font-bold uppercase underline">Modo Offline</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      <header className="bg-emerald-900 p-6 pt-12 pb-10 rounded-b-[3.5rem] text-white sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Bug className="text-emerald-400 w-8 h-8" />
            <div>
              <h1 className="font-black text-xl">PestScan Pro</h1>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
            </div>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="p-2 bg-white/10 rounded-xl"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 pb-32 overflow-y-auto">
        {error && <div className="bg-red-50 p-4 rounded-2xl mb-6 text-red-600 text-xs font-bold">{error}</div>}
        
        {view === 'main' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input type="text" placeholder="Pesquisar praga..." className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-4 text-sm outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="grid gap-3">
              {ENCYCLOPEDIA_DATA.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                <button key={item.id} onClick={() => { setSelectedPest(item.details); setView('detail'); }} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex-1"><p className="font-black text-slate-800 text-sm">{item.name}</p></div>
                  <ChevronRight size={18} className="text-slate-200" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="flex flex-col items-center">
             <div className="w-full aspect-[4/5] bg-slate-900 rounded-[3rem] overflow-hidden border-4 border-white shadow-xl relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 z-50">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-black/50 text-white rounded-xl"><ImageIcon size={24} /></button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                {hasFlash && <button onClick={toggleFlash} className={`absolute top-4 right-4 p-3 rounded-xl ${flashOn ? 'bg-yellow-400' : 'bg-black/50 text-white'}`}><Zap size={24} /></button>}
             </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            {history.map(entry => (
              <div key={entry.id} className="bg-white p-3 rounded-2xl border border-slate-100 flex gap-4 items-center">
                <img src={entry.image} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1"><p className="text-xs font-black">{entry.result.pest?.name || "Scan"}</p></div>
                <button onClick={() => { setCurrentResult(entry.result); setView('result'); }}><ChevronRight size={20} /></button>
              </div>
            ))}
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="space-y-6">
            <img src={currentResult.capturedImage} className="w-full aspect-square object-cover rounded-[3rem] shadow-xl" />
            {currentResult.pestFound && currentResult.pest ? <PestBioCard pest={currentResult.pest} /> : <div className="p-6 bg-white rounded-2xl text-center">Não identificado.</div>}
            <button onClick={() => setView('main')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black">FECHAR</button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-6">
            <button onClick={() => setView('main')} className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><ArrowLeft size={16} /> Voltar</button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-10 pt-4 pb-10 flex justify-around items-center z-50 rounded-t-[3rem] shadow-lg">
        <button onClick={() => setView('main')} className={view === 'main' ? 'text-emerald-600' : 'text-slate-300'}><BookOpen size={24} /></button>
        <button onClick={handleCapture} className="w-16 h-16 -mt-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl"><Camera size={28} /></button>
        <button onClick={() => setView('history')} className={view === 'history' ? 'text-emerald-600' : 'text-slate-300'}><History size={24} /></button>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-emerald-950/90 z-[100] flex flex-col items-center justify-center text-white">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
          <p className="font-black uppercase tracking-widest">Processando...</p>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
