import React, { useState, useRef, useEffect } from 'react';
import { Send, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage } from '../types';
import { ProductCard } from './ProductCard';
import { VoiceInput } from './VoiceInput';

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
  onClearChat
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input.trim());
      setInput('');
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
    "Modern industrial with warm accents"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`
                max-w-3xl rounded-2xl p-4
                ${message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-800 text-gray-100'
                }
              `}>
                <p className="mb-2">{message.content}</p>
                
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
                    onClick={() => onDownloadStyleGuide(message.styleGuide!, 'style-guide')}
                    className="mt-4 flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
                <span className="text-gray-300">Analyzing your aesthetic...</span>
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
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded-full text-sm transition-colors disabled:opacity-50"
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
      <div className="p-6 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your aesthetic vibe..."
            disabled={isProcessing}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white p-3 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </motion.button>

          {messages.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onClearChat}
              className="bg-gray-600 hover:bg-gray-500 text-white p-3 rounded-xl transition-colors"
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