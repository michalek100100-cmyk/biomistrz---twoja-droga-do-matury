// src/components/TopBar.tsx
// Kompaktowy TopBar dla mobile - tylko najważniejsze elementy
import React, { useEffect, useState } from 'react';
import { Flame, PackageOpen } from 'lucide-react';
import { UserStats } from '../types';
import { xpToLevel, getTierFromElo, getPlayerRanking, TierInfo, INITIAL_ELO } from '../services/rankingService';
import InventoryModal from './InventoryModal';

interface TopBarProps {
  stats: UserStats;
  userId?: string;
  onNavigate: (tab: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ stats, userId, onNavigate }) => {
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [elo, setElo] = useState<number>(INITIAL_ELO);
  const [showInventory, setShowInventory] = useState(false);

  const level = xpToLevel(stats.xp);

  // Fetch ranking on mount
  useEffect(() => {
    if (!userId) return;

    const fetchRanking = async () => {
      try {
        const ranking = await getPlayerRanking(userId);
        setElo(ranking.elo);
        setTierInfo(getTierFromElo(ranking.elo));
      } catch (error) {
        console.error('Failed to fetch ranking:', error);
        setTierInfo(getTierFromElo(INITIAL_ELO));
      }
    };

    fetchRanking();
  }, [userId]);

  return (
    <>
      <div
        className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] md:pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-xl border-b sticky top-0 z-40 bg-[#2ca02c]/80 border-[#228b22]/30 transition-all duration-300"
      >

        {/* LEFT: Streak with warning */}
        {(() => {
          // Calculate hours until midnight Polish time (Europe/Warsaw)
          const now = new Date();
          const polandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
          const hoursUntilMidnight = 24 - polandTime.getHours() - (polandTime.getMinutes() / 60);

          // Show warning if less than 5 hours left (19:00+) and goal not complete
          const isWarning = hoursUntilMidnight <= 5 && !stats.dailyGoalCompleted && stats.streak > 0;

          return (
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full transition-all ${isWarning
                ? 'bg-red-100 animate-pulse ring-2 ring-red-500/50'
                : 'bg-orange-50'
                }`}>
                <Flame className={`w-5 h-5 md:w-6 md:h-6 ${isWarning ? 'text-red-500 fill-red-500' : 'text-orange-500 fill-orange-500'}`} />
                <span className={`font-black text-sm md:text-base ${isWarning ? 'text-red-600' : 'text-orange-600'}`}>
                  {stats.streak}
                </span>
                {isWarning && (
                  <span className="text-red-500 font-black text-sm md:text-base animate-bounce">!</span>
                )}
              </div>

              {/* INVENTORY BUTTON */}
              <button
                onClick={() => setShowInventory(true)}
                className="p-1.5 md:p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-full transition-colors border border-purple-500/30 text-purple-600 shadow-sm"
              >
                <PackageOpen className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          );
        })()}

        {/* CENTER: ELO Badge (klikalne → ranking) */}
        {tierInfo && (
          <button
            onClick={() => onNavigate('leaderboard')}
            className={`flex items-center gap-2 md:gap-3 px-4 py-1.5 md:px-6 md:py-2.5 rounded-full ${tierInfo.bgColor} border border-white/20 shadow-sm hover:scale-105 active:scale-95 transition-transform`}
          >
            <span className="text-lg md:text-xl">{tierInfo.icon}</span>
            <span className={`font-black text-sm md:text-lg ${tierInfo.color}`}>{elo}</span>
          </button>
        )}

        {/* RIGHT: Avatar + Level (klikalne → profil) */}
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity"
        >
          <div className="text-right hidden xs:block">
            {stats.activeTitle && (
              <p className="text-[9px] md:text-[11px] font-black text-purple-200 uppercase tracking-widest leading-none mb-0.5 max-w-[80px] md:max-w-[120px] truncate">
                {stats.activeTitle}
              </p>
            )}
            <p className="text-xs md:text-lg font-black text-white leading-none truncate max-w-[80px] md:max-w-[120px]">
              {stats.name}
            </p>
            <p className="text-[10px] md:text-sm font-bold text-white/70 uppercase">
              Lvl {level}
            </p>
          </div>

          <div className="relative">
            <img
              src={stats.avatar || `https://picsum.photos/seed/${stats.name}/40/40`}
              alt="Avatar"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 md:border-[3px] border-purple-500 object-cover bg-gray-100"
            />
            {/* Level badge */}
            <div className="absolute -bottom-1 -right-1 md:-bottom-1.5 md:-right-1.5 bg-purple-500 text-white text-[10px] md:text-xs font-black w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center border-2 border-white">
              {level}
            </div>
          </div>
        </button>
      </div>

      {
        showInventory && userId && (
          <InventoryModal userId={userId} onClose={() => setShowInventory(false)} />
        )
      }
    </>
  );
};

export default TopBar;