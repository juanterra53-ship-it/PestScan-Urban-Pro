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
  },
  { 
    id: '13', name: 'Barata de Faixa Marrom', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata de Faixa Marrom', scientificName: 'Supella longipalpa', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Pequena (1.2cm)', 'Duas faixas transversais claras no abdômen e asas', 'Cor marrom-claro'],
      anatomy: 'Asas do macho ultrapassam o abdômen; na fêmea são mais curtas e arredondadas.',
      members: '6 pernas ágeis.',
      habits: 'Prefere locais altos e secos (diferente da Germânica). Encontrada em estantes, quadros, motores de TV e computadores.',
      reproduction: 'A fêmea cola a ooteca em superfícies altas e escondidas. Cada ooteca contém cerca de 14-18 ovos.',
      larvalPhase: 'Ninfas possuem as faixas transversais muito nítidas, facilitando a identificação precoce.',
      controlMethods: ['Aplicação focal de gel em locais altos', 'Limpeza de poeira e resíduos em eletrônicos', 'Inspeção de móveis'],
      physicalMeasures: ['Remover acúmulo de papéis e caixas', 'Vedar furos em móveis de madeira', 'Limpeza de prateleiras superiores'],
      chemicalMeasures: ['Iscas em gel específicas para locais secos', 'Aerossóis de baixo odor em frestas altas'],
      healthRisks: 'Contaminação de superfícies e equipamentos eletrônicos, além de potencial alergênico.'
    }
  },
  { 
    id: '14', name: 'Barata Oriental', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Oriental', scientificName: 'Blatta orientalis', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Média (2.5cm)', 'Cor marrom-escura a preta', 'Corpo brilhante e robusto'],
      anatomy: 'Dimorfismo sexual acentuado: machos têm asas curtas; fêmeas têm apenas vestígios de asas.',
      members: '6 pernas fortes.',
      habits: 'Gosta de locais frios e muito úmidos. Comum em porões, ralos externos, áreas de serviço e jardins com muita matéria orgânica.',
      reproduction: 'A fêmea deposita a ooteca em locais úmidos e protegidos. Contém cerca de 16 ovos.',
      larvalPhase: 'Desenvolvimento lento, podendo levar de 1 a 2 anos dependendo da temperatura.',
      controlMethods: ['Tratamento de ralos e áreas úmidas', 'Redução de umidade estrutural', 'Iscas resistentes à umidade'],
      physicalMeasures: ['Vedar passagens de tubulação', 'Limpar calhas e drenos', 'Remover pilhas de folhas úmidas'],
      chemicalMeasures: ['Inseticidas líquidos de efeito residual', 'Pós químicos em fendas úmidas'],
      healthRisks: 'Forte odor característico e transporte de patógenos de áreas contaminadas.'
    }
  },
  { 
    id: '15', name: 'Barata de Madeira', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata de Madeira', scientificName: 'Parcoblatta spp.', category: 'Rasteiros', riskLevel: 'Baixo',
      characteristics: ['Média (2cm)', 'Cor marrom-pálida', 'Bordas das asas transparentes'],
      anatomy: 'Machos voam bem e são atraídos pela luz; fêmeas têm asas curtas e não voam.',
      members: '6 pernas.',
      habits: 'Vivem ao ar livre em troncos podres e sob cascas de árvores. Entram em casas acidentalmente atraídas por luzes ou lenha.',
      reproduction: 'Ciclo de vida adaptado ao ambiente externo, com eclosão na primavera.',
      larvalPhase: 'Ninfas vivem no solo e matéria orgânica em decomposição.',
      controlMethods: ['Apagar luzes externas desnecessárias', 'Manter lenha longe da casa', 'Vedação de portas'],
      physicalMeasures: ['Telas em janelas', 'Remover madeira podre do jardim'],
      chemicalMeasures: ['Geralmente não requer tratamento químico interno'],
      healthRisks: 'Mínimo, considerada praga acidental que não se infesta em ambientes internos limpos.'
    }
  },
  { 
    id: '16', name: 'Barata Cinzenta', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Cinzenta', scientificName: 'Nauphoeta cinerea', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Média (2.8cm)', 'Padrão mosqueado cinza e marrom', 'Capacidade de escalar superfícies lisas'],
      anatomy: 'Corpo achatado, asas curtas que não cobrem todo o abdômen.',
      members: '6 pernas com garras tarsais potentes.',
      habits: 'Comum em depósitos de grãos e rações. Muito usada como alimento vivo para pets exóticos devido à facilidade de criação.',
      reproduction: 'Ovovivípara: a fêmea retém a ooteca internamente até o nascimento das ninfas.',
      larvalPhase: 'Ninfas nascem prontas para se alimentar e crescem rápido.',
      controlMethods: ['Limpeza de restos de grãos', 'Controle de estoque (FIFO)', 'Iscas em gel'],
      physicalMeasures: ['Armazenar rações em potes herméticos', 'Limpar farelos de prateleiras'],
      chemicalMeasures: ['Tratamento de frestas em depósitos', 'Uso de IGRs'],
      healthRisks: 'Alergias respiratórias e contaminação de alimentos estocados.'
    }
  },
  { 
    id: '17', name: 'Barata de Jardim', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata de Jardim', scientificName: 'Pycnoscelus surinamensis', category: 'Rasteiros', riskLevel: 'Baixo',
      characteristics: ['Média (2cm)', 'Corpo escuro com pronoto preto brilhante', 'Hábito de se enterrar'],
      anatomy: 'Corpo robusto adaptado para escavação.',
      members: '6 pernas curtas e fortes.',
      habits: 'Vivem no solo, sob vasos de plantas e jardins. São partenogenéticas (apenas fêmeas na maioria das populações).',
      reproduction: 'Reprodução assexuada rápida em solos férteis.',
      larvalPhase: 'Ninfas vivem enterradas alimentando-se de raízes e detritos.',
      controlMethods: ['Manejo de vasos e solo', 'Evitar excesso de rega'],
      physicalMeasures: ['Trocar terra infestada', 'Limpeza de pratinhos de vasos'],
      chemicalMeasures: ['Inseticidas granulados no solo se necessário'],
      healthRisks: 'Danos a plantas ornamentais, raramente entram em casas.'
    }
  },
  { 
    id: '18', name: 'Barata Australiana', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Australiana', scientificName: 'Periplaneta australasiae', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Grande (3.5cm)', 'Similar à Americana mas com marcas amarelas nas asas', 'Cor marrom-escura'],
      anatomy: 'Asas bem desenvolvidas, corpo ligeiramente mais largo que a Americana.',
      members: '6 pernas.',
      habits: 'Prefere climas tropicais e locais com muita vegetação. Comum em estufas e jardins de inverno.',
      reproduction: 'Ciclo similar à Barata Americana.',
      larvalPhase: 'Ninfas têm marcas amarelas distintas no tórax.',
      controlMethods: ['Controle de vegetação próxima a janelas', 'Barreiras químicas'],
      physicalMeasures: ['Podar plantas que encostam na casa', 'Vedar frestas'],
      chemicalMeasures: ['Pulverização perimetral', 'Iscas externas'],
      healthRisks: 'Vetor de patógenos e danos a plantas de interior.'
    }
  },
  { 
    id: '19', name: 'Barata de Cozinha (Ninfas)', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata de Cozinha (Ninfas)', scientificName: 'Blattella germanica (juvenil)', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Muito pequenas (2-8mm)', 'Sem asas', 'Cor escura com centro claro'],
      anatomy: 'Corpo em crescimento, antenas proporcionalmente longas.',
      members: '6 pernas.',
      habits: 'Permanecem muito próximas aos abrigos (frestas). Sua presença indica infestação ativa e local de reprodução.',
      reproduction: 'Fase imatura, ainda não se reproduzem.',
      larvalPhase: 'Passam por várias mudas (instares) até a fase adulta.',
      controlMethods: ['Uso de IGR (Regulador de Crescimento)', 'Gel isca'],
      physicalMeasures: ['Vedar frestas milimétricas', 'Limpeza extrema de resíduos'],
      chemicalMeasures: ['Gel isca e sprays com efeito desalojante'],
      healthRisks: 'Mesmos riscos da adulta, indicando alta densidade populacional.'
    }
  },
  { 
    id: '20', name: 'Barata Gigante de Madagascar', category: 'Rasteiros', icon: '🪳',
    details: {
      name: 'Barata Gigante de Madagascar', scientificName: 'Gromphadorhina portentosa', category: 'Rasteiros', riskLevel: 'Baixo',
      characteristics: ['Enorme (até 8cm)', 'Sem asas', 'Capacidade de emitir som (chiado)'],
      anatomy: 'Exoesqueleto muito duro e chifres nos machos.',
      members: '6 pernas com garras fortes.',
      habits: 'Não são pragas urbanas. Vivem em florestas. Comuns como pets exóticos.',
      reproduction: 'Ovovivíparas, cuidam das ninfas nos primeiros dias.',
      larvalPhase: 'Ninfas grandes e lentas.',
      controlMethods: ['Não requer controle, apenas manejo em cativeiro'],
      physicalMeasures: ['Terrários seguros'],
      chemicalMeasures: ['Nenhuma'],
      healthRisks: 'Nenhum, não transmitem doenças humanas.'
    }
  },
  { 
    id: '3', name: 'Aranha de Jardim', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Jardim', scientificName: 'Lycosa erythrognatha', category: 'Aracnídeos', riskLevel: 'Moderado',
      characteristics: ['Média (5cm)', 'Desenho de "seta" no abdômen', 'Quelíceras com pelos avermelhados'],
      anatomy: 'Corpo robusto, peludo, cor cinza-amarronzada.',
      members: '8 pernas fortes para corrida.',
      habits: 'Errante e caçadora. Não constrói teia para capturar presas. Vive em gramados e jardins. Ativa durante o dia.',
      reproduction: 'A fêmea carrega a ooteca presa às fieiras e depois os filhotes no dorso.',
      larvalPhase: 'Filhotes saem da ooteca e sobem no dorso da mãe por alguns dias.',
      controlMethods: ['Manter grama aparada', 'Uso de calçados fechados no jardim'],
      physicalMeasures: ['Limpeza de jardins', 'Remover entulhos'],
      chemicalMeasures: ['Barreira química externa se necessário'],
      healthRisks: 'Picada dolorosa mas veneno de baixa toxicidade para humanos (ação local).'
    }
  },
  { 
    id: '4', name: 'Aranha de Prata', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Prata', scientificName: 'Argiope argentata', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Abdômen prateado e lobado', 'Constrói teia em "X"', 'Fica no centro da teia'],
      anatomy: 'Cefalotórax pequeno, abdômen grande e geométrico.',
      members: '8 pernas longas dispostas em pares.',
      habits: 'Orbicular (faz teias circulares). Vive em jardins entre plantas. Excelente controladora natural de insetos voadores.',
      reproduction: 'Ootecas de seda amarelada presas na vegetação próxima.',
      larvalPhase: 'Filhotes se dispersam pelo vento (ballooning).',
      controlMethods: ['Geralmente benéfica, não requer controle'],
      physicalMeasures: ['Remover teias se incomodarem'],
      chemicalMeasures: ['Não recomendado'],
      healthRisks: 'Inofensiva para humanos.'
    }
  },
  { 
    id: '7', name: 'Aranha de Parede', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Parede', scientificName: 'Selenops spp.', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Muito achatada', 'Extremamente rápida', 'Cor camuflada com a parede/tronco'],
      anatomy: 'Corpo desenhado para entrar em frestas mínimas.',
      members: '8 pernas estendidas lateralmente.',
      habits: 'Noturna. Caça moscas e pequenas baratas nas paredes. Não faz teia de captura.',
      reproduction: 'Ooteca achatada colada em superfícies.',
      larvalPhase: 'Ninfas independentes desde o nascimento.',
      controlMethods: ['Controle de presas (moscas/baratas)'],
      physicalMeasures: ['Limpeza de frestas'],
      chemicalMeasures: ['Não necessário'],
      healthRisks: 'Inofensiva, foge rapidamente ao contato.'
    }
  },
  { 
    id: '8', name: 'Aranha Saltadora', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Saltadora', scientificName: 'Family Salticidae', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Pequena', 'Olhos frontais grandes', 'Movimentos bruscos e saltos'],
      anatomy: 'Visão excelente, corpo compacto.',
      members: '8 pernas, as frontais muitas vezes mais fortes.',
      habits: 'Caçadora diurna ativa. Não faz teia. Muito comum dentro de casas em janelas e paredes ensolaradas.',
      reproduction: 'Rituais de acasalamento complexos (danças).',
      larvalPhase: 'Ninfas miniaturas dos adultos.',
      controlMethods: ['Nenhum, são predadoras úteis'],
      physicalMeasures: ['Nenhuma'],
      chemicalMeasures: ['Não recomendado'],
      healthRisks: 'Totalmente inofensiva.'
    }
  },
  { 
    id: '9', name: 'Viúva Negra', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Viúva Negra', scientificName: 'Latrodectus curacaviensis', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Preta brilhante', 'Desenho de ampulheta vermelha no abdômen', 'Teia irregular e muito forte'],
      anatomy: 'Abdômen globoso e grande nas fêmeas.',
      members: '8 pernas negras.',
      habits: 'Vive em locais escuros e pouco perturbados: latas velhas, pneus, sob pedras, buracos no solo.',
      reproduction: 'Fêmea pode devorar o macho após o acasalamento.',
      larvalPhase: 'Centenas de filhotes saem de uma única ooteca.',
      controlMethods: ['Inspeção de áreas externas', 'Uso de EPIs em jardins'],
      physicalMeasures: ['Limpeza de entulhos', 'Vedar buracos em muros'],
      chemicalMeasures: ['Tratamento focal com inseticidas de contato'],
      healthRisks: 'Veneno neurotóxico potente. Causa dores musculares intensas, sudorese e alterações cardíacas. Requer soro específico.'
    }
  },
  { 
    id: '10', name: 'Aranha Armadeira', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Armadeira', scientificName: 'Phoneutria spp.', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Grande (até 15cm)', 'Assume postura de ataque (levanta as patas)', 'Pelos curtos e cinzas'],
      anatomy: 'Corpo robusto, quelíceras com pelos avermelhados.',
      members: '8 pernas longas e fortes.',
      habits: 'Errante e muito agressiva. Não faz teia. Entra em casas, esconde-se em sapatos, cortinas e atrás de móveis. Ativa à noite.',
      reproduction: 'Fêmeas grandes produzem várias ootecas ao longo da vida.',
      larvalPhase: 'Filhotes muito ativos e dispersivos.',
      controlMethods: ['Inspeção rigorosa de ambientes', 'Evitar acúmulo de materiais'],
      physicalMeasures: ['Sacudir roupas e sapatos', 'Telas em portas e janelas'],
      chemicalMeasures: ['Inseticidas de alto impacto e residual'],
      healthRisks: 'Veneno neurotóxico severo. Causa dor lancinante, priapismo, taquicardia e risco de morte por falência respiratória.'
    }
  },
  { 
    id: '11', name: 'Aranha de Pernas Longas', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Pernas Longas', scientificName: 'Pholcus phalangioides', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Corpo minúsculo', 'Pernas extremamente longas e finas', 'Vibra a teia quando ameaçada'],
      anatomy: 'Corpo cilíndrico e pálido.',
      members: '8 pernas filiformes.',
      habits: 'Vive em cantos de teto, garagens e porões. Alimenta-se de outros insetos e até de aranhas maiores.',
      reproduction: 'Fêmea carrega os ovos nas quelíceras.',
      larvalPhase: 'Ninfas transparentes.',
      controlMethods: ['Limpeza de teias com vassoura'],
      physicalMeasures: ['Remover teias regularmente'],
      chemicalMeasures: ['Não necessário'],
      healthRisks: 'Inofensiva para humanos.'
    }
  },
  { 
    id: '12', name: 'Aranha Caranguejeira', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha Caranguejeira', scientificName: 'Family Theraphosidae', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Muito grande e peluda', 'Cor escura', 'Movimentos lentos'],
      anatomy: 'Corpo maciço, quelíceras grandes que picam verticalmente.',
      members: '8 pernas grossas e peludas.',
      habits: 'Vivem em tocas no solo ou árvores. São tímidas. Quando ameaçadas, soltam pelos urticantes.',
      reproduction: 'Ciclo de vida longo (podem viver 20 anos).',
      larvalPhase: 'Ninfas crescem lentamente através de mudas anuais.',
      controlMethods: ['Não são pragas, apenas manejo se entrarem em casa'],
      physicalMeasures: ['Retirar com pote e soltar na natureza'],
      chemicalMeasures: ['Não recomendado'],
      healthRisks: 'Picada dolorosa mas veneno fraco. O maior risco são os pelos urticantes que causam alergia na pele e olhos.'
    }
  }
];

