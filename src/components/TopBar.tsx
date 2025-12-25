
import React from 'react';
import { Flame, Diamond } from 'lucide-react';
import { UserStats } from '../types';

interface TopBarProps {
  stats: UserStats;
}

const TopBar: React.FC<TopBarProps> = ({ stats }) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
      <div className="flex gap-6">
        <div className="flex items-center gap-2 group cursor-pointer" title="Twój streak">
          <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
          <span className="font-extrabold text-orange-500">{stats.streak}</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer" title="Twoje klejnoty">
          <Diamond className="w-6 h-6 text-blue-400 fill-blue-400" />
          <span className="font-extrabold text-blue-400">{stats.gems}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-black text-gray-800 leading-none">{stats.name}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stats.xp} XP</p>
        </div>
        <img 
          src={stats.avatar || `https://picsum.photos/seed/${stats.name}/32/32`} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover bg-gray-50"
        />
      </div>
    </div>
  );
};

export default TopBar;
