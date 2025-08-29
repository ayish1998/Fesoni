import { QueueStatus } from '../types';

export class MessageQueueService {
  private queue: Array<{ id: string; task: string; status: 'pending' | 'processing' | 'completed' }> = [];
  private listeners: Array<(status: QueueStatus) => void> = [];

  async addTask(task: string): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.queue.push({
      id: taskId,
      task,
      status: 'pending'
    });

    this.notifyListeners();
    
    // Simulate async processing
    setTimeout(() => this.processTask(taskId), 1000);
    
    return taskId;
  }

  private async processTask(taskId: string): Promise<void> {
    const task = this.queue.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'processing';
    this.notifyListeners();

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    task.status = 'completed';
    this.notifyListeners();

    // Clean up completed tasks after 30 seconds
    setTimeout(() => {
      this.queue = this.queue.filter(t => t.id !== taskId);
      this.notifyListeners();
    }, 30000);
  }

  getStatus(): QueueStatus {
    return {
      pending: this.queue.filter(t => t.status === 'pending').length,
      processing: this.queue.filter(t => t.status === 'processing').length,
      completed: this.queue.filter(t => t.status === 'completed').length
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

  async sendNotification(message: string): Promise<void> {
    // Simulate real-time notification
    console.log('LavinMQ Notification:', message);
    
    // In a real implementation, this would publish to LavinMQ
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Fesoni Update', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }
}

export const messageQueueService = new MessageQueueService();