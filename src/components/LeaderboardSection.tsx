import React, { useEffect, useState } from 'react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { Trophy, Medal, Crown, User, Flame } from 'lucide-react';

interface RankingUser {
  id: string;
  name: string;
  xp: number;
  streak: number;
  avatar?: string;
}

const LeaderboardSection = () => {
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // Zwiększyłem limit do 500, żeby mieć pewność, że pobierzemy najlepszych,
        // dopóki nie naprawimy struktury bazy danych.
        const q = query(
          collection(db, 'users'),
          limit(500) 
        );

        const querySnapshot = await getDocs(q);
        const fetchedUsers: RankingUser[] = [];

        querySnapshot.forEach((doc) => {
          const rawData = doc.data();
          
          // Logika "Fallback" - szukamy w stats, a jak nie ma, to w głównym
          // Używamy operatora || (lub), co jest czytelniejsze
          const stats = rawData.stats || {};
          
          // Priorytet: stats -> rawData -> Domyślne
          const name = stats.name || rawData.name || rawData.displayName || 'Anonim';
          const xp = stats.xp ?? rawData.xp ?? 0; // Używam ?? żeby nie pominąć 0
          const streak = stats.streak ?? rawData.streak ?? 0;
          const avatar = stats.avatar || rawData.avatar || '';

          // Dodajemy do listy
          fetchedUsers.push({
            id: doc.id,
            name: name,
            xp: xp,
            streak: streak,
            avatar: avatar,
          });
        });

        // Sortowanie malejąco po XP
        fetchedUsers.sort((a, b) => b.xp - a.xp);

        // Bierzemy top 50 do wyświetlenia
        setUsers(fetchedUsers.slice(0, 50));
        
      } catch (error) {
        console.error("Błąd rankingu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
        <Trophy className="w-12 h-12 animate-bounce text-purple-300" />
        <p className="font-bold animate-pulse">Szukam mistrzów...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Nagłówek */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-black text-gray-800 dark:text-white flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-200" />
          Ranking Mistrzów
        </h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
          Najlepsi z najlepszych
        </p>
      </div>

      {/* TOP 3 - Podium */}
      {users.length > 0 && (
        <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8">
          
          {/* 2. Miejsce */}
          <div className={`flex flex-col items-center gap-2 w-1/3 ${!users[1] ? 'invisible' : ''}`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-gray-200 bg-gray-100 overflow-hidden relative shadow-md">
               {users[1]?.avatar ? <img src={users[1].avatar} alt={users[1].name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-gray-300" />}
            </div>
            <div className="text-center w-full">
              <p className="font-bold text-xs text-gray-600 dark:text-gray-300 truncate w-full px-1">{users[1]?.name}</p>
              <p className="font-black text-xs sm:text-sm text-purple-600">{users[1]?.xp || 0} XP</p>
            </div>
            <div className="bg-gray-200 w-full h-24 rounded-t-xl flex items-start justify-center pt-2 font-black text-2xl text-white shadow-inner border-t-4 border-gray-300">2</div>
          </div>

          {/* 1. Miejsce */}
          <div className="flex flex-col items-center gap-2 w-1/3 -mt-8 z-10">
             <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-300 bg-yellow-50 overflow-hidden relative shadow-lg shadow-yellow-200/50">
               {users[0].avatar ? <img src={users[0].avatar} alt={users[0].name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-yellow-200" />}
            </div>
            <div className="text-center w-full">
              <p className="font-bold text-sm text-gray-800 dark:text-white truncate w-full px-1">{users[0].name}</p>
              <p className="font-black text-sm sm:text-lg text-purple-600">{users[0].xp} XP</p>
            </div>
            <div className="bg-gradient-to-b from-yellow-300 to-yellow-400 w-full h-32 rounded-t-xl flex items-start justify-center pt-4 font-black text-4xl text-white shadow-inner border-t-4 border-yellow-200">1</div>
          </div>

          {/* 3. Miejsce */}
          <div className={`flex flex-col items-center gap-2 w-1/3 ${!users[2] ? 'invisible' : ''}`}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-orange-200 bg-orange-50 overflow-hidden relative shadow-md">
               {users[2]?.avatar ? <img src={users[2].avatar} alt={users[2].name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-orange-200" />}
            </div>
            <div className="text-center w-full">
              <p className="font-bold text-xs text-gray-600 dark:text-gray-300 truncate w-full px-1">{users[2]?.name}</p>
              <p className="font-black text-xs sm:text-sm text-purple-600">{users[2]?.xp || 0} XP</p>
            </div>
            <div className="bg-orange-300 w-full h-16 rounded-t-xl flex items-start justify-center pt-2 font-black text-2xl text-white shadow-inner border-t-4 border-orange-200">3</div>
          </div>
        </div>
      )}

      {/* Lista pozostałych (Miejsca 4+) */}
      <div className="space-y-3">
        {users.slice(3).map((user, index) => (
          <div 
            key={user.id} 
            className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 flex justify-center text-gray-400 font-black text-sm">
                {index + 4}.
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">{user.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold">
                  <Flame className="w-3 h-3 fill-orange-500" /> {user.streak} dni
                </div>
              </div>
            </div>
            
            <div className="font-black text-purple-600 dark:text-purple-400 text-sm">
              {user.xp} XP
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center text-gray-400 py-10 font-medium">
            Jeszcze nikt nie zdobył punktów. Bądź pierwszy! 🚀
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSection;