// src/App.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { StatusPanel } from './components/StatusPanel';
import { useFesoni } from './hooks/useFesoni';
import { Bell, X, Activity } from 'lucide-react';

function App() {
  const {
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
    messageQueueService
  } = useFesoni();

  const [showStatus, setShowStatus] = useState(false);
  const [enableStreaming, setEnableStreaming] = useState(true);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show status panel if there are system issues
    if (systemStatus && (!systemStatus.kong || !systemStatus.lavinmq)) {
      setShowStatus(true);
    }
  }, [systemStatus]);

  const handleSendMessage = (message: string) => {
    if (enableStreaming) {
      processUserInputWithStreaming(message);
    } else {
      processUserInput(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      
      {/* Floating Notifications */}
      <div className="fixed top-20 right-6 z-50 space-y-2 max-w-sm">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
                notification.type === 'success' ? 'bg-green-900/80 border-green-500' :
                notification.type === 'error' ? 'bg-red-900/80 border-red-500' :
                notification.type === 'warning' ? 'bg-yellow-900/80 border-yellow-500' :
                'bg-blue-900/80 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <Bell className="w-4 h-4 mt-0.5 text-white" />
                  <div>
                    <p className="text-white text-sm font-medium">Fesoni</p>
                    <p className="text-gray-200 text-xs">{notification.message}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">
        <div className={`grid gap-6 h-[calc(100vh-120px)] ${showStatus ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'}`}>
          {/* Main Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden ${
              showStatus ? 'lg:col-span-3' : 'max-w-5xl mx-auto'
            }`}
          >
            <ChatInterface
              messages={messages}
              isProcessing={isProcessing}
              onSendMessage={handleSendMessage}
              onDownloadStyleGuide={downloadStyleGuide}
              onClearChat={clearChat}
            />
          </motion.div>

          {/* Status Panel - Collapsible */}
          <AnimatePresence>
            {showStatus && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <StatusPanel 
                  queueStatus={queueStatus}
                  systemStatus={systemStatus}
                  notifications={notifications}
                  onRetry={retryLastRequest}
                  getSystemHealth={getSystemHealth}
                />

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage("Show me trending aesthetic items")}
                      disabled={isProcessing}
                      className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Trending Aesthetics
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage("I want cozy winter vibes")}
                      disabled={isProcessing}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Cozy Winter
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage("Modern minimalist aesthetic")}
                      disabled={isProcessing}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Minimalist Modern
                    </motion.button>

                    {/* System Control Buttons */}
                    <div className="pt-3 border-t border-gray-700 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={getSystemHealth}
                        className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Refresh Status
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEnableStreaming(!enableStreaming)}
                        className={`w-full py-2 px-4 rounded-lg text-sm transition-colors ${
                          enableStreaming 
                            ? 'bg-green-600 hover:bg-green-500 text-white' 
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                      >
                        {enableStreaming ? 'Streaming ON' : 'Streaming OFF'}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-white font-semibold text-lg mb-4">Enterprise Features</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${systemStatus?.kong ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300">Kong API Gateway</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${systemStatus?.lavinmq ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300">LavinMQ Processing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      <span className="text-gray-300">Voice-enabled chat</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${systemStatus?.openai ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-gray-300">AI aesthetic analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full" />
                      <span className="text-gray-300">PDF style guides</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <span className="text-gray-300">Real-time notifications</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Status Panel Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStatus(!showStatus)}
          className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg border border-gray-600 z-40"
          title={showStatus ? 'Hide Status Panel' : 'Show Status Panel'}
        >
          {showStatus ? <X className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
        </motion.button>

        {/* System Status Indicator */}
        <div className="fixed bottom-6 left-6 flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-600">
          <div className={`w-2 h-2 rounded-full ${
            systemStatus?.initialized 
              ? (systemStatus.kong && systemStatus.lavinmq ? 'bg-green-400' : 'bg-yellow-400')
              : 'bg-red-400'
          }`} />
          <span className="text-gray-300 text-sm">
            {systemStatus?.initialized 
              ? (systemStatus.kong && systemStatus.lavinmq ? 'Enterprise Mode' : 'Fallback Mode')
              : 'Initializing...'
            }
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
