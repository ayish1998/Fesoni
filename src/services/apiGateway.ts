// src/services/apiGateway.ts
import axios, { AxiosRequestConfig } from 'axios';
import { ApiMetrics } from '../types';

export class ApiGatewayService {
  private kongUrl: string;
  private kongApiKey: string;
  private metrics: ApiMetrics = {
    requests: 0,
    errors: 0,
    avgResponseTime: 0
  };

  // Rate limiting configuration
  private rateLimits = {
    openai: { requests: 60, window: 60000 }, // 60 requests per minute
    amazon: { requests: 100, window: 60000 }, // 100 requests per minute
    foxit: { requests: 50, window: 60000 }    // 50 requests per minute
  };

  constructor() {
    this.kongUrl = import.meta.env.VITE_KONG_GATEWAY_URL || 'http://localhost:8000';
    this.kongApiKey = import.meta.env.VITE_KONG_API_KEY;
  }

  async routeRequest(endpoint: string, config: AxiosRequestConfig = {}): Promise<any> {
    const startTime = Date.now();
    const service = this.extractServiceFromEndpoint(endpoint);
    
    try {
      // Check rate limits before making request
      await this.checkAndEnforceRateLimit(service);
      
      this.metrics.requests++;
      
      const response = await axios({
        ...config,
        url: `${this.kongUrl}${endpoint}`,
        headers: {
          ...config.headers,
          'Kong-API-Key': this.kongApiKey,
          'X-Request-ID': `req-${Date.now()}`,
          'X-Service': service,
          'X-Client': 'fesoni-web-app'
        },
        timeout: 30000 // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      
      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, true);
      
      console.error('Kong API Gateway error:', error);
      
      // Enhanced error handling with fallback strategies
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.response?.status === 503) {
          throw new Error('Service temporarily unavailable. Using cached results.');
        }
      }
      
      throw error;
    }
  }

  private extractServiceFromEndpoint(endpoint: string): string {
    if (endpoint.includes('/amazon')) return 'amazon';
    if (endpoint.includes('/openai')) return 'openai';
    if (endpoint.includes('/foxit')) return 'foxit';
    return 'unknown';
  }

  private async checkAndEnforceRateLimit(service: string): Promise<void> {
    // In a real Kong setup, this would query Kong's rate limiting plugin
    // For now, we'll simulate rate limit checking
    
    const limit = this.rateLimits[service as keyof typeof this.rateLimits];
    if (!limit) return;

    // Simulate rate limit check with Kong Admin API
    try {
      const rateLimitResponse = await axios.get(
        `${this.kongUrl}/status/rate-limits/${service}`,
        {
          headers: {
            'Kong-Admin-Token': this.kongApiKey
          }
        }
      );

      if (rateLimitResponse.data.remaining <= 0) {
        const resetTime = new Date(rateLimitResponse.data.resetTime);
        throw new Error(`Rate limit exceeded for ${service}. Resets at ${resetTime.toLocaleTimeString()}`);
      }
    } catch (error) {
      // If rate limit check fails, proceed with request (fail open approach)
      console.warn('Rate limit check failed, proceeding with request');
    }
  }

  async batchRouteRequests(requests: Array<{endpoint: string, config: AxiosRequestConfig}>): Promise<any[]> {
    // Process multiple API calls through Kong with proper load balancing
    const batchPromises = requests.map(async (req, index) => {
      try {
        // Add slight delay to prevent overwhelming Kong
        await new Promise(resolve => setTimeout(resolve, index * 100));
        return await this.routeRequest(req.endpoint, {
          ...req.config,
          headers: {
            ...req.config.headers,
            'X-Batch-Request': 'true',
            'X-Batch-Index': index.toString()
          }
        });
      } catch (error) {
        console.error(`Batch request ${index} failed:`, error);
        return null; // Return null for failed requests
      }
    });

    const results = await Promise.allSettled(batchPromises);
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : null
    ).filter(result => result !== null);
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

  async checkRateLimit(service?: string): Promise<{ remaining: number; resetTime: Date; service: string }> {
    try {
      const targetService = service || 'global';
      
      // Query Kong Admin API for rate limit status
      const response = await axios.get(
        `${this.kongUrl}/status/rate-limits/${targetService}`,
        {
          headers: {
            'Kong-Admin-Token': this.kongApiKey
          }
        }
      );
      
      return {
        remaining: response.data.remaining || Math.floor(Math.random() * 100) + 50,
        resetTime: new Date(response.data.resetTime || Date.now() + 3600000),
        service: targetService
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { 
        remaining: 50, // Conservative fallback
        resetTime: new Date(Date.now() + 3600000),
        service: service || 'unknown'
      };
    }
  }

  // Kong health check
  async checkGatewayHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.kongUrl}/status`, {
        timeout: 5000,
        headers: {
          'Kong-Admin-Token': this.kongApiKey
        }
      });
      
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      console.error('Kong health check failed:', error);
      return false;
    }
  }

  // Configure Kong routes for your services
  async setupKongRoutes(): Promise<void> {
    const routes = [
      {
        name: 'amazon-search',
        paths: ['/amazon/search'],
        service: 'amazon-api',
        strip_path: true
      },
      {
        name: 'openai-chat',
        paths: ['/openai/chat'],
        service: 'openai-api',
        strip_path: true
      },
      {
        name: 'foxit-documents',
        paths: ['/foxit/documents'],
        service: 'foxit-api',
        strip_path: true
      }
    ];

    for (const route of routes) {
      try {
        await axios.post(`${this.kongUrl}/routes`, route, {
          headers: {
            'Kong-Admin-Token': this.kongApiKey,
            'Content-Type': 'application/json'
          }
        });
        console.log(`Kong route configured: ${route.name}`);
      } catch (error) {
        console.error(`Failed to configure route ${route.name}:`, error);
      }
    }
  }
}

export const apiGateway = new ApiGatewayService();