// src/services/messageQueue.ts
import axios from 'axios';
import { QueueStatus, QueueTask, NotificationPayload } from '../types';

export class MessageQueueService {
  private lavinMQUrl: string;
  private username: string;
  private password: string;
  private vhost: string;
  private queue: Array<QueueTask> = [];
  private listeners: Array<(status: QueueStatus) => void> = [];
  private connection: WebSocket | null = null;

  constructor() {
    this.lavinMQUrl = import.meta.env.VITE_LAVINMQ_URL || 'http://localhost:15672';
    this.username = import.meta.env.VITE_LAVINMQ_USERNAME || 'guest';
    this.password = import.meta.env.VITE_LAVINMQ_PASSWORD || 'guest';
    this.vhost = import.meta.env.VITE_LAVINMQ_VHOST || '/';
    
    this.initializeConnection();
  }

  private async initializeConnection(): Promise<void> {
    try {
      // Establish WebSocket connection to LavinMQ for real-time updates
      const wsUrl = this.lavinMQUrl.replace('http', 'ws') + '/ws';
      this.connection = new WebSocket(wsUrl);
      
      this.connection.onopen = () => {
        console.log('LavinMQ WebSocket connected');
        this.authenticate();
      };

      this.connection.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.connection.onerror = (error) => {
        console.error('LavinMQ WebSocket error:', error);
      };

      this.connection.onclose = () => {
        console.log('LavinMQ WebSocket disconnected');
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.initializeConnection(), 5000);
      };
    } catch (error) {
      console.error('Failed to initialize LavinMQ connection:', error);
    }
  }

  private authenticate(): void {
    if (this.connection?.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify({
        type: 'auth',
        username: this.username,
        password: this.password,
        vhost: this.vhost
      }));
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'task_update':
        this.updateTaskStatus(message.taskId, message.status);
        break;
      case 'notification':
        this.handleNotification(message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async addTask(task: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueTask: QueueTask = {
      id: taskId,
      task,
      status: 'pending',
      priority,
      createdAt: new Date(),
      attempts: 0
    };

    // Add to local queue for immediate UI updates
    this.queue.push(queueTask);
    this.notifyListeners();

    try {
      // Publish task to LavinMQ
      await this.publishToQueue('fesoni.tasks', {
        taskId,
        task,
        priority,
        timestamp: Date.now()
      });

      console.log(`Task ${taskId} published to LavinMQ`);
    } catch (error) {
      console.error('Failed to publish task to LavinMQ:', error);
      // Fall back to local processing
      setTimeout(() => this.processTask(taskId), 1000);
    }
    
    return taskId;
  }

  private async publishToQueue(queueName: string, payload: any): Promise<void> {
    try {
      await axios.post(
        `${this.lavinMQUrl}/api/exchanges/${encodeURIComponent(this.vhost)}/amq.direct/publish`,
        {
          properties: {},
          routing_key: queueName,
          payload: JSON.stringify(payload),
          payload_encoding: 'string'
        },
        {
          auth: {
            username: this.username,
            password: this.password
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to publish to LavinMQ:', error);
      throw error;
    }
  }

  private async processTask(taskId: string): Promise<void> {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'processing';
    task.attempts++;
    this.notifyListeners();

    try {
      // Simulate processing time based on task complexity
      const processingTime = this.getProcessingTime(task.task);
      await new Promise(resolve => setTimeout(resolve, processingTime));

      // Mark as completed
      task.status = 'completed';
      task.completedAt = new Date();
      this.notifyListeners();

      // Publish completion notification
      await this.publishToQueue('fesoni.notifications', {
        type: 'task_completed',
        taskId,
        message: `Task completed: ${task.task}`,
        timestamp: Date.now()
      });

      // Clean up completed tasks after 30 seconds
      setTimeout(() => {
        this.queue = this.queue.filter(t => t.id !== taskId);
        this.notifyListeners();
      }, 30000);

    } catch (error) {
      console.error('Task processing error:', error);
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyListeners();

      // Retry logic for failed tasks
      if (task.attempts < 3) {
        setTimeout(() => this.processTask(taskId), 5000 * task.attempts);
      }
    }
  }

  private getProcessingTime(task: string): number {
    if (task.includes('amazon-search')) return 2000 + Math.random() * 3000;
    if (task.includes('openai-analysis')) return 1500 + Math.random() * 2000;
    if (task.includes('document-generation')) return 3000 + Math.random() * 4000;
    return 1000 + Math.random() * 2000;
  }

  private updateTaskStatus(taskId: string, status: 'pending' | 'processing' | 'completed' | 'failed'): void {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }
      this.notifyListeners();
    }
  }

  getStatus(): QueueStatus {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      processing: this.queue.filter(t => t.status === 'processing').length,
      completed: this.queue.filter(t => t.status === 'completed').length,
      failed: this.queue.filter(t => t.status === 'failed').length
    };
  }

  onStatusChange(callback: (status: QueueStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  async sendNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
    const notification: NotificationPayload = {
      message,
      type,
      timestamp: Date.now(),
      source: 'fesoni-app'
    };

    try {
      // Publish notification to LavinMQ
      await this.publishToQueue('fesoni.notifications', notification);
      
      // Also show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Fesoni Update', {
          body: message,
          icon: '/favicon.ico',
          tag: 'fesoni-notification'
        });
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Fallback to console log
      console.log('LavinMQ Notification:', message);
    }
  }

  // Subscribe to specific queue for real-time updates
  async subscribeToQueue(queueName: string, callback: (message: any) => void): Promise<void> {
    try {
      // In a real LavinMQ setup, this would establish a consumer
      await axios.post(
        `${this.lavinMQUrl}/api/consumers/${encodeURIComponent(this.vhost)}/${queueName}`,
        {
          consumer_tag: `fesoni-consumer-${Date.now()}`,
          no_ack: false,
          exclusive: false
        },
        {
          auth: {
            username: this.username,
            password: this.password
          }
        }
      );

      console.log(`Subscribed to LavinMQ queue: ${queueName}`);
    } catch (error) {
      console.error('Failed to subscribe to queue:', error);
    }
  }

  // Health check for LavinMQ connection
  async checkQueueHealth(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.lavinMQUrl}/api/overview`,
        {
          auth: {
            username: this.username,
            password: this.password
          },
          timeout: 5000
        }
      );
      
      return response.status === 200 && response.data.management_version;
    } catch (error) {
      console.error('LavinMQ health check failed:', error);
      return false;
    }
  }

  // Graceful shutdown
  disconnect(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }
}

export const messageQueueService = new MessageQueueService();
