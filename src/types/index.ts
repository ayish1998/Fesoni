export interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  rating: number;
  url: string;
  description?: string;
}

export interface AestheticAnalysis {
  style: string;
  colors: string[];
  keywords: string[];
  categories: string[];
  mood: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
  styleGuide?: string;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
}

export interface ApiMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}