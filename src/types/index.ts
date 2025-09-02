// src/types/index.ts

export interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  rating: number;
  url: string;
  description?: string;
  category?: string;
  aestheticMatch?: number; // Confidence score 0-1
}

export interface AestheticAnalysis {
  style: string;
  colors: string[];
  keywords: string[];
  categories: string[];
  mood: string;
  confidence?: number; // AI confidence in analysis
}

export interface ApiMetrics {
  requests: number;
  errors: number;
  avgResponseTime: number;
  rateLimitRemaining?: number;
  lastRequestTime?: Date;
}

export interface QueueStatus {
  pending: number;
  processing: number;
  completed: number;
  failed?: number;
  totalProcessed?: number;
}

export interface QueueTask {
  id: string;
  task: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  completedAt?: Date;
  attempts: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  source: string;
  userId?: string;
  actionUrl?: string;
}

export interface KongServiceConfig {
  name: string;
  url: string;
  path?: string;
  retries?: number;
  connect_timeout?: number;
  read_timeout?: number;
  write_timeout?: number;
}

export interface LavinMQConfig {
  url: string;
  username: string;
  password: string;
  vhost: string;
  exchanges: {
    name: string;
    type: 'direct' | 'fanout' | 'topic' | 'headers';
    durable: boolean;
  }[];
  queues: {
    name: string;
    durable: boolean;
    exclusive: boolean;
    auto_delete: boolean;
  }[];
}

export interface FoxitDocumentRequest {
  template: string;
  content: string;
  format: 'pdf' | 'docx' | 'html';
  options: {
    page_size: 'A4' | 'Letter' | 'A3';
    orientation: 'portrait' | 'landscape';
    include_images: boolean;
    brand_colors: string[];
    style_theme: string;
    watermark?: string;
  };
}

export interface ApiGatewayResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
  service: string;
  processingTime: number;
}

export interface RateLimitInfo {
  service: string;
  remaining: number;
  limit: number;
  resetTime: Date;
  windowSize: number;
}

export interface HealthCheckResult {
  service: string;
  healthy: boolean;
  latency: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
  styleGuide?: string;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}