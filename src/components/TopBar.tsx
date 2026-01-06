import React from 'react';
import { Flame, Diamond, BookOpen, Trophy } from 'lucide-react';
import { UserStats } from '../types';

interface TopBarProps {
  stats: UserStats;
  onNavigate: (tab: string) => void; // NOWE: Funkcja do zmiany zakładki
  reviewCount: number;               // NOWE: Liczba powtórek do badge'a
}

const TopBar: React.FC<TopBarProps> = ({ stats, onNavigate, reviewCount }) => {
  return (
    <div className="flex items-center justify-between px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors duration-300">
      
      {/* LEWA STRONA: Statystyki */}
      <div className="flex gap-4 sm:gap-6">
        <div className="flex items-center gap-2 group cursor-pointer" title="Twój streak">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <span className="font-extrabold text-orange-500">{stats.streak}</span>
        </div>
        
        <div className="flex items-center gap-2 group cursor-pointer" title="Twoje klejnoty">
          <Diamond className="w-6 h-6 text-blue-400 fill-blue-400" />
          <span className="font-extrabold text-blue-400">{stats.gems}</span>
        </div>
      </div>
      
      {/* ŚRODEK / PRAWA STRONA: Nowe przyciski nawigacyjne */}
      <div className="flex items-center gap-2 md:gap-4 mr-auto ml-6 md:ml-12">
        
        {/* Przycisk Trening */}
        <button 
          onClick={() => onNavigate('practice')}
          className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors group"
          title="Trening / Powtórki"
        >
          <BookOpen className="w-6 h-6 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
          {reviewCount > 0 && (
             <span className="absolute top-1 right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 text-[8px] text-white font-bold items-center justify-center">
                 {/* Opcjonalnie: {reviewCount} jeśli chcesz liczbę, ale kropka jest czystsza */}
               </span>
             </span>
          )}
        </button>

        {/* Przycisk Ranking */}
        <button 
          onClick={() => onNavigate('leaderboard')}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors group"
          title="Ranking"
        >
          <Trophy className="w-6 h-6 group-hover:text-yellow-500 dark:group-hover:text-yellow-400 transition-colors" />
        </button>
      </div>

      {/* PRAWA STRONA: Profil */}
      <div className="flex items-center gap-3" onClick={() => onNavigate('profile')}>
        <div className="text-right hidden sm:block cursor-pointer">
          <p className="text-sm font-black text-gray-800 dark:text-white leading-none">
            {stats.name}
          </p>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            {stats.xp} XP
          </p>
        </div>
        
        <img 
          src={stats.avatar || `https://picsum.photos/seed/${stats.name}/32/32`} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover bg-gray-50 dark:bg-gray-800 cursor-pointer hover:scale-105 transition-transform"
        />
      </div>
    </div>
  );
};

export default TopBar;