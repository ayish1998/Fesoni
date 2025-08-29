import React, { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { QueueStatus, ApiMetrics } from '../types';
import { apiGateway } from '../services/apiGateway';

interface StatusPanelProps {
  queueStatus: QueueStatus;
  messageQueueService: any;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ queueStatus }) => {
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics>({ requests: 0, errors: 0, avgResponseTime: 0 });
  const [rateLimit, setRateLimit] = useState({ remaining: 100, resetTime: new Date() });

  useEffect(() => {
    const updateMetrics = () => {
      setApiMetrics(apiGateway.getMetrics());
    };

    const updateRateLimit = async () => {
      try {
        const limit = await apiGateway.checkRateLimit();
        setRateLimit(limit);
      } catch (error) {
        console.error('Failed to check rate limit:', error);
      }
    };

    const interval = setInterval(() => {
      updateMetrics();
      updateRateLimit();
    }, 5000);

    updateMetrics();
    updateRateLimit();

    return () => clearInterval(interval);
  }, []);

  const statusItems = [
    {
      label: 'Queue Status',
      icon: Activity,
      value: `${queueStatus.processing} processing`,
      color: queueStatus.processing > 0 ? 'text-blue-400' : 'text-gray-400'
    },
    {
      label: 'Pending Tasks',
      icon: Clock,
      value: queueStatus.pending.toString(),
      color: queueStatus.pending > 0 ? 'text-yellow-400' : 'text-gray-400'
    },
    {
      label: 'Completed',
      icon: CheckCircle,
      value: queueStatus.completed.toString(),
      color: queueStatus.completed > 0 ? 'text-green-400' : 'text-gray-400'
    },
    {
      label: 'API Requests',
      icon: AlertCircle,
      value: apiMetrics.requests.toString(),
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="bg-gray-900/70 backdrop-blur-xl rounded-2xl p-6 space-y-6 shadow-xl border border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-lg">System Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-green-400/50 shadow" />
          <span className="text-green-400 text-sm">Online</span>
        </div>
      </div>

      {/* Status Items */}
      <div className="grid grid-cols-2 gap-4">
        {statusItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800/70 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/5"
          >
            <div className="flex items-center space-x-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <div className="text-gray-400 text-xs">{item.label}</div>
                <div className={`font-semibold ${item.color}`}>{item.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rate Limit */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">API Rate Limit</span>
          <span className="text-blue-400 text-sm">{rateLimit.remaining} remaining</span>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(rateLimit.remaining / 150) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>

        <div className="text-xs text-gray-500">
          Resets at {rateLimit.resetTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Avg Response Time</span>
          <span className="text-green-400">{Math.round(apiMetrics.avgResponseTime)}ms</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Error Rate</span>
          <span className={apiMetrics.errors > 0 ? 'text-red-400' : 'text-green-400'}>
            {apiMetrics.requests > 0 ? Math.round((apiMetrics.errors / apiMetrics.requests) * 100) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};
