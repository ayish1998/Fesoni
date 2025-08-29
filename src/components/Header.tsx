import React, { useState } from "react";
import { Sparkles, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Header: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl shadow-lg"
      >
        {/* Gradient glow strip */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-3"
          >
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
              <p className="text-gray-400 text-sm">
                Your AI Shopping Assistant
              </p>
            </div>
          </motion.div>

          {/* Settings button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </motion.button>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              {/* Close button */}
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>

              <h2 className="text-xl font-semibold text-white mb-4">
                ⚙️ Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm">Theme</label>
                  <select className="w-full mt-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-white">
                    <option>Dark</option>
                    <option>Light</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 text-sm">Notifications</label>
                  <input
                    type="checkbox"
                    className="ml-2 rounded accent-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
