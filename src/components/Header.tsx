import React from "react";
import { Sparkles, Settings } from "lucide-react";
import { motion } from "framer-motion";


export const Header: React.FC = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl shadow-lg"
    >
      {/* Gradient glow strip */}
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div whileHover={{ scale: 1.02 }} className="flex items-center space-x-3">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-blue-400 drop-shadow" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-purple-400 opacity-40" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Fesoni</h1>
            <p className="text-gray-400 text-sm">Your AI Shopping Assistant</p>
          </div>
        </motion.div>

        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
