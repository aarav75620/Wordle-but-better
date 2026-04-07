import React, { useState } from 'react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'lucide-react';

interface UsernameSelectionProps {
  userId: string;
  onComplete: (username: string) => void;
}

export default function UsernameSelection({ userId, onComplete }: UsernameSelectionProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (username.length > 15) {
      setError('Username must be less than 15 characters');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { username });
      onComplete(username);
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E4E3E0] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-[#141414] p-8 max-w-md w-full shadow-[12px_12px_0px_0px_#141414]"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#141414] p-2 rounded-lg">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Choose Username</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="CoolPlayer_123"
              className="w-full bg-white border-4 border-[#141414] p-4 text-xl font-bold focus:outline-none focus:bg-[#141414]/5"
              maxLength={15}
              disabled={loading}
            />
            {error && <p className="text-red-500 text-xs mt-2 font-bold uppercase">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !username}
            className="w-full bg-[#141414] text-white border-4 border-[#141414] py-4 font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_#141414] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving...' : 'Start Playing'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