const App = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'result' | 'history' | 'encyclopedia' | 'detail' | 'settings'>('splash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchHistory();
        setView(session?.user ? 'main' : 'auth');
      });
    }, 2500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHistory();
        setView('main');
      } else {
        setView('auth');
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('pest_detections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const formattedHistory: HistoryEntry[] = data.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        image: item.image_data,
        result: item.analysis_result
      }));
      setHistory(formattedHistory);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const initCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Verifica suporte a flash/lanterna
        setTimeout(() => {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = (track as any).getCapabilities?.();
            setHasFlash(!!capabilities?.torch);
          }
        }, 1000);
      }
    } catch (e: any) { 
        console.error(e);
        setError("Câmera indisponível: Verifique as permissões do seu navegador."); 
    }
  };

  useEffect(() => {
    if (view === 'camera') {
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
    return "Ocorreu um problema na análise. Tente novamente.";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true); setError(null);
    try {
      // Senior Optimization: Redimensionamento e compressão de arquivos enviados da galeria
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

      const canvas = document.createElement('canvas');
      const maxWidth = 1024;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const fullResBase64 = `data:image/jpeg;base64,${compressedBase64}`;

      const res = await analyzePestImage(compressedBase64);
      const fullRes = { ...res, capturedImage: fullResBase64 };
      
      setCurrentResult(fullRes);
      setView('result');

      if (res.pestFound && user) {
        supabase.from('pest_detections')
          .insert({ 
            user_id: user.id, 
            image_data: fullRes.capturedImage, 
            pest_name: res.pest?.name || 'IA Gallery Scan', 
            confidence: res.confidence, 
            analysis_result: fullRes 
          })
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar no Supabase:', error);
            fetchHistory();
          });
      }
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
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Senior Optimization: Redimensionamento inteligente (Max 1024px)
      // Isso reduz o tamanho do arquivo em até 90% sem perder precisão para a IA
      const maxWidth = 1024;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Senior Optimization: Compressão JPEG 0.7
      const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      const fullResBase64 = `data:image/jpeg;base64,${base64}`;

      // Envia para análise
      const res = await analyzePestImage(base64);
      const fullRes = { ...res, capturedImage: fullResBase64 };
      
      setCurrentResult(fullRes);
      setView('result');

      // Senior Optimization: Operação assíncrona não-bloqueante para o banco de dados
      // O usuário vê o resultado imediatamente, enquanto o histórico salva em background
      if (res.pestFound && user) {
        supabase.from('pest_detections')
          .insert({ 
            user_id: user.id, 
            image_data: fullRes.capturedImage, 
            pest_name: res.pest?.name || 'IA Scan', 
            confidence: res.confidence, 
            analysis_result: fullRes 
          })
          .then(({ error }) => {
            if (error) console.error('Erro ao salvar no Supabase:', error);
            fetchHistory();
          });
      }
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
           <p className="text-xs font-bold text-emerald-600 italic mt-1">{pest.scientificName}</p>
         </div>
         <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
           pest.riskLevel === 'Crítico' ? 'bg-red-100 text-red-600' : 
           pest.riskLevel === 'Alto' ? 'bg-orange-100 text-orange-600' : 
           'bg-emerald-100 text-emerald-600'
         }`}>
           Risco {pest.riskLevel}
         </div>
       </div>

       <div className="space-y-4">
         <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {pest.characteristics.map((c, i) => (
             <span key={i} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap border border-slate-100">{c}</span>
           ))}
         </div>

         <div className="grid grid-cols-1 gap-4">
           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2 mb-2 text-slate-900 font-black text-xs uppercase tracking-wider">
               <Info size={14} className="text-emerald-500" /> Biologia e Hábitos
             </div>
             <p className="text-xs text-slate-600 leading-relaxed">{pest.habits}</p>
           </div>

           <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
             <div className="flex items-center gap-2 mb-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
               <ShieldCheck size={14} className="text-emerald-500" /> Controle Físico
             </div>
             <ul className="space-y-1.5">
               {pest.physicalMeasures.map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>

           <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
             <div className="flex items-center gap-2 mb-2 text-amber-900 font-black text-xs uppercase tracking-wider">
               <FlaskConical size={14} className="text-amber-500" /> Controle Químico
             </div>
             <ul className="space-y-1.5">
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
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8 pt-[calc(2rem+env(safe-area-inset-top))]">
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
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 rounded-b-[3.5rem] text-white sticky top-0 z-40 shadow-xl">
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

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 animate-in">
            <AlertTriangle className="text-red-500 shrink-0" size={18} />
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        {view === 'main' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('camera')} className="bg-emerald-500 p-6 rounded-[2.5rem] text-emerald-950 flex flex-col items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                <div className="bg-emerald-950/10 p-3 rounded-2xl"><Camera size={28} /></div>
                <span className="font-black uppercase text-xs tracking-wider">Scan IA</span>
              </button>
              <button onClick={() => setView('encyclopedia')} className="bg-white p-6 rounded-[2.5rem] text-slate-900 flex flex-col items-center gap-3 border border-slate-100 shadow-sm active:scale-95 transition-transform">
                <div className="bg-emerald-50 p-3 rounded-2xl"><BookOpen size={28} className="text-emerald-600" /></div>
                <span className="font-black uppercase text-xs tracking-wider">Guia Bio</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Histórico Recente</h2>
                <button onClick={() => setView('history')} className="text-emerald-500 text-[10px] font-black uppercase">Ver Tudo</button>
              </div>
              <div className="space-y-3">
                {history.slice(0, 3).map(entry => (
                  <div key={entry.id} onClick={() => { setCurrentResult(entry.result); setView('result'); }} className="bg-white p-3 rounded-3xl flex items-center gap-4 border border-slate-100 active:bg-slate-50 transition-colors cursor-pointer">
                    <img src={entry.image} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900 text-sm">{entry.result.pest?.name || 'Scan'}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(entry.timestamp).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 mr-2" />
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] text-center">
                    <History className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-xs text-slate-400 font-bold uppercase">Nenhum scan ainda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'camera' && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="relative flex-1">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[3px] border-emerald-400/30 m-12 rounded-[3rem] pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-400 text-emerald-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Alinhe a Praga</div>
              </div>
              
              <div className="absolute top-12 left-6 right-6 flex justify-between items-center">
                <button onClick={() => setView('main')} className="p-3 bg-black/40 backdrop-blur-md rounded-2xl text-white"><X size={24} /></button>
                <button onClick={toggleFlash} className={`p-3 backdrop-blur-md rounded-2xl ${flashOn ? 'bg-emerald-400 text-emerald-950' : 'bg-black/40 text-white'}`}><Zap size={24} /></button>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8">
                <div className="flex items-center gap-8">
                  <label className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white cursor-pointer active:scale-90 transition-transform">
                    <ImageIcon size={28} />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </label>
                  <button onClick={handleCapture} disabled={loading} className="w-20 h-20 bg-white rounded-full p-1 shadow-2xl active:scale-90 transition-transform">
                    <div className="w-full h-full border-4 border-emerald-500 rounded-full flex items-center justify-center">
                      {loading ? <Loader2 className="animate-spin text-emerald-500" size={32} /> : <div className="w-12 h-12 bg-emerald-500 rounded-full" />}
                    </div>
                  </button>
                  <div className="w-16 h-16" /> {/* Spacer */}
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Processamento via IA Bio-Urbana</p>
              </div>
            </div>
          </div>
        )}

        {view === 'result' && currentResult && (
          <div className="space-y-6 animate-in">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-square">
              <img src={currentResult.capturedImage} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-emerald-400 p-1.5 rounded-lg"><Sparkles size={16} className="text-emerald-950" /></div>
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Análise Concluída</span>
                </div>
                <h2 className="text-3xl font-black text-white leading-tight">{currentResult.pest?.name || 'Não Identificado'}</h2>
              </div>
            </div>

            {currentResult.pestFound ? (
              <PestBioCard pest={currentResult.pest!} />
            ) : (
              <div className="bg-white p-8 rounded-[2.5rem] text-center border border-slate-100 shadow-sm">
                <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
                <h3 className="text-xl font-black text-slate-900 mb-2">Praga não detectada</h3>
                <p className="text-xs text-slate-500 leading-relaxed">Nossa IA não conseguiu identificar uma praga urbana nesta imagem. Tente aproximar mais ou melhorar a iluminação.</p>
                <button onClick={() => setView('camera')} className="mt-6 w-full bg-emerald-500 text-emerald-950 font-black py-4 rounded-2xl uppercase text-sm">Tentar Novamente</button>
              </div>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setView('main')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Histórico Completo</h2>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {history.map(entry => (
                <div key={entry.id} onClick={() => { setCurrentResult(entry.result); setView('result'); }} className="bg-white p-4 rounded-[2rem] flex items-center gap-4 border border-slate-100 shadow-sm active:bg-slate-50 transition-colors cursor-pointer">
                  <img src={entry.image} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${entry.result.pest?.riskLevel === 'Crítico' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <h3 className="font-black text-slate-900 text-sm">{entry.result.pest?.name || 'Scan'}</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Clock size={10} /> {new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'encyclopedia' && (
          <div className="space-y-6 animate-in">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Buscar praga, categoria ou sintoma..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none shadow-sm focus:ring-2 ring-emerald-500/20" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Todos', 'Rasteiros', 'Voadores', 'Aracnídeos', 'Roedores'].map(cat => (
                <button key={cat} onClick={() => setSearchTerm(cat === 'Todos' ? '' : cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap border transition-all ${searchTerm === cat ? 'bg-emerald-500 border-emerald-500 text-emerald-950' : 'bg-white border-slate-100 text-slate-500'}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {filteredData.map(item => (
                <div key={item.id} onClick={() => { setSelectedPest(item.details); setView('detail'); }} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center gap-3 active:scale-95 transition-transform cursor-pointer">
                  <div className="text-4xl mb-1">{item.icon}</div>
                  <div>
                    <h3 className="font-black text-slate-900 text-xs leading-tight mb-1">{item.name}</h3>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-md">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-900 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-2">Busca Profunda IA</h3>
                <p className="text-xs text-emerald-400/80 mb-6 leading-relaxed">Não encontrou o que procurava? Nossa IA pode gerar uma ficha técnica completa agora.</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ex: Cupim de solo" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs outline-none focus:bg-white/20" />
                  <button onClick={handleAiDeepSearch} disabled={loading} className="bg-emerald-400 text-emerald-950 p-3 rounded-xl active:scale-95 transition-transform">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  </button>
                </div>
              </div>
              <Bug className="absolute -right-8 -bottom-8 text-white/5 w-40 h-40 rotate-12" />
            </div>
          </div>
        )}

        {view === 'detail' && selectedPest && (
          <div className="space-y-6 animate-in">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setView('encyclopedia')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"><ArrowLeft size={20} /></button>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ficha Técnica</h2>
            </div>
            <PestBioCard pest={selectedPest} />
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-slate-100 px-8 py-4 flex justify-between items-center sticky bottom-0 z-40">
        <button onClick={() => setView('main')} className={`flex flex-col items-center gap-1 ${view === 'main' ? 'text-emerald-500' : 'text-slate-300'}`}>
          <Bug size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => setView('camera')} className="bg-emerald-500 text-emerald-950 p-4 rounded-2xl -mt-12 shadow-lg shadow-emerald-500/40 active:scale-90 transition-transform">
          <Camera size={28} />
        </button>
        <button onClick={() => setView('encyclopedia')} className={`flex flex-col items-center gap-1 ${view === 'encyclopedia' || view === 'detail' ? 'text-emerald-500' : 'text-slate-300'}`}>
          <BookOpen size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Guia</span>
        </button>
      </nav>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
