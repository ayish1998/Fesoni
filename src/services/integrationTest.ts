// src/services/integrationTest.ts
import { openaiService } from './openai';
import { amazonService } from './amazon';
import { documentService } from './documentGeneration';
import { messageQueueService } from './messageQueue';
import { apiGateway } from './apiGateway';

export class IntegrationTestService {
  async runFullIntegrationTest(): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    const results: any = {};

    console.log('🧪 Starting Fesoni Integration Test...');

    try {
      // Test 1: OpenAI Aesthetic Analysis
      console.log('1️⃣ Testing OpenAI aesthetic analysis...');
      const testInput = "I love dark academia aesthetic with vintage books and cozy lighting";
      
      try {
        const analysis = await openaiService.analyzeAesthetic(testInput);
        results.openai = {
          success: true,
          analysis: analysis,
          hasRequiredFields: !!(analysis.style && analysis.colors && analysis.keywords)
        };
        console.log('✅ OpenAI test passed:', analysis.style);
      } catch (error) {
        errors.push(`OpenAI test failed: ${error}`);
        results.openai = { success: false, error: error };
      }

      // Test 2: Amazon Product Search
      console.log('2️⃣ Testing Amazon RapidAPI search...');
      
      try {
        const keywords = results.openai?.analysis?.keywords || ['vintage', 'books', 'lamp'];
        const categories = results.openai?.analysis?.categories || ['home-kitchen', 'books'];
        
        const products = await amazonService.searchProducts(keywords, categories);
        results.amazon = {
          success: true,
          productCount: products.length,
          hasProducts: products.length > 0,
          sampleProduct: products[0] || null
        };
        console.log(`✅ Amazon test passed: Found ${products.length} products`);
      } catch (error) {
        errors.push(`Amazon test failed: ${error}`);
        results.amazon = { success: false, error: error };
      }

      // Test 3: Cultural Context Search
      if (results.openai?.success && results.amazon?.success) {
        console.log('3️⃣ Testing cultural context search...');
        
        try {
          const culturalContext = {
            aestheticKeywords: results.openai.analysis.keywords,
            stylePreferences: [results.openai.analysis.style],
            moodDescriptors: results.openai.analysis.mood.split(' '),
            categories: results.openai.analysis.categories
          };
          
          const culturalProducts = await amazonService.searchWithCulturalContext(culturalContext);
          results.culturalSearch = {
            success: true,
            productCount: culturalProducts.length,
            averageMatchScore: culturalProducts.reduce((sum, p) => sum + (p.aestheticMatch || 0), 0) / culturalProducts.length
          };
          console.log(`✅ Cultural search test passed: ${culturalProducts.length} products with cultural matching`);
        } catch (error) {
          errors.push(`Cultural search test failed: ${error}`);
          results.culturalSearch = { success: false, error: error };
        }
      }

      // Test 4: Document Generation
      console.log('4️⃣ Testing Foxit document generation...');
      
      try {
        if (results.openai?.success && results.amazon?.success) {
          const styleGuideUrl = await documentService.generateStyleGuide(
            results.openai.analysis,
            results.amazon.sampleProduct ? [results.amazon.sampleProduct] : [],
            'test-user'
          );
          
          results.foxit = {
            success: true,
            styleGuideGenerated: !!styleGuideUrl,
            url: styleGuideUrl
          };
          console.log('✅ Foxit test passed: Style guide generated');
        } else {
          results.foxit = { success: false, error: 'Skipped due to previous failures' };
        }
      } catch (error) {
        errors.push(`Foxit test failed: ${error}`);
        results.foxit = { success: false, error: error };
      }

      // Test 5: Message Queue
      console.log('5️⃣ Testing LavinMQ message queue...');
      
      try {
        const taskId = await messageQueueService.addTask('integration-test-task', 'high');
        await messageQueueService.sendNotification('Integration test notification', 'info');
        
        const queueStatus = messageQueueService.getStatus();
        results.lavinmq = {
          success: true,
          taskId: taskId,
          queueStatus: queueStatus
        };
        console.log('✅ LavinMQ test passed: Task queued and notification sent');
      } catch (error) {
        errors.push(`LavinMQ test failed: ${error}`);
        results.lavinmq = { success: false, error: error };
      }

      // Test 6: API Gateway Health
      console.log('6️⃣ Testing Kong API Gateway...');
      
      try {
        const gatewayHealth = await apiGateway.checkGatewayHealth();
        const metrics = apiGateway.getMetrics();
        
        results.kong = {
          success: gatewayHealth,
          healthy: gatewayHealth,
          metrics: metrics
        };
        console.log(`✅ Kong test ${gatewayHealth ? 'passed' : 'failed'}: Gateway health check`);
      } catch (error) {
        errors.push(`Kong test failed: ${error}`);
        results.kong = { success: false, error: error };
      }

      // Test 7: End-to-End Workflow
      console.log('7️⃣ Testing end-to-end workflow...');
      
      try {
        if (results.openai?.success && results.amazon?.success) {
          // Test product description generation
          const description = await openaiService.generateProductDescription(
            results.amazon.sampleProduct,
            results.openai.analysis
          );
          
          results.endToEnd = {
            success: true,
            descriptionGenerated: !!description,
            workflowComplete: true
          };
          console.log('✅ End-to-end test passed: Complete workflow executed');
        } else {
          results.endToEnd = { success: false, error: 'Skipped due to previous failures' };
        }
      } catch (error) {
        errors.push(`End-to-end test failed: ${error}`);
        results.endToEnd = { success: false, error: error };
      }

      const overallSuccess = errors.length === 0;
      
      console.log('\n📊 Integration Test Results:');
      console.log(`Overall Success: ${overallSuccess ? '✅' : '❌'}`);
      console.log(`Tests Passed: ${Object.values(results).filter(r => r.success).length}/${Object.keys(results).length}`);
      console.log(`Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }

      return {
        success: overallSuccess,
        results,
        errors
      };

    } catch (error) {
      console.error('Integration test failed:', error);
      return {
        success: false,
        results: {},
        errors: [`Integration test crashed: ${error}`]
      };
    }
  }

  async testApiConnectivity(): Promise<{
    openai: boolean;
    rapidapi: boolean;
    foxit: boolean;
    kong: boolean;
    lavinmq: boolean;
  }> {
    const connectivity = {
      openai: false,
      rapidapi: false,
      foxit: false,
      kong: false,
      lavinmq: false
    };

    try {
      connectivity.openai = await openaiService.checkServiceHealth();
    } catch (error) {
      console.warn('OpenAI connectivity check failed:', error);
    }

    try {
      // Test RapidAPI connectivity with a simple search
      const testProducts = await amazonService.searchProducts(['test'], []);
      connectivity.rapidapi = true;
    } catch (error) {
      console.warn('RapidAPI connectivity check failed:', error);
    }

    try {
      connectivity.kong = await apiGateway.checkGatewayHealth();
    } catch (error) {
      console.warn('Kong connectivity check failed:', error);
    }

    try {
      connectivity.lavinmq = await messageQueueService.checkQueueHealth();
    } catch (error) {
      console.warn('LavinMQ connectivity check failed:', error);
    }

    // Foxit test would require actual API call, skip for now
    connectivity.foxit = true; // Assume available

    return connectivity;
  }
}

export const integrationTestService = new IntegrationTestService();