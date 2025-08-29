import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { StatusPanel } from './components/StatusPanel';
import { useFesoni } from './hooks/useFesoni';

function App() {
  const {
    messages,
    isProcessing,
    queueStatus,
    processUserInput,
    downloadStyleGuide,
    clearChat,
    messageQueueService
  } = useFesoni();

  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Main Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
          >
            <ChatInterface
              messages={messages}
              isProcessing={isProcessing}
              onSendMessage={processUserInput}
              onDownloadStyleGuide={downloadStyleGuide}
              onClearChat={clearChat}
            />
          </motion.div>

          {/* Status Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <StatusPanel 
              queueStatus={queueStatus}
              messageQueueService={messageQueueService}
            />

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => processUserInput("Show me trending aesthetic items")}
                  disabled={isProcessing}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Trending Aesthetics
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => processUserInput("I want cozy winter vibes")}
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Cozy Winter
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => processUserInput("Modern minimalist aesthetic")}
                  disabled={isProcessing}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Minimalist Modern
                </motion.button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold text-lg mb-4">Features</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span className="text-gray-300">Voice-enabled chat</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-gray-300">AI aesthetic analysis</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-gray-300">Personalized style guides</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-gray-300">Real-time notifications</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;