import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Bug, Camera, BookOpen, History, 
  ChevronRight, ArrowLeft, Loader2, 
  ShieldAlert, Volume2, Sparkles, 
  AlertTriangle, X, Search, Info, Key,
  Trash2, Clock, Hammer, FlaskConical, Eye,
  User, Lock, Mail, LogOut, CheckCircle,
  Database, ShieldCheck, Zap, ZapOff,
  Globe, Cpu, Image as ImageIcon, WifiOff, RefreshCw, Printer, Save, FileText,
  ChevronDown, ChevronUp, Activity, AlertCircle, Share2, Map as MapIcon, MapPin
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, FeatureGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { registerSW } from 'virtual:pwa-register';
import { motion, AnimatePresence } from 'framer-motion';
import SignaturePad from 'signature_pad';
import './index.css';
import { supabase } from './supabaseClient';
import PestScanPrivacy from './legal/PestScanPrivacy';
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

const isValidCoord = (val: any) => typeof val === 'number' && !isNaN(val) && Math.abs(val) > 0.0001;

const MapViewUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && isValidCoord(center[0]) && isValidCoord(center[1])) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapEvents: React.FC<{ onMoveStart: () => void, onMapClick?: (lat: number, lon: number) => void }> = ({ onMoveStart, onMapClick }) => {
  useMapEvents({
    movestart: onMoveStart,
    click: (e) => {
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Map Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] p-8 text-center border-2 border-dashed border-slate-200">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h3 className="text-slate-900 font-black uppercase tracking-tight mb-2">Erro ao Carregar Mapa</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest max-w-[200px]">
            Houve um problema ao renderizar o mapa. Tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Recarregar App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Componente de Cartão Biológico (Movido para fora do App para evitar re-criação e flickering)
const PestBioCard = ({ pest }: { pest: PestInfo }) => (
  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
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
       <p className="text-sm text-slate-600 leading-relaxed">{pest.habits || pest.description}</p>
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
           <FlaskConical size={12} /> Medidas Químicas (Princípios Ativos/Dosagens)
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
            <AlertCircle size={14} /> Riscos à Saúde / Interesse Médico
          </h4>
          <p className="text-xs text-red-700 leading-relaxed font-medium">{pest.healthRisks}</p>
       </div>
     )}
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'history' | 'result' | 'detail' | 'privacy' | 'report' | 'report-setup' | 'map'>('splash');
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Analisando Estrutura Biológica');

  useEffect(() => {
    if (loading) {
      const messages = [
        'Analisando Estrutura Biológica',
        'Mapeando Banco de Dados Global',
        'Consultando Enciclopédia Urbana',
        'Gerando Recomendações Técnicas',
        'Verificando Nível de Risco'
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loading]);
  const [location, setLocation] = useState<{lat: number, lon: number, address: string} | null>(null);
  
  // Report Fields
  const [reportArea, setReportArea] = useState('');
  const [reportObservation, setReportObservation] = useState('');
  const [reportMeasures, setReportMeasures] = useState('');
  const [modal, setModal] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    onConfirm?: () => void, 
    onSecondary?: () => void,
    confirmText?: string,
    secondaryText?: string,
    type: 'confirm' | 'alert'
  }>({
    isOpen: false, title: '', message: '', type: 'alert'
  });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  
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
  const [mapKey, setMapKey] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [shouldFollowUser, setShouldFollowUser] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const chartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    history.forEach(h => {
      const name = h.result.pest?.name || 'Não Identificado';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, count: counts[name] })).sort((a, b) => b.count - a.count);
  }, [history]);

  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Sincroniza campos do relatório com o resultado atual
  useEffect(() => {
    if (currentResult) {
      const target = currentResult.batchResults ? currentResult.batchResults[activeBatchIndex] : currentResult;
      setReportObservation(target.observations || '');
      setReportMeasures(target.measures || '');
      setReportArea(target.area || '');
    } else {
      setReportObservation('');
      setReportMeasures('');
      setReportArea('');
    }
  }, [currentResult?.id, currentResult?.batchResults, activeBatchIndex]);

  const reportChartData = useMemo(() => {
    const entries = currentResult?.batchResults || (currentResult ? [currentResult] : []);
    const counts: { [key: string]: number } = {};
    entries.forEach(res => {
      const name = res.pest?.name || 'Não Identificado';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.keys(counts).map(name => ({ name, count: counts[name] })).sort((a, b) => b.count - a.count);
  }, [currentResult]);

  const reportEntries = useMemo(() => {
    return currentResult?.batchResults || (currentResult ? [currentResult] : []);
  }, [currentResult]);

  const [isPublicView, setIsPublicView] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const lastLocRef = useRef<{lat: number, lon: number}>({lat: 0, lon: 0});

  const [gpsStatus, setGpsStatus] = useState<'active' | 'warning' | 'error'>('active');
  const [fileInputKey, setFileInputKey] = useState(0);

  const lastWatchGeocodeTimeRef = useRef<number>(0);

  // Real-time location tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number;
    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          if (!isValidCoord(latitude) || !isValidCoord(longitude)) return;

          const dist = Math.sqrt(Math.pow(latitude - lastLocRef.current.lat, 2) + Math.pow(longitude - lastLocRef.current.lon, 2));
          const now = Date.now();
          
          // Só atualiza se moveu significativamente OU se passou mais de 30 segundos
          if (dist > 0.0002 || !location || (now - lastWatchGeocodeTimeRef.current > 30000)) {
            lastLocRef.current = { lat: latitude, lon: longitude };
            setGpsStatus('active');
            
            // Throttle para geocodificação no watch: no máximo 1 a cada 15 segundos
            if (now - lastWatchGeocodeTimeRef.current > 15000 || !location) {
              lastWatchGeocodeTimeRef.current = now;
              try {
                const address = await getReverseGeocoding(latitude, longitude);
                setLocation({ lat: latitude, lon: longitude, address });
              } catch (e) {
                console.error("Erro ao obter endereço:", e);
                setLocation(prev => prev ? { ...prev, lat: latitude, lon: longitude } : { lat: latitude, lon: longitude, address: "Localização Atual" });
              }
            } else {
              // Apenas atualiza as coordenadas sem chamar a API de endereço
              setLocation(prev => prev ? { ...prev, lat: latitude, lon: longitude } : { lat: latitude, lon: longitude, address: "Localização Atual" });
            }
          }
        },
        (error) => {
          console.error("Erro ao rastrear localização:", error);
          setGpsStatus('warning');
          if (error.code === error.TIMEOUT) {
            console.log("Reiniciando rastreamento de localização devido a timeout...");
            navigator.geolocation.clearWatch(watchId);
            setTimeout(startWatching, 5000);
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    startWatching();
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [generatedPdfFileName, setGeneratedPdfFileName] = useState<string>("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  useEffect(() => {
    if (generatedPdfBlob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfBase64(reader.result as string);
      };
      reader.readAsDataURL(generatedPdfBlob);
    } else {
      setPdfBase64(null);
    }
  }, [generatedPdfBlob]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const sigCanvas = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (sigCanvas.current && !signaturePadRef.current) {
      signaturePadRef.current = new SignaturePad(sigCanvas.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: '#064e3b'
      });
    }
  }, [view]);

  // Deep Link & Heatmap Link Handler
  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const userIdParam = params.get('userId');
      
      if (viewParam === 'heatmap' && userIdParam) {
        setIsPublicView(true);
        setLoading(true);
        showToast("Carregando Mapa de Calor Público...", "info");
        try {
          await fetchHistory(true, userIdParam);
          setView('map');
          setMapMode('satellite');
        } catch (err) {
          showToast("Erro ao carregar mapa de calor.", "error");
        } finally {
          setLoading(false);
        }
      }
    };
    initApp();
  }, [user?.id]);

  const openInNativeMaps = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, '_blank');
  };

  const generateHeatmapLink = () => {
    if (!user) return;
    // Usamos o origin atual para garantir que o link aponte para o ambiente correto (produção ou dev)
    const baseUrl = window.location.origin;
    const link = `${baseUrl}?view=heatmap&userId=${user.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mapa de Calor PestScan Pro',
        text: 'Confira os pontos de pragas em tempo real nesta unidade.',
        url: link
      }).then(() => showToast("Link compartilhado!", "success"))
        .catch(() => {
          navigator.clipboard.writeText(link);
          showToast("Link copiado para a área de transferência!", "success");
        });
    } else {
      navigator.clipboard.writeText(link);
      showToast("Link copiado!", "success");
    }
  };

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
        
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');
        const userParam = params.get('user') || params.get('userId');
        
        if ((viewParam === 'map' || viewParam === 'heatmap') && userParam) {
          console.log("📍 [App] Modo Público detectado via URL");
          setIsPublicView(true);
          fetchHistory(true, userParam);
          setView('map');
          setLoading(false);
          return;
        }

        const splashPromise = new Promise(r => setTimeout(r, 800));
        
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
        const newUser = { 
          id: session.user.id, 
          email: session.user.email || '', 
          name: session.user.email?.split('@')[0] || 'Usuário' 
        };
        setUser(prev => {
          if (prev?.id === newUser.id && prev?.email === newUser.email) return prev;
          return newUser;
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

  useEffect(() => {
    if (view === 'map') {
      fetchHistory();
    }
  }, [view]);

  // Real-time subscription for pest detections
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-pest-detections')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pest_detections',
        },
        (payload: any) => {
          console.log('Nova detecção em tempo real:', payload);
          fetchHistory();
          // Only show toast if it's not the current user's detection to avoid double notification
          if (payload.new.user_id !== user.id) {
            const pestName = payload.new.analysis_result?.pest?.name || payload.new.pest_name || 'Scan';
            showToast(`Nova praga detectada: ${pestName}`, "info");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pestIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
      className: 'custom-pest-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); z-index: 2;"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background-color: #ef4444; border-radius: 50%; opacity: 0.2; animation: pulse 2s infinite; z-index: 1;"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }, []);

  const fetchHistory = async (force = false, publicUserId?: string) => {
    const targetId = publicUserId || user?.id;
    if (!targetId && !publicUserId) return;
    if (isFetching && !force) return;
    
    // Tenta carregar do cache local primeiro se estiver offline ou para carregamento instantâneo
    const cacheKey = `pestscan_history_${targetId}`;
    const cachedData = localStorage.getItem(cacheKey);
    const offlineQueue = JSON.parse(localStorage.getItem('pestscan_offline_queue') || '[]');
    
    const mapOfflineItem = (item: any, index: number) => ({
      id: `offline_${item.timestamp}_${index}`,
      timestamp: item.timestamp,
      image: item.image_data,
      result: item.analysis_result,
      location: item.location_name
    });

    if (cachedData && !force) {
      try {
        let parsed = JSON.parse(cachedData);
        
        // Adiciona itens da fila offline que ainda não foram sincronizados
        if (offlineQueue.length > 0) {
          const offlineEntries = offlineQueue.map(mapOfflineItem);
          parsed = [...offlineEntries, ...parsed];
        }

        if (parsed.length > 0) {
          setHistory(parsed);
          if (!navigator.onLine) return; // Se offline, para por aqui
        }
      } catch (e) {
        console.error("[History] Erro ao ler cache:", e);
      }
    }

    setIsFetching(true);
    try {
      console.log(`[History] Buscando registros para: ${targetId}`);
      let query = supabase
        .from('pest_detections')
        .select('id, user_id, image_data, analysis_result, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (publicUserId) {
        query = query.eq('user_id', publicUserId);
      } else if (user) {
        const isAdmin = user.email === 'juan.terra53@gmail.com';
        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        console.log(`[History] ${data.length} registros encontrados.`);
        let mappedHistory = data.map((item: any) => {
          // ... mapping logic (already exists) ...
          console.log(`[History] Item ID: ${item.id}, Image Data length: ${item.image_data?.length || 0}, Image Data starts with: ${item.image_data?.substring(0, 30)}...`);
          let result = item.analysis_result;
          if (typeof result === 'string') {
            try { result = JSON.parse(result); } catch (e) { console.error("[History] Erro parse:", e); }
          }
          
          if (!result || typeof result !== 'object') {
            result = { pestFound: false, confidence: 0 };
          }

          // Tenta ler das colunas (se existirem) ou do JSON (fallback)
          const dbLat = item.latitude !== undefined && item.latitude !== null ? Number(item.latitude) : (result.location?.latitude);
          const dbLon = item.longitude !== undefined && item.longitude !== null ? Number(item.longitude) : (result.location?.longitude);

          if (isValidCoord(dbLat) && isValidCoord(dbLon)) {
            result.location = {
              latitude: dbLat,
              longitude: dbLon,
              address: item.location_name || result.location?.address || "Localização não disponível"
            };
          }

          return { 
            id: item.id, 
            timestamp: new Date(item.created_at).getTime(), 
            image: (item.image_data?.startsWith('http') || item.image_data?.startsWith('data:')) 
              ? item.image_data 
              : (item.image_data ? `data:image/jpeg;base64,${item.image_data}` : 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem'), 
            result: result,
            location: item.location_name || result.location?.address
          };
        });

        // Adiciona itens da fila offline ao histórico carregado do servidor
        if (offlineQueue.length > 0) {
          const offlineEntries = offlineQueue.map(mapOfflineItem);
          mappedHistory = [...offlineEntries, ...mappedHistory];
        }
        
        console.log("[History] Mapped History sample image:", mappedHistory[0]?.image?.substring(0, 30));
        
        // Salva no cache local
        localStorage.setItem(`pestscan_history_${targetId}`, JSON.stringify(mappedHistory));

        // Só atualiza se houver mudança real ou se for forçado
        setHistory(prev => {
          // Comparação mais rápida: se o tamanho mudou ou se o ID do primeiro item mudou
          const hasChanged = prev.length !== mappedHistory.length || 
                            (prev.length > 0 && mappedHistory.length > 0 && prev[0].id !== mappedHistory[0].id);
          
          if (hasChanged || force) {
            console.log("[History] Atualizando estado e forçando re-render do mapa");
            setMapKey(k => k + 1);
            return mappedHistory;
          }
          return prev;
        });
      }
    } catch (err) { 
      console.error("Erro ao carregar histórico:", err); 
    } finally {
      setIsFetching(false);
    }
  };

  // URL Parameter Handling for AI Studio / Vercel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const userParam = params.get('user') || params.get('userId');
    
    if ((viewParam === 'map' || viewParam === 'heatmap') && userParam) {
      setIsPublicView(true);
      fetchHistory(true, userParam);
      setView('map');
    }
  }, [user]);

  const syncOfflineDetections = async () => {
    if (!navigator.onLine || !user || user.id === 'offline' || isSyncing) return;
    
    const queue = JSON.parse(localStorage.getItem('pestscan_offline_queue') || '[]');
    if (queue.length === 0) return;

    setIsSyncing(true);
    console.log(`[Sync] Sincronizando ${queue.length} itens pendentes...`);
    
    const remainingQueue = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        let imageUrl = item.image_data;
        
        // Se for base64, tenta subir pro storage
        if (imageUrl?.startsWith('data:')) {
          try {
            const blob = base64ToBlob(imageUrl);
            const fileName = `${user.id}/sync_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest_detections')
              .upload(fileName, blob, { contentType: 'image/jpeg' });

            if (!uploadError) {
              const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
              imageUrl = data.publicUrl;
            }
          } catch (e) {
            console.warn("[Sync] Falha no upload da imagem, mantendo local:", e);
          }
        }

        const { error: insertError } = await supabase.from('pest_detections').insert([{ 
          user_id: user.id, 
          image_data: imageUrl, 
          analysis_result: item.analysis_result || {
            pestFound: true,
            pest_name: item.pest_name,
            confidence: item.confidence,
            location: {
              latitude: item.latitude,
              longitude: item.longitude,
              address: item.location_name
            }
          },
          created_at: new Date(item.timestamp).toISOString()
        }]);

        if (insertError) throw insertError;
        successCount++;
      } catch (e) {
        console.error("[Sync] Erro ao sincronizar item:", e);
        remainingQueue.push(item);
      }
    }

    localStorage.setItem('pestscan_offline_queue', JSON.stringify(remainingQueue));
    setIsSyncing(false);
    
    if (successCount > 0) {
      showToast(`${successCount} detecções sincronizadas com sucesso!`, "success");
      fetchHistory(true);
    }
  };

  // Monitora estado online e sincroniza
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast("Conexão restaurada! Sincronizando dados...", "success");
      syncOfflineDetections();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast("Você está offline. As detecções serão salvas localmente.", "info");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Tenta sincronizar ao carregar se estiver online
    if (navigator.onLine) syncOfflineDetections();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);
  
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generatePDF = async (): Promise<{ pdf: any, blob: Blob, fileName: string } | null> => {
    if (!currentResult || !currentResult.pest || !reportRef.current) {
      showToast("Relatório não pronto.", "error");
      return null;
    }
    
    setIsGeneratingPDF(true);
    const element = reportRef.current;
    
    // Detecta se é dispositivo móvel para otimizar memória
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const captureWidth = isMobile ? 750 : 1024; // Reduzido para mobile
    const captureScale = isMobile ? 1.2 : 2; // Reduzido para mobile

    const originalStyle = {
      width: element.style.width,
      maxWidth: element.style.maxWidth,
      position: element.style.position,
      left: element.style.left,
      top: element.style.top,
      zIndex: element.style.zIndex,
      visibility: element.style.visibility,
      display: element.style.display,
      opacity: element.style.opacity,
      backgroundColor: element.style.backgroundColor,
      overflow: element.style.overflow,
      height: element.style.height
    };

    try {
      // Prepara o elemento para captura
      element.style.width = `${captureWidth}px`;
      element.style.maxWidth = 'none';
      element.style.height = 'auto';
      element.style.position = 'fixed';
      element.style.left = '0';
      element.style.top = '0';
      element.style.zIndex = '-9999';
      element.style.visibility = 'visible';
      element.style.display = 'block';
      element.style.opacity = '1';
      element.style.backgroundColor = '#ffffff';
      element.style.overflow = 'visible';
      
      // Aguarda renderização (mais tempo no mobile)
      await new Promise(r => setTimeout(r, isMobile ? 4000 : 2500));
      
      let canvas;
      try {
        // Tenta toPng primeiro (mais leve no mobile se configurado corretamente)
        const dataUrl = await toPng(element, {
          quality: 0.8,
          backgroundColor: '#ffffff',
          pixelRatio: captureScale,
          cacheBust: false, // Desativado para evitar problemas de CORS
          skipFonts: true,
        });
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = dataUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 10000); // Timeout de 10s
        });
        
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      } catch (e) {
        console.warn("toPng falhou, tentando html2canvas:", e);
        // Fallback para html2canvas
        canvas = await html2canvas(element, {
          useCORS: true,
          allowTaint: true,
          scale: captureScale,
          backgroundColor: '#ffffff',
          logging: false,
          width: captureWidth,
          height: element.offsetHeight,
          onclone: (clonedDoc) => {
            const el = clonedDoc.querySelector('[data-report-container]');
            if (el) {
              (el as HTMLElement).style.display = 'block';
              (el as HTMLElement).style.visibility = 'visible';
              (el as HTMLElement).style.opacity = '1';
              (el as HTMLElement).style.width = `${captureWidth}px`;
            }
          }
        });
      }

      if (!canvas) throw new Error("Falha ao criar canvas do relatório.");

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = pageWidth / imgWidth;
      const finalHeight = imgHeight * ratio;

      const dynamicPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pageWidth, finalHeight]
      });

      // Reduz qualidade no mobile para evitar crash de memória no addImage
      const imgQuality = isMobile ? 0.7 : 0.85;
      dynamicPdf.addImage(canvas.toDataURL('image/jpeg', imgQuality), 'JPEG', 0, 0, pageWidth, finalHeight, undefined, 'FAST');
      
      const fileName = `Relatorio_PestScan_${Date.now()}.pdf`;
      const pdfBlob = dynamicPdf.output('blob');
      
      return { pdf: dynamicPdf, blob: pdfBlob, fileName };
    } catch (e) {
      console.error("Erro crítico ao gerar PDF:", e);
      showToast("Erro ao processar o relatório. Tente novamente.", "error");
      return null;
    } finally {
      if (reportRef.current) {
        Object.assign(reportRef.current.style, originalStyle);
      }
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadOnly = async () => {
    showToast("Iniciando geração do PDF...", "info");
    const result = await generatePDF();
    if (!result) {
      showToast("Erro ao gerar PDF. Tente novamente.", "error");
      return;
    }

    const { blob, pdf, fileName } = result as any;
    setGeneratedPdfBlob(blob);
    setGeneratedPdfFileName(fileName);
    setIsPdfModalOpen(true);
    showToast("Relatório pronto!", "success");
    
    // Tenta o salvamento nativo do jsPDF imediatamente se possível
    if (pdf && pdf.save) {
      try {
        pdf.save(fileName);
      } catch (e) {
        console.warn("pdf.save falhou:", e);
      }
    }
  };

  const handleShare = async () => {
    showToast("Preparando para compartilhar...", "info");
    const result = await generatePDF();
    if (!result) {
      showToast("Erro ao gerar PDF.", "error");
      return;
    }

    const { blob, fileName } = result;
    setGeneratedPdfBlob(blob);
    setGeneratedPdfFileName(fileName);
    const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

    // Tenta compartilhar diretamente primeiro
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: 'Relatório PestScan Pro',
          text: `Confira a identificação da praga: ${currentResult?.pest?.name}`,
          files: [pdfFile]
        });
        showToast("Compartilhado com sucesso!", "success");
      } else {
        // Se não suportar arquivos, abre o modal de sucesso para download alternativo
        setGeneratedPdfBlob(blob);
        setIsPdfModalOpen(true);
      }
    } catch (err: any) {
      console.warn("navigator.share falhou:", err);
      // Fallback para compartilhar apenas texto se o arquivo falhar
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Relatório PestScan Pro',
            text: `Identificação: ${currentResult?.pest?.name}. O PDF foi gerado. Use a opção 'Baixar' no app.`
          });
          showToast("Texto compartilhado. Use 'Baixar' para o PDF.", "info");
        } catch (e) {
          console.error("Share texto falhou:", e);
        }
      }
      setGeneratedPdfBlob(blob);
      setIsPdfModalOpen(true);
    }
  };

  const PdfSuccessModal = () => {
    if (!isPdfModalOpen || !generatedPdfBlob) return null;

    const downloadPdf = (e: React.MouseEvent) => {
      if (!generatedPdfBlob) return;
      showToast("Iniciando download...", "success");
      
      try {
        const url = URL.createObjectURL(generatedPdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = generatedPdfFileName || "Relatorio_PestScan.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // No Android WebView, forçamos a navegação se o clique falhar
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && pdfBase64) {
          setTimeout(() => {
            window.location.href = pdfBase64;
          }, 500);
        }
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error("Erro no download:", err);
        if (pdfBase64) window.location.href = pdfBase64;
      }
    };

    const sharePdf = async () => {
      if (!generatedPdfBlob || !pdfBase64) return;
      
      try {
        const pdfFile = new File([generatedPdfBlob], generatedPdfFileName, { type: 'application/pdf' });
        
        if (navigator.share) {
          // Tenta compartilhar o arquivo diretamente
          try {
            if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
              await navigator.share({
                title: 'Relatório PestScan Pro',
                text: `Identificação: ${currentResult?.pest?.name}`,
                files: [pdfFile]
              });
              showToast("Compartilhado!", "success");
              return;
            }
          } catch (e) {
            console.warn("Falha ao compartilhar arquivo:", e);
          }

          // Fallback: Compartilha apenas o texto
          await navigator.share({
            title: 'Relatório PestScan Pro',
            text: `Identificação: ${currentResult?.pest?.name}. O PDF foi gerado. Use a opção 'Baixar' no app.`
          });
          showToast("Texto compartilhado.", "info");
        } else {
          showToast("Compartilhamento não disponível.", "error");
        }
      } catch (err) {
        console.error("Erro ao compartilhar:", err);
      }
    };

    const viewPdf = () => {
      if (!generatedPdfBlob) return;
      try {
        const url = URL.createObjectURL(generatedPdfBlob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch (err) {
        if (pdfBase64) window.location.href = pdfBase64;
      }
    };

    const printPdf = () => {
      if (!generatedPdfBlob) return;
      try {
        const url = URL.createObjectURL(generatedPdfBlob);
        const win = window.open(url);
        if (win) {
          setTimeout(() => {
            win.print();
            URL.revokeObjectURL(url);
          }, 1000);
        } else {
          window.print();
        }
      } catch (err) {
        window.print();
      }
    };

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <FileText size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Relatório Pronto!</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">O PDF foi gerado com sucesso.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={sharePdf}
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Share2 size={16} /> Compartilhar PDF
                </button>
                <a 
                  href={pdfBase64 || '#'}
                  download={generatedPdfFileName}
                  onClick={downloadPdf}
                  className="w-full py-5 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-slate-800/20"
                >
                  <Printer size={16} /> Baixar PDF
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={viewPdf}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Eye size={14} /> Visualizar
                  </button>
                  <button 
                    onClick={printPdf}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <Printer size={14} /> Imprimir
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsPdfModalOpen(false)}
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const savePestDetails = async () => {
    if (!currentResult || !currentResult.id) {
      showToast("Nenhum scan selecionado para salvar.", "error");
      return;
    }

    setLoading(true);
    try {
      // Otimização: remove a imagem base64 antes de salvar no JSON do banco
      const dbResult = { 
        ...currentResult, 
        capturedImage: undefined 
      };

      const { error } = await supabase
        .from('pest_detections')
        .update({ 
          analysis_result: dbResult
        })
        .eq('id', currentResult.id);

      if (error) throw error;

      // Atualiza o histórico local para refletir as mudanças
      setHistory(prev => prev.map(h => 
        h.id === currentResult.id ? { ...h, result: currentResult } : h
      ));

      showToast("Informações salvas com sucesso!", "success");
    } catch (e: any) {
      console.error("Erro ao salvar detalhes:", e);
      showToast("Erro ao salvar: " + (e.message || "Erro de rede"), "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (id: string, imageUrl: string) => {
    setModal({
      isOpen: true,
      title: "Excluir Registro",
      message: "Deseja realmente excluir este registro permanentemente?",
      type: 'confirm',
      onConfirm: async () => {
        setLoading(true);
        try {
          // 1. Deletar do banco
          const { error: dbError } = await supabase
            .from('pest_detections')
            .delete()
            .eq('id', id);
          
          if (dbError) throw dbError;

          // 2. Tentar deletar do storage se for uma URL do Supabase
          if (imageUrl.includes('supabase.co')) {
            const path = imageUrl.split('pest_detections/')[1];
            if (path) {
              await supabase.storage.from('pest_detections').remove([path]);
            }
          }

          setHistory(prev => prev.filter(h => h.id !== id));
          if (currentResult && (currentResult as any).id === id) {
            setCurrentResult(null);
            setView('history');
          }
          showToast("Registro excluído com sucesso!", "success");
        } catch (err) {
          console.error("Erro ao excluir:", err);
          showToast("Erro ao excluir registro.", "error");
        } finally {
          setLoading(false);
          setModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const getGeolocation = (force = false): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: force ? 25000 : 20000, // Aumentado para dar mais tempo ao GPS em áreas difíceis
        maximumAge: force ? 0 : 10000
      };

      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        console.warn("Alta precisão falhou, tentando modo balanceado...", err);
        
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Permissão de localização negada. Clique no ícone de cadeado (🔒) na barra de endereços e ative a 'Localização'."));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, (err2) => {
          if (err2.code === err2.TIMEOUT) {
            reject(new Error("Tempo esgotado ao buscar sinal de GPS."));
          } else if (err2.code === err2.POSITION_UNAVAILABLE) {
            reject(new Error("Sinal de GPS indisponível no momento."));
          } else {
            reject(new Error("Não foi possível obter sua localização."));
          }
        }, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 30000
        });
      }, options);
    });
  };

  const forceRefreshLocation = async () => {
    setLoading(true);
    showToast("Atualizando GPS de alta precisão...", "info");
    try {
      const pos = await getGeolocation(true);
      const { latitude, longitude } = pos.coords;
      
      if (!isValidCoord(latitude) || !isValidCoord(longitude)) {
        throw new Error("Coordenadas inválidas recebidas do GPS.");
      }

      const address = await getReverseGeocoding(latitude, longitude);
      setLocation({ lat: latitude, lon: longitude, address });
      setGpsStatus('active');
      setShouldFollowUser(true);
      setMapKey(k => k + 1);
      showToast("Localização atualizada!", "success");
    } catch (err: any) {
      console.error("Erro ao forçar localização:", err);
      setGpsStatus('error');
      
      if (err.message?.includes("Permissão") || err.message?.includes("denied")) {
        showToast("GPS Bloqueado. Você pode clicar no mapa para definir sua posição manualmente.", "info");
      } else if (location && isValidCoord(location.lat)) {
        showToast("GPS Instável - Usando última posição", "info");
      } else {
        showToast(err.message || "Não foi possível obter precisão total.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const lastGeocodeTimeRef = useRef<number>(0);

  const getReverseGeocoding = async (lat: number, lon: number): Promise<string> => {
    // Evita chamadas excessivas (máximo 1 a cada 2 segundos para o mesmo componente)
    const now = Date.now();
    if (now - lastGeocodeTimeRef.current < 2000) {
      return location?.address || "Localização Atual";
    }
    lastGeocodeTimeRef.current = now;

    try {
      // TENTATIVA 1: Nominatim (OpenStreetMap)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
        headers: { 'User-Agent': 'PestScanPro/1.0 (juan.terra53@gmail.com)' },
        signal: AbortSignal.timeout(5000) // Timeout de 5s
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.city_district || data.address.suburb || data.address.hamlet || data.address.county || "Cidade Desconhecida";
          const state = data.address.state || "";
          return `${city}${state ? `, ${state}` : ""}`;
        }
      }
      throw new Error("Nominatim failed");
    } catch (e) {
      console.warn("Nominatim falhou, tentando fallback...", e);
      
      try {
        // TENTATIVA 2: BigDataCloud (Fallback mais estável para Client-side)
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "Cidade Desconhecida";
          const state = data.principalSubdivisionCode?.split('-')[1] || "";
          return `${city}${state ? `, ${state}` : ""}`;
        }
      } catch (fallbackErr) {
        console.error("Todos os serviços de geocodificação falharam:", fallbackErr);
      }
      
      return location?.address || "Localização Indisponível";
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

    if (!window.isSecureContext) {
      setError("A câmera requer uma conexão segura (HTTPS).");
      return;
    }

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
      
      // Se a view mudou enquanto esperávamos pela permissão, paramos o stream imediatamente
      if (viewRef.current !== 'camera') {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playError: any) {
          // Ignora o erro de interrupção (AbortError) que ocorre quando o componente é desmontado
          // ou a câmera é parada antes do play() completar.
          if (playError.name !== 'AbortError') {
            throw playError;
          }
        }
        
        // Verifica novamente se ainda estamos na view da câmera antes de prosseguir com as capacidades
        if (viewRef.current !== 'camera') return;

        const track = stream.getVideoTracks()[0];
        const caps = (track as any).getCapabilities?.() || {};
        if (caps.torch) setHasFlash(true);
        if (caps.zoom) {
          setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max });
          const settings = (track as any).getSettings?.() || {};
          const currentZoom = settings.zoom || caps.zoom.min;
          setZoomLevel(currentZoom);
          zoomLevelRef.current = currentZoom;
        }
      }
    } catch (e: any) { 
      // Se o erro for AbortError, não mostramos erro na UI pois é uma ação esperada de cancelamento
      if (e.name !== 'AbortError') {
        console.error("Erro câmera:", e);
        
        let errorMsg = "Não foi possível acessar a câmera.";
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.message?.includes("Permission denied")) {
          errorMsg = "Permissão da câmera negada. Clique no ícone de cadeado (🔒) na barra de endereços do seu navegador e altere 'Câmera' para 'Permitir'.";
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          errorMsg = "Nenhuma câmera encontrada neste dispositivo.";
        } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
          errorMsg = "A câmera está sendo usada por outro aplicativo ou aba.";
        } else {
          errorMsg = `Erro ao acessar câmera: ${e.message || 'Verifique as permissões'}`;
        }
        
        setError(errorMsg);
      }
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

  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomLevelRef = useRef(1);
  const isZooming = useRef(false);
  const touchStartDist = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchStartDist.current = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
    }
  };

  const handleTouchMove = async (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current && streamRef.current && !isZooming.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = dist / touchStartDist.current;
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = (track as any).getCapabilities?.() || {};
      
      if (capabilities.zoom) {
        const newZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, zoomLevelRef.current * delta));
        if (Math.abs(newZoom - zoomLevelRef.current) < 0.01) return;

        isZooming.current = true;
        try {
          await (track as any).applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
          zoomLevelRef.current = newZoom;
          setZoomLevel(newZoom);
          touchStartDist.current = dist;
        } catch (err) {
          console.warn("Zoom error:", err);
        } finally {
          isZooming.current = false;
        }
      }
    }
  };

  const saveToOfflineQueue = async (res: RecognitionResult, validatedLoc: any, dataUrl: string) => {
    console.log("[Offline] Adicionando à fila de sincronização...");
    
    // OTIMIZAÇÃO CRÍTICA: Reduz a imagem para miniatura para não estourar o localStorage
    let optimizedDataUrl = dataUrl;
    try {
      const smallBase64 = await resizeImage(dataUrl, 300);
      optimizedDataUrl = `data:image/jpeg;base64,${smallBase64}`;
    } catch (e) {
      console.warn("Erro ao otimizar imagem offline:", e);
    }

    const offlineItem = {
      pest_name: res.pest?.name || 'Scan',
      confidence: Number(res.confidence) || 0,
      latitude: validatedLoc.lat,
      longitude: validatedLoc.lon,
      location_name: validatedLoc.address,
      analysis_result: { ...res, location: { latitude: validatedLoc.lat, longitude: validatedLoc.lon, address: validatedLoc.address } },
      image_data: optimizedDataUrl,
      timestamp: Date.now()
    };
    
    try {
      const queue = JSON.parse(localStorage.getItem('pestscan_offline_queue') || '[]');
      queue.push(offlineItem);
      localStorage.setItem('pestscan_offline_queue', JSON.stringify(queue));
      showToast("Offline: Detecção salva localmente.", "info");
    } catch (e) {
      console.error("Erro crítico de Storage:", e);
      showToast("Memória cheia! Sincronize os itens pendentes.", "error");
    }
    
    // Atualiza o histórico local imediatamente
    const localEntry = {
      id: `temp_${Date.now()}`,
      timestamp: offlineItem.timestamp,
      image: optimizedDataUrl,
      result: offlineItem.analysis_result,
      location: offlineItem.location_name
    };
    setHistory(prev => [localEntry, ...prev]);
    setMapKey(k => k + 1);
  };

  const handleCapture = async () => {
    setIsPdfModalOpen(false);
    if (view !== 'camera') { setView('camera'); return; }
    if (!videoRef.current) return;
    
    const startTime = Date.now();
    setLoading(true); 
    setLoadingMessage('Focando Câmera...');
    setError(null);
    
    try {
      // Pequeno delay para garantir o foco da câmera
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // CAPTURA DE LOCALIZAÇÃO (EM PARALELO - NÃO BLOQUEIA O INÍCIO DA ANÁLISE)
      let locData = (location && isValidCoord(location.lat)) 
        ? { lat: location.lat, lon: location.lon, address: location.address } 
        : { lat: -23.5505, lon: -46.6333, address: "Localização Padrão (SP)" };
      const locationPromise = (async () => {
        try {
          const pos = await getGeolocation();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const address = await getReverseGeocoding(lat, lon);
          return { lat, lon, address };
        } catch (locErr) {
          console.warn("Erro ao obter localização em tempo real, usando fallback:", locErr);
          // Se falhar e não tivermos localização prévia, tenta uma última vez sem alta precisão
          if (!location) {
            try {
              const pos = await new Promise<GeolocationPosition>((res, rej) => 
                navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: false, timeout: 5000 })
              );
              return { lat: pos.coords.latitude, lon: pos.coords.longitude, address: "Localização Aproximada" };
            } catch (e) {
              return locData;
            }
          }
          return locData;
        }
      })();

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      stopCamera();
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];

      let res: RecognitionResult;

      // --- MOTOR HÍBRIDO SÊNIOR OTIMIZADO ---
      // Executa primeiro o modo padrão (2 - Raw) que é o mais estável
      let results: RecognitionResult[] = [];
      const resMode2 = await analyzeOffline(canvas, 2);
      results.push(resMode2);
      
      // Só tenta outros modos se a confiança for baixa (< 80%)
      if (!resMode2.pestFound || resMode2.confidence < 0.80) {
        for (let i of [0, 1]) {
          const resMode = await analyzeOffline(canvas, i);
          results.push(resMode);
          if (resMode.pestFound && resMode.confidence > 0.85) break;
        }
      }
      
      const localRes = results.sort((a, b) => b.confidence - a.confidence)[0];
      setNormMode(localRes.normalizationMode || 0);
      
      // --- ECONOMIA DE API (BUSCA NO BANCO) ---
      if (localRes.pestFound && localRes.confidence > 0.60 && localRes.pest) {
        console.log(`[History] Buscando referência no banco para: ${localRes.pest.name}`);
        const { data: existingData } = await supabase
          .from('pest_detections')
          .select('analysis_result')
          .filter('analysis_result->pest->>name', 'ilike', `%${localRes.pest.name}%`)
          .not('analysis_result', 'is', null)
          .limit(1);

        if (existingData && existingData.length > 0) {
          const cachedResult = typeof existingData[0].analysis_result === 'string' 
            ? JSON.parse(existingData[0].analysis_result) 
            : existingData[0].analysis_result;

          if (cachedResult && cachedResult.pestFound) {
            console.log("✅ [History] Usando ficha técnica do banco de dados.");
            res = {
              ...cachedResult,
              confidence: localRes.confidence,
              message: `Identificado via Referência Local (${localRes.pest.name})`,
              source: 'Banco de Dados',
              capturedImage: undefined
            };
          } else {
            res = await analyzePestImage(base64, canvas, normMode);
          }
        } else {
          res = await analyzePestImage(base64, canvas, normMode);
        }
      } else {
        res = await analyzePestImage(base64, canvas, normMode);
      }

      const isConnectionError = res.message?.includes("Erro de Conexão") || res.message?.includes("Failed to fetch");
      if ((isConnectionError || (!res.pestFound && localRes.confidence > 0.85)) && localRes.pestFound) {
        res = {
          ...localRes,
          pestFound: true,
          message: isConnectionError 
            ? `Conexão instável. Usando IA Local: ${localRes.message}` 
            : `IA Local (Alta Confiança): ${localRes.message}`
        };
      }

      // Aguarda a localização (se ainda não terminou)
      const finalLoc = await locationPromise;
      const lat = isValidCoord(finalLoc.lat) ? finalLoc.lat : (isValidCoord(location?.lat) ? location!.lat : -23.5505);
      const lon = isValidCoord(finalLoc.lon) ? finalLoc.lon : (isValidCoord(location?.lon) ? location!.lon : -46.6333);
      const validatedLoc = { lat, lon, address: finalLoc.address || location?.address || "Localização Padrão (SP)" };
      
      res.location = { latitude: validatedLoc.lat, longitude: validatedLoc.lon, address: validatedLoc.address };
      setLocation(validatedLoc);

      const resultWithImage = { ...res, capturedImage: dataUrl };
      setCurrentResult(resultWithImage);
      setView('result');

      if (res.pestFound && user) {
        if (user.id !== 'offline') {
          try {
            let imageUrl = dataUrl;
            try {
              const resizedBase64 = await resizeImage(dataUrl, 800);
              const blob = base64ToBlob(resizedBase64);
              const fileName = `${user.id}/${Date.now()}.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('pest_detections')
                .upload(fileName, blob, { 
                  contentType: 'image/jpeg', 
                  cacheControl: '31536000',
                  upsert: false 
                });

              if (!uploadError) {
                const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
                imageUrl = data.publicUrl;
              } else {
                console.warn("Upload falhou, usando base64 otimizado:", uploadError);
                const rawBase64 = await resizeImage(dataUrl, 400); // Fallback para base64 pequeno se falhar upload
                imageUrl = `data:image/jpeg;base64,${rawBase64}`;
              }
            } catch (uploadErr) {
              console.warn("Erro no processo de upload:", uploadErr);
            }

            const dbResult = { 
              ...resultWithImage, 
              capturedImage: undefined,
              location: {
                latitude: validatedLoc.lat,
                longitude: validatedLoc.lon,
                address: validatedLoc.address
              }
            };

            console.log("[History] Salvando captura no banco...");
            const { data: insertData, error: insertError } = await supabase.from('pest_detections').insert([{ 
              user_id: user.id, 
              image_data: imageUrl || dataUrl, 
              analysis_result: dbResult
            }]).select('id');

            if (insertError) throw insertError;

            if (insertData && insertData.length > 0) {
              const newId = insertData[0].id;
              setCurrentResult(prev => prev ? { ...prev, id: newId } : null);
            }

            console.log("✅ [History] Salvo com sucesso!");
            fetchHistory();
          } catch (e: any) {
            console.error("❌ Erro ao salvar histórico no Supabase:", e);
            
            // SALVAMENTO OFFLINE (QUEUE)
            if (!navigator.onLine || e.message?.includes("Failed to fetch") || e.message?.includes("network")) {
              await saveToOfflineQueue(res, validatedLoc, dataUrl);
            } else {
              const errorMsg = e.message || e.details || "Erro de rede ou permissão";
              showToast(`Erro ao sincronizar: ${errorMsg}`, "error");
            }
          }
        } else {
          // MODO OFFLINE (Sem login)
          console.log("[Offline] Modo local sem login. Salvando apenas localmente.");
          await saveToOfflineQueue(res, validatedLoc, dataUrl);
        }
      }
    } catch (e: any) {
      console.error("Erro captura:", e);
      setError(e.message || "Erro inesperado na análise.");
    } finally {
      const elapsed = Date.now() - startTime;
      const minTime = 800;
      if (elapsed < minTime) await new Promise(r => setTimeout(r, minTime - elapsed));
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileInputKey(prev => prev + 1);
    const startTime = Date.now();
    setLoading(true); setError(null);
    
    const objectUrl = URL.createObjectURL(file);
    
    try {
      // CAPTURA DE LOCALIZAÇÃO (EM PARALELO)
      let locData = (location && isValidCoord(location.lat)) 
        ? { lat: location.lat, lon: location.lon, address: location.address } 
        : { lat: -23.5505, lon: -46.6333, address: "Localização Padrão (SP)" };
      const locationPromise = (async () => {
        try {
          const pos = await getGeolocation();
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const address = await getReverseGeocoding(lat, lon);
          return { lat, lon, address };
        } catch (locErr) {
          console.warn("Erro ao obter localização no upload, usando fallback:", locErr);
          return locData;
        }
      })();

      const resizedBase64 = await resizeImage(objectUrl, 512);
      const resizedDataUrl = `data:image/jpeg;base64,${resizedBase64}`;

      const canvas = document.createElement('canvas');
      const imgElement = new Image();
      imgElement.src = resizedDataUrl;
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
      });
      
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      canvas.getContext('2d')?.drawImage(imgElement, 0, 0);

      // --- MOTOR HÍBRIDO SÊNIOR OTIMIZADO ---
      let results: RecognitionResult[] = [];
      const resMode2 = await analyzeOffline(canvas, 2);
      results.push(resMode2);
      
      if (!resMode2.pestFound || resMode2.confidence < 0.80) {
        for (let i of [0, 1]) {
          const resMode = await analyzeOffline(canvas, i);
          results.push(resMode);
          if (resMode.pestFound && resMode.confidence > 0.85) break;
        }
      }
      
      const localRes = results.sort((a, b) => b.confidence - a.confidence)[0];
      setNormMode(localRes.normalizationMode || 0);

      // Aguarda a localização
      const finalLoc = await locationPromise;
      const lat = isValidCoord(finalLoc.lat) ? finalLoc.lat : (isValidCoord(location?.lat) ? location!.lat : -23.5505);
      const lon = isValidCoord(finalLoc.lon) ? finalLoc.lon : (isValidCoord(location?.lon) ? location!.lon : -46.6333);
      const validatedLoc = { lat, lon, address: finalLoc.address || location?.address || "Localização Padrão (SP)" };

      let res: RecognitionResult;

      // --- ECONOMIA DE API PARA UPLOAD ---
      if (localRes.pestFound && localRes.confidence > 0.60 && localRes.pest) {
        console.log(`[History] Buscando referência no banco para: ${localRes.pest.name}`);
        const { data: existingData } = await supabase
          .from('pest_detections')
          .select('analysis_result')
          .filter('analysis_result->pest->>name', 'ilike', `%${localRes.pest.name}%`)
          .not('analysis_result', 'is', null)
          .limit(1);

        if (existingData && existingData.length > 0) {
          const cachedResult = typeof existingData[0].analysis_result === 'string' 
            ? JSON.parse(existingData[0].analysis_result) 
            : existingData[0].analysis_result;

          if (cachedResult && cachedResult.pestFound) {
            console.log("✅ [History] Usando ficha técnica do banco de dados.");
            res = {
              ...cachedResult,
              confidence: localRes.confidence,
              location: { latitude: validatedLoc.lat, longitude: validatedLoc.lon, address: validatedLoc.address },
              message: "Ficha técnica otimizada (Cache)",
              source: 'Banco de Dados',
              capturedImage: undefined
            };
          } else {
            res = await analyzePestImage(resizedBase64, canvas, localRes.normalizationMode);
          }
        } else {
          res = await analyzePestImage(resizedBase64, canvas, localRes.normalizationMode);
        }
      } else {
        res = await analyzePestImage(resizedBase64, canvas, localRes.normalizationMode);
      }

      res.location = { latitude: validatedLoc.lat, longitude: validatedLoc.lon, address: validatedLoc.address };
      setLocation(validatedLoc);

      // Limpeza de memória imediata
      imgElement.src = '';
      URL.revokeObjectURL(objectUrl);

      const resultWithImage = { ...res, capturedImage: resizedDataUrl };
      
      setCurrentResult(resultWithImage);
      setView('result');

      if (res.pestFound && user) {
        if (user.id !== 'offline') {
          try {
            let imageUrl = resizedDataUrl;

            try {
              const blob = base64ToBlob(resizedBase64);
              const fileName = `${user.id}/${Date.now()}_file.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('pest_detections')
                .upload(fileName, blob, { 
                  contentType: 'image/jpeg', 
                  cacheControl: '31536000',
                  upsert: false 
                });

              if (!uploadError) {
                const { data } = supabase.storage.from('pest_detections').getPublicUrl(fileName);
                imageUrl = data.publicUrl;
              } else {
                console.warn("Upload falhou, usando base64 otimizado:", uploadError);
                const rawBase64 = await resizeImage(resizedDataUrl, 400);
                imageUrl = `data:image/jpeg;base64,${rawBase64}`;
              }
            } catch (uploadErr) {
              console.warn("Erro no processo de upload de arquivo:", uploadErr);
            }

            // OTIMIZAÇÃO CRÍTICA: Remove a imagem base64 do JSON antes de salvar no banco
            const dbResult = { 
              ...resultWithImage, 
              capturedImage: undefined,
              location: {
                latitude: validatedLoc.lat,
                longitude: validatedLoc.lon,
                address: validatedLoc.address
              }
            };

            console.log("[History] Salvando arquivo no banco...");
            const { data: insertData, error: insertError } = await supabase.from('pest_detections').insert([{ 
              user_id: user.id, 
              image_data: imageUrl || resizedDataUrl, 
              analysis_result: dbResult
            }]).select('id');

            if (insertError) throw insertError;

            if (insertData && insertData.length > 0) {
              const newId = insertData[0].id;
              setCurrentResult(prev => prev ? { ...prev, id: newId } : null);
            }

            console.log("✅ [History] Arquivo salvo com sucesso!");
            fetchHistory();
          } catch (e: any) {
            console.error("❌ Erro ao salvar histórico de arquivo no Supabase:", e);
            
            // SALVAMENTO OFFLINE (QUEUE)
            if (!navigator.onLine || e.message?.includes("Failed to fetch") || e.message?.includes("network")) {
              await saveToOfflineQueue(res, validatedLoc, resizedDataUrl);
            } else {
              const errorMsg = e.message || e.details || "Erro de rede ou permissão";
              showToast(`Erro ao sincronizar: ${errorMsg}`, "error");
            }
          }
        } else {
          // MODO OFFLINE (Sem login)
          console.log("[Offline] Modo local sem login. Salvando arquivo apenas localmente.");
          await saveToOfflineQueue(res, validatedLoc, resizedDataUrl);
        }
      }
    } catch (e: any) {
      console.error("Erro ao processar arquivo:", e);
      setError(e.message || "Erro ao processar arquivo.");
    } finally {
      const elapsed = Date.now() - startTime;
      const minTime = 800;
      if (elapsed < minTime) await new Promise(r => setTimeout(r, minTime - elapsed));
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  const handleAiDeepSearch = async () => {
    if (!searchTerm.trim()) return;
    const startTime = Date.now();
    setLoading(true); setError(null);
    try {
      // Tenta buscar no banco primeiro (Economia de API)
      const { data: existingData } = await supabase
        .from('pest_detections')
        .select('analysis_result')
        .filter('analysis_result->pest->>name', 'ilike', `%${searchTerm}%`)
        .not('analysis_result', 'is', null)
        .limit(1);

      if (existingData && existingData.length > 0) {
        const cachedResult = typeof existingData[0].analysis_result === 'string' 
          ? JSON.parse(existingData[0].analysis_result) 
          : existingData[0].analysis_result;
          
        if (cachedResult && cachedResult.pest) {
          setSelectedPest(cachedResult.pest);
          setView('detail');
          return;
        }
      }

      // Chama a IA diretamente (Se não tem no banco)
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
      const elapsed = Date.now() - startTime;
      const minTime = 800;
      if (elapsed < minTime) await new Promise(r => setTimeout(r, minTime - elapsed));
      setLoading(false);
    }
  };

  if (view === 'privacy') return <PestScanPrivacy onBack={() => setView(user ? 'main' : 'auth')} />;

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
          
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20 mt-2">v2.8.1 Stable</p>
          
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
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      {/* Custom Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-slate-900 mb-2">{modal.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-8">{modal.message}</p>
            <div className="flex gap-3">
              {(modal.type === 'confirm' || modal.onSecondary) && (
                <button 
                  onClick={() => {
                    if (modal.onSecondary) {
                      modal.onSecondary();
                    } else {
                      setModal(prev => ({ ...prev, isOpen: false }));
                    }
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  {modal.secondaryText || (modal.type === 'confirm' ? 'Cancelar' : 'Fechar')}
                </button>
              )}
              <button 
                onClick={() => {
                  if (modal.onConfirm) {
                    modal.onConfirm();
                  } else {
                    setModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {modal.confirmText || (modal.type === 'confirm' ? 'Confirmar' : 'OK')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast */}
      {toast && (
        <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      {!isPublicView && (
        <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-12 rounded-b-[4rem] text-white sticky top-0 z-40 shadow-2xl border-b border-emerald-800/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-400/10 p-3 rounded-2xl backdrop-blur-md border border-emerald-400/20 shadow-lg relative group">
              <div className="absolute inset-0 bg-emerald-400/5 blur-lg rounded-full group-hover:bg-emerald-400/10 transition-colors"></div>
              <Bug className="text-emerald-400 w-8 h-8 relative z-10" />
            </div>
            <div>
              <h1 className="font-black text-2xl text-white tracking-tighter">PestScan Pro</h1>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isOnline ? 'IA ONLINE' : 'MODO OFFLINE'}
                    </span>
                    {JSON.parse(localStorage.getItem('pestscan_offline_queue') || '[]').length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          syncOfflineDetections();
                        }}
                        disabled={isSyncing || !isOnline}
                        className="flex items-center gap-2 bg-amber-500/20 px-2 py-1 rounded-full border border-amber-500/30 animate-pulse active:scale-95 transition-all ml-1"
                      >
                        <RefreshCw size={10} className={`text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                          {isSyncing ? 'Sincronizando...' : `${JSON.parse(localStorage.getItem('pestscan_offline_queue') || '[]').length} Pendentes`}
                        </span>
                      </button>
                    )}
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
            {user && (
              <button 
                onClick={() => { setView('map'); stopCamera(); }}
                className={`p-3 rounded-2xl transition-all border ${view === 'map' ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                title="Mapa de Calor"
              >
                <MapIcon size={20} className={view === 'map' ? 'text-white' : 'text-white/80'} />
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
      )}

      <main className="flex-1 p-6 pb-40 overflow-y-auto">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-[2.5rem] mb-8 flex flex-col gap-4 animate-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed font-bold flex-1">{error}</p>
            </div>
            {view === 'camera' && (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => initCamera()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all w-full"
                >
                  <RefreshCw size={14} />
                  Tentar Novamente
                </button>
                {(error.includes("Permissão") || error.includes("cadeado")) && (
                  <div className="bg-white/60 p-5 rounded-[2rem] border border-red-100 shadow-sm">
                    <p className="text-[10px] font-black text-red-900 mb-3 uppercase tracking-wider">Como resolver o bloqueio:</p>
                    <ul className="text-[9px] text-red-800 space-y-2 font-bold leading-relaxed">
                      <li className="flex gap-2">
                        <span className="bg-red-200 text-red-900 w-4 h-4 rounded-full flex items-center justify-center shrink-0">1</span>
                        <span>Toque no ícone de <b>cadeado (🔒)</b> ou <b>ajustes</b> na barra de endereços acima.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="bg-red-200 text-red-900 w-4 h-4 rounded-full flex items-center justify-center shrink-0">2</span>
                        <span>Ative a permissão de <b>Câmera</b> e <b>Localização</b>.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="bg-red-200 text-red-900 w-4 h-4 rounded-full flex items-center justify-center shrink-0">3</span>
                        <span>Recarregue a página para aplicar as mudanças.</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {view === 'main' && (
          <div className="space-y-8">
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
              <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
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
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Enciclopédia Bio-Urbana</h3>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'PestScan Pro',
                        text: 'Confira este app incrível para reconhecimento de pragas urbanas!',
                        url: window.location.origin
                      }).catch(console.error);
                    } else {
                      showToast("Link copiado para a área de transferência!", "success");
                      navigator.clipboard.writeText(window.location.origin);
                    }
                  }}
                  className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full active:scale-95 transition-all"
                >
                  <Share2 size={12} />
                  Indicar App
                </button>
              </div>
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
          <div className="flex flex-col items-center">
             <div className="mb-6 flex flex-wrap justify-center gap-3">
                <div className="flex items-center gap-3 px-5 py-2.5 bg-white/80 rounded-2xl border border-slate-100 shadow-sm">
                   <div className={`w-2 h-2 rounded-full ${isModelReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                     Motor Local: {modelStatus}
                   </span>
                </div>
                {!isOnline && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500 text-white rounded-2xl shadow-sm animate-pulse">
                     <WifiOff size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
                  </div>
                )}
             </div>

             <div 
                className="w-full aspect-[3/4] bg-slate-900 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl relative"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                style={{ touchAction: 'none' }}
              >
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                <div className="absolute top-6 left-6 flex gap-3 z-50">
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
                    }}
                    className="p-5 rounded-2xl bg-black/40 text-white border border-white/20 transition-all active:scale-90"
                  >
                    <ImageIcon size={24} />
                  </button>
                  <input 
                    key={fileInputKey}
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </div>

                {hasFlash && (
                  <button 
                    onClick={toggleFlash} 
                    className={`absolute top-6 right-6 p-5 rounded-2xl transition-all active:scale-90 z-50 ${
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

                {zoomCaps && zoomCaps.max > zoomCaps.min && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 text-white rounded-full text-[10px] font-black z-50">
                    ZOOM: {zoomLevel.toFixed(1)}x
                  </div>
                )}
             </div>
             <p className="mt-10 text-sm font-bold text-slate-400 px-10 text-center leading-relaxed uppercase tracking-widest text-[10px]">
               Posicione a praga no centro do visor
             </p>
          </div>
        )}

        {view === 'map' && (
          <div className="space-y-8 pb-12">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => fetchHistory(true)}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-100 text-slate-400"
                    title="Atualizar Dados"
                  >
                    <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?view=heatmap&userId=${user?.id || 'public'}`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Mapa de Calor - PestScan Pro',
                          text: 'Confira o mapa de calor de pragas urbanas!',
                          url: shareUrl
                        }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(shareUrl);
                        showToast("Link do mapa copiado!", "success");
                      }
                    }}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-2xl transition-colors border border-emerald-100 text-emerald-600"
                    title="Compartilhar Mapa"
                  >
                    <Share2 size={18} />
                  </button>
                  <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                    <MapIcon size={24} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-emerald-900 font-black text-sm uppercase tracking-tight">Mapa de Calor</h3>
                    <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter">Live</span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Focos de Infestação em Tempo Real</p>
                </div>
              </div>

                <div className="w-full h-[400px] rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner relative z-10">
                {/* Manual Refresh Button - Removed extra one for cleaner UI */}
                <div className="absolute top-4 right-4 z-[2000] flex flex-col gap-2">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMapMode(prev => prev === 'street' ? 'satellite' : 'street');
                    }}
                    className={`bg-white p-3 rounded-2xl shadow-xl hover:bg-slate-50 active:scale-95 transition-all border-2 ${mapMode === 'satellite' ? 'border-amber-500 text-amber-600' : 'border-slate-100 text-slate-400'}`}
                    title={mapMode === 'satellite' ? "Mudar para Mapa" : "Mudar para Satélite"}
                  >
                    <Globe className="w-6 h-6" />
                  </button>
                </div>

                <ErrorBoundary>
                  <MapContainer 
                    key={mapKey}
                    center={
                      location && isValidCoord(location.lat) && isValidCoord(location.lon) 
                        ? [location.lat, location.lon] 
                        : (history.length > 0 && history[0].result.location && isValidCoord(history[0].result.location.latitude))
                          ? [history[0].result.location.latitude, history[0].result.location.longitude]
                          : [-23.5505, -46.6333]
                    } 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <MapEvents 
                      onMoveStart={() => setShouldFollowUser(false)} 
                      onMapClick={async (lat, lon) => {
                        try {
                          const address = await getReverseGeocoding(lat, lon);
                          setLocation({ lat, lon, address });
                          setGpsStatus('active');
                          showToast("Localização definida manualmente!", "success");
                        } catch (e) {
                          showToast("Erro ao definir localização.", "error");
                        }
                      }}
                    />
                    {location && isValidCoord(location.lat) && isValidCoord(location.lon) && shouldFollowUser && <MapViewUpdater center={[location.lat, location.lon]} />}
                    
                    {location && isValidCoord(location.lat) && isValidCoord(location.lon) && (
                      <CircleMarker 
                        center={[location.lat, location.lon]}
                        radius={6}
                        pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.8, color: 'white', weight: 2 }}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-black text-[10px] uppercase tracking-widest text-blue-600">Sua Localização</p>
                            <p className="text-[9px] text-slate-400 mt-1">{location.address}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )}
                    {mapMode === 'street' ? (
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    ) : (
                      <TileLayer
                        attribution='Map data &copy; Google Satellite 2026'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                      />
                    )}
                    {(() => {
                      const points = history.filter(h => {
                        const lat = h.result?.location?.latitude;
                        const lon = h.result?.location?.longitude;
                        return isValidCoord(lat) && isValidCoord(lon);
                      });
                      
                      if (points.length === 0) {
                        console.log("[Map] Nenhum ponto válido para renderizar no histórico.");
                        return null;
                      }

                      console.log(`[Map] Renderizando ${points.length} marcadores de pragas`);
                      
                      return points.map(entry => {
                        const lat = entry.result?.location?.latitude || 0;
                        const lon = entry.result?.location?.longitude || 0;
                        const address = entry.location || entry.result?.location?.address || "Localização Desconhecida";
                        const confidence = typeof entry.result?.confidence === 'number' ? entry.result.confidence : 0;
                        const pestName = entry.result?.pest?.name || 'Scan';
                        
                        if (!isValidCoord(lat) || !isValidCoord(lon)) return null;

                        return (
                          <React.Fragment key={entry.id}>
                            {/* Heatmap simulation with multiple circles - extremely subtle */}
                            <Circle 
                              center={[lat, lon]}
                              radius={120}
                              pathOptions={{ 
                                fillColor: confidence > 0.9 ? '#ef4444' : '#f97316',
                                fillOpacity: 0.01,
                                color: 'transparent'
                              }}
                            />
                            <Circle 
                              center={[lat, lon]}
                              radius={60}
                              pathOptions={{ 
                                fillColor: confidence > 0.9 ? '#ef4444' : '#f97316',
                                fillOpacity: 0.015,
                                color: 'transparent'
                              }}
                            />
                            <Circle 
                              center={[lat, lon]}
                              radius={30}
                              pathOptions={{ 
                                fillColor: confidence > 0.9 ? '#ef4444' : '#f97316',
                                fillOpacity: 0.02,
                                color: 'transparent'
                              }}
                            />
                            
                            <Marker
                              position={[lat, lon]}
                              icon={pestIcon || undefined}
                            >
                              <Popup>
                                <div className="w-48 p-1">
                                  <img 
                                    src={entry.image || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem'} 
                                    className="w-full h-24 object-cover rounded-xl mb-2" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-black text-xs text-slate-900 uppercase leading-none">{pestName}</p>
                                  </div>
                                  <div className="space-y-1 border-t border-slate-100 pt-2 mt-2">
                                    <p className="text-[9px] text-slate-500 flex items-center gap-1 font-bold">
                                      <MapPin size={10} className="text-emerald-500" /> {address}
                                    </p>
                                    <p className="text-[8px] font-mono text-slate-400 bg-slate-50 p-1 rounded">
                                      LAT: {lat.toFixed(6)} | LON: {lon.toFixed(6)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${confidence * 100}%` }} />
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-600">{(confidence * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              </Popup>
                            </Marker>
                          </React.Fragment>
                        );
                      });
                    })()}
                  </MapContainer>
                </ErrorBoundary>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-amber-500 p-3 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-slate-900 font-black text-sm uppercase tracking-tight">Análise de Infestação</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Regiões com Maior Incidência</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(() => {
                    const counts: Record<string, number> = {};
                    history.forEach(h => {
                      const region = h.location?.split(',')[0] || 'Desconhecido';
                      counts[region] = (counts[region] || 0) + 1;
                    });
                    return Object.entries(counts)
                      .map(([name, value]) => ({ name, value }))
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5);
                  })()}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                              <p className="text-[9px] font-black uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                              <p className="text-xs font-black">{payload[0].value} Ocorrências</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={30}>
                      {history.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Scans</p>
                  <p className="text-xl font-black text-slate-900">{history.length}</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Focos Ativos</p>
                  <p className="text-xl font-black text-emerald-600">
                    {history.filter(h => h.result.confidence > 0.9).length}
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setView('main')}
              className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase shadow-2xl active:scale-95 transition-all"
            >
              Voltar ao Guia
            </button>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Scans Recentes</h3>
              <div className="flex gap-2">
                <button 
                  onClick={generateHeatmapLink}
                  className="flex items-center gap-2 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full active:scale-95 transition-all"
                >
                  <Share2 size={12} />
                  Mapa de Calor
                </button>
                <button 
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) {
                      setHistory(prev => prev.map(h => ({ ...h, selected: false })));
                    }
                  }}
                  className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full active:scale-95 transition-all ${isSelectionMode ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar Vários'}
                </button>
                <button 
                  onClick={() => fetchHistory(true)}
                  disabled={isFetching}
                  className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
                  {isFetching ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            </div>

            {isSelectionMode && history.some(h => h.selected) && (
              <div className="bg-emerald-600 p-4 rounded-3xl flex justify-between items-center animate-in slide-in-from-top-4">
                <p className="text-white text-[10px] font-black uppercase tracking-widest">
                  {history.filter(h => h.selected).length} itens selecionados
                </p>
                <button 
                  onClick={() => {
                    const selected = history.filter(h => h.selected);
                    if (selected.length > 0) {
                      // Usamos o primeiro como base para o relatório, mas passamos todos os selecionados
                      setCurrentResult({ 
                        ...selected[0].result, 
                        capturedImage: selected[0].image, 
                        timestamp: selected[0].timestamp,
                        // Adicionamos uma propriedade customizada para o relatório em massa
                        batchResults: selected.map(s => ({ ...s.result, capturedImage: s.image, timestamp: s.timestamp }))
                      } as any);
                      setView('report-setup');
                    }
                  }}
                  className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Gerar Relatório em Massa
                </button>
              </div>
            )}
            <div className="grid gap-4">
              {history.length === 0 ? (
                <div className="bg-white p-12 rounded-[3rem] text-center border border-slate-100">
                  <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-xs font-bold text-slate-300 uppercase">Nenhum scan realizado</p>
                </div>
              ) : (
                history.map(entry => (
                  <div 
                    key={entry.id} 
                    className={`bg-white p-4 rounded-[3rem] border flex gap-5 items-center shadow-sm active:scale-[0.98] transition-all relative group ${entry.selected ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}`} 
                    onClick={() => { 
                      if (isSelectionMode) {
                        setHistory(prev => prev.map(h => h.id === entry.id ? { ...h, selected: !h.selected } : h));
                      } else {
                        setCurrentResult({ ...entry.result, id: entry.id, capturedImage: entry.image, timestamp: entry.timestamp }); 
                        setView('result'); 
                      }
                    }}
                  >
                    {isSelectionMode && (
                      <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 ${entry.selected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}>
                        {entry.selected && <CheckCircle size={14} />}
                      </div>
                    )}
                    <div className="relative">
                      <img 
                        src={entry.image || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem'} 
                        className="w-20 h-20 rounded-[2rem] object-cover shadow-inner" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          console.warn("[History] Erro ao carregar imagem:", entry.image?.substring(0, 50));
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem';
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                        {entry.image?.startsWith('http') ? (
                          <Database size={10} className="text-emerald-500" />
                        ) : (
                          <Zap size={10} className="text-amber-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black text-slate-900 truncate mb-1">{entry.result.pest?.name || "Scan Desconhecido"}</p>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-slate-300" />
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            {new Date(entry.timestamp).toLocaleDateString()} - {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {entry.location && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Database size={10} className="text-emerald-300" />
                              <p className="text-[9px] text-emerald-600 font-black uppercase truncate max-w-[120px]">{entry.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteScan(entry.id, entry.image); }}
                        className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={16} className="text-slate-200" />
                    </div>
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
                  src={currentResult.capturedImage || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem'} 
                  className="w-full aspect-square object-cover rounded-[4rem] border-8 border-white shadow-2xl" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.warn("[Result] Erro ao carregar imagem:", currentResult.capturedImage?.substring(0, 50));
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem';
                  }}
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
                  {currentResult.location && (
                    <button 
                      onClick={() => openInNativeMaps(currentResult.location!.latitude, currentResult.location!.longitude)}
                      className="bg-white/90 backdrop-blur-md p-3 rounded-2xl text-slate-900 shadow-xl border border-white/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <MapPin size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Google Maps</span>
                    </button>
                  )}
                </div>
              </div>
            
            {currentResult.pestFound && currentResult.pest ? (
              <>
                {/* Location & Time Info */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                      <Database size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Localização da Captura</p>
                      <p className="text-xs font-bold text-slate-800">{currentResult.location?.address || 'Ponta Grossa, Paraná'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data e Hora</p>
                    <p className="text-xs font-bold text-slate-800">{new Date(currentResult.timestamp || Date.now()).toLocaleDateString()} - {new Date(currentResult.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Quick Observation Field */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Observação Local / Área
                  </label>
                  <textarea 
                    value={reportObservation}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReportObservation(val);
                      if (currentResult) setCurrentResult({ ...currentResult, observations: val });
                    }}
                    placeholder="Identifique o local, talhão ou área com ocorrência..."
                    rows={2}
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                  />
                </div>

                <PestBioCard pest={currentResult.pest} />
                
                {/* Innovative Feature: Generate Report */}
                <div className="mt-8 bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-all" />
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-500 p-3 rounded-2xl">
                      <FlaskConical size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight">Certificado de Inspeção</h4>
                      <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest">Relatório Profissional Digital</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gere um relatório técnico completo com fotos, geolocalização e recomendações biológicas para enviar via WhatsApp ou E-mail.
                  </p>
                  <button 
                    onClick={() => setView('report-setup')}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg"
                  >
                    <Zap size={14} /> Gerar Relatório PDF
                  </button>
                </div>
                
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
                  <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                    <Search className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-[220px] mx-auto">
                      A imagem pode estar desfocada ou a espécie não consta no banco de dados.
                    </p>
                    <div className="mt-6 pt-6 border-t border-slate-200/50 space-y-3">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dicas para Identificação:</p>
                      <ul className="text-[10px] text-slate-400 font-bold space-y-2">
                        <li className="flex items-center gap-2 justify-center">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Aproxime mais a câmera da praga
                        </li>
                        <li className="flex items-center gap-2 justify-center">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Garanta que haja luz suficiente
                        </li>
                        <li className="flex items-center gap-2 justify-center">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Toque na tela para focar antes de capturar
                        </li>
                      </ul>
                    </div>
                  </div>
                  
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

        {view === 'report-setup' && currentResult && (
          <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('result')} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all text-slate-400">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configurar Relatório</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  {currentResult.batchResults ? `Editando item ${activeBatchIndex + 1} de ${currentResult.batchResults.length}` : 'Preencha os dados adicionais'}
                </p>
              </div>
            </div>

            {/* Seletor de Pragas para Relatório em Massa */}
            {currentResult.batchResults && currentResult.batchResults.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
                {currentResult.batchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveBatchIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-2xl border-4 transition-all overflow-hidden ${
                      activeBatchIndex === idx ? 'border-emerald-500 scale-110 shadow-lg' : 'border-white opacity-50 grayscale'
                    }`}
                  >
                    <img src={res.capturedImage} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0">
                  <img src={currentResult.batchResults ? currentResult.batchResults[activeBatchIndex].capturedImage : currentResult.capturedImage} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Editando Agora</p>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    {currentResult.batchResults ? currentResult.batchResults[activeBatchIndex].pest?.name : currentResult.pest?.name}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} /> Área Afetada (m² ou Hectares)
                </label>
                <input 
                  type="text" 
                  value={reportArea}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReportArea(val);
                    if (currentResult) {
                      if (currentResult.batchResults) {
                        currentResult.batchResults[activeBatchIndex].area = val;
                        setCurrentResult({ ...currentResult });
                      } else {
                        setCurrentResult({ ...currentResult, area: val });
                      }
                    }
                  }}
                  placeholder="Ex: 50 Hectares, Talhão 04"
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} /> Medidas Realizadas
                </label>
                <textarea 
                  value={reportMeasures}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReportMeasures(val);
                    if (currentResult) {
                      if (currentResult.batchResults) {
                        currentResult.batchResults[activeBatchIndex].measures = val;
                        setCurrentResult({ ...currentResult });
                      } else {
                        setCurrentResult({ ...currentResult, measures: val });
                      }
                    }
                  }}
                  placeholder="Descreva as ações já tomadas no local..."
                  rows={3}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> Observações Adicionais
                </label>
                <textarea 
                  value={reportObservation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setReportObservation(val);
                    if (currentResult) {
                      if (currentResult.batchResults) {
                        currentResult.batchResults[activeBatchIndex].observations = val;
                        setCurrentResult({ ...currentResult });
                      } else {
                        setCurrentResult({ ...currentResult, observations: val });
                      }
                    }
                  }}
                  placeholder="Informações extras para o relatório técnico..."
                  rows={3}
                  className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Assinatura Eletrônica
                </label>
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 rounded-2xl border-2 border-slate-100 overflow-hidden relative">
                    <canvas 
                      ref={sigCanvas}
                      className="w-full h-40 cursor-crosshair"
                      style={{ width: '100%', height: '160px' }}
                      onMouseUp={() => {
                        if (signaturePadRef.current) {
                          setSignature(signaturePadRef.current.toDataURL());
                        }
                      }}
                      onTouchEnd={() => {
                        if (signaturePadRef.current) {
                          setSignature(signaturePadRef.current.toDataURL());
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button 
                        onClick={() => {
                          if (signaturePadRef.current) {
                            signaturePadRef.current.clear();
                            setSignature(null);
                          }
                        }}
                        className="p-2 bg-white text-slate-400 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-all"
                        title="Limpar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest text-center">Assine no campo acima para validar o relatório</p>
                </div>
              </div>

              <button 
                onClick={async () => {
                  await savePestDetails();
                }}
                disabled={loading}
                className="w-full py-5 bg-white border-2 border-emerald-500 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save size={14} />
                {loading ? 'Salvando...' : 'Salvar Informações do Item'}
              </button>

              <button 
                onClick={() => setView('report')}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Zap size={14} /> Gerar Certificado Final
              </button>
            </div>
          </div>
        )}

        {view === 'report' && currentResult && (
          <div className="space-y-8 pb-12 animate-in fade-in zoom-in-95 print:p-0 print:m-0">
            <div className="flex justify-between items-center px-2 print:hidden">
              <button onClick={() => setView('report-setup')} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all">
                <ArrowLeft size={18} /> Editar
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={handleShare}
                  disabled={isGeneratingPDF}
                  className="flex-1 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 px-6 py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Share2 size={18} />
                  )}
                  {isGeneratingPDF ? 'Gerando...' : 'Compartilhar'}
                </button>
                <button 
                  onClick={handleDownloadOnly}
                  disabled={isGeneratingPDF}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-95 transition-all text-slate-400 disabled:opacity-50"
                  title="Baixar PDF"
                >
                  <Printer size={20} />
                </button>
              </div>
            </div>

            <div id="report-content" ref={reportRef} data-report-container="true" className="rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 relative print:shadow-none print:border-none print:rounded-none" style={{ backgroundColor: '#ffffff' }}>
              {/* Header do Relatório */}
              <div className="p-10 text-white relative overflow-hidden print:bg-emerald-900 print:text-white" style={{ backgroundColor: '#064e3b' }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 blur-3xl print:hidden" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }} />
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-2xl border border-emerald-400/20" style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
                    <ShieldCheck size={24} style={{ color: '#34d399' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: '#ffffff' }}>{currentResult.batchResults ? 'Relatório Consolidado de Inspeção' : 'Certificado de Inspeção'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#34d399' }}>PestScan Pro • Digital Report</p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(52, 211, 153, 0.6)' }}>ID do Relatório</p>
                    <p className="text-xs font-mono font-bold" style={{ color: '#ffffff' }}>#PS-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(52, 211, 153, 0.6)' }}>Data de Emissão</p>
                    <p className="text-xs font-bold" style={{ color: '#ffffff' }}>{new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              {/* Conteúdo do Relatório */}
              <div className="p-10 space-y-12">
                
                {/* Panorama Geral (Charts & Map) */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Mapa de Calor / Localização Geral */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                        <Globe size={14} /> Mapa de Ocorrências (Heatmap)
                      </h3>
                      <div className="aspect-video rounded-[2rem] overflow-hidden border-4 shadow-inner relative group" style={{ borderColor: '#f8fafc', backgroundColor: '#f1f5f9' }}>
                        {reportEntries.some(e => e.location && isValidCoord(e.location.latitude)) ? (
                          <>
                            {(() => {
                              const validPoints = reportEntries.filter(e => e.location && isValidCoord(e.location.latitude));
                              const center = validPoints[0].location!;
                              const pointsStr = validPoints.map(p => `${p.location!.longitude},${p.location!.latitude},pm2rdm`).join('~');
                              return (
                                <img 
                                  src={`https://static-maps.yandex.ru/1.x/?lang=pt_BR&ll=${center.longitude},${center.latitude}&z=14&l=map&pt=${pointsStr}`}
                                  alt="Mapa Geral"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/map-consolidated/800/450`;
                                  }}
                                />
                              );
                            })()}
                            {/* Simulação de Heatmap em Massa */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                              {reportEntries.slice(0, 8).map((_, i) => (
                                <div 
                                  key={i}
                                  className="absolute rounded-full blur-3xl animate-pulse" 
                                  style={{ 
                                    backgroundColor: i % 2 === 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(249, 115, 22, 0.2)',
                                    width: `${100 + Math.random() * 100}px`,
                                    height: `${100 + Math.random() * 100}px`,
                                    top: `${15 + Math.random() * 70}%`,
                                    left: `${15 + Math.random() * 70}%`,
                                    animationDelay: `${i * 0.4}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`
                                  }} 
                                />
                              ))}
                            </div>
                            <div className="absolute bottom-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderColor: '#e2e8f0' }}>
                              <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#ef4444' }} />
                              <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>{reportEntries.length} Focos Identificados</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: '#f8fafc' }}>
                            <Globe size={32} style={{ color: '#e2e8f0' }} className="mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-tight" style={{ color: '#94a3b8' }}>Localização não disponível</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Gráfico de Distribuição */}
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                        <Activity size={14} /> Distribuição por Espécie
                      </h3>
                      <div className="aspect-video w-full bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportChartData}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip 
                              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase' }}
                            />
                            <Bar dataKey="count" radius={[10, 10, 10, 10]}>
                              {reportChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#94a3b8'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Medidas Preventivas Sugeridas (Consolidado) */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                      <ShieldCheck size={14} /> Medidas Preventivas Recomendadas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(() => {
                        const allMeasures = Array.from(new Set(reportEntries.flatMap(e => e.pest?.controlMethods || []))).slice(0, 6);
                        if (allMeasures.length === 0) return <p className="text-[10px] font-bold text-slate-400 italic">Nenhuma recomendação específica disponível.</p>;
                        return allMeasures.map((measure, i) => (
                          <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle size={10} />
                            </div>
                            <p className="text-[10px] font-bold text-emerald-900 leading-tight">{measure}</p>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="h-px w-full" style={{ backgroundColor: '#f1f5f9' }} />

                {/* Detalhamento Individual de cada Praga */}
                <div className="space-y-16">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-center" style={{ color: '#0f172a' }}>Detalhamento Técnico por Ocorrência</h3>
                  
                  {reportEntries.map((entry, index) => (
                    <div key={entry.id || index} className="space-y-8 pb-16 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-tight" style={{ color: '#1e293b' }}>
                            {entry.pest?.name || 'Scan Desconhecido'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                            Confiança: {(entry.confidence * 100).toFixed(1)}%
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            entry.pest?.riskLevel === 'Crítico' || entry.pest?.riskLevel === 'Alto' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            Risco: {entry.pest?.riskLevel || 'Moderado'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                          {/* Imagem */}
                          <div className="space-y-3">
                            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#94a3b8' }}>Evidência Fotográfica</p>
                            <div className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-slate-50 shadow-sm relative group">
                              <img 
                                src={entry.capturedImage || 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sem+Imagem'} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>

                          {/* Informações Rápidas */}
                          <div className="space-y-4 flex flex-col justify-center">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="p-5 rounded-2xl border border-slate-50" style={{ backgroundColor: '#f8fafc' }}>
                                <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Área Afetada</p>
                                <p className="text-[12px] font-bold" style={{ color: '#1e293b' }}>{entry.area || 'Não informado'}</p>
                              </div>
                              <div className="p-5 rounded-2xl border border-slate-50" style={{ backgroundColor: '#f8fafc' }}>
                                <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Localização</p>
                                <p className="text-[11px] font-bold" style={{ color: '#1e293b' }}>{entry.location?.address || 'GPS indisponível'}</p>
                              </div>
                            </div>
                            <div className="p-5 rounded-2xl border border-slate-50" style={{ backgroundColor: '#f8fafc' }}>
                              <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: '#94a3b8' }}>Coordenadas GPS</p>
                              <p className="text-[10px] font-mono font-bold" style={{ color: '#64748b' }}>
                                {entry.location?.latitude ? `${entry.location.latitude.toFixed(6)}, ${entry.location.longitude.toFixed(6)}` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Descrições Detalhadas - Agora em largura total para máxima visibilidade */}
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                              <Activity size={12} /> Medidas Realizadas e Ações Corretivas
                            </p>
                            <div className="p-6 rounded-3xl border border-slate-50" style={{ backgroundColor: '#f8fafc' }}>
                              <p className="text-[13px] font-medium leading-relaxed" style={{ color: '#334155' }}>
                                {entry.measures || 'Nenhuma medida registrada.'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                              <Info size={12} /> Observações Adicionais do Técnico
                            </p>
                            <div className="p-6 rounded-3xl border border-slate-50" style={{ backgroundColor: '#f8fafc' }}>
                              <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap" style={{ color: '#334155' }}>
                                {entry.observations || 'Sem observações adicionais.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px w-full" style={{ backgroundColor: '#f1f5f9' }} />

                {/* Dados Técnicos e Assinatura */}
                <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-2 gap-8" style={{ borderColor: '#f1f5f9' }}>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: '#94a3b8' }}>
                      <User size={14} /> Responsável Técnico
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">Juan Nicolas Terra</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Técnico em Agropecuária</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Conselho CFTA</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registro Nº 40222945826</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-end">
                    {signature ? (
                      <div className="w-48 h-20 border-b-2 border-slate-900 flex items-center justify-center">
                        <img src={signature} alt="Assinatura" className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-48 h-20 border-b-2 border-slate-200 flex items-center justify-center">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Assinatura Digital</p>
                      </div>
                    )}
                    <p className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Técnico</p>
                  </div>
                </div>

                <div className="pt-10 flex flex-col items-center border-t" style={{ borderColor: '#f1f5f9' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: '#0f172a' }}>
                    <Bug size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: '#0f172a' }}>PestScan Pro AI • Certificado Digital</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setView('main')}
              className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase shadow-2xl active:scale-95 transition-all print:hidden"
            >
              Finalizar e Sair
            </button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-8 pb-12">
            <button onClick={() => { setView('main'); setSelectedPest(null); }} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-all">
              <ArrowLeft size={18} /> Voltar ao Guia
            </button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>
      
      <PdfSuccessModal />
      
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-10 text-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-8 border-emerald-500/20 rounded-full" />
            <div className="absolute inset-0 border-8 border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText size={40} className="text-emerald-500" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Gerando Relatório</h3>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">Capturando dados e processando imagens...</p>
          <div className="mt-12 max-w-xs w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      )}

      {!isPublicView && (
        <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-10 pt-5 pb-10 flex justify-between items-center z-50 rounded-t-[3.5rem] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.08)]">
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
      )}

      {loading && (
        <div className="fixed inset-0 bg-emerald-950 z-[100] flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin shadow-2xl" />
            <Bug className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-3 uppercase tracking-tighter">Acessando IA Urbana</h2>
          <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-[0.4em] max-w-[200px] leading-relaxed">
            {loadingMessage}
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
        v2.8.1 Stable
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
