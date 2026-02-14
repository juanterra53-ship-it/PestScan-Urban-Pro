import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Bug, Camera, BookOpen, History, 
  ChevronRight, ArrowLeft, Loader2, 
  ShieldAlert, Volume2, Sparkles, 
  AlertTriangle, X, Search, Info, Key,
  Trash2, Clock, Hammer, FlaskConical,
  User, Lock, Mail, LogOut, CheckCircle,
  Database, ShieldCheck
} from 'lucide-react';
import { supabase } from './supabaseClient';
import { analyzePestImage, generatePestAudio } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';

const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
  { 
    id: '1', name: 'Escorpião Amarelo', category: 'Aracnídeos', icon: '🦂',
    details: {
      name: 'Escorpião Amarelo', scientificName: 'Tityus serrulatus', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Tronco amarelo', 'Serrilha na cauda'],
      anatomy: 'Ferrão escuro com veneno ativo.',
      members: '8 pernas.',
      habits: 'Esconde-se em entulhos.',
      reproduction: 'Clonagem natural (Partenogênese).',
      larvalPhase: 'Ninfas brancas.',
      controlMethods: ['Manejo ambiental integrado', 'Busca ativa noturna com luz UV'],
      physicalMeasures: ['Instalação de telas em ralos', 'Vedação de frestas em paredes', 'Remoção de entulhos e madeiras', 'Criação de galinhas (predador natural)'],
      chemicalMeasures: ['Pouco eficazes (fecham estigmas pulmonares)', 'Microencapsulados lambda-cialotrina (uso profissional)', 'Não usar aerossol comum (causa dispersão)'],
      healthRisks: 'Picada grave, neurotóxica.'
    }
  },
  { 
    id: '2', name: 'Aranha Marrom', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Marrom', scientificName: 'Loxosceles spp.', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Pequena (3cm)', 'Cor marrom-claro', 'Mancha em forma de violino'],
      anatomy: 'Cefalotórax achatado, 6 olhos em pares.',
      members: '8 pernas finas.',
      habits: 'Noturna, teias irregulares atrás de móveis e quadros.',
      reproduction: 'Ovos em ootecas de seda branca.',
      larvalPhase: 'Aranhéus saem da ooteca após 40 dias.',
      controlMethods: ['Inspeção minuciosa', 'Limpeza frequente'],
      physicalMeasures: ['Aspirar atrás de móveis e quadros', 'Afastar camas das paredes (10cm)', 'Sacudir roupas e sapatos antes do uso'],
      chemicalMeasures: ['Piretróides microencapsulados em frestas', 'Polvilhamento em tomadas e conduítes', 'Tratamento espacial para desalojar'],
      healthRisks: 'Veneno loxoscélico, causa necrose e lesões graves.'
    }
  },
  { 
    id: '3', name: 'Aranha Armadeira', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Armadeira', scientificName: 'Phoneutria spp.', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Agressiva', 'Levanta as pernas dianteiras', 'Grande porte'],
      anatomy: 'Corpo piloso, manchas claras no abdômen.',
      members: '8 pernas robustas.',
      habits: 'Caçadora errante, não faz teia, esconde-se em bananeiras e sapatos.',
      reproduction: 'Postura de centenas de ovos em sacos de seda.',
      larvalPhase: 'Filhotes independentes e ágeis.',
      controlMethods: ['Controle de vegetação', 'Uso de EPI'],
      physicalMeasures: ['Manter jardins limpos e podados', 'Verificar sapatos e botas', 'Vedar soleiras de portas'],
      chemicalMeasures: ['Aplicação perimetral (barreira química)', 'Pulverização direta em abrigos externos'],
      healthRisks: 'Neurotóxica, dor intensa, arritmia e priapismo.'
    }
  },
  { 
    id: '4', name: 'Mosca Doméstica', category: 'Voadores', icon: '🪰',
    details: {
      name: 'Mosca Doméstica', scientificName: 'Musca domestica', category: 'Voadores', riskLevel: 'Alto',
      characteristics: ['Tórax acinzentado com 4 listras', 'Abdômen amarelado', 'Olhos avermelhados'],
      anatomy: 'Aparelho bucal lambedor-sugador (esponjoso).',
      members: '6 pernas.',
      habits: 'Diurna, sinantrópica, frequenta lixo e alimentos expostos.',
      reproduction: 'Ovos brancos em matéria orgânica em decomposição.',
      larvalPhase: 'Larvas brancas (bichos) que se alimentam de resíduos.',
      controlMethods: ['Saneamento e gestão de lixo', 'Exclusão física'],
      physicalMeasures: ['Telas em janelas (18 mesh)', 'Cortinas de ar em portas', 'Armadilhas luminosas UV-A com placa adesiva', 'Sacos de lixo fechados hermeticamente'],
      chemicalMeasures: ['Iscas granulares com atrativo sexual (feromônio)', 'Pulverização residual em paredes (locais de pouso)', 'Termonebulização (Fumacê) para adultos'],
      healthRisks: 'Vetor mecânico de Salmonella, E. coli e viroses.'
    }
  },
  { 
    id: '5', name: 'Mosca de Dreno', category: 'Voadores', icon: '🪰',
    details: {
      name: 'Mosca de Dreno', scientificName: 'Psychodidae', category: 'Voadores', riskLevel: 'Moderado',
      characteristics: ['Corpo peludo', 'Asas em forma de telhado', 'Voo lento e errático'],
      anatomy: 'Aparência de pequena mariposa cinza/preta.',
      members: '6 pernas.',
      habits: 'Vive em ambientes úmidos, ralos, fossas e filtros de esgoto.',
      reproduction: 'Postura de ovos no biofilme gelatinoso dos canos.',
      larvalPhase: 'Larvas semi-aquáticas que vivem na sujeira dos ralos.',
      controlMethods: ['Limpeza de criadouros', 'Correção estrutural'],
      physicalMeasures: ['Limpeza mecânica de ralos com escova (remover lodo)', 'Conserto de vazamentos e infiltrações', 'Uso de ralos com sistema abre-fecha'],
      chemicalMeasures: ['Bio-remediadores (bactérias que comem matéria orgânica)', 'Espumas expansivas inseticidas em canos', 'Não usar apenas água sanitária (pouco eficaz no biofilme)'],
      healthRisks: 'Transportam bactérias do esgoto; podem causar alergias.'
    }
  },
  { 
    id: '6', name: 'Mosca Varejeira', category: 'Voadores', icon: '🪰',
    details: {
      name: 'Mosca Varejeira', scientificName: 'Chrysomya / Cochliomyia', category: 'Voadores', riskLevel: 'Alto',
      characteristics: ['Brilho metálico (azul ou verde)', 'Porte robusto', 'Zumbido alto'],
      anatomy: 'Olhos grandes, corpo metálico.',
      members: '6 pernas.',
      habits: 'Atraída por carne fresca, feridas e matéria em decomposição.',
      reproduction: 'Põe ovos em tecidos vivos ou cadáveres.',
      larvalPhase: 'Larvas causam miíase (bicheira) alimentando-se de tecido.',
      controlMethods: ['Destinação rigorosa de lixo orgânico', 'Proteção individual'],
      physicalMeasures: ['Refrigeração de resíduos orgânicos (frigoríficos)', 'Telas de alta densidade', 'Armadilhas caça-moscas externas'],
      chemicalMeasures: ['Larvicidas em locais de reprodução', 'Pintura inseticida em superfícies de pouso', 'Iscas líquidas tóxicas'],
      healthRisks: 'Miíase primária e secundária, infecções graves.'
    }
  },
  { 
    id: '7', name: 'Rato de Telhado', category: 'Roedores', icon: '🐀',
    details: {
      name: 'Rato Preto (Telhado)', scientificName: 'Rattus rattus', category: 'Roedores', riskLevel: 'Crítico',
      characteristics: ['Cauda maior que o corpo', 'Orelhas grandes', 'Corpo esguio e preto/cinza'],
      anatomy: 'Focinho afilado, vibrissas longas.',
      members: '4 patas.',
      habits: 'Exímio escalador, vive no alto (forros, árvores, sótãos).',
      reproduction: 'Ninhos em locais elevados, 4 a 8 filhotes por cria.',
      larvalPhase: 'Filhotes nascem pelados e cegos (neófitos).',
      controlMethods: ['Manejo ambiental', 'Rat Proofing (vedação)'],
      physicalMeasures: ['Poda de galhos longe do telhado', 'Barreiras físicas em cabos e fios', 'Vedação de buracos > 1cm', 'Ratoeiras de impacto em vigas'],
      chemicalMeasures: ['Iscas parafinadas (blocos) amarradas no alto', 'Pó de contato em trilhas (uso profissional)', 'Iscas frescas em porta-iscas elevados'],
      healthRisks: 'Leptospirose, Peste Bubônica, Tifo murino.'
    }
  },
  { 
    id: '8', name: 'Ratazana', category: 'Roedores', icon: '🐀',
    details: {
      name: 'Ratazana (Esgoto)', scientificName: 'Rattus norvegicus', category: 'Roedores', riskLevel: 'Crítico',
      characteristics: ['Corpo robusto e pesado', 'Cauda menor que o corpo', 'Orelhas pequenas'],
      anatomy: 'Focinho rombo/arredondado, pelagem áspera.',
      members: '4 patas com membranas interdigitais (nada bem).',
      habits: 'Escavadora, vive em tocas no solo, beira de rios e esgotos.',
      reproduction: 'Colônias subterrâneas, altamente prolífica.',
      larvalPhase: 'Filhotes dependentes da mãe no ninho.',
      controlMethods: ['Desratização ativa', 'Saneamento'],
      physicalMeasures: ['Concretagem de tocas buracos', 'Telas em bueiros e saídas de esgoto', 'Placas de cola (pouco eficazes para tamanho grande)'],
      chemicalMeasures: ['Iscas anticoagulantes de dose única', 'Blocos extrusados resistentes à umidade', 'Pó químico em tocas (Rastros)'],
      healthRisks: 'Principal vetor da Leptospirose (urina), Hantavirose, Mordeduras.'
    }
  },
  { 
    id: '9', name: 'Camundongo', category: 'Roedores', icon: '🐁',
    details: {
      name: 'Camundongo', scientificName: 'Mus musculus', category: 'Roedores', riskLevel: 'Alto',
      characteristics: ['Pequeno porte', 'Orelhas grandes em relação à cabeça', 'Curioso'],
      anatomy: 'Adulto pesa aprox. 20g, pelagem macia.',
      members: '4 patas.',
      habits: 'Vive dentro de móveis, despensas, caixas e paredes (intradomiciliar).',
      reproduction: 'Ninhos feitos com papel/tecido picado, reprodução rápida.',
      larvalPhase: 'Filhotes minúsculos.',
      controlMethods: ['Captura mecânica', 'Organização 5S'],
      physicalMeasures: ['Placas de cola (adesivas) no rodapé', 'Ratoeiras mecânicas tipo "boca de sapo"', 'Eliminação de "bagunça" e caixas acumuladas'],
      chemicalMeasures: ['Sementes impregnadas com raticida', 'Iscas em pellet ou grãos', 'Iscas em pó dentro de paredes falsas'],
      healthRisks: 'Salmonelose, Alergias respiratórias, Leptospirose.'
    }
  },
  { 
    id: '10', name: 'Mosquito da Dengue', category: 'Voadores', icon: '🦟',
    details: {
      name: 'Aedes aegypti', scientificName: 'Aedes aegypti', category: 'Voadores', riskLevel: 'Crítico',
      characteristics: ['Cor escura com marcas brancas em lira no tórax', 'Pernas raiadas de branco'],
      anatomy: 'Probóscide fina para picada (fêmeas).',
      members: '6 pernas longas.',
      habits: 'Diurno, urbano, antropofílico (pica humanos), voo baixo.',
      reproduction: 'Ovos na parede de recipientes com água parada/limpa.',
      larvalPhase: 'Larvas aquáticas muito ativas ("martelinhos") e pupas.',
      controlMethods: ['Eliminação de criadouros', 'Educação sanitária'],
      physicalMeasures: ['Eliminar pratos de plantas e pneus', 'Telar caixas d\'água e ralos', 'Uso de repelentes elétricos e corporais', 'Raquete elétrica'],
      chemicalMeasures: ['Larvicidas biológicos (BTI) em água', 'Aplicação espacial UBV (Fumacê) para adultos', 'Aerossóis intra-domiciliares'],
      healthRisks: 'Dengue, Zika, Chikungunya, Febre Amarela Urbana.'
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
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{id: string; email: string; name: string} | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de Diagnóstico do Supabase
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error' | 'rls_error'>('checking');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Inicialização e Verificação de Sessão Supabase
  useEffect(() => {
    // Timer para o Splash
    const timer = setTimeout(() => {
      checkSession();
    }, 2500);

    // Ouvinte de mudanças na autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id,
          email: session.user.email || '', 
          name: session.user.email?.split('@')[0] || 'Usuário' 
        });
        fetchHistory(); 
        
        // Só redireciona automaticamente se não estiver fazendo logout
        // (Verificação implícita pelo estado do usuário)
        setView(prev => (prev === 'splash' || prev === 'auth') ? 'main' : prev);
      } else {
        // Se o evento for SIGNED_OUT, limpa tudo
        setUser(null);
        setHistory([]); 
        setView(prev => prev === 'splash' ? 'splash' : 'auth'); 
      }
    });

    return () => {
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    // getUser() é mais seguro que getSession() pois valida o token no servidor
    const { data: { user }, error } = await supabase.auth.getUser();
    if (user) {
      setUser({ 
        id: user.id,
        email: user.email || '', 
        name: user.email?.split('@')[0] || 'Usuário' 
      });
      await fetchHistory();
      setView('main');
    } else {
      setView('auth');
    }
  };

  const fetchHistory = async () => {
    setDbStatus('checking');
    try {
      const { data, error } = await supabase
        .from('pest_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === '42P01') {
          console.error("Tabela pest_detections não encontrada.");
          setDbStatus('error');
          setError("Configuração Pendente: Tabelas do banco de dados não encontradas.");
          return;
        } 
        if (error.code === '42501' || error.code === 'PGRST301') {
          console.error("Erro de permissão RLS.");
          setDbStatus('rls_error');
          setError("Erro de Permissão: As políticas de segurança (RLS) estão bloqueando o acesso.");
          return;
        }
        throw error;
      }

      setDbStatus('ok');
      if (data) {
        const formattedHistory: HistoryEntry[] = data.map((item: any) => ({
          id: item.id,
          timestamp: new Date(item.created_at).getTime(),
          image: item.image_data,
          result: item.analysis_result
        }));
        setHistory(formattedHistory);
      }
    } catch (err: any) {
      console.error("Erro ao carregar histórico:", err);
      if (err.message && err.message.includes('fetch')) {
         setError("Erro de conexão: Verifique sua internet.");
      }
    }
  };

  // Effect to handle Camera Lifecycle based on view state
  useEffect(() => {
    const initCamera = async () => {
      if (view === 'camera') {
        setError(null);
        try {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("Acesso à câmera indisponível (requer HTTPS ou localhost).");
          }

          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }

          let stream: MediaStream;
          try {
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' } 
            });
          } catch (firstErr) {
            console.warn("Could not get environment camera, falling back to any video device", firstErr);
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
          
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.error("Play error:", e));
            };
          }
        } catch (e: any) { 
          console.error(e);
          let msg = "Não foi possível acessar a câmera.";
          if (e.name === 'NotAllowedError') msg = "Acesso à câmera negado. Permita o acesso nas configurações.";
          if (e.name === 'NotFoundError') msg = "Nenhuma câmera encontrada no dispositivo.";
          if (e.name === 'NotReadableError') msg = "A câmera está sendo usada por outro aplicativo.";
          if (e.message) msg = e.message;
          setError(msg); 
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [view]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = async () => {
    if (view !== 'camera') { 
      setView('camera'); 
      return; 
    }
    
    if (!videoRef.current || !videoRef.current.videoWidth) {
      if (error) return; 
      return; 
    }
    
    setLoading(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Erro ao capturar contexto de imagem");
      
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const fullBase64Image = `data:image/jpeg;base64,${base64}`;

      stopCamera();

      const res = await analyzePestImage(base64);
      const fullRes = { ...res, capturedImage: fullBase64Image };
      setCurrentResult(fullRes);
      
      if (res.pestFound && user) {
        const { data, error: dbError } = await supabase.from('pest_detections').insert({
          user_id: user.id,
          image_data: fullBase64Image,
          pest_name: fullRes.pest?.name || 'Desconhecido',
          confidence: fullRes.confidence,
          analysis_result: fullRes
        }).select().single();

        if (dbError) {
          console.error("Erro ao salvar no banco:", dbError);
          if (dbError.code === '42501') {
             alert("Erro de Segurança: Não foi possível salvar o registro devido a permissões insuficientes.");
          } else if (dbError.code === '42P01') {
             alert("Erro de Configuração: Tabela de detecções não existe.");
          }
        } else if (data) {
          const newEntry: HistoryEntry = { 
            id: data.id, 
            timestamp: new Date(data.created_at).getTime(), 
            image: fullBase64Image, 
            result: fullRes 
          };
          setHistory(prev => [newEntry, ...prev].slice(0, 20));
        }
      }
      setView('result');
    } catch (e: any) {
      setError(e.message || "Erro desconhecido ao processar imagem.");
      setView('camera'); 
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).catch(() => null);
      if (stream) {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert("Cadastro realizado! Verifique seu e-mail se necessário ou faça login.");
      }
    } catch (err: any) {
      setError(err.message || "Erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Deseja sair da sua conta?")) return;

    setLoading(true);

    // 1. Parar Câmera imediatamente
    stopCamera();

    // 2. Limpeza Local Imediata (UI First)
    // Removemos dados locais e resetamos a UI *antes* de falar com o servidor.
    // Isso garante que o usuário saia instantaneamente, resolvendo o "travamento".
    localStorage.clear();
    sessionStorage.clear();

    setUser(null);
    setHistory([]);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setAuthMode('login');

    // 3. Forçar mudança de tela para Login
    setView('auth');
    setLoading(false);

    // 4. Desconectar no Servidor (Background / Fire and Forget)
    // Executamos sem await para não bloquear a UI caso a internet esteja lenta.
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Aviso: Erro ao notificar servidor sobre logout, mas sessão local foi encerrada com sucesso.", error);
    }
  };

  const clearHistory = async () => {
    if (confirm("Deseja apagar todo o histórico?") && user) {
      const { error } = await supabase
        .from('pest_detections')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        alert("Erro ao limpar histórico online.");
        console.error(error);
      } else {
        setHistory([]);
      }
    }
  };

  const filteredData = ENCYCLOPEDIA_DATA.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'splash') {
    return (
      <div className="h-screen bg-emerald-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <Bug className="w-20 h-20 text-emerald-400 animate-bounce mb-4" />
        <h1 className="text-3xl font-black tracking-tight">PestScan Pro</h1>
        <p className="text-xs text-emerald-400/60 uppercase font-black tracking-[0.3em] mt-2">IA Bio-Urbana v1.0</p>
      </div>
    );
  }

  // Auth Screen
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8 animate-in relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-emerald-900/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6 z-10">
          <div className="bg-emerald-900/50 p-4 rounded-3xl mb-4 backdrop-blur-sm border border-emerald-800">
            <Bug className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            {authMode === 'login' ? 'Bem-vindo' : 'Criar Conta'}
          </h1>
          <p className="text-emerald-400/60 text-sm mt-2 font-medium text-center max-w-[250px]">
            {authMode === 'login' 
              ? 'Acesse sua conta para identificar e catalogar pragas urbanas.' 
              : 'Junte-se à maior rede de monitoramento biológico urbano.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl mb-4 text-xs font-bold w-full max-w-sm text-center z-10 flex flex-col gap-1">
            <span className="flex items-center gap-2 justify-center"><AlertTriangle size={14}/> Atenção</span>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4 z-10">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors">
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                required
                placeholder="Seu e-mail profissional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-emerald-900/40 border border-emerald-800/50 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-600 outline-none transition-all shadow-lg shadow-emerald-950/20"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors">
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                required
                placeholder="Sua senha segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-emerald-900/40 border border-emerald-800/50 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-600 outline-none transition-all shadow-lg shadow-emerald-950/20"
              />
            </div>

            {authMode === 'register' && (
              <div className="relative group animate-in">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors">
                  <CheckCircle size={20} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-emerald-900/40 border border-emerald-800/50 focus:border-emerald-500 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-emerald-600 outline-none transition-all shadow-lg shadow-emerald-950/20"
                />
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : (authMode === 'login' ? 'Entrar no Sistema' : 'Cadastrar Perfil')}
            </button>
          </div>
        </form>

        <div className="mt-8 z-10">
          <button 
            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setEmail(''); setPassword(''); setConfirmPassword(''); setError(null); }}
            className="text-emerald-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            {authMode === 'login' ? 'Não tem acesso? Cadastre-se' : 'Já possui conta? Fazer Login'}
          </button>
        </div>
      </div>
    );
  }

  const PestBioCard = ({ pest }: { pest: PestInfo }) => (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in">
       <div className="flex justify-between items-start mb-4">
         <div>
           <h2 className="text-2xl font-black text-slate-900 leading-tight">{pest.name}</h2>
           <p className="text-emerald-600 font-bold italic text-sm">{pest.scientificName}</p>
         </div>
         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
           pest.riskLevel === 'Crítico' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
         }`}>
           Risco {pest.riskLevel}
         </div>
       </div>

       <div className="space-y-4">
         <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-50 p-3 rounded-2xl">
             <p className="text-[10px] font-black text-slate-400 uppercase">Membros</p>
             <p className="text-sm font-bold text-slate-700">{pest.members}</p>
           </div>
           <div className="bg-slate-50 p-3 rounded-2xl">
             <p className="text-[10px] font-black text-slate-400 uppercase">Reprodução</p>
             <p className="text-sm font-bold text-slate-700 truncate">{pest.reproduction}</p>
           </div>
         </div>

         <div className="space-y-2">
           <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
             <Info size={14} /> Hábitos e Bio
           </h4>
           <p className="text-sm text-slate-600 leading-relaxed">{pest.habits}</p>
         </div>

         <div className="bg-emerald-900 p-5 rounded-[2rem] text-white shadow-inner">
           <h4 className="font-black text-xs uppercase mb-3 text-emerald-300 flex items-center gap-2">
             <ShieldAlert size={14} /> Protocolo Geral
           </h4>
           <ul className="space-y-2">
             {pest.controlMethods.map((m, i) => (
               <li key={i} className="text-xs flex gap-2">
                 <span className="text-emerald-400 font-bold">•</span> {m}
               </li>
             ))}
           </ul>
         </div>

         {pest.physicalMeasures && pest.physicalMeasures.length > 0 && (
           <div className="bg-blue-50 border border-blue-100 p-5 rounded-[2rem] text-slate-700">
             <h4 className="font-black text-xs uppercase mb-3 text-blue-600 flex items-center gap-2">
               <Hammer size={14} /> Medidas Físicas
             </h4>
             <ul className="space-y-2">
               {pest.physicalMeasures.map((m, i) => (
                 <li key={i} className="text-xs flex gap-2">
                   <span className="text-blue-400 font-bold">→</span> {m}
                 </li>
               ))}
             </ul>
           </div>
         )}

         {pest.chemicalMeasures && pest.chemicalMeasures.length > 0 && (
           <div className="bg-purple-50 border border-purple-100 p-5 rounded-[2rem] text-slate-700">
             <h4 className="font-black text-xs uppercase mb-3 text-purple-600 flex items-center gap-2">
               <FlaskConical size={14} /> Medidas Químicas
             </h4>
             <ul className="space-y-2">
               {pest.chemicalMeasures.map((m, i) => (
                 <li key={i} className="text-xs flex gap-2">
                   <span className="text-purple-400 font-bold">⚡</span> {m}
                 </li>
               ))}
             </ul>
           </div>
         )}

         <div className="pt-2">
           <p className="text-[10px] text-red-500 font-black uppercase mb-1">Riscos à Saúde</p>
           <p className="text-xs text-slate-500 italic">{pest.healthRisks}</p>
         </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden">
      <header className="bg-emerald-900 p-6 pt-12 pb-8 rounded-b-[3.5rem] text-white sticky top-0 z-40 shadow-lg shadow-emerald-950/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl">
              <Bug className="text-emerald-400 w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-none">PestScan IA</h1>
              <p className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest mt-1">
                {user ? `Olá, ${user.name}` : 'Urbano Profissional'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Indicador de Status do Banco de Dados */}
             {dbStatus === 'error' && (
                <div className="bg-red-500 p-2 rounded-xl text-white animate-pulse" title="Tabela não encontrada">
                   <Database size={20} />
                </div>
             )}
             {dbStatus === 'rls_error' && (
                <div className="bg-orange-500 p-2 rounded-xl text-white animate-pulse" title="Erro de Permissão">
                   <ShieldAlert size={20} />
                </div>
             )}
             {dbStatus === 'ok' && (
                <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400" title="Banco de Dados Conectado e Seguro">
                   <ShieldCheck size={20} />
                </div>
             )}

            {view === 'main' && user && (
              <button onClick={handleLogout} className="p-2 bg-white/10 rounded-xl text-emerald-400 hover:bg-red-500 hover:text-white transition-colors">
                <LogOut size={20} />
              </button>
            )}
            {view !== 'main' && (
              <button onClick={() => { setView('main'); stopCamera(); setError(null); }} className="p-2 bg-white/10 rounded-xl">
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 pb-36 overflow-y-auto overflow-x-hidden">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-5 rounded-[2.5rem] mb-6 animate-in shadow-xl shadow-red-900/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-200 p-1.5 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <p className="font-black text-sm">Atenção</p>
            </div>
            <p className="text-xs leading-relaxed opacity-80">{error}</p>
          </div>
        )}

        {view === 'main' && (
          <div className="space-y-6 animate-in">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Escorpião, Aranha, Barata..." 
                className="w-full h-14 bg-white border border-slate-100 rounded-[1.5rem] pl-12 pr-6 text-sm shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between mb-2">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Catálogo Biológico</h3>
               <span className="text-[10px] font-bold text-emerald-600">{filteredData.length} espécies</span>
            </div>

            <div className="grid gap-3">
              {filteredData.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setSelectedPest(item.details); setView('detail'); }} 
                  className="flex items-center gap-4 p-5 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">{item.icon}</div>
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-sm leading-none mb-1">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-200" />
                </button>
              ))}
              {filteredData.length === 0 && (
                <div className="p-10 text-center opacity-40">
                  <Search size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-bold">Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="animate-in flex flex-col items-center">
             <div className="w-full aspect-[4/5] bg-slate-900 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl relative shadow-emerald-950/10">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-3/4 border border-white/30 rounded-[2.5rem] relative">
                     <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white/80 rounded-tl-xl" />
                     <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white/80 rounded-tr-xl" />
                     <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white/80 rounded-bl-xl" />
                     <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white/80 rounded-br-xl" />
                  </div>
                </div>
             </div>
             <div className="mt-8 text-center space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Scanner Pronto</p>
                <p className="text-sm font-bold text-slate-600 px-10">Toque no botão de câmera abaixo para identificar.</p>
             </div>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Análises Recentes</h3>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 active:opacity-50">
                  <Trash2 size={12} /> Limpar
                </button>
              )}
            </div>

            <div className="grid gap-4">
              {history.map(entry => (
                <div key={entry.id} className="bg-white p-3 rounded-[2rem] border border-slate-100 flex gap-4 items-center shadow-sm">
                  <img src={entry.image} className="w-20 h-20 rounded-2xl object-cover shadow-inner" />
                  <div className="flex-1 py-1">
                    <p className="text-xs font-black text-slate-900 leading-none mb-1">{entry.result.pest?.name || "Desconhecido"}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mb-2">{new Date(entry.timestamp).toLocaleDateString()} • {new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <button 
                      onClick={() => { setCurrentResult(entry.result); setView('result'); }}
                      className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"
                    >
                      Ver Detalhes <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              ))}

              {history.length === 0 && (
                <div className="py-20 text-center text-slate-300">
                  <Clock size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-sm">Sem histórico de análises</p>
                  <p className="text-xs">Capture fotos para iniciar seu arquivo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="animate-in space-y-6 pb-10">
            <div className="relative group">
              <img src={currentResult.capturedImage} className="w-full aspect-square object-cover rounded-[3.5rem] shadow-2xl border-4 border-white" />
              <div className="absolute top-6 right-6 bg-emerald-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Confiança IA</p>
                <p className="text-xs font-black">{(currentResult.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>

            {currentResult.pestFound && currentResult.pest ? (
              <PestBioCard pest={currentResult.pest} />
            ) : (
              <div className="bg-white p-12 rounded-[3.5rem] text-center shadow-sm border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <ShieldAlert className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Não Identificado</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6 px-4">Nossa IA não conseguiu classificar esta imagem com segurança. Tente uma foto com melhor luz e foco.</p>
                <button 
                  onClick={() => setView('camera')} 
                  className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                >
                  Nova Tentativa
                </button>
              </div>
            )}
            
            <button 
              onClick={() => { setView('main'); setCurrentResult(null); }} 
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20"
            >
              Voltar ao Menu
            </button>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="animate-in space-y-6 pb-10">
            <button onClick={() => setView('main')} className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-50 active:scale-95 transition-all">
              <ArrowLeft size={16} /> Voltar
            </button>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-10 pt-4 pb-12 flex justify-around items-center z-50 rounded-t-[3rem] shadow-2xl shadow-emerald-950/20">
        <button 
          onClick={() => { setView('main'); stopCamera(); setError(null); }} 
          className={`flex flex-col items-center gap-1 transition-all ${view === 'main' || view === 'detail' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}
        >
           <BookOpen size={24} />
           <span className="text-[8px] font-black uppercase">Catálogo</span>
        </button>

        <button 
          onClick={handleCapture} 
          className="w-20 h-20 -mt-20 bg-emerald-600 rounded-full flex items-center justify-center border-8 border-slate-50 shadow-2xl active:scale-90 transition-all group"
        >
          <Camera className="text-white group-active:scale-110 transition-transform" size={28} />
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 -z-10" />
        </button>

        <button 
          onClick={() => { setView('history'); stopCamera(); setError(null); }} 
          className={`flex flex-col items-center gap-1 transition-all ${view === 'history' ? 'text-emerald-600 scale-110' : 'text-slate-300'}`}
        >
           <History size={24} />
           <span className="text-[8px] font-black uppercase">Arquivo</span>
        </button>
      </nav>

      {loading && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-10 text-center animate-in">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
            <Bug className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2">
            Análise Biológica
          </h2>
          <div className="flex flex-col gap-1 items-center">
            <p className="text-[10px] text-emerald-300 uppercase font-black tracking-[0.3em]">
               Consultando Banco de Dados IA
            </p>
            <div className="w-48 h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
               <div className="h-full bg-emerald-400 w-1/2 animate-[progress_2s_infinite_linear]" />
            </div>
          </div>
          <style>{`
            @keyframes progress { 
              0% { transform: translateX(-100%); } 
              100% { transform: translateX(200%); } 
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);