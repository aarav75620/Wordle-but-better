import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, User, ChevronLeft, Loader2, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardProps {
  onBack: () => void;
}

interface UserStats {
  uid: string;
  username: string;
  stats: {
    wins: number;
    streak: number;
    avgGuesses: number;
    totalGames: number;
  };
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('stats.wins', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserStats[];
      setUsers(userData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', 'users');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#E4E3E0] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center gap-6 border-b-2 border-[#141414] pb-6">
          <button 
            onClick={onBack}
            className="p-3 bg-[#141414] text-white hover:bg-[#141414]/80 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-5xl font-bold tracking-tighter text-[#141414] uppercase">
            Global <span className="italic font-serif">Rankings</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#141414]" />
            <p className="font-mono font-bold uppercase tracking-widest opacity-50">Fetching Champions...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] flex items-center justify-between group hover:translate-x-2 transition-transform"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#141414] text-white flex items-center justify-center font-bold text-xl rounded-sm">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                      {user.username}
                      {index < 3 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                    </h3>
                    <p className="text-xs font-mono opacity-50 uppercase tracking-widest">
                      {user.stats?.totalGames || 0} Games Played
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                  <div className="text-center">
                    <div className="text-2xl font-bold tracking-tighter">{user.stats?.wins || 0}</div>
                    <div className="text-[10px] font-mono opacity-50 uppercase font-bold">Wins</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="text-2xl font-bold tracking-tighter">{user.stats?.streak || 0}</div>
                    <div className="text-[10px] font-mono opacity-50 uppercase font-bold">Streak</div>
                  </div>
                  <div className="text-center hidden sm:block">
                    <div className="text-2xl font-bold tracking-tighter">{(user.stats?.avgGuesses || 0).toFixed(1)}</div>
                    <div className="text-[10px] font-mono opacity-50 uppercase font-bold">Avg Guesses</div>
                  </div>
                  <div className="w-12 h-12 flex items-center justify-center">
                    {index === 0 && <Trophy className="w-8 h-8 text-yellow-500" />}
                    {index === 1 && <Medal className="w-8 h-8 text-gray-400" />}
                    {index === 2 && <Medal className="w-8 h-8 text-amber-600" />}
                  </div>
                </div>
              </motion.div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-20 bg-white border-2 border-dashed border-[#141414]/20">
                <p className="font-mono font-bold uppercase opacity-50">No rankings yet. Be the first!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
