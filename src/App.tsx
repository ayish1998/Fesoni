// src/App.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { useFesoni } from './hooks/useFesoni';
import { Bell } from 'lucide-react';

function App() {
  const {
    messages,
    isProcessing,
    systemStatus,
    notifications,
    processUserInput,
    processUserInputWithStreaming,
    downloadStyleGuide,
    clearChat
  } = useFesoni();

  const [enableStreaming, setEnableStreaming] = useState(true);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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
        <div className="grid gap-6 h-[calc(100vh-120px)] grid-cols-1">
          {/* Main Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden max-w-5xl mx-auto"
          >
            <ChatInterface
              messages={messages}
              isProcessing={isProcessing}
              onSendMessage={handleSendMessage}
              onDownloadStyleGuide={downloadStyleGuide}
              onClearChat={clearChat}
            />
          </motion.div>
        </div>

        {/* Streaming Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setEnableStreaming(!enableStreaming)}
          className={`fixed bottom-6 right-6 px-4 py-2 rounded-full shadow-lg border z-40 transition-colors ${
            enableStreaming 
              ? 'bg-green-600 hover:bg-green-500 border-green-500 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300'
          }`}
          title={enableStreaming ? 'Streaming Mode ON' : 'Streaming Mode OFF'}
        >
          {enableStreaming ? '🔄 Streaming' : '📝 Standard'}
        </motion.button>
      </div>
    </div>
  );
}

export default App;
