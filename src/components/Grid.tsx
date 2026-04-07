import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface GridProps {
  guesses: { letter: string; status: 'correct' | 'present' | 'absent' | 'empty' }[][];
  currentGuess: string;
  wordLength: number;
}

export default function Grid({ guesses, currentGuess, wordLength }: GridProps) {
  const emptyRows = Array.from({ length: 6 - guesses.length - 1 }, () => 
    Array.from({ length: wordLength }, () => ({ letter: '', status: 'empty' as const }))
  );

  const currentGuessRow = Array.from({ length: wordLength }, (_, i) => ({
    letter: currentGuess[i] || '',
    status: 'empty' as const
  }));

  return (
    <div className="grid grid-rows-6 gap-1 md:gap-2 max-w-sm mx-auto w-full">
      {guesses.map((row, i) => (
        <div key={i} className="grid grid-cols-5 gap-1 md:gap-2 h-9 md:h-16" style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}>
          {row.map((cell, j) => (
            <Cell key={j} letter={cell.letter} status={cell.status} delay={j * 0.25} />
          ))}
        </div>
      ))}

      {guesses.length < 6 && (
        <div className="grid grid-cols-5 gap-1 md:gap-2 h-9 md:h-16" style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}>
          {currentGuessRow.map((cell, j) => (
            <Cell key={j} letter={cell.letter} status={cell.status} isCurrent />
          ))}
        </div>
      )}

      {emptyRows.map((row, i) => (
        <div key={i} className="grid grid-cols-5 gap-1 md:gap-2 h-9 md:h-16" style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}>
          {row.map((cell, j) => (
            <Cell key={j} letter={cell.letter} status={cell.status} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Cell({ letter, status, delay = 0, isCurrent = false }: { letter: string; status: 'correct' | 'present' | 'absent' | 'empty'; delay?: number; isCurrent?: boolean }) {
  const statusColors = {
    correct: 'bg-[#6AAA64] border-[#6AAA64] text-white',
    present: 'bg-[#C9B458] border-[#C9B458] text-white',
    absent: 'bg-[#787C7E] border-[#787C7E] text-white',
    empty: 'bg-white border-[#D3D6DA] text-[#141414]'
  };

  return (
    <motion.div
      initial={status !== 'empty' ? { rotateX: -90 } : { scale: 1 }}
      animate={
        status !== 'empty' 
          ? { rotateX: 0 } 
          : isCurrent && letter 
            ? { scale: [1, 1.1, 1], borderColor: '#141414' } 
            : { scale: 1, borderColor: '#D3D6DA' }
      }
      transition={
        status !== 'empty' 
          ? { duration: 0.5, delay } 
          : { duration: 0.1 }
      }
      className={cn(
        "w-full h-full border flex items-center justify-center text-base md:text-2xl font-bold uppercase select-none transition-colors",
        statusColors[status]
      )}
    >
      {letter}
    </motion.div>
  );
}
