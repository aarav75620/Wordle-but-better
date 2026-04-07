import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AIHintProps {
  targetWord: string;
  guesses: { letter: string; status: 'correct' | 'present' | 'absent' | 'empty' }[][];
  approved: boolean;
  onRequest: () => void;
  isSingleplayer: boolean;
  hasRequested: boolean;
}

export default function AIHint({ targetWord, guesses, approved, onRequest, isSingleplayer, hasRequested }: AIHintProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const getHint = async () => {
    if (!approved && !isSingleplayer) {
      onRequest();
      return;
    }

    if (isLoading || hint) {
      setShowHint(true);
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `I am playing a Wordle-style game. The target word is "${targetWord}". 
      My current guesses are: ${guesses.map(g => g.map(c => c.letter).join('')).join(', ')}.
      Give me a cryptic but helpful hint without revealing the word itself. 
      Keep it short (max 15 words). 
      Format: "HINT: [your hint]"`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const text = response.text || "I'm stumped too!";
      setHint(text.replace('HINT:', '').trim());
      setShowHint(true);
    } catch (error) {
      console.error("AI Hint Error:", error);
      setHint("The AI is currently offline.");
      setShowHint(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={getHint}
        disabled={isLoading || (hasRequested && !approved && !isSingleplayer)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full font-bold uppercase text-xs tracking-widest transition-all",
          "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50",
          (hint || approved) && "from-green-600 to-emerald-600"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {approved || isSingleplayer ? (hint ? 'VIEW HINT' : 'GET AI HINT') : (hasRequested ? 'WAITING FOR VOTE...' : 'REQUEST HINT')}
      </button>

      <AnimatePresence>
        {showHint && hint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-full mt-4 right-0 w-64 bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_#141414] z-[60]"
          >
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
              <p className="text-xs font-mono font-bold leading-relaxed">
                {hint}
              </p>
            </div>
            <button 
              onClick={() => setShowHint(false)}
              className="mt-3 w-full text-[10px] font-mono uppercase font-bold opacity-50 hover:opacity-100"
            >
              Close
            </button>
            <div className="absolute bottom-full right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#141414]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
