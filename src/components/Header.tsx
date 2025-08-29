import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <Sparkles className="w-8 h-8 text-blue-400" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-purple-400 opacity-50" />
              </motion.div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Fesoni</h1>
              <p className="text-gray-400 text-sm">Your AI Shopping Assistant</p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <div className="text-white text-sm font-medium">Enterprise APIs</div>
              <div className="text-gray-400 text-xs">Kong • LavinMQ • Foxit • OpenAI</div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-300" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};