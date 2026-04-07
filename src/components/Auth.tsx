import React from 'react';
import { signIn, auth } from '../firebase';
import { LogIn, Gamepad2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_#141414]"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-[#141414] flex items-center justify-center rounded-sm">
            <Gamepad2 className="text-white w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-[#141414] uppercase">
              Wordle <span className="italic font-serif">Multiplayer</span>
            </h1>
            <p className="text-[#141414]/60 font-mono text-sm">
              UNLIMITED PUZZLES. REAL-TIME BATTLES.
            </p>
          </div>

          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-[#141414] text-white py-4 px-6 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-colors group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>

          <div className="pt-4 border-t border-[#141414]/10 w-full">
            <p className="text-xs font-mono text-[#141414]/40 uppercase tracking-tighter">
              Secure authentication via Firebase
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
