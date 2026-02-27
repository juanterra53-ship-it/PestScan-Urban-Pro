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
      characteristics: ['Cor preta ou marrom-muito-escuro brilhante', 'Aparência robusta', 'Não voa'],
      anatomy: 'Asas vestigiais no macho e ausentes na fêmea. Corpo mais largo que as outras baratas urbanas.',
      members: '6 pernas curtas e fortes.',
      habits: 'Prefere locais muito úmidos e frios. Comum em ralos externos, jardins, porões úmidos e áreas de serviço externas.',
      reproduction: 'A fêmea deposita a ooteca em matéria orgânica em decomposição. Contém cerca de 16 ovos.',
      larvalPhase: 'Desenvolvimento muito lento, podendo levar até 2 anos para chegar à fase adulta em climas frios.',
      controlMethods: ['Drenagem de áreas úmidas', 'Barreira química externa', 'Eliminação de matéria orgânica acumulada'],
      physicalMeasures: ['Eliminar vazamentos de água', 'Vedar ralos de jardim e áreas externas', 'Manter calhas limpas'],
      chemicalMeasures: ['Grânulos inseticidas resistentes à umidade', 'Atomização perimetral', 'Pós químicos em caixas de passagem'],
      healthRisks: 'Exala um odor fétido característico e transporta patógenos de áreas externas para o interior das edificações.'
    }
  },
  { 
    id: '15', name: 'Caruncho-do-Feijão', category: 'Rasteiros', icon: '🫘',
    details: {
      name: 'Caruncho-do-Feijão', scientificName: 'Acanthoscelides obtectus', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Corpo ovalado e achatado', 'Cor marrom-oliva com manchas claras nos élitros', 'Pequeno (3-4mm)'],
      anatomy: 'Cabeça pequena e inclinada para baixo. Antenas serrilhadas. Élitros (asas duras) não cobrem totalmente o abdômen.',
      members: '6 pernas, sendo o par posterior mais robusto.',
      habits: 'Infesta grãos de leguminosas (feijão, ervilha, soja) tanto no campo quanto em armazéns. Capaz de perfurar embalagens plásticas e de papel.',
      reproduction: 'A fêmea deposita os ovos diretamente nos grãos ou nas frestas de sacarias. Pode gerar várias gerações por ano.',
      larvalPhase: 'A larva penetra no grão logo após a eclosão, consumindo todo o conteúdo interno e deixando apenas a casca.',
      controlMethods: ['Higiene rigorosa da despensa', 'Uso de potes herméticos de vidro ou metal', 'Inspeção de compras'],
      physicalMeasures: ['Congelamento de grãos por 48h para matar ovos', 'Descarte de pacotes infestados', 'Limpeza de resíduos em prateleiras'],
      chemicalMeasures: ['Expurgo industrial com fosfina (profissional)', 'Pulverização residual em frestas de armazéns', 'Piretrinas naturais'],
      healthRisks: 'Inutilização total dos alimentos para consumo humano e perda de poder germinativo das sementes.'
    }
  },
  { 
    id: '16', name: 'Caruncho-do-Arroz', category: 'Rasteiros', icon: '🌾',
    details: {
      name: 'Caruncho-do-Arroz', scientificName: 'Sitophilus oryzae', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Possui um bico ou rostro longo', '4 manchas avermelhadas nas asas', 'Cor marrom-escuro opaco'],
      anatomy: 'Cabeça prolongada em um bico característico (tromba). Antenas em formato de cotovelo inseridas no bico.',
      members: '6 pernas curtas e fortes.',
      habits: 'Infesta cereais armazenados como arroz, trigo, milho e cevada. É um voador ativo, o que facilita a dispersão em armazéns.',
      reproduction: 'A fêmea perfura o grão com o bico, deposita um ovo e sela o orifício com uma secreção gelatinosa.',
      larvalPhase: 'A larva se desenvolve inteiramente dentro do grão, onde se transforma em pupa antes de emergir como adulto.',
      controlMethods: ['Armazenamento em locais secos e ventilados', 'Uso de recipientes com vedação perfeita', 'Rotação de estoque (PEPS)'],
      physicalMeasures: ['Limpeza de fendas em armários', 'Peneiração de grãos para detecção precoce', 'Manter temperatura baixa na despensa'],
      chemicalMeasures: ['Protetores de grãos (inseticidas de contato)', 'Fumigação em silos', 'Uso de terra de diatomáceas'],
      healthRisks: 'Causa aquecimento e umidade nos grãos armazenados, favorecendo o surgimento de fungos e toxinas.'
    }
  },
  { 
    id: '17', name: 'Formiga de Fogo', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga de Fogo', scientificName: 'Solenopsis invicta', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Cor avermelhada a marrom-escuro', 'Picada que causa pústulas brancas', 'Comportamento extremamente agressivo'],
      anatomy: 'Cintura com dois nós (pedicelo). Antenas com 10 segmentos e clava de 2 segmentos.',
      members: '6 pernas. Operárias de tamanhos variados (polimorfismo).',
      habits: 'Constrói montículos de terra solta em áreas abertas. Ataca em massa qualquer invasor do seu território.',
      reproduction: 'Colônias podem ser monogínicas (uma rainha) ou poligínicas (várias rainhas), estas últimas muito difíceis de controlar.',
      larvalPhase: 'As larvas são alimentadas com comida líquida e sólida regurgitada pelas operárias.',
      controlMethods: ['Aplicação de iscas granuladas ao redor do ninho', 'Tratamento direto de montículos com líquidos', 'Manejo de solo'],
      physicalMeasures: ['Eliminar acúmulo de terra e entulho', 'Vedar frestas em calçadas e pisos externos', 'Manter gramados aparados'],
      chemicalMeasures: ['Iscas granuladas com Hidrametilnona ou Abamectina', 'Fipronil líquido para barreira', 'Piretróides de contato'],
      healthRisks: 'O veneno contém alcaloides que causam dor intensa, queimação e pústulas. Pode causar choque anafilático em pessoas sensíveis.'
    }
  },
  { 
    id: '18', name: 'Formiga Carpinteira', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Carpinteira', scientificName: 'Camponotus spp.', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Tamanho grande (até 2.5cm)', 'Cor preta, avermelhada ou amarelada', 'Cintura com um único nó'],
      anatomy: 'Tórax com perfil superior em arco contínuo e uniforme. Mandíbulas fortes para escavar madeira.',
      members: '6 pernas longas.',
      habits: 'Nidifica em madeira úmida, oca ou em decomposição. Não come madeira, apenas escava para criar galerias limpas e lisas.',
      reproduction: 'Produz formas aladas (siriris/aleluias) para revoadas nupciais em épocas quentes e úmidas.',
      larvalPhase: 'As larvas se desenvolvem em câmaras protegidas dentro da madeira ou em ninhos satélites em frestas de alvenaria.',
      controlMethods: ['Localização do ninho principal (geralmente externo)', 'Eliminação de fontes de umidade', 'Tratamento de madeiras'],
      physicalMeasures: ['Substituir madeiras podres', 'Podar galhos que tocam a edificação', 'Vedar furos em batentes e guarnições'],
      chemicalMeasures: ['Injeção de inseticidas em pó ou líquido nas galerias', 'Iscas em gel específicas', 'Barreiras perimetrais'],
      healthRisks: 'Danos estruturais significativos em telhados, decks e móveis, além de contaminação de alimentos açucarados.'
    }
  },
  { 
    id: '19', name: 'Formiga Louca', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Louca', scientificName: 'Nylanderia fulva', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Movimentos rápidos e erráticos', 'Cor marrom-dourada a avermelhada', 'Corpo coberto por pelos longos'],
      anatomy: 'Cintura com um nó escondido pelo abdômen. Antenas longas com 12 segmentos.',
      members: '6 pernas muito longas em relação ao corpo.',
      habits: 'Não possui local fixo de ninho; vive sob pedras, vasos, frestas e dentro de conduítes elétricos e eletrônicos.',
      reproduction: 'Colônias poligínicas (muitas rainhas) que se expandem por fragmentação, formando supercolônias gigantescas.',
      larvalPhase: 'Desenvolvimento rápido. As operárias transportam as larvas constantemente ao menor sinal de perigo.',
      controlMethods: ['Barreiras químicas residuais extensas', 'Limpeza de resíduos orgânicos e secreções de pulgões', 'Controle de umidade'],
      physicalMeasures: ['Vedar passagens de fiação elétrica', 'Limpeza de calhas e acúmulo de folhas', 'Remover vasos de plantas infestados'],
      chemicalMeasures: ['Pulverização residual perimetral', 'Pós químicos em caixas de luz', 'Iscas líquidas doces'],
      healthRisks: 'Causa curtos-circuitos em aparelhos eletrônicos e quadros de energia, além de infestações massivas em jardins.'
    }
  },
  { 
    id: '20', name: 'Formiga Fantasma', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Fantasma', scientificName: 'Tapinoma melanocephalum', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Cabeça e tórax escuros', 'Abdômen e pernas translúcidos/brancos', 'Tamanho minúsculo (1.5mm)'],
      anatomy: 'Cintura com um nó escondido. Exala odor de coco podre quando esmagada.',
      members: '6 pernas finas.',
      habits: 'Altamente oportunista. Nidifica em locais minúsculos: frestas de azulejos, atrás de batentes, dentro de livros e teclados.',
      reproduction: 'Fragmentação da colônia: grupos de operárias e rainhas se separam para formar novos ninhos próximos.',
      larvalPhase: 'Larvas brancas e imóveis, alimentadas por trofalaxia (regurgitação) pelas operárias.',
      controlMethods: ['Uso de iscas em gel de ação lenta', 'Eliminação de fontes de água e alimentos doces', 'Higiene rigorosa'],
      physicalMeasures: ['Vedar frestas com rejunte ou silicone', 'Manter bancadas de cozinha secas', 'Armazenar doces em geladeira'],
      chemicalMeasures: ['Gel isca de baixa toxicidade e alta hidratação', 'Evitar pulverizações que causam dispersão da colônia'],
      healthRisks: 'Vetor de patógenos em cozinhas e hospitais devido à sua alta mobilidade e preferência por locais úmidos.'
    }
  },
  { 
    id: '21', name: 'Formiga Faraó', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Faraó', scientificName: 'Monomorium pharaonis', category: 'Rasteiros', riskLevel: 'Alto',
      characteristics: ['Cor amarela clara a marrom-avermelhada', 'Muito pequena (2mm)', 'Abdômen mais escuro que o resto do corpo'],
      anatomy: 'Cintura com dois nós. Antenas com 12 segmentos terminando em uma clava de 3 segmentos.',
      members: '6 pernas.',
      habits: 'Nidifica em locais aquecidos e protegidos dentro de edifícios: atrás de azulejos, dentro de paredes, frestas de armários e equipamentos médicos.',
      reproduction: 'As rainhas não realizam revoadas; a colônia se espalha por "botamento" (fragmentação), o que torna o controle por pulverização ineficaz.',
      larvalPhase: 'As larvas são alimentadas por operárias e se desenvolvem rapidamente em ambientes com temperatura controlada.',
      controlMethods: ['Uso obrigatório de iscas em gel de ação lenta', 'Eliminação de fontes de umidade e resíduos proteicos', 'Monitoramento contínuo'],
      physicalMeasures: ['Higiene extrema em áreas de manipulação de alimentos', 'Vedação de frestas em cozinhas e banheiros', 'Descarte de embalagens'],
      chemicalMeasures: ['Iscas com reguladores de crescimento (Metopreno/Piriproxifeno)', 'Iscas com Hidrametilnona', 'Não usar inseticidas desalojantes'],
      healthRisks: 'Grave vetor mecânico de infecções hospitalares, podendo contaminar soros, curativos e instrumentos cirúrgicos.'
    }
  },
  { 
    id: '22', name: 'Formiga Cabeçuda', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Cabeçuda', scientificName: 'Pheidole spp.', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Soldados com cabeça desproporcionalmente grande', 'Cor marrom-claro a escuro', 'Tamanho pequeno (2-4mm)'],
      anatomy: 'Cintura com dois nós. Soldados possuem mandíbulas maciças para triturar sementes e defender o ninho.',
      members: '6 pernas.',
      habits: 'Constrói ninhos no solo, sob pedras, calçadas e pisos. Frequentemente entra em casas em busca de alimentos gordurosos e proteicos.',
      reproduction: 'Colônias grandes com múltiplas rainhas e ninhos interconectados por trilhas bem definidas.',
      larvalPhase: 'As larvas são diferenciadas em operárias menores (minors) ou soldados (majors) dependendo da alimentação recebida.',
      controlMethods: ['Tratamento perimetral de solo', 'Iscas granuladas externas', 'Vedação de pontos de entrada'],
      physicalMeasures: ['Vedar frestas em rodapés e soleiras', 'Manter áreas externas limpas de sementes e restos orgânicos', 'Nivelar pisos'],
      chemicalMeasures: ['Inseticidas líquidos residuais em fendas e rachaduras', 'Iscas de base proteica', 'Piretróides em pó'],
      healthRisks: 'Causa danos estéticos a jardins e calçadas devido à escavação de terra, além de infestações massivas em cozinhas.'
    }
  },
  { 
    id: '23', name: 'Formiga Cortadeira', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Cortadeira', scientificName: 'Atta spp.', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Operárias cortam e carregam pedaços de folhas', 'Três pares de espinhos no dorso do tórax', 'Cor marrom-fosca'],
      anatomy: 'Mandíbulas serrilhadas e poderosas. Corpo robusto com exoesqueleto resistente.',
      members: '6 pernas fortes.',
      habits: 'Vivem em formigueiros subterrâneos complexos. Cortam vegetação para cultivar o fungo Leucoagaricus, sua única fonte de alimento.',
      reproduction: 'A rainha (Içá) funda o ninho levando uma porção do fungo em sua boca após a revoada nupcial.',
      larvalPhase: 'As larvas são totalmente dependentes do fungo cultivado pelas operárias jardineiras.',
      controlMethods: ['Uso de iscas formicidas granuladas aplicadas ao lado das trilhas', 'Localização do formigueiro sede'],
      physicalMeasures: ['Uso de cones plásticos protetores em troncos', 'Eliminação de trilhas próximas a plantas sensíveis'],
      chemicalMeasures: ['Iscas granuladas com Sulfluramida ou Fipronil', 'Termonebulização em ninhos de grande porte'],
      healthRisks: 'Extrema destruição de jardins, pomares e reflorestamentos em poucas horas.'
    }
  },
  { 
    id: '24', name: 'Formiga Saúva Limão', category: 'Rasteiros', icon: '🐜',
    details: {
      name: 'Formiga Saúva Limão', scientificName: 'Atta sexdens rubropilosa', category: 'Rasteiros', riskLevel: 'Moderado',
      characteristics: ['Odor cítrico de limão ao ser manipulada', 'Cabeça grande e opaca', 'Cor marrom-avermelhada'],
      anatomy: 'Três pares de espinhos dorsais. Cabeça com textura rugosa e sem brilho.',
      members: '6 pernas.',
      habits: 'Uma das saúvas mais comuns e destrutivas do Brasil. Ataca eucaliptos, citros e diversas culturas agrícolas.',
      reproduction: 'Ninhos podem atingir profundidades de até 7 metros com centenas de câmaras subterrâneas.',
      larvalPhase: 'Desenvolvimento dentro das câmaras de fungo, protegidas da luz e variações térmicas.',
      controlMethods: ['Iscas granuladas de alta atratividade', 'Insuflação de pós químicos em olheiros ativos'],
      physicalMeasures: ['Cercamento de mudas novas', 'Limpeza da área ao redor do formigueiro para facilitar a visualização'],
      chemicalMeasures: ['Iscas com princípios ativos de ação lenta', 'Pós químicos à base de Deltametrina'],
      healthRisks: 'Impacto econômico severo na agricultura e silvicultura.'
    }
  },
  { 
    id: '25', name: 'Aranha de Parede', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Parede', scientificName: 'Nesticodes rufipes', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Cor avermelhada ou marrom-ferrugem', 'Abdômen globoso e arredondado', 'Pequena (corpo de 5-7mm)'],
      anatomy: 'Cefalotórax avermelhado. Pernas finas com cerdas sensoriais. Olhos pequenos dispostos em dois grupos.',
      members: '8 pernas longas e finas.',
      habits: 'Sinantrópica. Vive em cantos de paredes, atrás de móveis, quadros e eletrodomésticos. Constrói teias irregulares e emaranhadas.',
      reproduction: 'A fêmea produz várias ootecas esféricas de cor palha que ficam suspensas na teia até a eclosão.',
      larvalPhase: 'Os filhotes são independentes logo após a eclosão, dispersando-se para novos cantos da residência.',
      controlMethods: ['Remoção mecânica de teias e ootecas com vassoura ou aspirador', 'Limpeza periódica de áreas escondidas'],
      physicalMeasures: ['Vedar frestas em rodapés e guarnições', 'Afastar móveis da parede para limpeza', 'Reduzir umidade em cantos'],
      chemicalMeasures: ['Inseticidas domésticos de pronto uso (aerossóis)', 'Pulverização residual em frestas e cantos altos'],
      healthRisks: 'Picada causa dor local leve, vermelhidão e pequeno inchaço, sem necessidade de soro específico.'
    }
  },
  { 
    id: '26', name: 'Aranha-papa-moscas', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha-papa-moscas', scientificName: 'Salticidae', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Pequenas e ágeis', 'Saltam para caçar', 'Olhos frontais grandes'],
      anatomy: 'Cefalotórax robusto, 8 olhos (2 centrais enormes para visão 3D). Corpo peludo.',
      members: '8 pernas curtas e fortes para saltos.',
      habits: 'Ativa durante o dia. Não constrói teias de captura; caça ativamente insetos pequenos. Comum em paredes ensolaradas.',
      reproduction: 'Ootecas protegidas em pequenos sacos de seda em frestas.',
      larvalPhase: 'Ninfas independentes que já nascem com habilidade de salto.',
      controlMethods: ['Não recomendado (controle natural de pragas)', 'Remoção manual se necessário'],
      physicalMeasures: ['Manter janelas limpas', 'Evitar uso de inseticidas que eliminem predadores benéficos'],
      chemicalMeasures: ['Geralmente desnecessário', 'Inseticidas de contato apenas em casos extremos'],
      healthRisks: 'Totalmente inofensiva ao ser humano.'
    }
  },
  { 
    id: '27', name: 'Aranha-treme-treme', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha-treme-treme', scientificName: 'Pholcidae', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Pernas extremamente longas e finas', 'Corpo pequeno e cilíndrico'],
      anatomy: 'Corpo frágil, pernas que podem ser 10x o tamanho do corpo.',
      members: '8 pernas muito finas.',
      habits: 'Vive em cantos de teto e garagens. Quando ameaçada, vibra a teia rapidamente para confundir predadores.',
      reproduction: 'A fêmea carrega o saco de ovos nas quelíceras (boca).',
      larvalPhase: 'Ninfas permanecem na teia da mãe nos primeiros dias.',
      controlMethods: ['Remoção mecânica com vassoura', 'Limpeza de teias'],
      physicalMeasures: ['Limpeza frequente de cantos altos e tetos', 'Uso de aspirador de pó'],
      chemicalMeasures: ['Inseticidas domésticos comuns em frestas de teto', 'Aerossóis'],
      healthRisks: 'Inofensiva; suas quelíceras raramente conseguem perfurar a pele humana.'
    }
  },
  { 
    id: '28', name: 'Aranha de Jardim / Lobo', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha de Jardim / Lobo', scientificName: 'Lycosa sp.', category: 'Aracnídeos', riskLevel: 'Moderado',
      characteristics: ['Marrom com desenho de seta no abdômen', 'Peluda e robusta'],
      anatomy: 'Olhos dispostos em três fileiras (4-2-2). Quelíceras fortes.',
      members: '8 pernas robustas.',
      habits: 'Vive em gramados, jardins e sob pedras. Caçadora de solo, não faz teia de captura. Noturna.',
      reproduction: 'A fêmea carrega a ooteca presa às fiandeiras e depois os filhotes no dorso.',
      larvalPhase: 'Centenas de ninfas viajam nas costas da mãe até a primeira muda.',
      controlMethods: ['Manejo de gramados', 'Vedação de portas'],
      physicalMeasures: ['Manter grama curta', 'Remover pilhas de lenha e entulho do jardim', 'Vedar soleiras de portas'],
      chemicalMeasures: ['Tratamento perimetral com inseticidas líquidos', 'Pós em áreas externas'],
      healthRisks: 'Picada dolorosa, pode causar pequena necrose local, mas sem gravidade sistêmica.'
    }
  },
  { 
    id: '29', name: 'Aranha-de-prata', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha-de-prata', scientificName: 'Argiope argentata', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Abdômen prateado e recortado', 'Teia geométrica com "X" central'],
      anatomy: 'Pernas longas dispostas em pares. Abdômen com brilho metálico.',
      members: '8 pernas.',
      habits: 'Constrói teias orbitais em jardins e arbustos. Fica no centro da teia sobre um reforço de seda (estabilimento).',
      reproduction: 'Ootecas angulares e amareladas presas na periferia da teia.',
      larvalPhase: 'Ninfas se dispersam pelo vento usando fios de seda.',
      controlMethods: ['Realocação manual para áreas de mata', 'Limpeza de arbustos'],
      physicalMeasures: ['Poda de plantas ornamentais', 'Remoção manual das teias'],
      chemicalMeasures: ['Desnecessário', 'Evitar uso de venenos em jardins'],
      healthRisks: 'Inofensiva ao ser humano.'
    }
  },
  { 
    id: '30', name: 'Caranguejeira / Tarântula', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Caranguejeira / Tarântula', scientificName: 'Mygalomorphae', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Muito grande e peluda', 'Movimentos lentos', 'Vida longa'],
      anatomy: 'Quelíceras paraxiais (movem-se verticalmente). Possui pelos urticantes no abdômen.',
      members: '8 pernas grossas e 2 pedipalpos robustos.',
      habits: 'Terrestre ou arborícola. Vive em tocas, sob troncos ou em frestas. Defende-se lançando pelos irritantes.',
      reproduction: 'Ootecas grandes guardadas dentro de tocas de seda.',
      larvalPhase: 'Crescimento lento, passando por dezenas de mudas ao longo de anos.',
      controlMethods: ['Vedação de acessos', 'Manejo ambiental'],
      physicalMeasures: ['Telas em portas e janelas', 'Vedar frestas em muros e fundações', 'Evitar acúmulo de madeira'],
      chemicalMeasures: ['Inseticidas de contato de longo residual em perímetros', 'Pós químicos em tocas'],
      healthRisks: 'Pelos causam irritação severa na pele e olhos. Picada dolorosa, mas veneno pouco ativo em humanos.'
    }
  },
  { 
    id: '31', name: 'Aranha-armadeira', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha-armadeira', scientificName: 'Phoneutria sp.', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Muito agressiva', 'Levanta as patas dianteiras', 'Pode saltar'],
      anatomy: 'Grande (até 15cm). Quelíceras com pelos avermelhados. Manchas claras no dorso.',
      members: '8 pernas longas e ágeis.',
      habits: 'Errante e noturna. Não faz teia. Esconde-se em sapatos, roupas, caixas e bananeiras. Entra em casas no inverno.',
      reproduction: 'A fêmea produz várias ootecas ao longo da vida.',
      larvalPhase: 'Ninfas muito agressivas e rápidas desde o nascimento.',
      controlMethods: ['Inspeção rigorosa', 'Vedação total de frestas'],
      physicalMeasures: ['Sacudir roupas e sapatos antes de usar', 'Vedar portas com rodinhos de borracha', 'Eliminar entulhos'],
      chemicalMeasures: ['Inseticidas profissionais de choque e residual alto', 'Aplicação em perímetros e esconderijos'],
      healthRisks: 'Veneno neurotóxico potente. Causa dor intensa, sudorese, arritmia e risco de morte (especialmente crianças).'
    }
  },
  { 
    id: '32', name: 'Viúva-negra', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Viúva-negra', scientificName: 'Latrodectus curacaviensis', category: 'Aracnídeos', riskLevel: 'Crítico',
      characteristics: ['Preta com manchas vermelhas no abdômen', 'Abdômen globoso'],
      anatomy: 'Pequena (1-1.5cm de corpo). Fiandeiras curtas. Quelíceras pequenas mas potentes.',
      members: '8 pernas.',
      habits: 'Constrói teias irregulares e resistentes próximas ao solo, em gramados, vegetação rasteira ou latas velhas.',
      reproduction: 'Ootecas esféricas de seda densa e cor clara.',
      larvalPhase: 'Ninfas pequenas que se dispersam rapidamente após a eclosão.',
      controlMethods: ['Limpeza de áreas externas', 'Uso de EPIs em jardinagem'],
      physicalMeasures: ['Uso de luvas grossas ao mexer em jardins', 'Remover mato alto e objetos abandonados no quintal'],
      chemicalMeasures: ['Pulverização residual em áreas de nidificação externas', 'Controle de focos específicos'],
      healthRisks: 'Veneno neurotóxico. Causa dor muscular severa, espasmos, náuseas e alterações de pressão.'
    }
  },
  { 
    id: '33', name: 'Caranguejeira-rosa-salmão', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Caranguejeira-rosa-salmão', scientificName: 'Lasiodora parahybana', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Uma das maiores do mundo', 'Pelos rosados/salmão'],
      anatomy: 'Envergadura de até 25cm. Corpo extremamente robusto e pesado.',
      members: '8 pernas grossas e peludas.',
      habits: 'Nativa do Nordeste brasileiro. Vive no solo, em tocas ou sob pedras. Muito comum no mercado de pets exóticos.',
      reproduction: 'Pode colocar até 2000 ovos em uma única ooteca.',
      larvalPhase: 'Crescimento rápido para o padrão das caranguejeiras.',
      controlMethods: ['Manter distância', 'Vedação de residências rurais'],
      physicalMeasures: ['Barreiras físicas em portas', 'Limpeza de arredores de casas em áreas rurais'],
      chemicalMeasures: ['Raramente necessário', 'Inseticidas de barreira se houver invasão frequente'],
      healthRisks: 'Pelos urticantes são a principal defesa e causam alergias. Picada dói mas não é letal.'
    }
  },
  { 
    id: '34', name: 'Aranha-golias', category: 'Aracnídeos', icon: '🕷️',
    details: {
      name: 'Aranha-golias', scientificName: 'Theraphosa blondi', category: 'Aracnídeos', riskLevel: 'Baixo',
      characteristics: ['Maior aranha em massa do mundo', 'Cor marrom-escura'],
      anatomy: 'Quelíceras de até 2cm. Pelos estridulantes que fazem barulho ao serem esfregados.',
      members: '8 pernas maciças.',
      habits: 'Habita a Floresta Amazônica. Vive em tocas profundas no solo úmido. Alimenta-se de grandes insetos e pequenos vertebrados.',
      reproduction: 'Ootecas com ovos grandes (tamanho de ervilhas).',
      larvalPhase: 'Ninfas já nascem com tamanho considerável e são predadoras imediatas.',
      controlMethods: ['Preservação ambiental', 'Não manusear'],
      physicalMeasures: ['Não aplicável em contexto urbano comum', 'Evitar contato em áreas de mata nativa'],
      chemicalMeasures: ['Não recomendado', 'Preservar a espécie em seu habitat'],
      healthRisks: 'Picada profunda e dolorosa devido ao tamanho das quelíceras. Pelos altamente irritantes.'
    }
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<'splash' | 'auth' | 'main' | 'camera' | 'history' | 'result' | 'detail'>('auth');
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
    const themeColor = (view === 'splash' || view === 'auth') ? '#022c22' : '#064e3b';
    const bodyBg = (view === 'splash' || view === 'auth') ? '#022c22' : '#f8fafc';
    
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
    document.querySelector('meta[name="msapplication-navbutton-color"]')?.setAttribute('content', themeColor);
    document.body.style.backgroundColor = bodyBg;
    document.documentElement.style.backgroundColor = bodyBg;

    // Carregar o modelo local do TFJS em background
    loadLocalModel();
  }, [view]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Carrega modelo em paralelo (não bloqueia a UI)
        loadLocalModel().catch(e => console.warn("Modelo offline:", e));

        if (!navigator.onLine) {
          setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' });
          if (isMounted) setView('main');
          return;
        }

        // Tenta pegar sessão
        const { data, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
           console.error("Erro de sessão:", error);
           // Se der erro, não trava: manda para login
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
          // Sem usuário logado -> tela de login
          setView('auth');
        }
      } catch (err) {
        console.error("Erro crítico na inicialização:", err);
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
      streamRef.current.getTracks().forEach(track => {
        if (track.kind === 'video') {
            try { 
                (track as any).applyConstraints({ advanced: [{ torch: false }] }); 
            } catch(e) {
                // Silenciosamente ignoramos erros ao desligar o torch pois o stop() da track resolverá
            }
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

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Seu navegador ou app não suporta acesso à câmera. Use o botão da Galeria.");
            return;
        }

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
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn("Auto-play falhou, tentando novamente após interação:", playErr);
              // Fallback para dispositivos que bloqueiam autoplay
              if (videoRef.current) {
                videoRef.current.onclick = () => videoRef.current?.play();
              }
            }
            
            // Aumento do delay para 1500ms para garantir que o hardware esteja pronto
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
            }, 1500);
          }
        } catch (e: any) { 
            console.error(e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError' || e.message?.includes("denied")) {
              setError("Acesso à câmera negado. Por favor, autorize o uso da câmera nas configurações do seu navegador para usar o scanner.");
            } else {
              setError("Câmera indisponível: Verifique as permissões do seu navegador ou se outra aba está usando a câmera."); 
            }
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
          // Uso defensivo de applyConstraints para evitar 'setPhotoOptions failed'
          if ((track as any).applyConstraints) {
            await (track as any).applyConstraints({ advanced: [{ torch: next }] });
            setFlashOn(next);
          }
      } catch (err: any) {
          console.error("Erro ao alternar lanterna:", err);
          // Não exibimos erro para o usuário se for apenas falha de hardware do flash
          if (!err.message?.includes("setPhotoOptions")) {
             setError("Seu dispositivo não permitiu o controle da lanterna no momento.");
          }
      }
    }
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || JSON.stringify(err);
    console.error("Erro detalhado:", err);
    
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) return "O servidor de IA está com alta demanda agora. Por favor, aguarde um instante e tente novamente.";
    if (msg.includes("429")) return "Muitas solicitações seguidas. Aguarde 10 segundos.";
    if (msg.includes("setPhotoOptions") || msg.includes("Permission denied")) return "Acesso à câmera negado ou hardware ocupado. Verifique as permissões do navegador.";
    if (msg.includes("dimensões")) return "A câmera ainda está iniciando. Tente capturar novamente em 2 segundos.";
    if (msg.includes("JSON")) return `Erro de Processamento: A IA enviou dados malformados. Tente novamente.`;
    
    return `[v4.2 MASTER-FINAL] Erro: ${msg}`;
  };

  const forceRefresh = async () => {
    try {
      // Limpa Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Limpa Caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      // Limpa LocalStorage (opcional, mas ajuda no debug)
      // localStorage.clear();
      
      // Recarrega a página forçando o servidor
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  const compressImage = async (imgSource: HTMLImageElement | HTMLVideoElement): Promise<{ blob: Blob, dataUrl: string }> => {
    const canvas = document.createElement('canvas');
    const maxWidth = 800; // Resolução otimizada para Gemini Vision
    
    let width = 0;
    let height = 0;
    
    if (imgSource instanceof HTMLImageElement) {
      width = imgSource.width;
      height = imgSource.height;
    } else {
      width = imgSource.videoWidth;
      height = imgSource.videoHeight;
    }

    const scale = Math.min(1, maxWidth / width);
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Não foi possível inicializar o contexto do Canvas.");
    
    ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);
    
    // Compressão agressiva para Supabase (0.6) e IA (0.5)
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.6));
    if (!blob) throw new Error("Falha na compressão da imagem.");
    
    return {
      blob,
      dataUrl: canvas.toDataURL('image/jpeg', 0.5)
    };
  };

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

      const { blob, dataUrl } = await compressImage(img);
      let publicUrl = dataUrl;
      
      // Upload para Supabase (Otimizado)
      if (navigator.onLine && user && user.id !== 'offline') {
        try {
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('pest-images')
            .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

          if (!uploadError) {
            const { data } = supabase.storage.from('pest-images').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Upload falhou, usando local:", uploadErr);
        }
      }

      const res = await analyzePestImage(dataUrl.split(',')[1]);
      const fullRes = { ...res, capturedImage: publicUrl };
      
      setCurrentResult(fullRes);
      setView('result');

      // Só salva no histórico se estiver online e não for usuário offline
      if (res.pestFound && user && navigator.onLine && user.id !== 'offline') {
        try {
          await supabase.from('pest_detections')
            .insert({ 
              user_id: user.id, 
              image_data: publicUrl, 
              pest_name: res.pest?.name || 'IA Gallery Scan', 
              confidence: res.confidence, 
              analysis_result: fullRes 
            });
          fetchHistory();
        } catch (err) {
          console.warn("Falha ao salvar histórico:", err);
        }
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
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError("A análise está demorando mais que o esperado.");
    }, 30000);

    try {
      const { blob, dataUrl } = await compressImage(videoRef.current);
      let publicUrl = dataUrl;
      
      if (navigator.onLine && user && user.id !== 'offline') {
        try {
          const fileName = `${user.id}/${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('pest-images')
            .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

          if (!uploadError) {
            const { data } = supabase.storage.from('pest-images').getPublicUrl(fileName);
            publicUrl = data.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Upload falhou, usando local:", uploadErr);
        }
      }

      const res = await analyzePestImage(dataUrl.split(',')[1]);
      clearTimeout(timeoutId);
      
      const fullRes = { ...res, capturedImage: publicUrl };
      
      setCurrentResult(fullRes);
      setView('result');

      // Só salva no histórico se estiver online e não for usuário offline
      if (res.pestFound && user && navigator.onLine && user.id !== 'offline') {
        try {
          await supabase.from('pest_detections')
            .insert({ 
              user_id: user.id, 
              image_data: publicUrl, 
              pest_name: res.pest?.name || 'IA Scan', 
              confidence: res.confidence, 
              analysis_result: fullRes 
            });
          fetchHistory();
        } catch (err) {
          console.warn("Falha ao salvar histórico:", err);
        }
      }
    } catch (e: any) { 
      clearTimeout(timeoutId);
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
    <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-8 pt-[calc(2rem+env(safe-area-inset-top))]">
      <div className="bg-emerald-900/50 p-4 rounded-3xl mb-4"><Bug className="w-12 h-12 text-emerald-400" /></div>
      <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-wider">{authMode === 'login' ? 'Acessar App' : 'Criar Cadastro'}</h1>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl mb-6 w-full max-w-xs text-center text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={async (e) => { 
        e.preventDefault(); 
        setLoading(true); 
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
        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-emerald-900/40 border border-emerald-800 rounded-2xl py-4 px-6 text-white outline-none" />
        <button className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl uppercase text-sm">Entrar</button>
      </form>
      <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-emerald-400 text-xs font-bold uppercase">Trocar para {authMode === 'login' ? 'Cadastro' : 'Login'}</button>
      <button onClick={() => { setUser({ id: 'offline', email: 'offline@local', name: 'Modo Offline' }); setView('main'); }} className="mt-4 text-slate-400 text-xs font-bold uppercase underline">Entrar no Modo Offline</button>
      <button onClick={forceRefresh} className="mt-8 text-emerald-400 text-[12px] font-black uppercase border-2 border-emerald-400 px-6 py-3 rounded-2xl animate-pulse">⚠️ Clique aqui para Atualizar (v4.2 MASTER-FINAL)</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 rounded-b-[3.5rem] text-white sticky top-0 z-40 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl"><Bug className="text-emerald-400 w-6 h-6" /></div>
            <div>
              <h1 className="font-black text-lg">PestScan Pro</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-emerald-400/60 font-bold uppercase">{user?.name} • v4.2 MASTER-FINAL</p>
                <button 
                  onClick={forceRefresh}
                  className="text-[8px] bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-400/20 transition-colors"
                  title="Forçar Atualização"
                >
                  Atualizar App
                </button>
              </div>
            </div>
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

            {filteredData.length === 0 && searchTerm.trim() !== '' && (
              <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 animate-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-emerald-500 p-2 rounded-xl text-white"><Cpu size={20} /></div>
                  <h3 className="text-emerald-900 font-black text-sm uppercase">Pesquisa de IA Robusta</h3>
                </div>
                <p className="text-emerald-700 text-xs font-bold leading-relaxed mb-4">Nenhuma praga "{searchTerm}" encontrada no catálogo local. Gostaria de usar nossa IA para buscar dados técnicos externos?</p>
                <div className="flex flex-col gap-2">
                  <button onClick={handleAiDeepSearch} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">
                    <Globe size={14} /> Consultar IA Especialista
                  </button>
                  <button onClick={() => setSearchTerm('')} className="w-full py-3 bg-white text-emerald-600 border border-emerald-200 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all">
                    Limpar Pesquisa
                  </button>
                </div>
              </div>
            )}

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

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Algo deu errado!</h1>
          <p className="text-red-600 mb-4">O aplicativo encontrou um erro inesperado.</p>
          <pre className="bg-white p-4 rounded-lg border border-red-200 text-xs text-left overflow-auto max-w-full text-red-900">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  // @ts-ignore
  const root = container._reactRoot || createRoot(container);
  // @ts-ignore
  container._reactRoot = root;
  
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
// Forcing git refresh 4 - Fix permissions and capture readiness

