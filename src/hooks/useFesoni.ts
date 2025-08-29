import { useState, useCallback } from 'react';
import { ChatMessage, Product, AestheticAnalysis, QueueStatus } from '../types';
import { openaiService } from '../services/openai';
import { amazonService } from '../services/amazon';
import { messageQueueService } from '../services/messageQueue';
import { documentService } from '../services/documentGeneration';

export const useFesoni = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey! I'm Fesoni, your AI shopping assistant. Tell me about your vibe or aesthetic, and I'll find products that match your style. Try saying something like 'I love dark academia with cozy elements' or 'minimalist Scandinavian vibes'.",
      timestamp: new Date()
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ pending: 0, processing: 0, completed: 0 });

  const processUserInput = useCallback(async (input: string) => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Queue the aesthetic analysis task
      await messageQueueService.addTask('aesthetic-analysis');
      
      // Analyze aesthetic preferences
      const aesthetic = await openaiService.analyzeAesthetic(input);
      
      // Queue product search tasks
      await messageQueueService.addTask('product-search');
      
      // Search for products
      const products = await amazonService.searchProducts(
        aesthetic.keywords,
        aesthetic.categories
      );

      // Queue style guide generation
      await messageQueueService.addTask('style-guide-generation');
      
      // Generate style guide
      const styleGuideUrl = await documentService.generateStyleGuide(aesthetic, products);

      // Create assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: `Perfect! I found some amazing ${aesthetic.style} pieces that match your ${aesthetic.mood} vibe. I've also created a personalized style guide for you!`,
        timestamp: new Date(),
        products,
        styleGuide: styleGuideUrl
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Send notification
      await messageQueueService.sendNotification(
        `Found ${products.length} products matching your ${aesthetic.style} aesthetic!`
      );

    } catch (error) {
      console.error('Processing error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm having trouble processing your request right now. Please try again or describe your aesthetic in a different way.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const downloadStyleGuide = useCallback((content: string, aesthetic: string) => {
    const filename = `${aesthetic.replace(/\s+/g, '-').toLowerCase()}-style-guide`;
    documentService.downloadStyleGuide(content, filename);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Chat cleared! Tell me about your aesthetic preferences and I'll help you find matching products.",
      timestamp: new Date()
    }]);
  }, []);

  return {
    messages,
    isProcessing,
    queueStatus,
    processUserInput,
    downloadStyleGuide,
    clearChat,
    messageQueueService
  };
};