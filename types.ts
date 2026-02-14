
export interface PestInfo {
  name: string;
  scientificName: string;
  category: string;
  riskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';
  characteristics: string[];
  anatomy: string;
  members: string; // Quantidade de pernas/membros
  habits: string;
  reproduction: string; // Quantidade de ovos/postura
  larvalPhase: string; // Informações sobre a fase larval/imatura
  controlMethods: string[];
  physicalMeasures: string[]; // Medidas físicas específicas
  chemicalMeasures: string[]; // Medidas químicas específicas
  healthRisks: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
  type?: 'map' | 'web';
}

export interface RecognitionResult {
  pestFound: boolean;
  confidence: number;
  pest?: PestInfo;
  message?: string;
  capturedImage?: string;
  sources?: GroundingSource[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  image: string;
  result: RecognitionResult;
}

export interface EncyclopediaItem {
  id: string;
  name: string;
  category: 'Rasteiros' | 'Voadores' | 'Aracnídeos' | 'Roedores';
  icon: string;
  details: PestInfo;
}
