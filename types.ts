export interface PestInfo {
  name: string;
  scientificName: string;
  category: string;
  riskLevel: string;
  characteristics: string[];
  anatomy: string;
  members: string;
  habits: string;
  reproduction: string;
  larvalPhase: string;
  controlMethods: string[];
  physicalMeasures: string[];
  chemicalMeasures: string[];
  healthRisks: string;
}

export interface RecognitionResult {
  pestFound: boolean;
  confidence: number;
  pest?: PestInfo;
  capturedImage?: string;
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
  category: string;
  icon: string;
  details: PestInfo;
}
