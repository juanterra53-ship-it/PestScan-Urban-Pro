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
import { analyzePestImage, analyzePestByName } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';

// Mantenha seus dados da enciclopédia aqui...
const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
  // ... (seus itens de pragas atuais)
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

  // Efeito para gerenciar cores de sistema e background
  useEffect(() => {
    const themeColor = (view === 'splash' || view === 'auth') ? '#022c22' : '#064e3b';
    const bodyBg = (view === 'splash' || view === 'auth') ? '#022c22' : '#f8fafc';
    
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.body.style.backgroundColor = bodyBg;
  }, [view]);

  // Gerenciamento de Sessão
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
      if (data) setHistory(data.map((item: any) => ({ 
        id: item.id, 
        timestamp: new Date(item.created_at).getTime(), 
        image: item.image_data, 
        result: item.analysis_result 
      })));
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setFlashOn(false);
  };

  // --- FUNÇÕES OTIMIZADAS (SENIOR LEVEL) ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true); setError(null);
    try {
      const img = new Image();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = base64Data;
      });

      // OTIMIZAÇÃO: Redimensionamento para Max 1024px
      const canvas = document.createElement('canvas');
      const maxWidth = 1024;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // OTIMIZAÇÃO: Compressão JPEG 0.7 (Reduz tamanho em até 90%)
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const fullResBase64 = `data:image/jpeg;base64,${compressedBase64}`;

      const res = await analyzePestImage(compressedBase64);
      const fullRes = { ...res, capturedImage: fullResBase64 };
      
      setCurrentResult(fullRes);
      setView('result');

      // OTIMIZAÇÃO: Salvamento Assíncrono (Não trava a UI)
      if (res.pestFound && user) {
        supabase.from('pest_detections')
          .insert({ 
            user_id: user.id, 
            image_data: fullRes.capturedImage, 
            pest_name: res.pest?.name || 'IA Gallery Scan', 
            confidence: res.confidence, 
            analysis_result: fullRes 
          })
          .then(() => fetchHistory());
      }
    } catch (e: any) {
      setError("Erro ao processar imagem.");
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (view !== 'camera') { setView('camera'); return; }
    if (!videoRef.current) return;
    
    setLoading(true); setError(null);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // OTIMIZAÇÃO: Redimensionamento inteligente
      const maxWidth = 1024;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // OTIMIZAÇÃO: Compressão agressiva para performance
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const fullResBase64 = `data:image/jpeg;base64,${base64}`;

      const res = await analyzePestImage(base64);
      const fullRes = { ...res, capturedImage: fullResBase64 };
      
      setCurrentResult(fullRes);
      setView('result');

      // OTIMIZAÇÃO: Background save
      if (res.pestFound && user) {
        supabase.from('pest_detections')
          .insert({ 
            user_id: user.id, 
            image_data: fullRes.capturedImage, 
            pest_name: res.pest?.name || 'IA Scan', 
            confidence: res.confidence, 
            analysis_result: fullRes 
          })
          .then(() => fetchHistory());
      }
    } catch (e: any) { 
      setError("Erro na análise. Tente novamente."); 
    } finally { setLoading(false); }
  };

  // ... (Restante do componente UI - Renderização de telas, botões, etc.)
  // Certifique-se de manter o código de renderização do seu App original abaixo desta linha
  
  return (
    // Seu JSX de retorno aqui...
    <div className="app-container">
      {/* ... conteúdo do app ... */}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
