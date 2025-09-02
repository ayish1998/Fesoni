// src/services/fesoniService.ts - Main integration example
import { orchestrationService } from './orchestrationService';
import { messageQueueService } from './messageQueue';
import { apiGateway } from './apiGateway';
import { AestheticAnalysis, Product } from '../types';

export class FesoniService {
  private isReady = false;

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Fesoni AI Shopping Assistant...');
      
      // Initialize all services
      await orchestrationService.initialize();
      
      // Start health monitoring
      await orchestrationService.monitorSystemHealth();
      
      // Set up notification permissions
      await this.requestNotificationPermissions();
      
      this.isReady = true;
      console.log('✅ Fesoni is ready!');
      
    } catch (error) {
      console.error('❌ Fesoni initialization failed:', error);
      throw new Error('Failed to initialize Fesoni services');
    }
  }

  private async requestNotificationPermissions(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await messageQueueService.sendNotification('Notifications enabled!', 'success');
      }
    }
  }

  // Main user-facing method
  async findMyVibe(userInput: string, userId?: string): Promise<{
    analysis: AestheticAnalysis;
    products: Product[];
    styleGuideUrl: string;
    taskId: string;
  }> {
    if (!this.isReady) {
      await this.initialize();
    }

    try {
      // Check system health before processing
      const systemStatus = await orchestrationService.getSystemStatus();
      
      if (!systemStatus.kong && !systemStatus.lavinmq) {
        console.warn('Critical services unavailable, using fallback mode');
        return await this.fallbackProcessing(userInput, userId);
      }

      // Process the request using full enterprise architecture
      return await orchestrationService.processEnhancedShoppingRequest(userInput, userId);
      
    } catch (error) {
      console.error('Main processing error:', error);
      await messageQueueService.sendNotification(
        'Switching to simplified mode due to technical issues',
        'warning'
      );
      
      return await this.fallbackProcessing(userInput, userId);
    }
  }

  private async fallbackProcessing(userInput: string, userId?: string): Promise<{
    analysis: AestheticAnalysis;
    products: Product[];
    styleGuideUrl: string;
    taskId: string;
  }> {
    // Simplified processing without Kong/LavinMQ
    return await orchestrationService.processShoppingRequest(userInput, userId);
  }

  // Real-time status updates for UI
  subscribeToUpdates(callback: (update: any) => void): () => void {
    return messageQueueService.onStatusChange((status) => {
      callback({
        type: 'queue_status',
        data: status,
        timestamp: Date.now()
      });
    });
  }

  // Get current system metrics for dashboard
  async getSystemMetrics(): Promise<any> {
    return await orchestrationService.getSystemStatus();
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Fesoni services...');
    
    messageQueueService.disconnect();
    
    await messageQueueService.sendNotification(
      'Fesoni session ended. Thanks for shopping with us!',
      'info'
    );
    
    this.isReady = false;
    console.log('✅ Fesoni shutdown complete');
  }
}

export const fesoniService = new FesoniService();

// Usage Example in your main application:
/*
// Initialize Fesoni
await fesoniService.initialize();

// Subscribe to real-time updates
const unsubscribe = fesoniService.subscribeToUpdates((update) => {
  console.log('Fesoni Update:', update);
  // Update your UI based on queue status, notifications, etc.
});

// Process user request
const result = await fesoniService.findMyVibe(
  "I love dark academia aesthetic with some cottagecore elements",
  "user-123"
);

console.log('Results:', {
  style: result.analysis.style,
  productCount: result.products.length,
  styleGuide: result.styleGuideUrl
});

// Clean up when done
unsubscribe();
await fesoniService.shutdown();
*/
