// src/types/index.ts

Export interface Product {
  Id: string;
  Title: string;
  Price: string;
  Image: string;
  Rating: number;
  url: string;
  description?: string;
  category?: string;
  aestheticMatch?: number; // Confidence score 0-1
}

Export interface AestheticAnalysis {
  Style: string;
  Colors: string[];
  Keywords: string[];
  Categories: string[];
  Mood: string;
  Confidence?: number; // AI confidence in analysis
}

Export interface ApiMetrics {
  Requests: number;
  Errors: number;
  avgResponseTime: number;
  rateLimitRemaining?: number;
  lastRequestTime?: Date;
}

Export interface QueueStatus {
  Pending: number;
  Processing: number;
  Completed: number;
  Failed?: number;
  totalProcessed?: number;
}

Export interface QueueTask {
  Id: string;
  Task: string;
  Status: ‘pending’ | ‘processing’ | ‘completed’ | ‘failed’;
  Priority: ‘low’ | ‘normal’ | ‘high’;
  createdAt: Date;
  completedAt?: Date;
  attempts: number;
  error?: string;
  metadata?: Record<string, any>;
}

Export interface NotificationPayload {
  Message: string;
  Type: ‘info’ | ‘success’ | ‘warning’ | ‘error’;
  Timestamp: number;
  Source: string;
  userId?: string;
  actionUrl?: string;
}

Export interface KongServiceConfig {
  Name: string;
  url: string;
  path?: string;
  retries?: number;
  connect_timeout?: number;
  read_timeout?: number;
  write_timeout?: number;
}

Export interface LavinMQConfig {
  url: string;
  username: string;
  password: string;
  vhost: string;
  exchanges: {
    name: string;
    type: ‘direct’ | ‘fanout’ | ‘topic’ | ‘headers’;
    durable: boolean;
  }[];
  Queues: {
    Name: string;
    Durable: boolean;
    Exclusive: boolean;
    Auto_delete: boolean;
  }[];
}

Export interface FoxitDocumentRequest {
  Template: string;
  Content: string;
  Format: ‘pdf’ | ‘docx’ | ‘html’;
  Options: {
    Page_size: ‘A4’ | ‘Letter’ | ‘A3’;
    Orientation: ‘portrait’ | ‘landscape’;
    Include_images: boolean;
    Brand_colors: string[];
    Style_theme: string;
    Watermark?: string;
  };
}

Export interface ApiGatewayResponse<T = any> {
  Data: T;
  Status: number;
  Headers: Record<string, string>;
  requestId: string;
  service: string;
  processingTime: number;
}

Export interface RateLimitInfo {
  Service: string;
  Remaining: number;
  Limit: number;
  resetTime: Date;
  windowSize: number;
}

Export interface HealthCheckResult {
  Service: string;
  Healthy: boolean;
  Latency: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

