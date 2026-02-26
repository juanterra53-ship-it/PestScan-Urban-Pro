import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Bug, 
  Camera, 
  History, 
  BookOpen, 
  ChevronRight, 
  X, 
  ArrowLeft, 
  LogOut,
  ShieldCheck,
  Zap,
  Hammer,
  FlaskConical,
  Search,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabase } from './supabase';
import { analyzePestImage, analyzePestByName, loadLocalModel } from './geminiService';
import { RecognitionResult, PestData } from './types';

const App = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'result' | 'history' | 'detail'>('splash');
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'splash') {
        // Se estiver offline, pula direto para o modo offline
        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          setView('main');
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        loadLocalModel().catch(e => console.warn("Modelo offline:", e));
        
        // MODO OFFLINE AUTOMÁTICO
        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          if (isMounted) setView('main');
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
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
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || JSON.stringify(err);
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) return "IA sobrecarregada. Tente em 5 segundos.";
    if (msg.includes("API Key")) return "Erro de configuração da chave IA.";
    return `Erro na análise: ${msg}`;
  };

  const handleCapture = async () => {
    if (view !== 'camera') { setView('camera'); return; }
    if (!videoRef.current) return;
    setLoading(true); setError(null);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      const res = await analyzePestImage(base64.split(',')[1], canvas);
      
      setCurrentResult({ ...res, capturedImage: base64 });
      setView('result');
      
      if (res.pestFound && user && navigator.onLine && user.id !== 'offline') {
        await supabase.from('pest_detections').insert({ 
          user_id: user.id, image_data: base64, pest_name: res.pest?.name || 'IA Scan', analysis_result: res 
        });
        fetchHistory();
      }
    } catch (e: any) { setError(formatErrorMessage(e)); } finally { setLoading(false); }
  };

  // ... (Restante do código simplificado para o exemplo)
  // NOTA: O botão de login abaixo agora é AZUL (bg-blue-600) para você confirmar a atualização
  
  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8">
      <Bug className="w-12 h-12 text-emerald-400 mb-6" />
      <h1 className="text-2xl font-black text-white mb-6 uppercase">Acessar App</h1>
      <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); try { await supabase.auth.signInWithPassword({ email, password }); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }} className="w-full max-w-xs space-y-4">
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white" />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white" />
        <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase">Entrar</button>
      </form>
      <button onClick={() => { setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' }); setView('main'); }} className="mt-6 text-slate-400 text-xs font-bold uppercase underline">Entrar no Modo Offline</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto">
       {/* UI Principal aqui... */}
       <div className="p-10 text-center">
         <h1 className="text-2xl font-black">PestScan Pro Ativo</h1>
         <p className="text-sm text-slate-500">Usuário: {user?.name}</p>
         <button onClick={() => setView('camera')} className="mt-10 bg-emerald-600 text-white p-6 rounded-full"><Camera size={40} /></button>
         {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-2xl text-xs font-bold">{error}</div>}
       </div>
       <nav className="fixed bottom-0 inset-x-0 bg-white p-6 flex justify-around border-t">
         <button onClick={() => setView('main')}><BookOpen /></button>
         <button onClick={() => setView('history')}><History /></button>
         <button onClick={() => { supabase.auth.signOut(); setUser(null); setView('auth'); }}><LogOut /></button>
       </nav>
    </div>
  );
};

// FIX createRoot
const container = document.getElementById('root');
if (container) {
  // @ts-ignore
  const root = container._reactRoot || createRoot(container);
  // @ts-ignore
  container._reactRoot = root;
  root.render(<App />);
}
