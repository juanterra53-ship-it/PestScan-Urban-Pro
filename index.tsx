import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Bug, Camera, BookOpen, History, 
  ChevronRight, ArrowLeft, Loader2, 
  ShieldAlert, Volume2, Sparkles, 
  AlertTriangle, X, Search, Info, Key,
  Trash2, Clock, Hammer, FlaskConical,
  User, Lock, Mail, LogOut, CheckCircle,
  Database, ShieldCheck, Zap, ZapOff,
  Globe, Cpu, Image as ImageIcon
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { analyzePestImage, analyzePestByName, loadLocalModel } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';

// Dados da Enciclopédia (Mesmos do seu app)
const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
  { 
    id: '1', name: 'Escorpião Amarelo', category: 'Aracnídeos', icon: '🦂',
    details: {
      name: 'Escorpião Amarelo', scientificName: 'Tityus serrulatus', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Tronco amarelo-claro', 'Serrilha dorsal no 4º segmento da cauda'],
      anatomy: 'Possui cefalotórax e abdômen com ferrão.',
      members: '4 pares de pernas.',
      habits: 'Noturno. Habita esgotos e entulhos.',
      reproduction: 'Partenogênese.',
      larvalPhase: 'Ninfas nascem vivas.',
      controlMethods: ['Manejo ambiental'],
      physicalMeasures: ['Telas em ralos'],
      chemicalMeasures: ['Inseticidas profissionais'],
      healthRisks: 'Picada extremamente dolorosa com risco de morte.'
    }
  }
  // ... adicione os outros se desejar, ou mantenha os que já existem no seu GitHub
];

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
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{id: string; email: string; name: string} | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'splash') {
        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          setView('main');
        } else {
          checkSession();
        }
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [view]);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();
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
  };

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
    setFlashOn(false);
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || JSON.stringify(err);
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

  const PestBioCard = ({ pest }: { pest: PestInfo }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
       <h2 className="text-2xl font-black text-slate-900">{pest.name}</h2>
       <p className="text-emerald-600 font-bold italic mb-4">{pest.scientificName}</p>
       <div className="space-y-4 text-sm text-slate-600">
         <p><strong>Hábitos:</strong> {pest.habits}</p>
         <div className="bg-emerald-900 p-4 rounded-2xl text-white">
           <p className="font-black text-[10px] uppercase text-emerald-300 mb-2">Controle</p>
           <ul className="text-xs space-y-1">
             {pest.controlMethods.map((m, i) => <li key={i}>• {m}</li>)}
           </ul>
         </div>
       </div>
    </div>
  );

  if (view === 'splash') return (
    <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white">
      <Bug className="w-20 h-20 text-emerald-400 animate-bounce mb-4" />
      <h1 className="text-3xl font-black">PestScan Pro</h1>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8">
      <Bug className="w-12 h-12 text-emerald-400 mb-6" />
      <h1 className="text-2xl font-black text-white mb-6 uppercase">Acessar App</h1>
      <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); try { await supabase.auth.signInWithPassword({ email, password }); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }} className="w-full max-w-xs space-y-4">
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <button className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-sm shadow-lg">Entrar</button>
      </form>
      <button onClick={() => { setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' }); setView('main'); }} className="mt-8 text-slate-400 text-xs font-bold uppercase underline">Entrar no Modo Offline</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative">
      <header className="bg-emerald-900 p-6 pt-12 pb-8 rounded-b-[3rem] text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Bug className="text-emerald-400" />
          <h1 className="font-black">PestScan Pro</h1>
        </div>
        <button onClick={() => { supabase.auth.signOut(); setUser(null); setView('auth'); }} className="p-2 bg-white/10 rounded-xl"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-6 pb-32">
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-4 text-xs font-bold">{error}</div>}
        
        {view === 'main' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center gap-3">
              <Search className="text-slate-300" size={20} />
              <input type="text" placeholder="Pesquisar praga..." className="flex-1 outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="grid gap-3">
              {ENCYCLOPEDIA_DATA.map(item => (
                <button key={item.id} onClick={() => { setSelectedPest(item.details); setView('detail'); }} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-slate-800">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="flex flex-col items-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/5] bg-black rounded-[3rem] object-cover border-4 border-white shadow-xl" />
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase">Aponte para a praga</p>
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="space-y-6">
            <img src={currentResult.capturedImage} className="w-full aspect-square object-cover rounded-[3rem] shadow-xl" />
            {currentResult.pestFound && currentResult.pest ? <PestBioCard pest={currentResult.pest} /> : <p>Não identificado.</p>}
            <button onClick={() => setView('main')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Voltar</button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-4">
            <button onClick={() => setView('main')} className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md p-6 flex justify-around border-t rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => { setView('main'); stopCamera(); }} className={view === 'main' ? 'text-emerald-600' : 'text-slate-300'}><BookOpen /></button>
        <button onClick={handleCapture} className="w-16 h-16 -mt-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-xl"><Camera /></button>
        <button onClick={() => { setView('history'); stopCamera(); }} className={view === 'history' ? 'text-emerald-600' : 'text-slate-300'}><History /></button>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-emerald-950/90 z-[100] flex flex-col items-center justify-center text-white">
          <div className="w-12 h-12 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mb-4" />
          <p className="font-black uppercase text-[10px] tracking-widest">Analisando...</p>
        </div>
      )}
    </div>
  );
};

// Error Boundary para evitar crash total
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center"><h1>Erro Crítico. Recarregue a página.</h1></div>;
    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  // @ts-ignore
  const root = container._reactRoot || createRoot(container);
  // @ts-ignore
  container._reactRoot = root;
  root.render(<ErrorBoundary><App /></ErrorBoundary>);
}
