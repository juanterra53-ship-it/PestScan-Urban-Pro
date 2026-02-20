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
