import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Player {
  uid: string;
  username: string;
  progress: { letter: string; status: 'correct' | 'present' | 'absent' | 'empty' }[][];
  finished: boolean;
  guesses: number;
}

interface OpponentProgressProps {
  players: Player[];
  currentUserId: string;
  wordLength: number;
}

export default function OpponentProgress({ players, currentUserId, wordLength }: OpponentProgressProps) {
  const opponents = players.filter(p => p.uid !== currentUserId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
      {opponents.map((opponent) => (
        <motion.div 
          key={opponent.uid}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border-2 border-[#141414] p-3 shadow-[4px_4px_0px_0px_#141414]"
        >
          <div className="flex justify-between items-center mb-2 border-b border-[#141414]/10 pb-1">
            <span className="text-[10px] font-mono font-bold uppercase truncate max-w-[80px]">
              {opponent.username}
            </span>
            <span className="text-[10px] font-mono opacity-50">
              {opponent.guesses}/6
            </span>
          </div>
          
          <div className="grid grid-rows-6 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-0.5" style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}>
                {Array.from({ length: wordLength }).map((_, j) => {
                  const cell = opponent.progress[i]?.[j];
                  return (
                    <div 
                      key={j} 
                      className={cn(
                        "aspect-square rounded-[1px]",
                        cell?.status === 'correct' ? 'bg-[#6AAA64]' :
                        cell?.status === 'present' ? 'bg-[#C9B458]' :
                        cell?.status === 'absent' ? 'bg-[#787C7E]' :
                        'bg-[#D3D6DA]/30'
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          
          {opponent.finished && (
            <div className="mt-2 text-[8px] font-mono font-bold uppercase text-[#6AAA64] text-center">
              FINISHED
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
