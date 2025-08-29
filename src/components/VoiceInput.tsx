import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, disabled }) => {
  const {
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    isSupported
  } = useVoiceRecognition();

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onTranscript(transcript);
        resetTranscript();
      }
    } else {
      startListening();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-gray-500 text-sm">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleListening}
          disabled={disabled}
          className={`
            relative p-4 rounded-full transition-all duration-300
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' 
              : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>

        <button
          onClick={() => speakText("Hi! I'm Fesoni, your AI shopping assistant. Describe your aesthetic and I'll find matching products for you.")}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          title="Hear introduction"
        >
          <Volume2 className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-blue-400 text-sm mb-2">Listening...</div>
          {transcript && (
            <div className="bg-gray-800 rounded-lg p-3 max-w-md">
              <div className="text-gray-300 text-sm">{transcript}</div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="text-gray-500 text-xs text-center max-w-xs">
        {isListening 
          ? "Speak naturally about your style preferences. Click the mic again when done."
          : "Click the microphone to describe your aesthetic with voice"
        }
      </div>
    </div>
  );
};