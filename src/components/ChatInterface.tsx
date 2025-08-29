import React, { useState, useRef, useEffect } from "react";
import { Send, Download, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "../types";
import { ProductCard } from "./ProductCard";
import { VoiceInput } from "./VoiceInput";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
  onDownloadStyleGuide: (content: string, aesthetic: string) => void;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isProcessing,
  onSendMessage,
  onDownloadStyleGuide,
  onClearChat,
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript && !isProcessing) {
      onSendMessage(transcript);
    }
  };

  const examplePrompts = [
    "Dark academia with vintage elements",
    "Minimalist Scandinavian vibes",
    "Cottagecore aesthetic with earthy tones",
    "Modern industrial with warm accents",
  ];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-2xl px-5 py-3 rounded-3xl shadow-lg border
                  ${message.type === "user"
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white"
                    : "bg-gray-900/70 border-gray-700 text-gray-100 backdrop-blur-md"}
                `}
              >
                <p className="leading-relaxed whitespace-pre-line">{message.content}</p>

                {message.products && message.products.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-3">Curated Products</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {message.products.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                      ))}
                    </div>
                  </div>
                )}

                {message.styleGuide && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onDownloadStyleGuide(message.styleGuide!, "style-guide")}
                    className="mt-4 flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white px-4 py-2 rounded-xl shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Style Guide</span>
                  </motion.button>
                )}

                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-gray-900/70 border border-gray-700 rounded-3xl p-4 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full shadow"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-gray-300 text-sm">Analyzing your aesthetic...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Example Prompts */}
      {messages.length <= 1 && (
        <div className="px-6 pb-4">
          <div className="text-gray-400 text-sm mb-3">Try these aesthetic vibes:</div>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSendMessage(prompt)}
                disabled={isProcessing}
                className="px-3 py-2 rounded-full text-sm border border-purple-400/30 text-gray-300 bg-gray-800/60 hover:bg-gray-700/80 backdrop-blur-sm disabled:opacity-50"
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Input */}
      <div className="px-6 pb-4">
        <VoiceInput onTranscript={handleVoiceTranscript} disabled={isProcessing} />
      </div>

      {/* Text Input */}
      <div className="p-6 border-t border-gray-800 bg-gray-950/70 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your aesthetic vibe..."
            disabled={isProcessing}
            className="flex-1 bg-gray-900/80 border border-gray-700 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />

          <motion.button
            whileHover={{ rotate: 5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg text-white disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>

          {messages.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClearChat}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white shadow"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          )}
        </form>
      </div>
    </div>
  );
};
