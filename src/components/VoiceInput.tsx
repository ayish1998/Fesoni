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
    <div className="flex flex-col items-center space-y-5">
      {/* Mic + Intro Button */}
      <div className="flex items-center space-x-5">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleListening}
          disabled={disabled}
          className={`
            relative p-5 rounded-full transition-all duration-300
            ${isListening 
              ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30'
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
              className="absolute inset-0 rounded-full border-2 border-white/60"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>

        {/* Play Intro */}
        <button
          onClick={() => speakText("Hi! I'm Fesoni, your AI shopping assistant. Describe your aesthetic and I'll find matching products for you.")}
          className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors shadow-md border border-white/10"
          title="Hear introduction"
        >
          <Volume2 className="w-5 h-5 text-gray-300" />
        </button>
      </div>

      {/* Listening State */}
      {isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-blue-400 text-sm mb-2 animate-pulse">Listening...</div>
          {transcript && (
            <div className="bg-gray-900/70 backdrop-blur-lg border border-white/10 rounded-xl p-3 max-w-md shadow">
              <div className="text-gray-200 text-sm">{transcript}</div>
              {confidence > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Errors */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/30 border border-red-500/20 rounded-lg p-2 shadow">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="text-gray-500 text-xs text-center max-w-xs">
        {isListening 
          ? "Speak naturally about your style preferences. Click the mic again when done."
          : "Click the microphone to describe your aesthetic with voice"}
      </div>
    </div>
  );
};
