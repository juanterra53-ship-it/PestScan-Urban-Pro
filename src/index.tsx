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
import { supabase } from '../supabaseClient';
import { analyzePestImage, analyzePestByName, loadLocalModel, isLocalModelLoaded } from './geminiService';
import { RecognitionResult, HistoryEntry, EncyclopediaItem, PestInfo } from './types';

const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
  { 
    id: '1', name: 'Aranha-armadeira', category: 'Aranhas', icon: '🕷️',
    details: {
      name: 'Aranha-armadeira', scientificName: 'Phoneutria nigriventer', category: 'Aranhas', riskLevel: 'Crítico',
      characteristics: ['Muito agressiva', 'Levanta as patas dianteiras', 'Pode saltar'],
      anatomy: 'Grande (até 15cm). Quelíceras com pelos avermelhados. Manchas claras no dorso.',
      members: '8 pernas longas e ágeis.',
      habits: 'Errante e noturna. Não faz teia. Esconde-se em sapatos, roupas, caixas e bananeiras.',
      reproduction: 'A fêmea produz várias ootecas ao longo da vida.',
      larvalPhase: 'Ninfas muito agressivas e rápidas desde o nascimento.',
      controlMethods: ['Inspeção rigorosa', 'Vedação total de frestas'],
      physicalMeasures: ['Sacudir roupas e sapatos antes de usar', 'Vedar portas com rodinhos de borracha', 'Eliminar entulhos'],
      chemicalMeasures: [
        'Bifentrina: 30ml/10L água (Aplicação perimetral)',
        'Deltametrina: 50ml/10L água (Pulverização em esconderijos)',
        'Lambda-cialotrina: 20ml/10L água (Efeito residual em frestas)'
      ],
      healthRisks: 'Veneno neurotóxico potente. Causa dor intensa, sudorese, arritmia e risco de morte.'
    }
  },
  { 
    id: '2', name: 'Aranha-marrom', category: 'Aranhas', icon: '🕷️',
    details: {
      name: 'Aranha-marrom', scientificName: 'Loxosceles intermedia', category: 'Aranhas', riskLevel: 'Crítico',
      characteristics: ['Pequena (3-4cm)', 'Cor marrom-claro', 'Mancha de violino no cefalotórax'],
      anatomy: 'Corpo dividido em cefalotórax e abdômen. Possui 6 olhos em 3 pares.',
      members: '8 pernas finas e longas.',
      habits: 'Sedentária e não agressiva. Vive em ambientes escuros e secos: atrás de quadros e móveis.',
      reproduction: 'A fêmea produz ootecas de seda branca com 30 a 100 ovos.',
      larvalPhase: 'Os filhotes eclodem após 40 dias e passam por várias mudas.',
      controlMethods: ['Limpeza profunda com aspirador', 'Inspeção de roupas', 'Uso de luvas'],
      physicalMeasures: ['Aspirar atrás de móveis', 'Sacudir sapatos', 'Afastar camas das paredes'],
      chemicalMeasures: [
        'Bifentrina: 40ml/10L água (Tratamento de frestas e rodapés)',
        'Deltametrina: 60ml/10L água (Pulverização residual)',
        'Fipronil: 20ml/10L água (Controle em áreas críticas)'
      ],
      healthRisks: 'Veneno proteolítico que causa necrose tecidual severa e falência renal.'
    }
  },
  { 
    id: '3', name: 'Viúva-marrom', category: 'Aranhas', icon: '🕷️',
    details: {
      name: 'Viúva-marrom', scientificName: 'Latrodectus geometricus', category: 'Aranhas', riskLevel: 'Alto',
      characteristics: ['Ampulheta laranja no abdômen', 'Cor marrom com padrões geométricos'],
      anatomy: 'Abdômen globoso. Fiandeiras curtas. Quelíceras pequenas.',
      members: '8 pernas.',
      habits: 'Constrói teias irregulares em locais protegidos: sob bancos, latas e vegetação.',
      reproduction: 'Ootecas esféricas com espículas (parecem minas navais).',
      larvalPhase: 'Ninfas pequenas que se dispersam após a eclosão.',
      controlMethods: ['Limpeza de áreas externas', 'Uso de EPIs em jardinagem'],
      physicalMeasures: ['Remover objetos abandonados', 'Uso de luvas em jardins', 'Limpeza de entulhos'],
      chemicalMeasures: [
        'Bifentrina: 30ml/10L água (Aplicação em teias e esconderijos)',
        'Deltametrina: 50ml/10L água (Tratamento perimetral)',
        'Lambda-cialotrina: 25ml/10L água (Pulverização residual)'
      ],
      healthRisks: 'Veneno neurotóxico. Causa dor local, espasmos musculares e náuseas.'
    }
  },
  { 
    id: '4', name: 'Barata-americana', category: 'Baratas', icon: '🪳',
    details: {
      name: 'Barata-americana', scientificName: 'Periplaneta americana', category: 'Baratas', riskLevel: 'Alto',
      characteristics: ['Grande (até 5cm)', 'Cor marrom-avermelhada', 'Borda amarela no pronoto'],
      anatomy: 'Asas longas. Excelentes voadoras em temperaturas altas.',
      members: '6 pernas longas e robustas.',
      habits: 'Habita sistemas de esgoto, caixas de gordura e bueiros.',
      reproduction: 'A fêmea deposita a ooteca em locais protegidos. Contém cerca de 16 ovos.',
      larvalPhase: 'As ninfas levam de 6 a 12 meses para atingir a maturidade.',
      controlMethods: ['Barreira química perimetral', 'Saneamento básico', 'Tratamento de esgoto'],
      physicalMeasures: ['Ralos do tipo "abre-fecha"', 'Vedação de tampas de esgoto', 'Rodinhos de porta'],
      chemicalMeasures: [
        'Deltametrina: 100ml/10L água (Pulverização em ralos e bueiros)',
        'Fipronil (Gel): 1-2 pontos/m² (Áreas de alimentação)',
        'Lambda-cialotrina: 40ml/10L água (Barreira perimetral)'
      ],
      healthRisks: 'Vetor de doenças entéricas, transportando patógenos de esgotos.'
    }
  },
  { 
    id: '5', name: 'Barata-alemã', category: 'Baratas', icon: '🪳',
    details: {
      name: 'Barata-alemã', scientificName: 'Blattella germanica', category: 'Baratas', riskLevel: 'Alto',
      characteristics: ['Pequena (1.5cm)', 'Duas faixas escuras no pronoto', 'Cor marrom-claro'],
      anatomy: 'Corpo oval e achatado. Possui asas, mas raramente voa.',
      members: '6 pernas espinhosas.',
      habits: 'Prefere locais quentes e úmidos. Comum em cozinhas e motores de eletrodomésticos.',
      reproduction: 'A fêmea carrega a ooteca até a eclosão. Contém 30-40 ovos.',
      larvalPhase: 'As ninfas passam por 6 a 7 mudas.',
      controlMethods: ['Aplicação de iscas em gel', 'Monitoramento com armadilhas', 'Eliminação de abrigo'],
      physicalMeasures: ['Limpeza de gordura', 'Vedar frestas em azulejos', 'Lixeiras fechadas'],
      chemicalMeasures: [
        'Abamectina (Gel): 1-3 pontos/m² (Frestas e armários)',
        'Fipronil (Gel): 1-2 pontos/m² (Pontos críticos de cozinha)',
        'Indoxacarbe (Gel): 1-2 pontos/m² (Áreas de alta infestação)'
      ],
      healthRisks: 'Transmissão de patógenos e causadora de asma e rinites.'
    }
  },
  { 
    id: '6', name: 'Barata-oriental', category: 'Baratas', icon: '🪳',
    details: {
      name: 'Barata-oriental', scientificName: 'Blatta orientalis', category: 'Baratas', riskLevel: 'Alto',
      characteristics: ['Cor preta brilhante', 'Aparência robusta', 'Não voa'],
      anatomy: 'Asas vestigiais no macho e ausentes na fêmea.',
      members: '6 pernas curtas e fortes.',
      habits: 'Prefere locais muito úmidos e frios. Comum em ralos externos e porões.',
      reproduction: 'A fêmea deposita a ooteca em matéria orgânica. Contém cerca de 16 ovos.',
      larvalPhase: 'Desenvolvimento lento, podendo levar até 2 anos.',
      controlMethods: ['Drenagem de áreas úmidas', 'Barreira química externa', 'Limpeza orgânica'],
      physicalMeasures: ['Eliminar vazamentos', 'Vedar ralos de jardim', 'Calhas limpas'],
      chemicalMeasures: [
        'Bifentrina: 50ml/10L água (Pulverização perimetral externa)',
        'Deltametrina: 80ml/10L água (Tratamento de áreas úmidas)',
        'Lambda-cialotrina: 30ml/10L água (Aplicação em ralos e caixas de passagem)'
      ],
      healthRisks: 'Exala odor fétido e transporta patógenos de áreas externas.'
    }
  },
  { 
    id: '7', name: 'Besouro-vermelho-da-farinha', category: 'Carunchos', icon: '🪵',
    details: {
      name: 'Besouro-vermelho-da-farinha', scientificName: 'Tribolium castaneum', category: 'Carunchos', riskLevel: 'Moderado',
      characteristics: ['Cor marrom-avermelhada', 'Corpo achatado', 'Pequeno (3-4mm)'],
      anatomy: 'Antenas com clava de 3 segmentos. Élitros com estrias longitudinais.',
      members: '6 pernas.',
      habits: 'Infesta farinhas, farelos e grãos quebrados. Comum em moinhos e despensas.',
      reproduction: 'A fêmea põe centenas de ovos diretamente no substrato alimentar.',
      larvalPhase: 'Larvas cilíndricas de cor amarelada.',
      controlMethods: ['Higiene de silos', 'Controle de temperatura', 'Expurgo'],
      physicalMeasures: ['Limpeza de resíduos', 'Uso de potes herméticos', 'Peneiração'],
      chemicalMeasures: [
        'Deltametrina: 40ml/10L água (Pulverização de frestas em armazéns)',
        'Fosfina: 3-5 pastilhas/m³ (Expurgo profissional de grãos)',
        'Pirimifós-metílico: 10ml/tonelada (Protetor de grãos)'
      ],
      healthRisks: 'Contaminação de alimentos e secreção de substâncias quinonas cancerígenas.'
    }
  },
  { 
    id: '8', name: 'Broca-do-trigo', category: 'Carunchos', icon: '🪵',
    details: {
      name: 'Broca-do-trigo', scientificName: 'Rhyzopertha dominica', category: 'Carunchos', riskLevel: 'Moderado',
      characteristics: ['Cabeça escondida sob o pronoto', 'Cor marrom-escura', 'Forma cilíndrica'],
      anatomy: 'Pronoto com tubérculos na parte anterior. Antenas com clava de 3 segmentos.',
      members: '6 pernas.',
      habits: 'Praga primária de grãos inteiros. Perfura sementes duras como trigo e milho.',
      reproduction: 'Ovos depositados fora dos grãos, mas larvas penetram imediatamente.',
      larvalPhase: 'Larvas brancas em forma de "C".',
      controlMethods: ['Resfriamento de grãos', 'Fumigação', 'Limpeza mecânica'],
      physicalMeasures: ['Manter grãos secos', 'Limpeza de fendas em silos', 'Monitoramento térmico'],
      chemicalMeasures: [
        'Deltametrina: 50ml/10L água (Tratamento de superfícies de armazenamento)',
        'Fosfina: 4 pastilhas/m³ (Fumigação em câmaras herméticas)',
        'Metopreno: 5ml/tonelada (Regulador de crescimento em grãos)'
      ],
      healthRisks: 'Perda total da qualidade nutricional e comercial dos grãos.'
    }
  },
  { 
    id: '9', name: 'Gorgulho-do-arroz', category: 'Carunchos', icon: '🪵',
    details: {
      name: 'Gorgulho-do-arroz', scientificName: 'Sitophilus oryzae', category: 'Carunchos', riskLevel: 'Moderado',
      characteristics: ['Possui bico longo (rostro)', '4 manchas claras nos élitros', 'Cor marrom-escuro'],
      anatomy: 'Antenas cotoveladas. Élitros com pontuações profundas.',
      members: '6 pernas.',
      habits: 'Voador ativo. Infesta arroz, milho e trigo armazenados.',
      reproduction: 'Fêmea perfura o grão para depositar o ovo e o sela.',
      larvalPhase: 'Desenvolve-se inteiramente dentro do grão.',
      controlMethods: ['Vedação de silos', 'Uso de terra de diatomáceas', 'Expurgo'],
      physicalMeasures: ['Peneiração', 'Limpeza de armários', 'Controle de umidade'],
      chemicalMeasures: [
        'Deltametrina: 30ml/10L água (Pulverização residual em depósitos)',
        'Fosfina: 3 pastilhas/m³ (Expurgo em silos)',
        'Terra de Diatomáceas: 1kg/tonelada (Controle físico-químico)'
      ],
      healthRisks: 'Aquecimento de grãos e proliferação de fungos e micotoxinas.'
    }
  },
  { 
    id: '10', name: 'Cupim-arborícola', category: 'Cupins', icon: '🪵',
    details: {
      name: 'Cupim-arborícola', scientificName: 'Nasutitermes corniger', category: 'Cupins', riskLevel: 'Moderado',
      characteristics: ['Ninhos externos pretos em árvores ou postes', 'Soldados com cabeça em forma de cone'],
      anatomy: 'Soldados (nasutos) expelem substância pegajosa pelo cone frontal.',
      members: '6 pernas.',
      habits: 'Constrói ninhos volumosos e trilhas de terra em paredes. Ataca madeiras e fiação.',
      reproduction: 'Revoadas em épocas quentes. Rainha vive no centro do ninho externo.',
      larvalPhase: 'Ninfas cuidadas por operárias no interior do cupinzeiro.',
      controlMethods: ['Remoção do ninho', 'Barreira química', 'Tratamento de trilhas'],
      physicalMeasures: ['Poda de árvores', 'Remover ninhos mecânicamente', 'Vedar frestas externas'],
      chemicalMeasures: [
        'Bifentrina: 40ml/10L água (Pulverização de trilhas e ninhos)',
        'Fipronil: 20ml/10L água (Injeção no ninho e barreira perimetral)',
        'Lambda-cialotrina: 25ml/10L água (Tratamento residual de superfícies)'
      ],
      healthRisks: 'Danos estruturais e riscos de curto-circuito em redes elétricas.'
    }
  },
  { 
    id: '11', name: 'Cupim-de-madeira-seca', category: 'Cupins', icon: '🪵',
    details: {
      name: 'Cupim-de-madeira-seca', scientificName: 'Cryptotermes brevis', category: 'Cupins', riskLevel: 'Moderado',
      characteristics: ['Pozinho granulado (fezes)', 'Vive dentro da madeira', 'Colônias pequenas'],
      anatomy: 'Soldados with cabeça curta e forte para tampar furos.',
      members: '6 pernas.',
      habits: 'Infesta móveis e batentes sem contato with o solo.',
      reproduction: 'Casal real entra em frestas da madeira após revoadas.',
      larvalPhase: 'Desenvolvimento lento dentro da própria peça de madeira atacada.',
      controlMethods: ['Injeção na madeira', 'Fumigação', 'Substituição de peças'],
      physicalMeasures: ['Verniz e pintura', 'Inspeção de móveis novos', 'Uso de madeiras tratadas'],
      chemicalMeasures: [
        'Bifentrina: 30ml/10L água (Injeção em furos de saída)',
        'Deltametrina: 50ml/10L água (Tratamento preventivo de superfícies)',
        'Fipronil: 15ml/10L água (Injeção profunda em galerias)'
      ],
      healthRisks: 'Destruição de patrimônio e móveis históricos.'
    }
  },
  { 
    id: '12', name: 'Cupim-subterrâneo', category: 'Cupins', icon: '🪵',
    details: {
      name: 'Cupim-subterrâneo', scientificName: 'Coptotermes gestroi', category: 'Cupins', riskLevel: 'Crítico',
      characteristics: ['Túneis de terra em paredes', 'Altamente destrutivo', 'Colônias gigantes'],
      anatomy: 'Soldados with cabeça ovalada e mandíbulas em foice.',
      members: '6 pernas.',
      habits: 'Vive no solo e sobe em busca de celulose. Ataca prédios inteiros.',
      reproduction: 'Revoadas massivas. Rainha produz milhares de ovos por dia.',
      larvalPhase: 'Ninfas que se diferenciam em castas conforme a necessidade.',
      controlMethods: ['Barreira química no solo', 'Iscas with IGR', 'Tratamento de fundações'],
      physicalMeasures: ['Evitar madeira em contato with solo', 'Vedar frestas em lajes', 'Drenagem de solo'],
      chemicalMeasures: [
        'Bifentrina: 60ml/10L água (Barreira química pesada no solo)',
        'Fipronil: 30ml/10L água (Tratamento de solo e injeção em paredes)',
        'Hexaflumuron (Isca): Monitoramento e eliminação de colônia'
      ],
      healthRisks: 'Risco de desabamento de structures de madeira e danos elétricos.'
    }
  },
  { 
    id: '13', name: 'Escorpião-amarelo', category: 'Escorpiões', icon: '🦂',
    details: {
      name: 'Escorpião-amarelo', scientificName: 'Tityus serrulatus', category: 'Escorpiões', riskLevel: 'Crítico',
      characteristics: ['Tronco amarelo-claro', 'Serrilha na cauda', 'Manchas escuras no telson'],
      anatomy: 'Possui cefalotórax e abdômen. Telson with ferrão e veneno neurotóxico.',
      members: '8 pernas e 2 pinças.',
      habits: 'Noturno e lucífugo. Vive em esgotos e entulhos. Alimenta-se de baratas.',
      reproduction: 'Partenogênese (reprodução sem macho).',
      larvalPhase: 'Ninfas nascem vivas e ficam no dorso da mãe.',
      controlMethods: ['Manejo ambiental', 'Busca ativa with luz UV', 'Controle de baratas'],
      physicalMeasures: ['Telas em ralos', 'Vedação de frestas', 'Limpeza de quintais'],
      chemicalMeasures: [
        'Bifentrina (Microencapsulada): 50ml/10L água (Tratamento de frestas)',
        'Deltametrina: 60ml/10L água (Pulverização perimetral)',
        'Lambda-cialotrina (Microencapsulada): 30ml/10L água (Efeito residual longo)'
      ],
      healthRisks: 'Picada extremamente perigosa, risco de morte em crianças.'
    }
  },
  { 
    id: '14', name: 'Escorpião-marrom', category: 'Escorpiões', icon: '🦂',
    details: {
      name: 'Escorpião-marrom', scientificName: 'Tityus bahiensis', category: 'Escorpiões', riskLevel: 'Crítico',
      characteristics: ['Cor marrom-escuro', 'Pernas with manchas escuras', 'Sem serrilha na cauda'],
      anatomy: 'Corpo robusto. Pinças mais largas que as do amarelo.',
      members: '8 pernas e 2 pinças.',
      habits: 'Comum em áreas with vegetação e entulhos úmidos. Menos adaptado a esgotos que o amarelo.',
      reproduction: 'Sexuada (necessita de macho).',
      larvalPhase: 'Ninfas permanecem no dorso materno até a primeira muda.',
      controlMethods: ['Limpeza de jardins', 'Remover pilhas de madeira', 'Controle de insetos'],
      physicalMeasures: ['Uso de calçados fechados', 'Sacudir roupas', 'Vedar soleiras'],
      chemicalMeasures: [
        'Bifentrina: 40ml/10L água (Aplicação em esconderijos externos)',
        'Deltametrina: 50ml/10L água (Barreira química perimetral)',
        'Lambda-cialotrina: 25ml/10L água (Tratamento residual)'
      ],
      healthRisks: 'Picada muito dolorosa, veneno perigoso mas menos letal que o do amarelo.'
    }
  },
  { 
    id: '15', name: 'Escorpião-amarelo-do-nordeste', category: 'Escorpiões', icon: '🦂',
    details: {
      name: 'Escorpião-amarelo-do-nordeste', scientificName: 'Tityus stigmurus', category: 'Escorpiões', riskLevel: 'Crítico',
      characteristics: ['Faixa escura longitudinal no dorso', 'Triângulo escuro na cabeça'],
      anatomy: 'Corpo amarelo-alaranjado. Telson with ferrão curvo.',
      members: '8 pernas e 2 pinças.',
      habits: 'Muito comum em áreas urbanas do Nordeste. Habita frestas e esgotos.',
      reproduction: 'Partenogênese frequente.',
      larvalPhase: 'Ninfas brancas no dorso da mãe.',
      controlMethods: ['Vedação de ralos', 'Limpeza urbana', 'Controle de presas'],
      physicalMeasures: ['Telas metálicas', 'Reboque de paredes', 'Limpeza de terrenos'],
      chemicalMeasures: [
        'Bifentrina: 45ml/10L água (Tratamento de frestas e caixas de gordura)',
        'Deltametrina: 55ml/10L água (Pulverização residual)',
        'Lambda-cialotrina: 35ml/10L água (Aplicação em pontos críticos)'
      ],
      healthRisks: 'Causa acidentes graves, especialmente no Nordeste brasileiro.'
    }
  },
  { 
    id: '16', name: 'Formiga-carpinteira', category: 'Formigas', icon: '🐜',
    details: {
      name: 'Formiga-carpinteira', scientificName: 'Camponotus spp.', category: 'Formigas', riskLevel: 'Moderado',
      characteristics: ['Tamanho grande (até 2.5cm)', 'Cintura with um único nó', 'Cor preta ou avermelhada'],
      anatomy: 'Tórax with perfil superior em arco contínuo. Mandíbulas fortes.',
      members: '6 pernas longas.',
      habits: 'Nidifica em madeira úmida ou oca. Não come madeira, apenas escava galerias.',
      reproduction: 'Revoadas nupciais em épocas quentes. Produz formas aladas.',
      larvalPhase: 'Larvas brancas cuidadas em câmaras protegidas.',
      controlMethods: ['Localização do ninho', 'Eliminação de umidade', 'Tratamento de madeiras'],
      physicalMeasures: ['Substituir madeiras podres', 'Podar galhos próximos', 'Vedar furos em batentes'],
      chemicalMeasures: [
        'Bifentrina: 40ml/10L água (Barreira perimetral externa)',
        'Fipronil (Gel): Aplicação em trilhas e frestas',
        'Lambda-cialotrina: 30ml/10L água (Injeção em galerias de madeira)'
      ],
      healthRisks: 'Danos estruturais em móveis e telhados, contaminação de alimentos.'
    }
  },
  { 
    id: '17', name: 'Formiga-fantasma', category: 'Formigas', icon: '🐜',
    details: {
      name: 'Formiga-fantasma', scientificName: 'Tapinoma melanocephalum', category: 'Formigas', riskLevel: 'Moderado',
      characteristics: ['Cabeça e tórax escuros', 'Abdômen e pernas translúcidos', 'Minúscula (1.5mm)'],
      anatomy: 'Cintura with um nó escondido. Exala odor de coco podre ao ser esmagada.',
      members: '6 pernas finas.',
      habits: 'Oportunista. Nidifica em frestas de azulejos, batentes e até dentro de teclados.',
      reproduction: 'Fragmentação da colônia (botamento). Múltiplas rainhas.',
      larvalPhase: 'Larvas brancas alimentadas por trofalaxia.',
      controlMethods: ['Iscas em gel', 'Higiene rigorosa', 'Vedação de frestas'],
      physicalMeasures: ['Vedar frestas with rejunte', 'Manter bancadas secas', 'Armazenar doces em geladeira'],
      chemicalMeasures: [
        'Abamectina (Gel): Aplicação em pontos de passagem',
        'Imidacloprido (Gel): Iscagem em frestas de cozinha',
        'Tiametoxam (Gel): Controle de colônias em áreas úmidas'
      ],
      healthRisks: 'Vetor de patógenos em cozinhas e hospitais.'
    }
  },
  { 
    id: '18', name: 'Formiga-lava-pés', category: 'Formigas', icon: '🐜',
    details: {
      name: 'Formiga-lava-pés', scientificName: 'Solenopsis invicta', category: 'Formigas', riskLevel: 'Alto',
      characteristics: ['Cor avermelhada a marrom-escuro', 'Comportamento agressivo', 'Picada dolorosa'],
      anatomy: 'Cintura with dois nós. Antenas with 10 segmentos e clava de 2 segmentos.',
      members: '6 pernas.',
      habits: 'Constrói montículos de terra solta. Ataca em massa qualquer invasor.',
      reproduction: 'Colônias monogínicas ou poligínicas. Expansão rápida.',
      larvalPhase: 'Larvas alimentadas com comida líquida e sólida pelas operárias.',
      controlMethods: ['Iscas granuladas', 'Tratamento de montículos', 'Manejo de solo'],
      physicalMeasures: ['Eliminar entulho', 'Vedar frestas em calçadas', 'Manter gramados aparados'],
      chemicalMeasures: [
        'Abamectina (Isca): 10g/m² ao redor do formigueiro',
        'Fipronil: 20ml/10L água (Inundação de montículos externos)',
        'Hidrametilnona (Isca): Aplicação perimetral em áreas infestadas'
      ],
      healthRisks: 'Veneno causa pústulas e pode provocar choque anafilático.'
    }
  },
  { 
    id: '19', name: 'Mosca-doméstica', category: 'Moscas', icon: '🪰',
    details: {
      name: 'Mosca-doméstica', scientificName: 'Musca domestica', category: 'Moscas', riskLevel: 'Moderado',
      characteristics: ['Cor cinza-escura', '4 listras pretas no tórax', 'Olhos compostos grandes'],
      anatomy: 'Aparelho bucal lambedor. Corpo coberto por cerdas.',
      members: '6 pernas with ventosas.',
      habits: 'Diurna. Alimenta-se de matéria orgânica em decomposição e alimentos humanos.',
      reproduction: 'A fêmea põe centenas de ovos em lixo ou fezes.',
      larvalPhase: 'Larvas brancas e cilíndricas (tapuru).',
      controlMethods: ['Saneamento básico', 'Telas em janelas', 'Iscas atrativas'],
      physicalMeasures: ['Acondicionar lixo corretamente', 'Instalar telas', 'Limpeza de resíduos orgânicos'],
      chemicalMeasures: [
        'Azametifós (Isca): 10g/m² em pontos de pouso',
        'Deltametrina: 50ml/10L água (Pulverização residual de superfícies)',
        'Tiametoxam (Isca): Pintura ou aspersão em áreas de agregação'
      ],
      healthRisks: 'Transmissora de diversas doenças como febre tifoide e cólera.'
    }
  },
  { 
    id: '20', name: 'Mosca-verde', category: 'Moscas', icon: '🪰',
    details: {
      name: 'Mosca-verde', scientificName: 'Lucilia cuprina', category: 'Moscas', riskLevel: 'Moderado',
      characteristics: ['Cor verde-metálica brilhante', 'Tamanho médio (10mm)'],
      anatomy: 'Corpo robusto. Olhos avermelhados.',
      members: '6 pernas.',
      habits: 'Comum em carcaças e lixo. Atraída por feridas e odores fortes.',
      reproduction: 'Deposita ovos em tecidos em decomposição ou feridas abertas.',
      larvalPhase: 'Larvas necrófagas que podem causar miíases.',
      controlMethods: ['Remoção de carcaças', 'Tratamento de feridas em animais', 'Iscas'],
      physicalMeasures: ['Enterrar ou queimar restos animais', 'Limpeza de lixeiras', 'Uso de armadilhas'],
      chemicalMeasures: [
        'Deltametrina: 60ml/10L água (Pulverização de áreas de descarte)',
        'Fentiom: 20ml/10L água (Tratamento residual externo)',
        'Tiametoxam (Isca): Aplicação em pontos de pouso externos'
      ],
      healthRisks: 'Causa miíases (bicheiras) em animais e humanos.'
    }
  },
  { 
    id: '21', name: 'Mosca-varejeira', category: 'Moscas', icon: '🪰',
    details: {
      name: 'Mosca-varejeira', scientificName: 'Chrysomya megacephala', category: 'Moscas', riskLevel: 'Moderado',
      characteristics: ['Cor azul-metálica', 'Olhos grandes e vermelhos'],
      anatomy: 'Corpo robusto. Asas transparentes.',
      members: '6 pernas.',
      habits: 'Frequenta fezes, lixo e carcaças. Muito comum em mercados e feiras.',
      reproduction: 'A fêmea põe ovos em matéria orgânica em decomposição.',
      larvalPhase: 'Larvas brancas (tapurus) muito vorazes.',
      controlMethods: ['Higiene ambiental', 'Telas', 'Iscas'],
      physicalMeasures: ['Limpeza de fezes de animais', 'Proteção de alimentos', 'Uso de armadilhas luminosas'],
      chemicalMeasures: [
        'Azametifós: 15g/m² (Iscagem em áreas de resíduos)',
        'Deltametrina: 40ml/10L água (Pulverização residual externa)',
        'Tiametoxam: 20g/L água (Pintura de superfícies de pouso)'
      ],
      healthRisks: 'Vetor de patógenos entéricos e causadora de miíases.'
    }
  },
  { 
    id: '22', name: 'Aedes aegypti', category: 'Mosquitos', icon: '🦟',
    details: {
      name: 'Aedes aegypti', scientificName: 'Aedes aegypti', category: 'Mosquitos', riskLevel: 'Crítico',
      characteristics: ['Cor escura with manchas brancas', 'Lira no tórax', 'Hábito diurno'],
      anatomy: 'Probóscide para picar. Escamas brancas em forma de lira no dorso do tórax.',
      members: '6 pernas with anéis brancos.',
      habits: 'Vive próximo ao homem. Pica preferencialmente durante o dia. Cria-se em água limpa e parada.',
      reproduction: 'A fêmea deposita ovos nas paredes de recipientes com água.',
      larvalPhase: 'Larvas aquáticas que se movimentam em "S".',
      controlMethods: ['Eliminação de criadouros', 'Uso de repelentes', 'Nebulização (Fumacê)'],
      physicalMeasures: ['Tampar caixas d\'água', 'Eliminar pratos de vasos', 'Limpeza de calhas'],
      chemicalMeasures: [
        'Deltametrina: 40ml/10L água (Nebulização espacial - UBV)',
        'Malation: 30ml/10L água (Controle de adultos em áreas críticas)',
        'Piriproxifeno: 1g/100L água (Larvicida em depósitos de água)'
      ],
      healthRisks: 'Principal vetor de Dengue, Zika, Chikungunya e Febre Amarela.'
    }
  },
  { 
    id: '23', name: 'Anopheles darlingi', category: 'Mosquitos', icon: '🦟',
    details: {
      name: 'Anopheles darlingi', scientificName: 'Anopheles darlingi', category: 'Mosquitos', riskLevel: 'Crítico',
      characteristics: ['Pousa em ângulo de 45 graus', 'Asas com manchas escuras'],
      anatomy: 'Probóscide longa. Pernas longas e finas.',
      members: '6 pernas.',
      habits: 'Vetor da Malária. Pica preferencialmente ao entardecer e à noite. Cria-se em águas limpas e sombreadas.',
      reproduction: 'Ovos depositados individualmente na superfície da água.',
      larvalPhase: 'Larvas flutuam paralelamente à superfície da água.',
      controlMethods: ['Telas impregnadas', 'Pulverização residual intra-domiciliar', 'Drenagem'],
      physicalMeasures: ['Uso de mosquiteiros', 'Instalação de telas em portas e janelas', 'Manejo de coleções d\'água'],
      chemicalMeasures: [
        'Bifentrina: 50ml/10L água (Tratamento residual de paredes)',
        'Deltametrina: 30ml/10L água (Impregnação de mosquiteiros)',
        'Lambda-cialotrina: 25ml/10L água (Pulverização espacial externa)'
      ],
      healthRisks: 'Principal transmissor da Malária na região amazônica.'
    }
  },
  { 
    id: '24', name: 'Culex quinquefasciatus', category: 'Mosquitos', icon: '🦟',
    details: {
      name: 'Culex quinquefasciatus', scientificName: 'Culex quinquefasciatus', category: 'Mosquitos', riskLevel: 'Moderado',
      characteristics: ['Cor marrom-claro', 'Hábito noturno', 'Zumbido característico'],
      anatomy: 'Probóscide para picar. Corpo sem manchas brancas evidentes.',
      members: '6 pernas.',
      habits: 'Mosquito comum doméstico (pernilongo). Cria-se em água rica em matéria orgânica (esgoto). Pica à noite.',
      reproduction: 'A fêmea deposita ovos em jangadas na superfície da água.',
      larvalPhase: 'Larvas aquáticas que flutuam em ângulo com a superfície.',
      controlMethods: ['Vedação de fossas', 'Uso de telas', 'Inseticidas'],
      physicalMeasures: ['Tampar ralos e fossas', 'Instalar telas em janelas', 'Uso de ventiladores'],
      chemicalMeasures: [
        'Deltametrina: 40ml/10L água (Nebulização em áreas de esgoto)',
        'Lambda-cialotrina: 20ml/10L água (Tratamento residual perimetral)',
        'Piriproxifeno: 2g/100L água (Larvicida em águas servidas)'
      ],
      healthRisks: 'Vetor da Filariose (Elefantíase) e de diversas arboviroses.'
    }
  },
  { 
    id: '25', name: 'Percevejo-de-cama', category: 'Percevejos', icon: '🛏️',
    details: {
      name: 'Percevejo-de-cama', scientificName: 'Cimex lectularius', category: 'Percevejos', riskLevel: 'Crítico',
      characteristics: ['Cor marrom-avermelhada', 'Corpo achatado oval', 'Pequeno (5-7mm)'],
      anatomy: 'Aparelho bucal picador-sugador. Asas atrofiadas (não voa).',
      members: '6 pernas.',
      habits: 'Noturno. Esconde-se em costuras de colchões, frestas de camas e atrás de quadros. Alimenta-se de sangue humano.',
      reproduction: 'Inseminação traumática. Fêmea põe centenas de ovos ao longo da vida.',
      larvalPhase: 'Ninfas passam por 5 estágios, necessitando de sangue em cada um.',
      controlMethods: ['Tratamento térmico', 'Aspiração', 'Inseticidas residuais'],
      physicalMeasures: ['Lavar roupas em água quente (>60°C)', 'Uso de capas protetoras em colchões', 'Aspiração exaustiva'],
      chemicalMeasures: [
        'Bifentrina: 50ml/10L água (Tratamento de frestas e rodapés)',
        'Deltametrina: 40ml/10L água (Aplicação em estruturas de cama)',
        'Lambda-cialotrina: 30ml/10L água (Pulverização residual de áreas de refúgio)'
      ],
      healthRisks: 'Causa dermatites, reações alérgicas severas e estresse psicológico (insônia).'
    }
  },
  { 
    id: '26', name: 'Rato-de-telhado', category: 'Roedores', icon: '🐀',
    details: {
      name: 'Rato-de-telhado', scientificName: 'Rattus rattus', category: 'Roedores', riskLevel: 'Crítico',
      characteristics: ['Orelhas grandes', 'Cauda longa (maior que o corpo)', 'Ágil e escalador'],
      anatomy: 'Corpo esguio. Nariz pontiagudo.',
      members: '4 patas with garras para escalar.',
      habits: 'Noturno. Vive em forros, sótãos e árvores. Excelente equilibrista.',
      reproduction: 'Alta taxa reprodutiva. Gestação de 21 dias.',
      larvalPhase: 'Filhotes nascem cegos e sem pelos (ninhada).',
      controlMethods: ['Iscagem em locais altos', 'Vedação de acessos', 'Manejo de alimentos'],
      physicalMeasures: ['Instalar anéis de proteção em fios', 'Podar galhos sobre o telhado', 'Vedar vãos de telha'],
      chemicalMeasures: [
        'Bromadiolona (Isca): Blocos parafinados em forros',
        'Cumatetralil (Pó de contato): Aplicação em trilhas de telhado',
        'Difenacoum (Isca): Grãos em pontos de difícil acesso'
      ],
      healthRisks: 'Transmite Leptospirose, Peste Bubônica e Tifo Murino.'
    }
  },
  { 
    id: '27', name: 'Ratazana', category: 'Roedores', icon: '🐀',
    details: {
      name: 'Ratazana', scientificName: 'Rattus norvegicus', category: 'Roedores', riskLevel: 'Crítico',
      characteristics: ['Corpo robusto e pesado', 'Orelhas pequenas', 'Cauda menor que o corpo'],
      anatomy: 'Focinho rombo (arredondado). Olhos pequenos.',
      members: '4 patas with membranas interdigitais rudimentares (nada bem).',
      habits: 'Noturna. Vive em tocas no solo, esgotos e lixões. Excelente nadadora e escavadora.',
      reproduction: 'Extremamente prolífica. Ninhadas de 8 a 12 filhotes.',
      larvalPhase: 'Filhotes dependentes da mãe nas primeiras semanas.',
      controlMethods: ['Iscagem em tocas e bueiros', 'Saneamento', 'Eliminação de abrigos'],
      physicalMeasures: ['Vedar ralos with telas metálicas', 'Eliminar acúmulo de lixo', 'Canalização de esgoto'],
      chemicalMeasures: [
        'Bromadiolona (Isca): Blocos parafinados em bueiros e áreas úmidas',
        'Flocoumafen (Isca): Iscagem em pontos estratégicos de alta infestação',
        'Warfarina (Pó): Aplicação em tocas ativas'
      ],
      healthRisks: 'Vetor de Leptospirose (via urina), Hantavírus e Salmonelose.'
    }
  },
  { 
    id: '28', name: 'Camundongo', category: 'Roedores', icon: '🐀',
    details: {
      name: 'Camundongo', scientificName: 'Mus musculus', category: 'Roedores', riskLevel: 'Crítico',
      characteristics: ['Tamanho pequeno', 'Orelhas grandes e arredondadas', 'Focinho pontiagudo'],
      anatomy: 'Corpo esguio. Cauda fina e longa.',
      members: '4 patas ágeis.',
      habits: 'Curioso e explorador. Vive dentro de residências, em armários, despensas e atrás de móveis. Noturno.',
      reproduction: 'Ciclo reprodutivo muito rápido. Gestação de 19 dias.',
      larvalPhase: 'Filhotes amadurecem sexualmente em poucas semanas.',
      controlMethods: ['Iscagem em pontos estratégicos', 'Higiene de armários', 'Vedação de frestas'],
      physicalMeasures: ['Armazenar alimentos em potes rígidos', 'Vedar frestas de 6mm (tamanho de um lápis)', 'Limpeza de migalhas'],
      chemicalMeasures: [
        'Brodifacoum (Isca): Pellets ou blocos em locais de passagem',
        'Cumatetralil (Pó): Aplicação em trilhas e ninhos',
        'Difenacoum (Isca): Iscagem em áreas de manipulação de alimentos'
      ],
      healthRisks: 'Transmite Salmonelose, Hantavírus e pode causar alergias severas.'
    }
  },
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
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
                // Tentativa silenciosa de desligar o flash
                if ((track as any).applyConstraints) {
                  (track as any).applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }
            } catch(e) {
                // Ignorado
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
        try {
          (track as any).applyConstraints({ advanced: [{ zoom }] }).catch((e: any) => {
            console.warn("Zoom apply error (handled):", e);
          });
        } catch (e) {
          console.warn("Zoom apply exception (handled):", e);
        }
      }
    }
  }, [zoom, zoomCaps]);

  const initCamera = useCallback(async () => {
    setError(null); 
    setHasFlash(false); 
    setFlashOn(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Seu navegador ou app não suporta acesso à câmera. Use o botão da Galeria.");
      return;
    }

    const constraints = [
      { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: 'environment' } },
      { video: { facingMode: 'user' } },
      { video: true }
    ];

    let stream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraint of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (stream) break;
      } catch (e: any) {
        console.warn(`Falha ao iniciar câmera com restrição:`, constraint, e);
        lastError = e;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') break;
      }
    }

    if (!stream) {
      console.error("Todas as tentativas de abrir a câmera falharam:", lastError);
      const isPermissionError = lastError?.name === 'NotAllowedError' || 
                               lastError?.name === 'PermissionDeniedError' || 
                               lastError?.message?.toLowerCase().includes("denied") ||
                               lastError?.message?.toLowerCase().includes("permissão");
      
      if (isPermissionError) {
        setError("PERMISSÃO_NEGADA: Acesso à câmera bloqueado.");
      } else if (lastError?.name === 'OverconstrainedError') {
        setError("A câmera do seu dispositivo não suporta as configurações exigidas. Tente usar a Galeria.");
      } else {
        setError(`Câmera indisponível: ${lastError?.message || "Verifique as permissões ou se outra aba está usando a câmera."}`); 
      }
      return;
    }

    try {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Auto-play falhou, tentando novamente após interação:", playErr);
          if (videoRef.current) {
            videoRef.current.onclick = () => videoRef.current?.play();
          }
        }
        
        setTimeout(() => {
          if (!streamRef.current) return;
          const track = streamRef.current.getVideoTracks()[0];
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
      console.error("Erro ao configurar stream no vídeo:", e);
      setError("Erro ao iniciar a visualização da câmera.");
    }
  }, [view]);

  useEffect(() => {
    if (view === 'camera') {
      initCamera();
    }
    return () => stopCamera();
  }, [view, initCamera]);

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track || track.readyState !== 'live') return;
      
      const next = !flashOn;
      try {
          // Uso defensivo de applyConstraints para evitar 'setPhotoOptions failed'
          if ((track as any).applyConstraints) {
            await (track as any).applyConstraints({ advanced: [{ torch: next }] });
            setFlashOn(next);
          }
      } catch (err: any) {
          console.warn("Erro ao alternar lanterna (ignorado):", err);
          // Se falhar com setPhotoOptions, apenas ignoramos para não travar o app
      }
    }
  };

  const formatErrorMessage = (err: any) => {
    const msg = err.message || JSON.stringify(err);
    console.error("Erro detalhado:", err);
    
    if (msg.includes("fetch") || msg.includes("NetworkError")) {
      return "Erro de Conexão: Não foi possível acessar a IA Online. Verifique sua internet ou use o Modo Offline.";
    }
    
    if (msg.includes("503") || msg.includes("UNAVAILABLE")) return "O servidor de IA está com alta demanda agora. Por favor, aguarde um instante e tente novamente.";
    
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      const retryMatch = msg.match(/retry in ([\d.]+)s/);
      if (retryMatch && retryMatch[1]) {
        return `Limite de uso da IA atingido. Por favor, aguarde ${Math.ceil(parseFloat(retryMatch[1]))} segundos para o próximo Scan.`;
      }
      return "O Google Gemini está com muitas solicitações agora. Aguarde 15 segundos para o próximo Scan.";
    }
    if (msg.includes("setPhotoOptions")) return "Hardware da câmera ocupado ou indisponível no momento. Tente novamente em instantes.";
    if (msg.includes("Permission denied") || msg.includes("denied") || msg.includes("PERMISSÃO_NEGADA")) {
      return "PERMISSÃO_NEGADA: Acesso à câmera bloqueado. Siga as instruções abaixo para liberar.";
    }
    if (msg.includes("carregando a imagem")) return msg;
    if (msg.includes("JSON")) return `Erro de Processamento: A IA enviou dados malformados. Tente novamente.`;
    
    return `Erro: ${msg}`;
  };

  const forceRefresh = async () => {
    // Verifica conectividade real antes de apagar tudo
    try {
      const ping = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' }).catch(() => ({ ok: false }));
      if (!ping.ok) {
        alert("Sua conexão com a internet parece instável ou inexistente. Você precisa estar ONLINE para resetar o app com segurança.");
        return;
      }
    } catch (e) {
      alert("Você precisa estar ONLINE para resetar o app e baixar a nova versão.");
      return;
    }

    if (!confirm("ATENÇÃO: Este procedimento irá apagar a versão atual do seu celular e baixar a versão mais recente do servidor. \n\nVocê deve estar com uma conexão ESTÁVEL de internet, caso contrário o app poderá parar de funcionar até que você se conecte novamente. \n\nDeseja continuar?")) return;

    try {
      setLoading(true);
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
      
      // Pequeno delay para garantir a limpeza
      await new Promise(r => setTimeout(r, 1000));
      
      // Recarrega a página forçando o servidor
      window.location.href = window.location.origin + '?v=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  };

  const compressImage = async (imgSource: HTMLImageElement | HTMLVideoElement): Promise<{ blob: Blob, dataUrl: string, canvas: HTMLCanvasElement }> => {
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

    if (imgSource instanceof HTMLVideoElement && imgSource.readyState < 2) {
      throw new Error("A câmera ainda está carregando a imagem. Tente novamente em 1 segundo.");
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
      dataUrl: canvas.toDataURL('image/jpeg', 0.5),
      canvas
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

      const { blob, dataUrl, canvas } = await compressImage(img);
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

      const res = await analyzePestImage(dataUrl.split(',')[1], canvas);
      
      // Se for offline, tenta buscar os dados completos na enciclopédia local
      if (!navigator.onLine && res.pestFound && res.pest) {
        const localPest = ENCYCLOPEDIA_DATA.find(p => p.name === res.pest?.name);
        if (localPest) {
          res.pest = localPest.details;
        }
      }

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
      setError("A análise está demorando mais que o esperado. Verifique sua conexão ou tente novamente.");
    }, 50000);

    try {
      const { blob, dataUrl, canvas } = await compressImage(videoRef.current);
      
      // Execução em paralelo: Análise da IA e Upload para o Storage
      // Isso reduz o tempo total de espera significativamente
      const aiPromise = analyzePestImage(dataUrl.split(',')[1], canvas);
      
      let uploadPromise = Promise.resolve(dataUrl);
      if (navigator.onLine && user && user.id !== 'offline') {
        uploadPromise = (async () => {
          try {
            const fileName = `${user.id}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from('pest-images')
              .upload(fileName, blob, { contentType: 'image/jpeg', cacheControl: '3600' });

            if (!uploadError) {
              const { data } = supabase.storage.from('pest-images').getPublicUrl(fileName);
              return data.publicUrl;
            }
          } catch (e) {
            console.warn("Upload falhou (usando local):", e);
          }
          return dataUrl;
        })();
      }

      // Aguardamos a IA e o Upload. 
      // O upload tem um "race" interno de 8s para não travar a IA se o storage estiver lento.
      const [res, publicUrl] = await Promise.all([
        aiPromise,
        Promise.race([
          uploadPromise,
          new Promise<string>(resolve => setTimeout(() => resolve(dataUrl), 8000))
        ])
      ]);

      clearTimeout(timeoutId);
      
      // Se for offline, tenta buscar os dados completos na enciclopédia local
      if (!navigator.onLine && res.pestFound && res.pest) {
        const localPest = ENCYCLOPEDIA_DATA.find(p => p.name === res.pest?.name);
        if (localPest) {
          res.pest = localPest.details;
        }
      }

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

  const filteredData = ENCYCLOPEDIA_DATA.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.details.scientificName.toLowerCase().includes(search)
    );
  });

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
           <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Membros</p><p className="text-sm font-bold text-slate-700">{pest.members || 'Não informado'}</p></div>
           <div className="bg-slate-50 p-3 rounded-2xl"><p className="text-[10px] font-black text-slate-400 uppercase">Reprodução</p><p className="text-sm font-bold text-slate-700 truncate">{pest.reproduction || 'Não informado'}</p></div>
         </div>
         <div className="space-y-2">
           <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Info size={14} /> Biologia e Hábitos</h4>
           <p className="text-sm text-slate-600 leading-relaxed">{pest.habits || 'Informação biológica não disponível no momento.'}</p>
         </div>
         <div className="bg-emerald-900 p-5 rounded-[2rem] text-white shadow-inner space-y-4">
           <div>
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><ShieldCheck size={14} /> Métodos de Controle</h4>
             <ul className="space-y-1">
               {(pest.controlMethods || []).map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>
           <div className="pt-3 border-t border-emerald-800">
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><Hammer size={12} /> Medidas Físicas</h4>
             <ul className="space-y-1">
               {(pest.physicalMeasures || []).map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
             </ul>
           </div>
           <div className="pt-3 border-t border-emerald-800">
             <h4 className="font-black text-[10px] uppercase mb-2 text-emerald-300 flex items-center gap-2"><FlaskConical size={12} /> Medidas Químicas</h4>
             <ul className="space-y-1">
               {(pest.chemicalMeasures || []).map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-emerald-400 font-bold">•</span> {m}</li>)}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <header className="bg-emerald-900 p-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8 rounded-b-[3.5rem] text-white sticky top-0 z-40 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-400/20 p-2 rounded-xl"><Bug className="text-emerald-400 w-6 h-6" /></div>
            <div>
              <h1 className="font-black text-lg text-white">PestScan Pro</h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-emerald-400/60 font-bold uppercase">
                  {!isOnline ? 'OFFLINE' : user?.name}
                </p>
                <div className={`w-2 h-2 rounded-full ${isLocalModelLoaded() ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} title={isLocalModelLoaded() ? 'IA Offline Ativa' : 'IA Offline Inativa'}></div>
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
          <div className="bg-red-50 border-2 border-red-200 text-red-700 p-6 rounded-[2.5rem] mb-6 flex flex-col gap-4 animate-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs leading-relaxed font-bold">
                  {error.startsWith("PERMISSÃO_NEGADA") ? "Acesso à Câmera Bloqueado" : error}
                </p>
                
                {error.startsWith("PERMISSÃO_NEGADA") && (
                  <div className="mt-3 p-3 bg-white/50 rounded-2xl border border-red-100 space-y-2">
                    <p className="text-[10px] font-black uppercase text-red-800">Como resolver:</p>
                    <ol className="text-[10px] space-y-1 list-decimal ml-4 font-bold text-red-600">
                      <li>Clique no ícone de <b>Cadeado</b> ou <b>Configurações</b> ao lado da URL (topo da tela).</li>
                      <li>Localize a opção <b>Câmera</b>.</li>
                      <li>Mude para <b>Permitir</b> ou <b>Ativar</b>.</li>
                      <li>Recarregue a página se necessário.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {view === 'camera' && (
                <>
                  {error?.includes("demorando") && (
                    <button 
                      onClick={() => { setError(null); handleCapture(); }} 
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                      <Camera size={16} /> Tentar Novamente Agora
                    </button>
                  )}
                  <button 
                    onClick={() => { setError(null); initCamera(); }} 
                    className={`w-full py-3 ${error?.includes("demorando") ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-600 text-white'} rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2`}
                  >
                    <RefreshCw size={14} /> Reativar Câmera
                  </button>
                </>
              )}
              <button 
                onClick={forceRefresh} 
                className="w-full py-3 bg-red-100 text-red-700 rounded-2xl font-black text-[10px] uppercase active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={14} /> Limpar Cache e Forçar Reset
              </button>
            </div>
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
            {currentResult.pestFound && currentResult.pest ? (
              <PestBioCard pest={currentResult.pest} />
            ) : (
              <div className="bg-white p-10 rounded-[2.5rem] text-center space-y-4">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <Bug size={32} />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm uppercase">Praga não identificada</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">A imagem pode estar desfocada ou a praga não está no nosso banco de dados global.</p>
                </div>
                <button 
                  onClick={() => setView('camera')} 
                  className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase border border-emerald-100 active:scale-95 transition-all"
                >
                  Tentar Novo Scan
                </button>
              </div>
            )}
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
  // Registro do Service Worker para PWA (AutoUpdate)
  registerSW({
    onOfflineReady() {
      console.log('App pronto para uso offline!');
    },
  });

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
// Forcing git refresh 5 - Master Sync v5.0 ULTRA-FINAL-SYNC - Fix model 404 error

