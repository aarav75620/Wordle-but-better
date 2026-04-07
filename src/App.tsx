import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import Auth from './components/Auth';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import UsernameSelection from './components/UsernameSelection';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'lobby' | 'game' | 'leaderboard'>('lobby');
  const [gameConfig, setGameConfig] = useState<{ roomId: string; mode: string; difficulty: string; isRanked: boolean; isSingleplayer: boolean } | null>(null);
  const [theme, setTheme] = useState('default');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Load theme and sound from localStorage
    const savedTheme = localStorage.getItem('wordle-theme');
    const savedSound = localStorage.getItem('wordle-sound');
    if (savedTheme) setTheme(savedTheme);
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('wordle-theme', newTheme);
  };

  const handleSetSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('wordle-sound', String(enabled));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ensure user exists in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            // New user, will need to set username
            await setDoc(userRef, {
              uid: currentUser.uid,
              username: '', // Empty means they need to set it
              stats: {
                wins: 0,
                losses: 0,
                streak: 0,
                avgGuesses: 0,
                totalGames: 0,
                totalGuesses: 0
              }
            });
            setUsername('');
          } else {
            const data = userDoc.data();
            setUsername(data.username || '');
          }
        } catch (error) {
          handleFirestoreError(error, 'get', `users/${currentUser.uid}`);
        }
      } else {
        setUsername(null);
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleJoinRoom = (roomId: string, mode: string, difficulty: string, isRanked: boolean, isSingleplayer: boolean) => {
    setGameConfig({ roomId, mode, difficulty, isRanked, isSingleplayer });
    setView('game');
  };

  const handleExitGame = () => {
    setGameConfig(null);
    setView('lobby');
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-[#E4E3E0] gap-4`}>
        <Loader2 className="w-12 h-12 animate-spin text-[#141414]" />
        <p className="font-mono font-bold uppercase tracking-widest opacity-50">Initializing System...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (username === '') {
    return <UsernameSelection userId={user.uid} onComplete={(name) => setUsername(name)} />;
  }

  return (
    <div className="min-h-screen">
      {view === 'lobby' && (
        <Lobby 
          onJoinRoom={handleJoinRoom} 
          onShowLeaderboard={() => setView('leaderboard')} 
          theme={theme}
          setTheme={handleSetTheme}
          soundEnabled={soundEnabled}
          setSoundEnabled={handleSetSound}
        />
      )}
      
      {view === 'game' && gameConfig && (
        <Game 
          user={{ uid: user.uid, username: username || 'Anonymous' }}
          roomId={gameConfig.roomId}
          mode={gameConfig.mode}
          difficulty={gameConfig.difficulty}
          isRanked={gameConfig.isRanked}
          isSingleplayer={gameConfig.isSingleplayer}
          onExit={handleExitGame}
          theme={theme}
          soundEnabled={soundEnabled}
        />
      )}

      {view === 'leaderboard' && (
        <Leaderboard onBack={() => setView('lobby')} />
      )}
    </div>
  );
}
