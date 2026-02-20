import './index.css';
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
import { analyzePestImage, analyzePestByName, generatePestAudio } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';

const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
  { 
    id: '1', name: 'Escorpião Amarelo', category: 'Aracnídeos', icon: '🦂',
    details: {
      name: 'Escorpião Amarelo', scientificName: 'Tityus serrulatus', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Tronco amarelo-claro', 'Serrilha dorsal no 4º segmento da cauda', 'Manchas escuras no final da cauda'],
      anatomy: 'Possui cefalotórax, abdômen (pré e pós-abdômen) e um telson com ferrão e glândulas de veneno neurotóxico.',
      members: '4 pares de pernas e 1 par de quelíceras e pedipalpos (pinças).',
      habits: 'Noturno e lucífugo. Habita galerias de esgoto, frestas em paredes, pilhas de tijolos e entulhos. Alimenta-se principalmente de baratas.',
      reproduction: 'Partenogênese: a fêmea se reproduz sem necessidade de macho, gerando clones de si mesma.',
      larvalPhase: 'As ninfas nascem vivas e permanecem no dorso da mãe até a primeira muda (cerca de 10-14 dias).',
      controlMethods: ['Manejo ambiental rigoroso', 'Busca ativa noturna com luz UV', 'Controle biológico natural (galinhas/gambás)'],
      physicalMeasures: ['Telas metálicas em ralos e janelas', 'Vedação de frestas com silicone', 'Limpeza constante de quintais e jardins'],
      chemicalMeasures: ['Inseticidas microencapsulados de longo residual', 'Aplicação profissional em pontos estratégicos', 'Evitar desalojantes comuns'],
      healthRisks: 'Picada extremamente dolorosa com risco de morte por edema pulmonar e choque cardiogênico, especialmente em crianças e idosos.'
    }
  },
  { 
    id: '2', name: 'Aranha Marrom', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Marrom', scientificName: 'Loxosceles spp.', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Pequena (3-4cm com pernas)', 'Cor marrom-claro a acinzentado', 'Mancha em formato de violino no cefalotórax'],
      anatomy: 'Corpo dividido em cefalotórax e abdômen. Possui 6 olhos dispostos em 3 pares (diferente da maioria das aranhas que tem 8).',
      members: '8 pernas finas e longas, pedipalpos pequenos.',
      habits: 'Sedentária e não agressiva. Vive em ambientes escuros e secos: atrás de quadros, móveis, pilhas de roupas e sótãos. Teia irregular (algodão).',
      reproduction: 'A fêmea produz ootecas de seda branca contendo de 30 a 100 ovos cada.',
      larvalPhase: 'Os filhotes eclodem após 40 dias e passam por várias mudas até a fase adulta.',
      controlMethods: ['Limpeza profunda com aspirador de pó', 'Inspeção de roupas e calçados antes do uso', 'Uso de luvas em limpezas'],
      physicalMeasures: ['Aspirar atrás de móveis e rodapés', 'Sacudir sapatos e roupas de cama', 'Afastar camas e sofás das paredes'],
      chemicalMeasures: ['Piretróides microencapsulados em frestas', 'Polvilhamento químico em conduítes elétricos', 'Tratamento perimetral'],
      healthRisks: 'Veneno proteolítico que causa necrose tecidual severa (ferida que não cicatriza) e, em casos graves, falência renal (hemólise).'
    }
  },
  { 
    id: '5', name: 'Barata Germânica', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Germânica', scientificName: 'Blattella germanica', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Pequena (1.5cm)', 'Duas faixas longitudinais escuras no pronoto', 'Cor marrom-claro'],
      anatomy: 'Corpo oval e achatado dorso-ventralmente. Possui asas, mas raramente voa.',
      members: '6 pernas espinhosas adaptadas para corrida rápida.',
      habits: 'Prefere locais quentes e úmidos com acesso a comida. Comum em cozinhas, motores de eletrodomésticos, frestas de armários e pias.',
      reproduction: 'A fêmea carrega a ooteca (estojo de ovos) até momentos antes da eclosão. Cada ooteca contém 30-40 ovos.',
      larvalPhase: 'As ninfas passam por 6 a 7 mudas. São menores, mais escuras e não possuem asas.',
      controlMethods: ['Aplicação de iscas em gel', 'Monitoramento com armadilhas adesivas', 'Eliminação de fontes de água e abrigo'],
      physicalMeasures: ['Limpeza profunda de gordura', 'Vedar frestas em azulejos e bancadas', 'Manter lixeiras hermeticamente fechadas'],
      chemicalMeasures: ['Gel isca de alta atratividade (Indoxacarbe/Fipronil)', 'Reguladores de crescimento (IGR)', 'Pulverização focal'],
      healthRisks: 'Transmissão mecânica de patógenos (Salmonella, E. coli), além de ser um potente alérgeno causador de asma e rinites.'
    }
  },
  { 
    id: '6', name: 'Barata Americana', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Americana', scientificName: 'Periplaneta americana', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Grande (até 5cm)', 'Cor marrom-avermelhada brilhante', 'Borda amarela no pronoto'],
      anatomy: 'Asas longas que cobrem todo o abdômen. Excelentes voadoras em temperaturas altas.',
      members: '6 pernas longas e robustas com espinhos sensoriais.',
      habits: 'Habita sistemas de esgoto, caixas de gordura, bueiros e porões. Entra em residências em busca de alimento ou durante chuvas.',
      reproduction: 'A fêmea deposita a ooteca em locais protegidos e úmidos logo após sua formação. Contém cerca de 16 ovos.',
      larvalPhase: 'As ninfas são resistentes e levam de 6 a 12 meses para atingir a maturidade sexual.',
      controlMethods: ['Barreira química perimetral', 'Saneamento básico', 'Tratamento de redes de esgoto e águas pluviais'],
      physicalMeasures: ['Instalação de ralos do tipo "abre-fecha"', 'Vedação de tampas de inspeção de esgoto', 'Colocação de rodinhos de porta'],
      chemicalMeasures: ['Desinsetização líquida por pulverização ou atomização', 'Pós químicos em áreas secas', 'Iscas granuladas externas'],
      healthRisks: 'Principal vetor de doenças entéricas, transportando bactérias, fungos e vírus de esgotos para superfícies de manipulação de alimentos.'
    }
  }
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
  const [zoom, setZoom] = useState(1);
  const [zoomCaps, setZoomCaps] = useState<{ min: number; max: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{id: string; email: string; name: string} | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => checkSession(), 2500);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '', name: session.user.email?.split('@')[0] || 'Usuário' });
        fetchHistory();
        if (view === 'splash' || view === 'auth') setView('main');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('auth');
      }
    });
    return () => { clearTimeout(timer); authListener.subscription.unsubscribe(); };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({ id: user.id, email: user.email || '', name: user.email?.split('@')[0] || 'Usuário' });
        await fetchHistory();
        setView('main');
      } else setView('auth');
    } catch { setView('auth'); }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await supabase.from('pest_detections').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) setHistory(data.map((item: any) => ({ id: item.id, timestamp: new Date(item.created_at).getTime(), image: item.image_data, result: item.analysis_result })));
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        if (track.kind === 'video') {
            try { 
                (track as any).applyConstraints({ advanced: [{ torch: false }] }); 
            } catch(e) {}
        }
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setFlashOn(false);
    setZoom(1);
    setZoomCaps(null);
  };

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getDistance(e.touches);
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null && zoomCaps) {
      const currentDist = getDistance(e.touches);
      const ratio = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(zoomCaps.max, Math.max(zoomCaps.min, initialZoomRef.current * ratio));
      if (Math.abs(newZoom - zoom) > 0.01) {
        setZoom(newZoom);
      }
    }
  };

  useEffect(() => {
    if (streamRef.current && zoomCaps) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && (track as any).getCapabilities?.().zoom) {
        (track as any).applyConstraints({ advanced: [{ zoom }] }).catch((e: any) => console.error("Zoom apply error:", e));
      }
    }
  }, [zoom, zoomCaps]);

  useEffect(() => {
    if (view === 'camera') {
      const initCamera = async () => {
        setError(null); 
        setHasFlash(false); 
        setFlashOn(false);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            
            setTimeout(() => {
                const track = stream.getVideoTracks()[0];
                if (track) {
                  const caps = (track as any).getCapabilities?.() || {};
                  if (caps.torch) {
                    setHasFlash(true);
                  } else {
                    const settings = track.getSettings();
                    if ('torch' in settings) setHasFlash(true);
                  }

                  if (caps.zoom) {
                    setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max });
                    const currentZoom = (track.getSettings() as any).zoom || caps.zoom.min;
                    setZoom(currentZoom);
                  }
                }
            }, 1000);
          }
        } catch (e: any) { 
            console.error(e);
            setError("Câmera indisponível: Verifique as permissões do seu navegador."); 
        }
      };
      initCamera();
    }
    return () => stopCamera();
  }, [view]);

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;
      
      const next = !flashOn;
      try {
          await (track as any).applyConstraints({ advanced: [{ torch: next }] });
          setFlashOn(next);
      } catch (err: any) {
          console.error("Erro ao alternar lanterna:", err);
          setError("Seu dispositivo não permitiu o controle da lanterna no momento.");
      }
    }
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || JSON.stringify(err);
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) return "O servidor de IA está com alta demanda agora. Por favor, aguarde um instante e tente novamente.";
    if (msg.includes("429")) return "Muitas solicitações seguidas. Aguarde 10 segundos.";
    if (msg.includes("API Key")) return "Chave da IA não configurada corretamente.";
    if (msg.includes("setPhotoOptions")) return "Hardware da câmera ocupado. Reiniciando visor...";
    return "Ocorreu um problema na análise. Tente novamente.";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true); setError(null);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64 = base64Data.split(',')[1];
      const res = await analyzePestImage(base64);
      const fullRes = { ...res, capturedImage: base64Data };
      
      setCurrentResult(fullRes);
      if (res.pestFound && user) {
        await supabase.from('pest_detections').insert({ 
          user_id: user.id, 
          image_data: fullRes.capturedImage, 
          pest_name: res.pest?.name || 'IA Gallery Scan', 
          confidence: res.confidence, 
          analysis_result: fullRes 
        });
        fetchHistory();
      }
      setView('result');
    } catch (e: any) {
      setError(formatErrorMessage(e));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCapture = async () => {
    if (view !== 'camera') { setView('camera'); return; }
    if (!videoRef.current) return;
    
    setLoading(true); setError(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const res = await analyzePestImage(base64);
      const fullRes = { ...res, capturedImage: `data:image/jpeg;base64,${base64}` };
      setCurrentResult(fullRes);
      if (res.pestFound && user) {
        await supabase.from('pest_detections').insert({ user_id: user.id, image_data: fullRes.capturedImage, pest_name: res.pest?.name || 'IA Scan', confidence: res.confidence, analysis_result: fullRes });
        fetchHistory();
      }
      setView('result');
    } catch (e: any) { 
      setError(formatErrorMessage(e)); 
    } finally { setLoading(false); }
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
        setError("Nenhum dado biológico encontrado para este termo.");
      }
    } catch (e: any) { 
      setError(formatErrorMessage(e)); 
    } finally { setLoading(false); setIsAiSearching(false); }
  };

  const filteredData = ENCYCLOPEDIA_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PestBioCard = ({ pest }: { pest: PestInfo }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in">
       <div className="flex justify-between items-start mb-4">
         <div className="flex-1 pr-4">
           <h2 className="text-2xl font-black text-slate-900 leading-tight">{pest.name}</h2>
           <p className="text-emerald-600 font-bold italic text-sm">{pest.scientificName}</p>
         </div>
         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap ${pest.riskLevel === 'Crítico' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>Risco {pest.riskLevel}</div>
       </div>
       <div className="space-y-4">
         <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Membros</p><p className="text-sm font-bold text-slate-700">{pest.members}</p></div>
           <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Reprodução</p><p className="text-sm font-bold text-slate-700 truncate">{pest.reproduction}</p></div>
         </div>
         <div className="space-y-2">
           <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Info size={14} /> Biologia e Hábitos</h4>
           <p className="text-sm text-slate-600 leading-relaxed">{pest.habits}</p>
         </div>
         <div className="bg-emerald-900 p-5 rounded-[2rem] text-white shadow-inner space-y-4">
           <div>
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><ShieldCheck size={14} /> Métodos de Controle</h4>
             <ul className="space-y-1">
               {pest.controlMethods.map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>
           <div className="pt-3 border-t border-emerald-800">
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><Hammer size={12} /> Medidas Físicas</h4>
             <ul className="space-y-1">
               {pest.physicalMeasures.map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>
           <div className="pt-3 border-t border-emerald-800">
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><FlaskConical size={12} /> Medidas Químicas</h4>
             <ul className="space-y-1">
               {pest.chemicalMeasures.map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>
         </div>
       </div>
    </div>
  );

  if (view === 'splash') return (
    <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
      <Bug className="w-20 h-20 text-emerald-400 animate-bounce mb-4" />
      <h1 className="text-3xl font-black tracking-tight">PestScan Pro</h1>
      <p className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.3em] mt-2">Inteligência Bio-Urbana</p>
    </div>
  );

  if (view === 'auth') return (
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8">
      <div className="bg-emerald-900/50 p-4 rounded-3xl mb-4"><Bug className="w-12 h-12 text-emerald-400" /></div>
      <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-wider">{authMode === 'login' ? 'Acessar App' : 'Criar Cadastro'}</h1>
      <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); try { if (authMode === 'login') await supabase.auth.signInWithPassword({ email, password }); else await supabase.auth.signUp({ email, password }); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }} className="w-full max-w-xs space-y-4">
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <button className="w-full bg-emerald-500 text-emerald-950 font-black py-4 rounded-2xl uppercase text-sm">Entrar</button>
      </form>
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-emerald-400 text-xs font-bold uppercase">Trocar para {authMode === 'login' ? 'Cadastro' : 'Login'}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      <header className="bg-emerald-900 p-6 pt-12 pb-8 rounded-b-[3.5rem] text-white sticky top-0 z-40 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl"><Bug className="text-emerald-400 w-6 h-6" /></div>
            <div><h1 className="font-black text-lg">PestScan Pro</h1><p className="text-[10px] text-emerald-400/60 font-bold uppercase">{user?.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {user && <button onClick={() => supabase.auth.signOut()} className="p-2 bg-white/10 rounded-xl"><LogOut size={20} /></button>}
            {view !== 'main' && <button onClick={() => { setView('main'); stopCamera(); setError(null); }} className="p-2 bg-white/10 rounded-xl"><X size={20} /></button>}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 pb-36 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-[2.5rem] mb-6 flex items-start gap-3 animate-in">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed font-bold">{error}</p>
          </div>
        )}
        
        {view === 'main' && (
          <div className="space-y-6 animate-in">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input type="text" placeholder="Pesquisar praga ou caruncho..." className="w-full h-14 bg-white border border-slate-100 rounded-[1.5rem] pl-12 pr-12 text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              {searchTerm && (
                 <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 p-1 hover:text-slate-500"><X size={16} /></button>
              )}
            </div>

            <div className="grid gap-3">
              {filteredData.map(item => (
                <button key={item.id} onClick={() => { setSelectedPest(item.details); setView('detail'); }} className="flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-left active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl">{item.icon}</div>
                  <div className="flex-1"><p className="font-black text-slate-800 text-sm leading-none mb-1">{item.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{item.category}</p></div>
                  <ChevronRight size={18} className="text-slate-200" />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="flex flex-col items-center animate-in">
             <div 
                className="w-full aspect-[4/5] bg-slate-900 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl relative touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => { touchStartDistRef.current = null; }}
             >
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />

                <div className="absolute top-6 left-6 flex gap-2 z-[60]">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl bg-black/40 text-white border border-white/20 backdrop-blur-md transition-all active:scale-90 shadow-lg"
                    aria-label="Abrir Galeria"
                  >
                    <ImageIcon size={24} />
                  </button>
                </div>

                {hasFlash && (
                  <button 
                    onClick={e => { 
                        e.stopPropagation(); 
                        toggleFlash(); 
                    }} 
                    className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md transition-all active:scale-90 z-[60] shadow-lg ${
                        flashOn ? 'bg-yellow-400 text-yellow-950 shadow-yellow-400/30' : 'bg-black/40 text-white border border-white/20'
                    }`}
                    aria-label="Alternar Lanterna"
                  >
                    {flashOn ? <Zap size={24} fill="currentColor" /> : <ZapOff size={24} />}
                  </button>
                )}

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                   <div className="w-3/4 h-3/4 border-2 border-emerald-400/40 rounded-[2.5rem] relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                   </div>
                </div>
             </div>
             <p className="mt-8 text-sm font-bold text-slate-600 px-8 text-center leading-relaxed">Centralize a praga no visor para detecção bio-métrica.</p>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Recentes</h3>
            <div className="grid gap-4">
              {history.map(entry => (
                <div key={entry.id} className="bg-white p-3 rounded-[2.5rem] border border-slate-100 flex gap-4 items-center shadow-sm">
                  <img src={entry.image} className="w-16 h-16 rounded-2xl object-cover shadow-inner" />
                  <div className="flex-1 overflow-hidden"><p className="text-xs font-black text-slate-900 truncate">{entry.result.pest?.name || "Scan Desconhecido"}</p><p className="text-[10px] text-emerald-600 font-bold">{new Date(entry.timestamp).toLocaleDateString()}</p></div>
                  <button onClick={() => { setCurrentResult(entry.result); setView('result'); }} className="p-2 text-slate-300"><ChevronRight size={20} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="space-y-6 pb-10 animate-in">
            <div className="relative">
              <img src={currentResult.capturedImage} className="w-full aspect-square object-cover rounded-[3.5rem] border-4 border-white shadow-2xl" />
              <div className="absolute top-4 right-4 bg-emerald-900/90 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[10px] font-black">{(currentResult.confidence * 100).toFixed(0)}% MATCH</div>
            </div>
            {currentResult.pestFound && currentResult.pest ? <PestBioCard pest={currentResult.pest} /> : <div className="bg-white p-10 rounded-[2.5rem] text-center"><p className="font-bold text-slate-500">Praga não catalogada ou imagem inconclusiva.</p></div>}
            <button onClick={() => setView('main')} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Encerrar Análise</button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-6 pb-10 animate-in">
            <button onClick={() => { setView('main'); setSelectedPest(null); }} className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-50"><ArrowLeft size={16} /> Voltar</button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-10 pt-4 pb-12 flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]">
        <button onClick={() => { setView('main'); stopCamera(); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'main' || view === 'detail' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}><BookOpen size={24} /><span className="text-[8px] font-black uppercase">Guia</span></button>
        <button onClick={handleCapture} className="w-20 h-20 -mt-20 bg-emerald-600 rounded-full flex items-center justify-center border-[6px] border-slate-50 shadow-2xl active:scale-90 transition-all text-white"><Camera size={28} /></button>
        <button onClick={() => { setView('history'); stopCamera(); }} className={`flex flex-col items-center gap-1 transition-all ${view === 'history' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}><History size={24} /><span className="text-[8px] font-black uppercase">Scans</span></button>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-10 text-center">
          <div className="w-20 h-20 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin mb-8 shadow-inner" />
          <h2 className="text-xl font-black mb-2 animate-pulse uppercase tracking-wider">Acessando IA Urbana</h2>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">{isAiSearching ? 'Mapeando Banco de Dados Global' : 'Analisando Estrutura Biológica'}</p>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
