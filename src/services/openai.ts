// src/services/openai.ts
import { AestheticAnalysis } from '../types';
import { apiGateway } from './apiGateway';
import { messageQueueService } from './messageQueue';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export class OpenAIService {
  private apiKey: string;

  constructor() {
    this.apiKey = OPENAI_API_KEY;
  }

  async analyzeAesthetic(userInput: string): Promise<AestheticAnalysis> {
    try {
      // Route OpenAI requests through Kong API Gateway
      const response = await apiGateway.routeRequest('/openai/chat', {
        method: 'POST',
        data: {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an expert aesthetic analyst for Fesoni, an AI shopping assistant. Parse user descriptions of style preferences and extract specific elements. Return a JSON object with:
              - style: main aesthetic category (e.g., "Dark Academia", "Cottagecore", "Minimalist")
              - colors: array of 3-5 color preferences (e.g., ["forest green", "cream", "brass"])
              - keywords: 5-8 specific style descriptors for product search
              - categories: 3-5 Amazon product categories to search (e.g., ["home decor", "books", "clothing"])
              - mood: overall emotional tone in 2-3 words
              - confidence: number between 0-1 indicating analysis confidence
              
              Always return valid JSON with all fields populated.`
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Service': 'openai-aesthetic-analysis'
        }
      });

      const content = response.choices[0].message.content;
      const analysis = JSON.parse(content);

      // Send success notification through LavinMQ
      await messageQueueService.sendNotification(
        `Aesthetic analysis complete: ${analysis.style} style identified`,
        'success'
      );

      return analysis;
    } catch (error) {
      console.error('OpenAI API error:', error);

      // Send error notification
      await messageQueueService.sendNotification(
        'Aesthetic analysis failed, using fallback analysis',
        'warning'
      );

      // Return fallback analysis
      return this.getFallbackAnalysis(userInput);
    }
  }

  async analyzeAestheticAsync(userInput: string): Promise<string> {
    // Queue the analysis task
    const taskId = await messageQueueService.addTask(
      `openai-analysis:${userInput.substring(0, 50)}...`,
      'high'
    );

    // Process asynchronously
    this.processAsyncAnalysis(taskId, userInput);

    return taskId;
  }

  private async processAsyncAnalysis(taskId: string, userInput: string): Promise<void> {
    try {
      const analysis = await this.analyzeAesthetic(userInput);

      // Store analysis result (in real app, save to DB with taskId)
      console.log(`Async analysis ${taskId} completed:`, analysis);

      await messageQueueService.sendNotification(
        `Your ${analysis.style} aesthetic profile is ready!`,
        'success'
      );
    } catch (error) {
      console.error('Async analysis error:', error);
      await messageQueueService.sendNotification(
        'Aesthetic analysis encountered an issue',
        'error'
      );
    }
  }

  async generateProductDescription(product: any, aesthetic: AestheticAnalysis): Promise<string> {
    try {
      // Route through Kong with specific service identification
      const response = await apiGateway.routeRequest('/openai/chat', {
        method: 'POST',
        data: {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a Fesoni product stylist. Create a personalized product description (max 150 words) that explains how this product fits the user's ${aesthetic.style} aesthetic. Be specific about style elements, colors, and mood. Make it engaging and personal.`
            },
            {
              role: 'user',
              content: `Product: ${product.title}
              Price: ${product.price}
              User's Aesthetic: ${aesthetic.style}
              Mood: ${aesthetic.mood}
              Preferred Colors: ${aesthetic.colors.join(', ')}
              Style Keywords: ${aesthetic.keywords.join(', ')}`
            }
          ],
          temperature: 0.8,
          max_tokens: 200
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Service': 'openai-product-description'
        }
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI description generation error:', error);
      return `This ${product.title} perfectly complements your ${aesthetic.style} aesthetic with its ${aesthetic.colors[0]} tones and ${aesthetic.mood} vibe.`;
    }
  }

  async batchGenerateDescriptions(products: any[], aesthetic: AestheticAnalysis): Promise<string[]> {
    // Queue multiple description generation tasks
    const taskPromises = products.map(async (product, index) => {
      const taskId = await messageQueueService.addTask(
        `description-gen:${product.title}`,
        'normal'
      );

      // Add small delay to prevent overwhelming OpenAI API
      await new Promise(resolve => setTimeout(resolve, index * 200));

      return this.generateProductDescription(product, aesthetic);
    });

    try {
      const descriptions = await Promise.all(taskPromises);

      await messageQueueService.sendNotification(
        `Generated personalized descriptions for ${products.length} products`,
        'success'
      );

      return descriptions;
    } catch (error) {
      console.error('Batch description generation error:', error);
      await messageQueueService.sendNotification(
        'Some product descriptions failed to generate',
        'warning'
      );

      // Return fallback descriptions
      return products.map(product =>
        `This ${product.title} matches your ${aesthetic.style} aesthetic.`
      );
    }
  }

  private getFallbackAnalysis(userInput: string): AestheticAnalysis {
    // Basic keyword-based fallback analysis
    const input = userInput.toLowerCase();

    let style = 'Modern Minimalist';
    let colors = ['white', 'black', 'gray'];
    let keywords = ['clean', 'simple', 'elegant'];
    let categories = ['home-kitchen', 'clothing', 'books'];
    let mood = 'clean minimalist';

    // Simple pattern matching for common aesthetics
    if (input.includes('dark academia')) {
      style = 'Dark Academia';
      colors = ['forest green', 'burgundy', 'cream', 'gold'];
      keywords = ['vintage', 'scholarly', 'antique', 'leather', 'books', 'brass'];
      categories = ['books', 'home-decor', 'clothing', 'office-products'];
      mood = 'scholarly sophisticated';
    } else if (input.includes('cottagecore')) {
      style = 'Cottagecore';
      colors = ['sage green', 'cream', 'terracotta', 'lavender'];
      keywords = ['rustic', 'cozy', 'handmade', 'natural', 'vintage', 'floral'];
      categories = ['home-kitchen', 'garden', 'clothing', 'handmade'];
      mood = 'cozy rustic';
    } else if (input.includes('aesthetic') || input.includes('vibe')) {
      style = 'Aesthetic Modern';
      colors = ['pastel pink', 'white', 'gold', 'sage'];
      keywords = ['trendy', 'instagram-worthy', 'cute', 'aesthetic', 'modern'];
      categories = ['electronics', 'home-decor', 'beauty', 'clothing'];
      mood = 'trendy cute';
    } else if (input.includes('minimalist') || input.includes('scandinavian')) {
      style = 'Scandinavian Minimalist';
      colors = ['white', 'light gray', 'natural wood', 'black'];
      keywords = ['clean', 'functional', 'hygge', 'simple', 'light', 'airy'];
      categories = ['furniture', 'home-kitchen', 'lighting', 'textiles'];
      mood = 'serene functional';
    } else if (input.includes('boho') || input.includes('bohemian')) {
      style = 'Bohemian Chic';
      colors = ['terracotta', 'mustard', 'sage', 'cream', 'rust'];
      keywords = ['eclectic', 'textured', 'macrame', 'vintage', 'layered', 'global'];
      categories = ['home-decor', 'textiles', 'jewelry', 'art'];
      mood = 'free-spirited eclectic';
    }

    return {
      style,
      colors,
      keywords,
      categories,
      mood,
      confidence: 0.6 // Lower confidence for fallback
    };
  }

  // Health check for OpenAI service through Kong
  async checkServiceHealth(): Promise<boolean> {
    try {
      await apiGateway.routeRequest('/openai/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Service': 'openai-health-check'
        }
      });

      return true;
    } catch (error) {
      console.error('OpenAI service health check failed:', error);
      return false;
    }
  }

  // Stream responses for real-time chat experience
  async streamAestheticAnalysis(
    userInput: string,
    onUpdate: (partial: Partial<AestheticAnalysis>) => void
  ): Promise<AestheticAnalysis> {
    try {
      // Simulate streaming response (in real implementation, use OpenAI's streaming API)
      onUpdate({ style: 'Analyzing...' });
      await new Promise(resolve => setTimeout(resolve, 500));

      onUpdate({ style: 'Processing aesthetic preferences...' });
      await new Promise(resolve => setTimeout(resolve, 500));

      const analysis = await this.analyzeAesthetic(userInput);
      onUpdate(analysis);

      return analysis;
    } catch (error) {
      console.error('Streaming analysis error:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();
