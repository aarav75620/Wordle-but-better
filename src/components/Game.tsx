import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Clock, AlertCircle, Sparkles, RefreshCw, ChevronLeft } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Grid from './Grid';
import Keyboard from './Keyboard';
import OpponentProgress from './OpponentProgress';
import AIHint from './AIHint';
import { cn } from '../lib/utils';
import { useSound } from '../hooks/useSound';
import englishWords from 'an-array-of-english-words';

interface GameProps {
  user: { uid: string; username: string };
  roomId: string;
  mode: string;
  difficulty: string;
  isRanked: boolean;
  isSingleplayer: boolean;
  onExit: () => void;
  theme: string;
  soundEnabled: boolean;
}

const dictionary = new Set(englishWords.map(w => w.toUpperCase()));

export default function Game({ user, roomId, mode, difficulty, isRanked, isSingleplayer, onExit, theme, soundEnabled }: GameProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [guesses, setGuesses] = useState<{ letter: string; status: 'correct' | 'present' | 'absent' | 'empty' }[][]>([]);
  const [usedKeys, setUsedKeys] = useState<Record<string, 'correct' | 'present' | 'absent' | 'empty'>>({});
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'loss' | null>(null);
  const [hintApproved, setHintApproved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { playSound } = useSound(soundEnabled);

  const wordLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.emit('join-room', { roomId, user, mode, difficulty, isRanked, isSingleplayer });

    newSocket.on('room-update', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'finished') {
        setIsGameOver(true);
      }
    });

    newSocket.on('game-start', (startedRoom) => {
      setRoom(startedRoom);
      setMessage('GAME START!');
      setTimeout(() => setMessage(''), 2000);
    });

    newSocket.on('hint-approved', () => {
      setHintApproved(true);
      setMessage('HINT APPROVED!');
      setTimeout(() => setMessage(''), 2000);
    });

    newSocket.on('game-over', (finishedRoom) => {
      setRoom(finishedRoom);
      setIsGameOver(true);
      const isWinner = finishedRoom.winner === user.username;
      playSound(isWinner ? 'win' : 'lose');
      setMessage(`GAME OVER! WINNER: ${finishedRoom.winner || 'NONE'}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, user, mode, difficulty, isRanked, isSingleplayer]);

  const requestHint = () => {
    if (hintApproved) return;
    socket?.emit('request-hint', { roomId });
    setMessage('HINT REQUESTED...');
  };

  const themes = {
    default: { bg: 'bg-[#E4E3E0]', card: 'bg-white', text: 'text-[#141414]' },
    dark: { bg: 'bg-[#141414]', card: 'bg-[#242424]', text: 'text-white' },
    vibrant: { bg: 'bg-purple-100', card: 'bg-white', text: 'text-purple-900' },
    forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900' }
  };

  const currentTheme = themes[theme as keyof typeof themes] || themes.default;

  useEffect(() => {
    if (room?.status === 'playing' && !isGameOver) {
      const interval = setInterval(() => {
        setTimer(Math.floor((Date.now() - room.startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [room?.status, room?.startTime, isGameOver]);

  const getFeedback = (guess: string, target: string) => {
    const feedback: { letter: string; status: 'correct' | 'present' | 'absent' | 'empty' }[] = [];
    const targetArr = target.split('');
    const guessArr = guess.split('');
    const result = new Array(wordLength).fill('absent');

    // First pass: Correct positions
    guessArr.forEach((letter, i) => {
      if (letter === targetArr[i]) {
        result[i] = 'correct';
        targetArr[i] = ''; // Mark as used
      }
    });

    // Second pass: Present letters
    guessArr.forEach((letter, i) => {
      if (result[i] !== 'correct') {
        const index = targetArr.indexOf(letter);
        if (index !== -1) {
          result[i] = 'present';
          targetArr[index] = ''; // Mark as used
        }
      }
    });

    return guessArr.map((letter, i) => ({
      letter,
      status: result[i] as 'correct' | 'present' | 'absent'
    }));
  };

  const handleSubmit = useCallback(() => {
    if (currentGuess.length !== wordLength || !room || room.status !== 'playing' || isGameOver) {
      playSound('incorrect');
      return;
    }

    if (!dictionary.has(currentGuess)) {
      playSound('incorrect');
      setMessage("WORD DOESN'T EXIST");
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    playSound('submit');
    const feedback = getFeedback(currentGuess, room.targetWord);
    const newGuesses = [...guesses, feedback];
    setGuesses(newGuesses);

    // Update used keys
    const newUsedKeys = { ...usedKeys };
    feedback.forEach(({ letter, status }) => {
      const currentStatus = newUsedKeys[letter];
      if (status === 'correct' || (status === 'present' && currentStatus !== 'correct') || (!currentStatus && status === 'absent')) {
        newUsedKeys[letter] = status;
      }
    });
    setUsedKeys(newUsedKeys);

    socket?.emit('submit-guess', { roomId, guess: currentGuess, feedback });
    setCurrentGuess('');

    const isCorrect = feedback.every(f => f.status === 'correct');
    if (isCorrect) {
      playSound('correct');
      setMessage('CORRECT!');
      setGameResult('win');
    } else if (newGuesses.length >= 6) {
      playSound('lose');
      setMessage(`OUT OF GUESSES! WORD WAS: ${room.targetWord}`);
      setGameResult('loss');
    }
  }, [currentGuess, wordLength, room, guesses, usedKeys, socket, roomId, isGameOver, playSound]);

  const handleKeyPress = (key: string) => {
    if (isGameOver || room?.status !== 'playing') return;
    if (currentGuess.length < wordLength) {
      playSound('key');
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleDelete = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Backspace') handleDelete();
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const handleFinish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const stats = userDoc.data().stats;
        const isWin = gameResult === 'win';
        
        const newTotalGames = (stats.totalGames || 0) + 1;
        const newTotalGuesses = (stats.totalGuesses || 0) + guesses.length;
        const newWins = (stats.wins || 0) + (isWin ? 1 : 0);
        const newLosses = (stats.losses || 0) + (isWin ? 0 : 1);
        const newStreak = isWin ? (stats.streak || 0) + 1 : 0;
        const newAvgGuesses = newTotalGuesses / newTotalGames;

        await updateDoc(userRef, {
          'stats.wins': newWins,
          'stats.losses': newLosses,
          'stats.streak': newStreak,
          'stats.totalGames': newTotalGames,
          'stats.totalGuesses': newTotalGuesses,
          'stats.avgGuesses': newAvgGuesses
        });
      }

      if (isSingleplayer) {
        // For singleplayer, just reload to get a new word
        window.location.reload();
      } else {
        onExit();
      }
    } catch (error) {
      console.error('Error saving game:', error);
      setMessage('FAILED TO SAVE GAME');
    } finally {
      setIsSaving(false);
    }
  };

  if (!room) return <div className={`min-h-screen flex items-center justify-center ${currentTheme.bg} font-mono uppercase`}>Connecting...</div>;

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex flex-col transition-colors duration-500`}>
      {/* Header */}
      <header className={`${currentTheme.card} border-b-2 border-[#141414] p-2 md:p-4 flex justify-between items-center sticky top-0 z-50`}>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onExit} className={`p-1 md:p-2 hover:bg-[#141414]/5 transition-colors ${currentTheme.text}`}>
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className={`text-sm md:text-xl font-bold tracking-tighter uppercase leading-none ${currentTheme.text}`}>
              {isSingleplayer ? (mode === 'daily' ? 'Daily' : 'Solo') : `Room ${roomId}`}
              {isRanked && <span className="ml-2 text-[8px] md:text-[10px] bg-yellow-500 text-black px-1 rounded">RANKED</span>}
            </h1>
            <span className={`text-[8px] md:text-[10px] font-mono opacity-50 uppercase tracking-widest ${currentTheme.text}`}>
              {mode === 'daily' ? 'Daily Challenge' : mode === 'free' ? 'Free Play' : mode} • {difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <AIHint 
            targetWord={room.targetWord} 
            guesses={guesses} 
            approved={hintApproved} 
            onRequest={requestHint}
            isSingleplayer={isSingleplayer}
            hasRequested={room.hintRequests?.includes(socket?.id)}
          />
          <div className="flex items-center gap-1 md:gap-2 bg-[#141414] text-white px-2 md:px-4 py-1 md:py-2 font-mono text-[10px] md:text-sm">
            <Clock className="w-3 h-3 md:w-4 md:h-4" />
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto md:overflow-visible">
        <div className="flex flex-col md:flex-row p-2 md:p-8 gap-4 md:gap-8 max-w-7xl mx-auto w-full">
          {/* Left Column: Game Board */}
          <div className="flex flex-col items-center gap-4 md:gap-8 w-full">
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#141414] text-white px-4 md:px-6 py-2 md:py-3 font-bold uppercase tracking-widest text-[10px] md:text-sm shadow-[4px_4px_0px_0px_#6AAA64] z-10"
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full flex flex-col items-center">
              <Grid guesses={guesses} currentGuess={currentGuess} wordLength={wordLength} />
            </div>
            
            <div className="w-full space-y-2 md:space-y-4 pb-4">
              <Keyboard 
                onKeyPress={handleKeyPress} 
                onDelete={handleDelete} 
                onSubmit={handleSubmit} 
                usedKeys={usedKeys} 
              />
            </div>
          </div>

        {/* Right Column: Multiplayer Status */}
        {!isSingleplayer && (
          <aside className="w-full md:w-80 space-y-6">
            <div className={`${currentTheme.card} border-2 border-[#141414] p-6 shadow-[8px_8px_0px_0px_#141414]`}>
              <h2 className={`text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2 border-b border-[#141414]/10 pb-2 ${currentTheme.text}`}>
                <Users className="w-5 h-5" />
                Opponents
              </h2>
              <OpponentProgress players={room.players} currentUserId={user.uid} wordLength={wordLength} />
            </div>

            <div className={`${currentTheme.card} border-2 border-[#141414] p-6 shadow-[8px_8px_0px_0px_#141414]`}>
              <h2 className={`text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2 border-b border-[#141414]/10 pb-2 ${currentTheme.text}`}>
                <AlertCircle className="w-5 h-5" />
                Status
              </h2>
              <div className="space-y-3">
                {room.players.map((p: any) => (
                  <div key={p.uid} className={`flex items-center justify-between font-mono text-xs ${currentTheme.text}`}>
                    <span className={cn("font-bold", p.uid === user.uid && "text-blue-600")}>{p.username}</span>
                    <div className="flex items-center gap-2">
                      {room.hintRequests?.includes(p.id) && <Sparkles className="w-3 h-3 text-purple-500" />}
                      {p.isReady ? (
                        <span className="text-[#6AAA64] font-bold">READY</span>
                      ) : (
                        <span className="text-red-500 font-bold">WAITING</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {room.status === 'waiting' && (
                <button
                  onClick={() => socket?.emit('player-ready', { roomId })}
                  disabled={room.players.find((p: any) => p.uid === user.uid)?.isReady}
                  className="w-full mt-6 bg-[#141414] text-white py-3 px-4 font-bold uppercase tracking-widest hover:bg-[#141414]/90 disabled:opacity-50 transition-all"
                >
                  {room.players.find((p: any) => p.uid === user.uid)?.isReady ? 'READY!' : 'READY UP'}
                </button>
              )}
            </div>
          </aside>
        )}
        </div>
      </main>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-4 border-[#141414] p-10 max-w-md w-full shadow-[12px_12px_0px_0px_#6AAA64] text-center space-y-8"
            >
              <Trophy className="w-20 h-20 mx-auto text-yellow-500" />
              <div className="space-y-2">
                <h2 className="text-5xl font-bold uppercase tracking-tighter">Game Over</h2>
                <p className="text-xl font-serif italic text-[#141414]/60">
                  {room.winner ? `${room.winner} won the battle!` : 'No winner this time.'}
                </p>
              </div>

              <div className="bg-[#141414]/5 p-6 space-y-4 font-mono text-sm border-2 border-dashed border-[#141414]/20">
                <div className="flex justify-between">
                  <span className="opacity-50 uppercase">Word</span>
                  <span className="font-bold text-xl tracking-widest">{room.targetWord}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-50 uppercase">Time</span>
                  <span className="font-bold">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="bg-[#141414] text-white py-4 px-6 font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Finish'}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="border-2 border-[#141414] py-4 px-6 font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rematch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
