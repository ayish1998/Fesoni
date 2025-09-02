// src/services/orchestrationService.ts
import { amazonService } from './amazon';
import { openaiService } from './openai';
import { documentService } from './documentGeneration';
import { apiGateway } from './apiGateway';
import { messageQueueService } from './messageQueue';
import { AestheticAnalysis, Product } from '../types';

export class OrchestrationService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await messageQueueService.sendNotification('Initializing Fesoni services...', 'info');

      // Check Kong Gateway health
      const kongHealthy = await apiGateway.checkGatewayHealth();
      if (!kongHealthy) {
        console.warn('Kong Gateway not available, using direct API calls');
      }

      // Check LavinMQ health
      const queueHealthy = await messageQueueService.checkQueueHealth();
      if (!queueHealthy) {
        console.warn('LavinMQ not available, using local queue simulation');
      }

      // Setup Kong routes if gateway is healthy
      if (kongHealthy) {
        await apiGateway.setupKongRoutes();
      }

      // Subscribe to important queue events
      await this.subscribeToQueueEvents();

      this.isInitialized = true;
      await messageQueueService.sendNotification('Fesoni is ready to find your perfect style!', 'success');

    } catch (error) {
      console.error('Orchestration initialization error:', error);
      await messageQueueService.sendNotification('Some services are unavailable, using fallback mode', 'warning');
    }
  }

  private async subscribeToQueueEvents(): Promise<void> {
    // Subscribe to task completion notifications
    await messageQueueService.subscribeToQueue('fesoni.notifications', (message) => {
      console.log('Queue notification received:', message);
    });

    // Subscribe to product availability updates
    await messageQueueService.subscribeToQueue('fesoni.product_updates', (message) => {
      this.handleProductUpdate(message);
    });
  }

  private handleProductUpdate(message: any): void {
    if (message.type === 'price_drop' || message.type === 'back_in_stock') {
      messageQueueService.sendNotification(
        `Great news! ${message.productTitle} ${message.type === 'price_drop' ? 'price dropped' : 'is back in stock'}`,
        'success'
      );
    }
  }

  // Main workflow: Complete aesthetic-based shopping experience
  async processShoppingRequest(userInput: string, userId?: string): Promise<{
    analysis: AestheticAnalysis;
    products: Product[];
    styleGuideUrl: string;
    taskId: string;
  }> {
    try {
      // Step 1: Analyze user's aesthetic preferences
      await messageQueueService.sendNotification('Analyzing your aesthetic preferences...', 'info');
      const analysis = await openaiService.analyzeAesthetic(userInput);

      // Step 2: Search for products asynchronously
      await messageQueueService.sendNotification('Searching for products that match your vibe...', 'info');
      const searchTaskId = await amazonService.searchProductsAsync(analysis.keywords, analysis.categories);

      // Step 3: Get immediate product results for quick preview
      const products = await amazonService.searchProducts(analysis.keywords, analysis.categories);

      // Step 4: Generate style guide asynchronously
      await messageQueueService.sendNotification('Creating your personalized style guide...', 'info');
      const styleGuideTaskId = await documentService.generateStyleGuideAsync(analysis, products, userId);

      // Step 5: Generate immediate style guide for preview
      const styleGuideUrl = await documentService.generateStyleGuide(analysis, products, userId);

      return {
        analysis,
        products,
        styleGuideUrl,
        taskId: `orchestration-${Date.now()}`
      };

    } catch (error) {
      console.error('Shopping request processing error:', error);
      await messageQueueService.sendNotification('Request processing encountered an issue', 'error');
      throw error;
    }
  }

  // Enhanced workflow with parallel processing
  async processEnhancedShoppingRequest(userInput: string, userId?: string): Promise<{
    analysis: AestheticAnalysis;
    products: Product[];
    enhancedProducts: Product[];
    styleGuideUrl: string;
    htmlPreview: string;
  }> {
    const mainTaskId = await messageQueueService.addTask('enhanced-shopping-request', 'high');

    try {
      // Step 1: Analyze aesthetic (high priority)
      const analysis = await openaiService.analyzeAesthetic(userInput);

      // Step 2: Enhanced search with cultural context
      const culturalContext = {
        aestheticKeywords: analysis.keywords,
        stylePreferences: [analysis.style],
        moodDescriptors: analysis.mood.split(' '),
        categories: analysis.categories
      };

      const [
        basicProducts,
        enhancedSearchTaskId,
        styleGuideTaskId
      ] = await Promise.all([
        // Cultural context search
        amazonService.searchWithCulturalContext(culturalContext),
        
        // Enhanced async search with expanded keywords
        amazonService.searchProductsAsync([
          ...analysis.keywords,
          ...this.generateExpandedKeywords(analysis)
        ], [
          ...analysis.categories,
          ...this.generateRelatedCategories(analysis)
        ]),
        
        // Style guide generation
        documentService.generateStyleGuideAsync(analysis, [], userId)
      ]);

      // Step 3: Enhance products with AI descriptions
      const enhancedProducts = await this.enhanceProductsWithDescriptions(basicProducts, analysis);

      // Step 4: Generate final documents with enhanced products
      const [styleGuideUrl, htmlPreview] = await Promise.all([
        documentService.generateStyleGuide(analysis, enhancedProducts, userId),
        documentService.generateHtmlPreview(analysis, enhancedProducts)
      ]);

      await messageQueueService.sendNotification(
        `Complete ${analysis.style} shopping experience ready!`,
        'success'
      );

      return {
        analysis,
        products: basicProducts,
        enhancedProducts,
        styleGuideUrl,
        htmlPreview
      };

    } catch (error) {
      console.error('Enhanced shopping request error:', error);
      await messageQueueService.sendNotification('Enhanced processing failed, using basic results', 'warning');
      throw error;
    }
  }

  private generateExpandedKeywords(analysis: AestheticAnalysis): string[] {
    // Generate related keywords based on the aesthetic
    const expansions: Record<string, string[]> = {
      'dark academia': ['tweed', 'leather bound', 'antique', 'mahogany', 'scholarly'],
      'cottagecore': ['wicker', 'linen', 'ceramic', 'dried flowers', 'handwoven'],
      'minimalist': ['geometric', 'monochrome', 'sleek', 'uncluttered', 'modern'],
      'boho': ['macrame', 'fringe', 'earthy', 'textured', 'eclectic'],
      'scandinavian': ['hygge', 'light wood', 'cozy', 'functional', 'nordic']
    };

    const styleKey = analysis.style.toLowerCase();
    return expansions[styleKey] || ['stylish', 'quality', 'aesthetic'];
  }

  private generateRelatedCategories(analysis: AestheticAnalysis): string[] {
    const categoryMap: Record<string, string[]> = {
      'home-kitchen': ['furniture', 'lighting', 'storage'],
      'clothing': ['accessories', 'shoes', 'jewelry'],
      'books': ['stationery', 'office-products', 'art-supplies'],
      'garden': ['outdoor-living', 'patio-furniture', 'planters']
    };

    const relatedCategories: string[] = [];
    analysis.categories.forEach(category => {
      const related = categoryMap[category];
      if (related) {
        relatedCategories.push(...related);
      }
    });

    return [...new Set(relatedCategories)]; // Remove duplicates
  }

  private async enhanceProductsWithDescriptions(products: Product[], analysis: AestheticAnalysis): Promise<Product[]> {
    try {
      const descriptions = await openaiService.batchGenerateDescriptions(products, analysis);
      
      return products.map((product, index) => ({
        ...product,
        description: descriptions[index] || product.description,
        aestheticMatch: this.calculateAestheticMatch(product, analysis)
      }));
    } catch (error) {
      console.error('Product enhancement error:', error);
      return products;
    }
  }

  private calculateAestheticMatch(product: Product, analysis: AestheticAnalysis): number {
    // Simple matching algorithm based on title keywords
    const titleWords = product.title.toLowerCase().split(' ');
    const aestheticWords = [...analysis.keywords, ...analysis.colors].map(w => w.toLowerCase());
    
    const matches = titleWords.filter(word => 
      aestheticWords.some(aestheticWord => 
        word.includes(aestheticWord) || aestheticWord.includes(word)
      )
    );

    return Math.min(matches.length / aestheticWords.length, 1);
  }

  // Get comprehensive system status
  async getSystemStatus(): Promise<{
    kong: boolean;
    lavinmq: boolean;
    openai: boolean;
    metrics: any;
    queueStatus: any;
  }> {
    const [
      kongHealth,
      queueHealth,
      openaiHealth
    ] = await Promise.all([
      apiGateway.checkGatewayHealth(),
      messageQueueService.checkQueueHealth(),
      openaiService.checkServiceHealth()
    ]);

    return {
      kong: kongHealth,
      lavinmq: queueHealth,
      openai: openaiHealth,
      metrics: apiGateway.getMetrics(),
      queueStatus: messageQueueService.getStatus()
    };
  }

  // Monitor and handle system health
  async monitorSystemHealth(): Promise<void> {
    setInterval(async () => {
      const status = await this.getSystemStatus();
      
      if (!status.kong || !status.lavinmq) {
        await messageQueueService.sendNotification(
          'Some services are experiencing issues. Switching to fallback mode.',
          'warning'
        );
      }
      
      // Log metrics for monitoring
      console.log('System Health Check:', {
        timestamp: new Date().toISOString(),
        ...status
      });
    }, 60000); // Check every minute
  }
}

export const orchestrationService = new OrchestrationService();
