import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  Trophy, 
  Settings as SettingsIcon, 
  Gamepad2, 
  Globe, 
  Lock, 
  Zap, 
  Palette,
  Volume2,
  VolumeX,
  X,
  LogOut,
  Calendar,
  PlayCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from '../firebase';

interface LobbyProps {
  onJoinRoom: (roomId: string, mode: string, difficulty: string, isRanked: boolean, isSingleplayer: boolean) => void;
  onShowLeaderboard: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export default function Lobby({ onJoinRoom, onShowLeaderboard, theme, setTheme, soundEnabled, setSoundEnabled }: LobbyProps) {
  const [roomInput, setRoomInput] = useState('');
  const [mode, setMode] = useState('1v1');
  const [difficulty, setDifficulty] = useState('medium');
  const [isRanked, setIsRanked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const themes = {
    default: { bg: 'bg-[#E4E3E0]', card: 'bg-white', text: 'text-[#141414]', accent: 'bg-[#141414]' },
    dark: { bg: 'bg-[#141414]', card: 'bg-[#242424]', text: 'text-white', accent: 'bg-white' },
    vibrant: { bg: 'bg-purple-100', card: 'bg-white', text: 'text-purple-900', accent: 'bg-purple-600' },
    forest: { bg: 'bg-emerald-50', card: 'bg-white', text: 'text-emerald-900', accent: 'bg-emerald-600' }
  };

  const currentTheme = themes[theme as keyof typeof themes] || themes.default;

  const handleCreateRoom = (isSingleplayer = false) => {
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const isSoloMode = mode === 'daily' || mode === 'free';
    onJoinRoom(roomId, isSoloMode ? mode : (isSingleplayer ? 'solo' : mode), difficulty, isRanked, isSingleplayer || isSoloMode);
  };

  const handleJoinRoom = () => {
    if (roomInput.trim()) {
      onJoinRoom(roomInput.toUpperCase(), mode, difficulty, isRanked, false);
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500 flex flex-col items-center p-4 md:p-8", currentTheme.bg)}>
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", currentTheme.accent)}>
            <Gamepad2 className={cn("w-8 h-8", theme === 'dark' ? 'text-black' : 'text-white')} />
          </div>
          <h1 className={cn("text-4xl font-black tracking-tighter uppercase", currentTheme.text)}>
            Wordle<span className="italic font-serif">Multi</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className={cn("p-3 border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all", currentTheme.card, currentTheme.text)}
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={onShowLeaderboard}
            className={cn("p-3 border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all", currentTheme.card, currentTheme.text)}
          >
            <Trophy className="w-6 h-6" />
          </button>
          <button 
            onClick={signOut}
            className="p-3 bg-[#141414] text-white hover:bg-red-600 transition-colors border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Game Section - Always Light Card */}
        <section className="bg-white border-4 border-[#141414] p-8 shadow-[12px_12px_0px_0px_#141414]">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3 text-[#141414]">
            <Plus className="w-6 h-6" />
            Create Game
          </h2>

          <div className="space-y-8">
            {/* Mode Selection */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-4 text-[#141414]">Game Mode</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: '1v1', label: '1 vs 1', icon: Users },
                  { id: 'coop', label: 'Co-op', icon: Globe },
                  { id: 'daily', label: 'Daily', icon: Calendar },
                  { id: 'free', label: 'Free Play', icon: PlayCircle }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      "flex items-center justify-center gap-2 p-4 border-2 border-[#141414] font-bold uppercase transition-all",
                      mode === m.id ? "bg-[#141414] text-white translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white text-[#141414] shadow-[4px_4px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    )}
                  >
                    <m.icon className="w-4 h-4" />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-4 text-[#141414]">Difficulty</label>
              <div className="flex gap-4">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 py-3 border-2 border-[#141414] font-bold uppercase text-xs transition-all",
                      difficulty === d ? "bg-[#141414] text-white" : "bg-white text-[#141414] hover:bg-[#141414]/5"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Ranked Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#141414]/5 border-2 border-[#141414]">
              <div className="flex items-center gap-3">
                <Zap className={cn("w-5 h-5", isRanked ? "text-yellow-500 fill-yellow-500" : "text-[#141414]")} />
                <span className="font-black uppercase text-sm text-[#141414]">Ranked Match</span>
              </div>
              <button
                onClick={() => setIsRanked(!isRanked)}
                className={cn(
                  "w-12 h-6 rounded-full border-2 border-[#141414] relative transition-colors",
                  isRanked ? "bg-yellow-500" : "bg-white"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 rounded-full bg-[#141414] transition-all",
                  isRanked ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            {/* Mode Description */}
            <div className="p-4 bg-[#141414]/5 border-2 border-[#141414] rounded-lg">
              <p className="text-[10px] font-mono text-[#141414]/60 uppercase leading-relaxed">
                {mode === '1v1' && "Compete head-to-head with another player. First to solve wins."}
                {mode === 'coop' && "Work together with friends to solve the puzzle. Shared guesses."}
                {mode === 'daily' && "One word per day. Everyone gets the same challenge. Can you beat the average?"}
                {mode === 'free' && "Infinite play. No streaks, no pressure. Just pure Wordle fun."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {mode === 'daily' || mode === 'free' ? (
                <button
                  onClick={() => handleCreateRoom(true)}
                  className="col-span-2 bg-[#141414] text-white border-4 border-[#141414] py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  Start {mode === 'daily' ? 'Daily Challenge' : 'Free Play'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleCreateRoom(true)}
                    className="bg-white text-[#141414] border-4 border-[#141414] py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    Solo
                  </button>
                  <button
                    onClick={() => handleCreateRoom(false)}
                    className="bg-[#141414] text-white border-4 border-[#141414] py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    Create
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Join Room Section - Always Light Card */}
        <section className="bg-white border-4 border-[#141414] p-8 shadow-[12px_12px_0px_0px_#141414] flex flex-col">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3 text-[#141414]">
            <Users className="w-6 h-6" />
            Join Room
          </h2>

          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-[#141414]">Room Code</label>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="w-full bg-white border-4 border-[#141414] p-6 text-3xl font-black uppercase tracking-[0.5em] text-center focus:outline-none focus:bg-[#141414]/5 text-[#141414]"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!roomInput.trim()}
              className="w-full bg-[#141414] text-white border-4 border-[#141414] py-6 font-black uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Join Game
            </button>
          </div>

          <div className="mt-12 p-6 border-2 border-dashed border-[#141414]/30 rounded-xl">
            <p className="text-xs font-mono text-[#141414]/60 uppercase leading-relaxed">
              Enter a 6-character room code to join an existing session. Make sure you're using the same difficulty as the host.
            </p>
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white border-4 border-[#141414] p-8 shadow-[16px_16px_0px_0px_#141414]"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-[#141414]" />
              </button>

              <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-[#141414]">Settings</h2>

              <div className="space-y-8">
                {/* Sound Setting */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#141414] rounded-lg">
                      {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm text-[#141414]">Sound Effects</p>
                      <p className="text-[10px] font-mono text-[#141414]/60 uppercase">Toggle game audio</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                      "w-14 h-7 rounded-full border-2 border-[#141414] relative transition-colors",
                      soundEnabled ? "bg-green-500" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-[#141414] transition-all",
                      soundEnabled ? "left-8" : "left-1"
                    )} />
                  </button>
                </div>

                {/* Theme Setting */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#141414] rounded-lg">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black uppercase text-sm text-[#141414]">Theme</p>
                      <p className="text-[10px] font-mono text-[#141414]/60 uppercase">Change UI appearance</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'default', name: 'Classic', color: 'bg-[#E4E3E0]' },
                      { id: 'dark', name: 'Midnight', color: 'bg-[#141414]' },
                      { id: 'vibrant', name: 'Vibrant', color: 'bg-purple-500' },
                      { id: 'forest', name: 'Forest', color: 'bg-emerald-500' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "flex items-center gap-2 p-3 border-2 border-[#141414] font-bold uppercase text-xs transition-all",
                          theme === t.id ? "bg-[#141414] text-white" : "bg-white text-[#141414] hover:bg-[#141414]/5"
                        )}
                      >
                        <div className={cn("w-3 h-3 rounded-full border border-[#141414]", t.color)} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-10 bg-[#141414] text-white py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="mt-auto pt-12 pb-8 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 opacity-40">
        <p className={cn("text-[10px] font-mono uppercase tracking-[0.2em]", currentTheme.text)}>© 2026 WordleMulti v2.0.0</p>
        <div className="flex gap-8">
          <a href="#" className={cn("text-[10px] font-mono uppercase tracking-[0.2em] hover:opacity-100 transition-opacity", currentTheme.text)}>Terms</a>
          <a href="#" className={cn("text-[10px] font-mono uppercase tracking-[0.2em] hover:opacity-100 transition-opacity", currentTheme.text)}>Privacy</a>
          <a href="#" className={cn("text-[10px] font-mono uppercase tracking-[0.2em] hover:opacity-100 transition-opacity", currentTheme.text)}>Support</a>
        </div>
      </footer>
    </div>
  );
}
