import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  usedKeys: Record<string, 'correct' | 'present' | 'absent' | 'empty'>;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
];

export default function Keyboard({ onKeyPress, onDelete, onSubmit, usedKeys }: KeyboardProps) {
  const getKeyColor = (key: string) => {
    const status = usedKeys[key];
    switch (status) {
      case 'correct': return 'bg-[#6AAA64] text-white border-[#6AAA64]';
      case 'present': return 'bg-[#C9B458] text-white border-[#C9B458]';
      case 'absent': return 'bg-[#787C7E] text-white border-[#787C7E]';
      default: return 'bg-[#D3D6DA] text-[#141414] border-[#D3D6DA] hover:bg-[#D3D6DA]/80';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2 px-2">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'DELETE';
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'ENTER') onSubmit();
                  else if (key === 'DELETE') onDelete();
                  else onKeyPress(key);
                }}
                className={cn(
                  "flex-1 h-11 md:h-14 rounded-sm font-bold text-[10px] md:text-sm uppercase transition-all border-b-4 active:border-b-0 active:translate-y-1",
                  isSpecial ? "px-2 md:px-4 bg-[#D3D6DA] text-[#141414] border-[#D3D6DA]" : getKeyColor(key),
                  key === 'ENTER' && "text-[8px] md:text-xs"
                )}
              >
                {key === 'DELETE' ? <Delete className="w-5 h-5 mx-auto" /> : 
                 key === 'ENTER' ? <span className="flex items-center justify-center gap-1">SUBMIT <CornerDownLeft className="w-3 h-3" /></span> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
