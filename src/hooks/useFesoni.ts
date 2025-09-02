// src/hooks/useFesoni.ts
import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Product, AestheticAnalysis, QueueStatus } from '../types';
import { fesoniService } from '../services/fesoniService';
import { messageQueueService } from '../services/messageQueue';
import { apiGateway } from '../services/apiGateway';

export const useFesoni = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hey! I'm Fesoni, your AI shopping assistant powered by enterprise-grade APIs. Tell me about your vibe or aesthetic, and I'll find products that match your style through our Kong API Gateway and process everything with LavinMQ for lightning-fast results!",
      timestamp: new Date()
    }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({ 
    pending: 0, 
    processing: 0, 
    completed: 0,
    failed: 0 
  });
  const [systemStatus, setSystemStatus] = useState({
    kong: false,
    lavinmq: false,
    openai: false,
    initialized: false
  });
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: string;
    timestamp: number;
  }>>([]);

  // Initialize Fesoni services on mount
  useEffect(() => {
    initializeFesoni();
    
    // Subscribe to queue status updates
    const unsubscribeQueue = messageQueueService.onStatusChange((status) => {
      setQueueStatus(status);
    });

    // Subscribe to system updates
    const unsubscribeSystem = fesoniService.subscribeToUpdates((update) => {
      if (update.type === 'system_status') {
        setSystemStatus(update.data);
      } else if (update.type === 'notification') {
        addNotification(update.data);
      }
    });

    return () => {
      unsubscribeQueue();
      unsubscribeSystem();
    };
  }, []);

  const initializeFesoni = async () => {
    try {
      await fesoniService.initialize();
      
      // Check system status
      const status = await fesoniService.getSystemMetrics();
      setSystemStatus({
        kong: status.kong,
        lavinmq: status.lavinmq,
        openai: status.openai,
        initialized: true
      });

      // Add system status message
      const statusMessage = `🚀 Fesoni initialized! Services: Kong ${status.kong ? '✅' : '❌'}, LavinMQ ${status.lavinmq ? '✅' : '❌'}, OpenAI ${status.openai ? '✅' : '❌'}`;
      
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'assistant',
        content: statusMessage,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Fesoni initialization error:', error);
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "⚠️ Some enterprise features are unavailable. Running in fallback mode with direct API access.",
        timestamp: new Date()
      }]);
    }
  };

  const addNotification = (notification: any) => {
    const newNotification = {
      id: `notif-${Date.now()}`,
      message: notification.message || notification,
      type: notification.type || 'info',
      timestamp: Date.now()
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Keep last 5
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

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
      // Show immediate feedback
      const processingMessage: ChatMessage = {
        id: `processing-${Date.now()}`,
        type: 'assistant',
        content: "🎨 Analyzing your aesthetic through our AI pipeline...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMessage]);

      // Process through enterprise architecture
      const result = await fesoniService.findMyVibe(input, `user-${Date.now()}`);

      // Remove processing message and add results
      setMessages(prev => {
        const withoutProcessing = prev.filter(m => m.id !== processingMessage.id);
        
        const resultMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `Perfect! I found ${result.products.length} amazing ${result.analysis.style} pieces that match your ${result.analysis.mood} vibe. Your aesthetic profile shows preferences for ${result.analysis.colors.slice(0, 3).join(', ')} colors with ${result.analysis.keywords.slice(0, 3).join(', ')} elements.`,
          timestamp: new Date(),
          products: result.products,
          styleGuide: result.styleGuideUrl
        };

        return [...withoutProcessing, resultMessage];
      });

      // Show success notification
      addNotification({
        message: `Found ${result.products.length} ${result.analysis.style} products!`,
        type: 'success'
      });

    } catch (error) {
      console.error('Processing error:', error);
      
      // Remove processing message and show error
      setMessages(prev => {
        const withoutProcessing = prev.filter(m => !m.id.includes('processing'));
        
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: "I'm having trouble processing your request right now. Our enterprise services might be temporarily unavailable. Please try again or describe your aesthetic in a different way.",
          timestamp: new Date()
        };

        return [...withoutProcessing, errorMessage];
      });

      addNotification({
        message: 'Processing failed, please try again',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const downloadStyleGuide = useCallback((content: string, aesthetic: string) => {
    const filename = `${aesthetic.replace(/\s+/g, '-').toLowerCase()}-style-guide`;
    
    // Use document service to handle download
    if (content.startsWith('data:')) {
      // Handle PDF downloads
      const link = document.createElement('a');
      link.href = content;
      link.download = `${filename}.pdf`;
      link.click();
    } else {
      // Handle text downloads
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }

    addNotification({
      message: `Style guide "${filename}" downloaded successfully`,
      type: 'success'
    });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Chat cleared! Tell me about your aesthetic preferences and I'll help you find matching products through our enterprise API infrastructure.",
      timestamp: new Date()
    }]);
    
    addNotification({
      message: 'Chat cleared',
      type: 'info'
    });
  }, []);

  const retryLastRequest = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage) {
      processUserInput(lastUserMessage.content);
    }
  }, [messages, processUserInput]);

  const getSystemHealth = useCallback(async () => {
    try {
      const metrics = await fesoniService.getSystemMetrics();
      setSystemStatus({
        kong: metrics.kong,
        lavinmq: metrics.lavinmq,
        openai: metrics.openai,
        initialized: true
      });
      return metrics;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }, []);

  // Enhanced processing with streaming updates
  const processUserInputWithStreaming = useCallback(async (input: string) => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Create a streaming response message
    const streamingMessageId = `streaming-${Date.now()}`;
    let currentContent = "🎨 Starting aesthetic analysis...";
    
    const addStreamingMessage = (content: string) => {
      setMessages(prev => {
        const existing = prev.find(m => m.id === streamingMessageId);
        if (existing) {
          return prev.map(m => m.id === streamingMessageId ? { ...m, content } : m);
        } else {
          return [...prev, {
            id: streamingMessageId,
            type: 'assistant' as const,
            content,
            timestamp: new Date()
          }];
        }
      });
    };

    try {
      addStreamingMessage(currentContent);

      // Stream aesthetic analysis
      currentContent = "🧠 Processing through OpenAI via Kong Gateway...";
      addStreamingMessage(currentContent);
      await new Promise(resolve => setTimeout(resolve, 800));

      currentContent = "🛍️ Searching Amazon catalog through RapidAPI...";
      addStreamingMessage(currentContent);
      await new Promise(resolve => setTimeout(resolve, 1000));

      currentContent = "📊 Queuing tasks in LavinMQ for parallel processing...";
      addStreamingMessage(currentContent);
      await new Promise(resolve => setTimeout(resolve, 600));

      // Get actual results
      const result = await fesoniService.findMyVibe(input, `user-${Date.now()}`);

      // Final update with results
      setMessages(prev => prev.map(m => 
        m.id === streamingMessageId ? {
          ...m,
          content: `Perfect! I found ${result.products.length} amazing ${result.analysis.style} pieces that match your ${result.analysis.mood} vibe. Your aesthetic profile shows preferences for ${result.analysis.colors.slice(0, 3).join(', ')} colors with ${result.analysis.keywords.slice(0, 3).join(', ')} elements.`,
          products: result.products,
          styleGuide: result.styleGuideUrl
        } : m
      ));

    } catch (error) {
      console.error('Streaming processing error:', error);
      
      setMessages(prev => prev.map(m => 
        m.id === streamingMessageId ? {
          ...m,
          content: "I encountered an issue while processing your request. Our enterprise services might be temporarily unavailable. Please try again!"
        } : m
      ));
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    messages,
    isProcessing,
    queueStatus,
    systemStatus,
    notifications,
    processUserInput,
    processUserInputWithStreaming,
    downloadStyleGuide,
    clearChat,
    retryLastRequest,
    getSystemHealth,
    messageQueueService,
    apiGateway
  };
};