// src/components/StatusPanel.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Server, Database, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { QueueStatus, ApiMetrics } from '../types';

interface StatusPanelProps {
  queueStatus: QueueStatus;
  systemStatus?: {
    kong: boolean;
    lavinmq: boolean;
    openai: boolean;
    initialized: boolean;
  };
  notifications?: Array<{
    id: string;
    message: string;
    type: string;
    timestamp: number;
  }>;
  onRetry?: () => void;
  getSystemHealth?: () => Promise<any>;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  queueStatus,
  systemStatus,
  notifications = [],
  onRetry,
  getSystemHealth
}) => {
  const [metrics, setMetrics] = useState<ApiMetrics>({
    requests: 0,
    errors: 0,
    avgResponseTime: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update metrics periodically
    const updateMetrics = async () => {
      if (getSystemHealth) {
        try {
          const health = await getSystemHealth();
          if (health?.metrics) {
            setMetrics(health.metrics);
          }
        } catch (error) {
          console.error('Failed to get system health:', error);
        }
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [getSystemHealth]);

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? CheckCircle : AlertCircle;
  };

  const totalTasks = queueStatus.pending + queueStatus.processing + queueStatus.completed + (queueStatus.failed || 0);

  return (
    <div className="space-y-4">
      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Status
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {isExpanded ? 'Collapse' : 'Details'}
          </motion.button>
        </div>

        <div className="space-y-3">
          {/* Kong Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">Kong Gateway</span>
            </div>
            <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus?.kong || false)}`}>
              {React.createElement(getStatusIcon(systemStatus?.kong || false), { className: "w-4 h-4" })}
              <span className="text-sm">{systemStatus?.kong ? 'Active' : 'Offline'}</span>
            </div>
          </div>

          {/* LavinMQ Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">LavinMQ</span>
            </div>
            <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus?.lavinmq || false)}`}>
              {React.createElement(getStatusIcon(systemStatus?.lavinmq || false), { className: "w-4 h-4" })}
              <span className="text-sm">{systemStatus?.lavinmq ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* OpenAI Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">OpenAI API</span>
            </div>
            <div className={`flex items-center space-x-1 ${getStatusColor(systemStatus?.openai || false)}`}>
              {React.createElement(getStatusIcon(systemStatus?.openai || false), { className: "w-4 h-4" })}
              <span className="text-sm">{systemStatus?.openai ? 'Ready' : 'Error'}</span>
            </div>
          </div>

          {/* Expanded Metrics */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-700 space-y-2"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">API Requests:</span>
                <span className="text-white">{metrics.requests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Error Rate:</span>
                <span className={metrics.errors > 0 ? 'text-red-400' : 'text-green-400'}>
                  {metrics.requests > 0 ? Math.round((metrics.errors / metrics.requests) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg Response:</span>
                <span className="text-white">{Math.round(metrics.avgResponseTime)}ms</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Queue Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Task Queue
        </h3>

        <div className="space-y-3">
          {/* Queue Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{queueStatus.pending}</div>
              <div className="text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{queueStatus.processing}</div>
              <div className="text-gray-400">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{queueStatus.completed}</div>
              <div className="text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{queueStatus.failed || 0}</div>
              <div className="text-gray-400">Failed</div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{Math.round((queueStatus.completed / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(queueStatus.completed / totalTasks) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}

          {/* Retry Button */}
          {(queueStatus.failed || 0) > 0 && onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Retry Failed Tasks
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-white font-semibold text-lg mb-4">Live Updates</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start space-x-2 text-sm"
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  notification.type === 'success' ? 'bg-green-400' :
                  notification.type === 'error' ? 'bg-red-400' :
                  notification.type === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <div>
                  <p className="text-gray-300">{notification.message}</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Performance Metrics */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-white font-semibold text-lg mb-4">Performance</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Response Time:</span>
              <span className={`${metrics.avgResponseTime > 2000 ? 'text-red-400' : 'text-green-400'}`}>
                {Math.round(metrics.avgResponseTime)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Success Rate:</span>
              <span className="text-green-400">
                {metrics.requests > 0 ? Math.round(((metrics.requests - metrics.errors) / metrics.requests) * 100) : 100}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Queue Efficiency:</span>
              <span className="text-blue-400">
                {totalTasks > 0 ? Math.round((queueStatus.completed / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StatusPanel;
