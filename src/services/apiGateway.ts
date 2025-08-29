import axios, { AxiosRequestConfig } from 'axios';
import { ApiMetrics } from '../types';

export class ApiGatewayService {
  private kongUrl: string;
  private apiKey: string;
  private metrics: ApiMetrics = {
    requests: 0,
    errors: 0,
    avgResponseTime: 0
  };

  constructor() {
    this.kongUrl = import.meta.env.VITE_KONG_GATEWAY_URL;
    this.apiKey = import.meta.env.VITE_KONG_API_KEY;
  }

  async routeRequest(endpoint: string, config: AxiosRequestConfig = {}): Promise<any> {
    const startTime = Date.now();
    
    try {
      this.metrics.requests++;
      
      const response = await axios({
        ...config,
        url: `${this.kongUrl}${endpoint}`,
        headers: {
          ...config.headers,
          'Kong-API-Key': this.apiKey,
          'X-Request-ID': `req-${Date.now()}`
        }
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      console.error('Kong API Gateway error:', error);
      throw error;
    }
  }

  private updateMetrics(responseTime: number, isError: boolean): void {
    if (isError) {
      this.metrics.errors++;
    }
    
    // Calculate rolling average response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime * (this.metrics.requests - 1) + responseTime) / 
      this.metrics.requests;
  }

  getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  async checkRateLimit(): Promise<{ remaining: number; resetTime: Date }> {
    try {
      // Simulate Kong rate limit check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        remaining: Math.floor(Math.random() * 100) + 50,
        resetTime: new Date(Date.now() + 3600000) // 1 hour from now
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { remaining: 0, resetTime: new Date() };
    }
  }
}

export const apiGateway = new ApiGatewayService();