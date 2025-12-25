import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig'; // Upewnij się, że ścieżka jest dobra
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

  // Funkcja pobierająca dane z Firebase
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        // Pobierz kolekcję 'users', posortuj malejąco po 'xp', weź top 50
        const q = query(
          collection(db, 'users'),
          orderBy('xp', 'desc'),
          limit(50)
        );

        const querySnapshot = await getDocs(q);
        const fetchedUsers: RankingUser[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedUsers.push({
            id: doc.id,
            name: data.name || 'Anonim',
            xp: data.xp || 0,
            streak: data.streak || 0,
            avatar: data.avatar || '',
          });
        });

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Błąd pobierania rankingu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  // Funkcja pomocnicza do kolorów medali
  const getPlaceColor = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-100 text-yellow-600 border-yellow-300'; // Złoto
      case 1: return 'bg-gray-100 text-gray-500 border-gray-300';       // Srebro
      case 2: return 'bg-orange-100 text-orange-600 border-orange-300'; // Brąz
      default: return 'bg-white text-gray-600 border-gray-100';
    }
  };

  const getPlaceIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Medal className="w-5 h-5 text-orange-500" />;
      default: return <span className="font-bold text-gray-400 text-sm">#{index + 1}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
        <Trophy className="w-12 h-12 animate-bounce text-purple-300" />
        <p className="font-bold animate-pulse">Szukam mistrzów...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
      {/* Nagłówek */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-200" />
          Ranking Mistrzów
        </h2>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
          Najlepsi z najlepszych
        </p>
      </div>

      {/* TOP 3 - Podium */}
      {users.length >= 3 && (
        <div className="flex justify-center items-end gap-4 mb-8">
          {/* 2. Miejsce */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 bg-gray-100 overflow-hidden relative">
               {users[1].avatar ? <img src={users[1].avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-gray-300" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-xs text-gray-600 truncate w-20">{users[1].name}</p>
              <p className="font-black text-sm text-purple-600">{users[1].xp} XP</p>
            </div>
            <div className="bg-gray-200 w-16 h-24 rounded-t-lg flex items-start justify-center pt-2 font-black text-2xl text-white shadow-inner">2</div>
          </div>

          {/* 1. Miejsce */}
          <div className="flex flex-col items-center gap-2 -mt-8">
             <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
            <div className="w-20 h-20 rounded-full border-4 border-yellow-300 bg-yellow-50 overflow-hidden relative shadow-lg shadow-yellow-200/50">
               {users[0].avatar ? <img src={users[0].avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-yellow-200" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-sm text-gray-800 truncate w-24">{users[0].name}</p>
              <p className="font-black text-lg text-purple-600">{users[0].xp} XP</p>
            </div>
            <div className="bg-gradient-to-b from-yellow-300 to-yellow-400 w-20 h-32 rounded-t-lg flex items-start justify-center pt-4 font-black text-4xl text-white shadow-inner">1</div>
          </div>

          {/* 3. Miejsce */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 bg-orange-50 overflow-hidden relative">
               {users[2].avatar ? <img src={users[2].avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-orange-200" />}
            </div>
            <div className="text-center">
              <p className="font-bold text-xs text-gray-600 truncate w-20">{users[2].name}</p>
              <p className="font-black text-sm text-purple-600">{users[2].xp} XP</p>
            </div>
            <div className="bg-orange-300 w-16 h-16 rounded-t-lg flex items-start justify-center pt-2 font-black text-2xl text-white shadow-inner">3</div>
          </div>
        </div>
      )}

      {/* Lista pozostałych (4+) */}
      <div className="space-y-3">
        {users.slice(3).map((user, index) => (
          <div 
            key={user.id} 
            className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center text-gray-400 font-black">
                {index + 4}.
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-gray-300" />}
              </div>
              <div>
                <p className="font-bold text-gray-700 text-sm">{user.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold">
                  <Flame className="w-3 h-3 fill-orange-500" /> {user.streak} dni
                </div>
              </div>
            </div>
            
            <div className="font-black text-purple-600 text-sm">
              {user.xp} XP
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            Jeszcze nikt nie zdobył punktów. Bądź pierwszy!
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardSection;