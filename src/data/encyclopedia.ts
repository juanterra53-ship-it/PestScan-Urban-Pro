import { EncyclopediaItem } from '../types';

export const ENCYCLOPEDIA_DATA: EncyclopediaItem[] = [
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
      characteristics: ['Pousa em ângulo de 45 graus', 'Asas with manchas escuras'],
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
  { 
    id: '29', name: 'Pulga', category: 'Ectoparasitas', icon: '🦟',
    details: {
      name: 'Pulga', scientificName: 'Ctenocephalides spp.', category: 'Ectoparasitas', riskLevel: 'Alto',
      characteristics: ['Pequena (1-3mm)', 'Cor marrom-escura', 'Corpo achatado lateralmente'],
      anatomy: 'Pernas traseiras muito fortes para saltar. Sem asas.',
      members: '6 pernas.',
      habits: 'Parasita externo de mamíferos e aves. Vive em frestas de pisos, carpetes e camas de animais.',
      reproduction: 'A fêmea põe ovos no hospedeiro que caem no ambiente.',
      larvalPhase: 'Larvas vivem no ambiente alimentando-se de detritos orgânicos.',
      controlMethods: ['Tratamento de animais domésticos', 'Aspiração frequente', 'Lavagem de tecidos'],
      physicalMeasures: ['Lavar camas de pets com água quente', 'Aspirar carpetes e frestas de tacos', 'Manter gramados curtos'],
      chemicalMeasures: [
        'Fipronil: 20ml/10L água (Tratamento perimetral e de frestas)',
        'Piriproxifeno: 5ml/10L água (Inibidor de crescimento larval)',
        'Deltametrina: 40ml/10L água (Pulverização residual em áreas infestadas)'
      ],
      healthRisks: 'Causa dermatites alérgicas, transmite vermes (Dipylidium) e doenças como o Tifo Murino.'
    }
  }
];
