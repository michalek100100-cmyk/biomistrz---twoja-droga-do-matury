import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ArrowLeft, Play, Hash, User as UserIcon, Swords, Plus, Edit3, Lock, Check, ChevronDown } from 'lucide-react';
import { UserStats } from '../types';

// Rank definitions
const RANKS = [
  { id: 0, name: 'Trawa Przed Domem', emoji: '🌱', color: 'from-green-400 to-emerald-500', border: 'border-green-500', minElo: 0 },
  { id: 1, name: 'Polana Wiedzy', emoji: '🌿', color: 'from-emerald-500 to-teal-600', border: 'border-teal-500', minElo: 400 },
  { id: 2, name: 'Las Odkrywcy', emoji: '🌲', color: 'from-teal-500 to-cyan-600', border: 'border-cyan-500', minElo: 800 },
  { id: 3, name: 'Góry Wytrwałości', emoji: '⛰️', color: 'from-cyan-500 to-blue-600', border: 'border-blue-500', minElo: 1200 },
  { id: 4, name: 'Dolina Mistrzów', emoji: '🏔️', color: 'from-blue-500 to-indigo-600', border: 'border-indigo-500', minElo: 1600 },
  { id: 5, name: 'Wieża Mędrców', emoji: '🏰', color: 'from-indigo-500 to-purple-600', border: 'border-purple-500', minElo: 2000 },
  { id: 6, name: 'Pałac Geniuszy', emoji: '👑', color: 'from-purple-500 to-pink-600', border: 'border-pink-500', minElo: 2400 },
  { id: 7, name: 'Olimp Biologów', emoji: '⚡', color: 'from-yellow-400 to-orange-500', border: 'border-yellow-500', minElo: 3000 },
];

// ELO reward milestones: every 100 ELO, increasing gem rewards
const ELO_REWARDS = Array.from({ length: 30 }, (_, i) => ({
  elo: (i + 1) * 100,
  gems: 10 + Math.floor(i / 5) * 5, // 10, 10, 10, 10, 10, 15, 15, 15, 15, 15, 20...
}));

interface MultiplayerHubProps {
  stats: UserStats;
  onBack: () => void;
  onCreateLobby: (type?: 'group' | 'charades') => void;
  onJoinLobby: (pin: string, nick: string) => void;
  onFind1v1Match: () => void;
  onClaimReward?: (milestone: number, gems: number) => void;
}

type GameMode = '1v1' | 'group' | 'charades';
type GroupView = 'menu' | 'join';

const MultiplayerHub: React.FC<MultiplayerHubProps> = ({
  stats,
  onBack,
  onCreateLobby,
  onJoinLobby,
  onFind1v1Match,
  onClaimReward
}) => {
  const [gameMode, setGameMode] = useState<GameMode>('1v1');
  const [groupView, setGroupView] = useState<GroupView>('menu');
  const [pin, setPin] = useState('');
  const [nick, setNick] = useState(stats.name);
  const [showRankPath, setShowRankPath] = useState(false);

  const userElo = stats.elo ?? 0;
  const claimedRewards = stats.claimedEloRewards ?? [];

  const currentRankIndex = useMemo(() => {
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (userElo >= RANKS[i].minElo) return i;
    }
    return 0;
  }, [userElo]);

  const currentRank = RANKS[currentRankIndex];
  const nextRank = RANKS[currentRankIndex + 1] || null;

  // Progress bar within current rank
  const progressInRank = useMemo(() => {
    if (!nextRank) return 100;
    const range = nextRank.minElo - currentRank.minElo;
    const progress = userElo - currentRank.minElo;
    return Math.min(100, Math.floor((progress / range) * 100));
  }, [userElo, currentRank, nextRank]);

  // Auto-scroll to current ELO position
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentEloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showRankPath && currentEloRef.current) {
      setTimeout(() => {
        currentEloRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [showRankPath]);

  const handleJoinSubmit = () => {
    if (pin.length < 6) { alert("Kod PIN musi mieć 6 cyfr!"); return; }
    if (!nick.trim()) { alert("Musisz podać nazwę!"); return; }
    onJoinLobby(pin, nick);
  };

  // ==================== RANK PATH VIEW ====================
  const renderRankPath = () => {
    // Build combined list: ranks + reward milestones, sorted by ELO descending
    type PathItem = { type: 'rank'; rank: typeof RANKS[0] } | { type: 'reward'; elo: number; gems: number };
    const pathItems: PathItem[] = [];

    RANKS.forEach(r => pathItems.push({ type: 'rank', rank: r }));
    ELO_REWARDS.forEach(r => pathItems.push({ type: 'reward', elo: r.elo, gems: r.gems }));

    // Sort descending by ELO (highest on top)
    pathItems.sort((a, b) => {
      const eloA = a.type === 'rank' ? a.rank.minElo : a.elo;
      const eloB = b.type === 'rank' ? b.rank.minElo : b.elo;
      return eloB - eloA;
    });

    return (
      <motion.div
        key="rankpath"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65] bg-gray-950 text-white flex flex-col"
      >
        {/* Header */}
        <div className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex items-center justify-between bg-gray-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-white/10">
          <button onClick={() => setShowRankPath(false)} className="p-2 bg-white/10 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentRank.emoji}</span>
            <span className="font-black text-sm">{currentRank.name}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 rounded-full border border-yellow-500/30">
            <span className="text-xs font-black text-yellow-400">🏆 {userElo}</span>
          </div>
        </div>

        {/* Scrollable Path */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-sm mx-auto relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-white/10 rounded-full" />

            {pathItems.map((item) => {
              if (item.type === 'rank') {
                const rank = item.rank;
                const isCurrentRank = rank.id === currentRankIndex;
                const isUnlocked = userElo >= rank.minElo;

                return (
                  <div
                    key={`rank-${rank.id}`}
                    ref={isCurrentRank ? currentEloRef : undefined}
                    className="relative mb-6"
                  >
                    {/* Connector dot */}
                    <div className={`absolute left-[26px] top-6 w-5 h-5 rounded-full border-2 z-10 ${isUnlocked ? `bg-gradient-to-br ${rank.color} border-white/50` : 'bg-gray-800 border-gray-600'}`} />

                    <div className={`ml-16 p-4 rounded-2xl border-2 transition-all ${isCurrentRank
                      ? `bg-gradient-to-br ${rank.color} border-white/30 shadow-2xl shadow-purple-500/20 scale-105`
                      : isUnlocked
                        ? 'bg-white/5 border-white/10'
                        : 'bg-gray-900/50 border-gray-800 opacity-50'
                      }`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-3xl ${!isUnlocked ? 'grayscale opacity-50' : ''}`}>{rank.emoji}</span>
                        <div>
                          <h3 className={`font-black text-sm tracking-tight ${isCurrentRank ? 'text-white' : isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                            {rank.name}
                          </h3>
                          <p className={`text-xs font-bold ${isCurrentRank ? 'text-white/70' : 'text-gray-500'}`}>
                            {rank.minElo} ELO
                          </p>
                        </div>
                      </div>
                      {isCurrentRank && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressInRank}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-white/80 rounded-full"
                            />
                          </div>
                          <span className="text-[10px] font-black text-white/70">{progressInRank}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Reward milestone
                const isClaimed = claimedRewards.includes(item.elo);
                const canClaim = userElo >= item.elo && !isClaimed;
                const isLocked = userElo < item.elo;
                const isNearCurrent = Math.abs(item.elo - userElo) < 50;

                return (
                  <div
                    key={`reward-${item.elo}`}
                    ref={isNearCurrent ? currentEloRef : undefined}
                    className="relative mb-4"
                  >
                    {/* Connector dot */}
                    <div className={`absolute left-[29px] top-3 w-3 h-3 rounded-full z-10 ${isClaimed ? 'bg-green-400' : canClaim ? 'bg-yellow-400 animate-pulse' : 'bg-gray-700'}`} />

                    <div className={`ml-16 p-3 rounded-xl flex items-center justify-between transition-all ${canClaim
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : isClaimed
                        ? 'bg-green-500/5 border border-green-500/20'
                        : 'bg-white/[0.02] border border-white/5'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          {item.elo} ELO
                        </span>
                        <div className="flex items-center gap-1">
                          <img src="/Kasztany.png" alt="Kasztan" className="w-4 h-4 object-contain" />
                          <span className={`text-xs font-black ${canClaim ? 'text-yellow-400' : isClaimed ? 'text-green-400' : 'text-gray-500'}`}>
                            +{item.gems}
                          </span>
                        </div>
                      </div>

                      {isClaimed ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] font-black text-green-400">ODEBRANO</span>
                        </div>
                      ) : canClaim ? (
                        <button
                          onClick={() => onClaimReward?.(item.elo, item.gems)}
                          className="px-3 py-1.5 bg-yellow-500 text-black rounded-lg text-[10px] font-black uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all shadow-lg shadow-yellow-500/30"
                        >
                          ODBIERZ
                        </button>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-700" />
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50  flex flex-col animate-in slide-in-from-right duration-300">
      {/* Rank Path Overlay */}
      <AnimatePresence>
        {showRankPath && renderRankPath()}
      </AnimatePresence>

      {/* Header */}
      <div className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex items-center justify-between bg-white/80  backdrop-blur-md sticky top-0 z-20">
        <button
          onClick={groupView === 'join' ? () => setGroupView('menu') : onBack}
          className="p-2 bg-gray-100  rounded-full text-gray-600  hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full">
          <Swords className="w-4 h-4 text-white" />
          <span className="text-xs font-black uppercase text-white tracking-widest">Arena</span>
        </div>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100  rounded-full">
          <span className="text-xs font-black text-yellow-600 ">🏆 {userElo}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 space-y-8 max-w-lg mx-auto w-full overflow-hidden text-center">
        <AnimatePresence mode='wait'>
          {gameMode === '1v1' ? (
            <motion.div key="1v1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center space-y-6">
              {/* Current Rank Display - Clickable */}
              <button
                onClick={() => setShowRankPath(true)}
                className="w-full flex flex-col items-center group"
              >
                <div className={`w-40 h-40 bg-gradient-to-br ${currentRank.color} rounded-[3rem] flex items-center justify-center shadow-2xl relative overflow-hidden group-hover:scale-105 transition-transform`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                  <span className="text-7xl drop-shadow-lg">{currentRank.emoji}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-white  rounded-full shadow-lg">
                    <span className="text-[10px] font-black uppercase text-gray-600 ">Twoja ranga</span>
                  </div>
                </div>
                <h2 className="mt-6 text-2xl font-black text-gray-900 ">{currentRank.name}</h2>
                <p className="text-sm font-bold text-gray-400  mt-1">
                  {currentRank.minElo} ELO {nextRank ? `→ ${nextRank.minElo} ELO` : '(MAX)'}
                </p>

                {/* Progress bar */}
                {nextRank && (
                  <div className="w-full max-w-[200px] mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-gray-200  rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressInRank}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${currentRank.color} rounded-full`}
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-400">{progressInRank}%</span>
                  </div>
                )}

                <div className="flex items-center gap-1 mt-3 text-gray-400  group-hover:text-purple-500 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Zobacz ranking i nagrody</span>
                </div>
              </button>

              <button onClick={onFind1v1Match} className="w-full max-w-xs py-5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <Play className="w-7 h-7 fill-white" /> GRAJ
              </button>
            </motion.div>
          ) : gameMode === 'charades' ? (
            <motion.div key="charades" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col items-center space-y-8">
              {groupView === 'menu' ? (
                <div className="w-full space-y-8">
                  <div className="space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                      <Edit3 className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 ">Biologiczne Kalambury</h1>
                    <p className="text-gray-500  font-medium text-sm max-w-[280px] mx-auto">Jeden rysuje, drugi zgaduje! Graj ze znajomymi.</p>
                  </div>

                  <div className="w-full space-y-4">
                    <button onClick={() => setGroupView('join')} className="w-full p-5 bg-white  rounded-2xl border-2 border-purple-100  shadow-lg flex items-center gap-5 hover:border-purple-300 transition-all">
                      <div className="w-14 h-14 bg-purple-100  rounded-xl flex items-center justify-center shrink-0">
                        <Play className="w-7 h-7 text-purple-600  ml-0.5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-gray-800 ">Dołącz do znajomych</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Wpisz kod PIN</p>
                      </div>
                    </button>

                    <button onClick={() => onCreateLobby('charades')} className="w-full p-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl flex items-center gap-5 text-white active:scale-95 transition-transform">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                        <Plus className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black">Utwórz pokój</h3>
                        <p className="text-xs text-purple-200 font-bold uppercase tracking-wider">Gra prywatna</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-gray-800 ">Dołącz do Kalamburów</h2>
                    <p className="text-gray-500 text-sm">Podaj kod PIN pokoju</p>
                  </div>
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2 tracking-widest">Twoja nazwa</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-gray-100  rounded-2xl font-bold text-gray-800  focus:border-purple-500 outline-none transition-colors" placeholder="Twój Nick" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2 tracking-widest">Kod PIN</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="number" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-gray-100  rounded-2xl font-black text-2xl text-gray-800  focus:border-purple-500 outline-none transition-colors tracking-widest" placeholder="000000" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleJoinSubmit} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-purple-200  transition-all active:scale-95">Wejdź do pokoju</button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full space-y-8">
              {groupView === 'menu' ? (
                <div className="w-full space-y-8">
                  <div className="space-y-2">
                    <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-xl mb-4">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 ">Wyzwanie Grupowe</h1>
                    <p className="text-gray-500  font-medium text-sm">Rywalizuj z przyjaciółmi w czasie rzeczywistym</p>
                  </div>
                  <div className="w-full space-y-4">
                    <button onClick={() => setGroupView('join')} className="w-full p-5 bg-white  rounded-2xl border-2 border-purple-100  shadow-lg flex items-center gap-5 hover:border-purple-300 transition-all">
                      <div className="w-14 h-14 bg-purple-100  rounded-xl flex items-center justify-center shrink-0">
                        <Play className="w-7 h-7 text-purple-600  ml-0.5" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black text-gray-800 ">Dołącz do gry</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mam kod PIN</p>
                      </div>
                    </button>
                    <button onClick={() => onCreateLobby('group')} className="w-full p-5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl flex items-center gap-5 text-white active:scale-95 transition-transform">
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0 backdrop-blur-sm">
                        <Plus className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-black">Utwórz pokój</h3>
                        <p className="text-xs text-purple-200 font-bold uppercase tracking-wider">Jestem organizatorem</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-gray-800 ">Podaj dane wejściowe</h2>
                    <p className="text-gray-500 text-sm">Poproś organizatora o kod PIN</p>
                  </div>
                  <div className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2 tracking-widest">Twoja nazwa</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={nick} onChange={(e) => setNick(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-gray-100  rounded-2xl font-bold text-gray-800  focus:border-purple-500 outline-none transition-colors" placeholder="Twój Nick" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400 ml-2 tracking-widest">Kod PIN</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="number" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white  border-2 border-gray-100  rounded-2xl font-black text-2xl text-gray-800  focus:border-purple-500 outline-none transition-colors tracking-widest" placeholder="000000" />
                      </div>
                    </div>
                  </div>
                  <button onClick={handleJoinSubmit} className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-purple-200  transition-all active:scale-95">Wejdź do gry</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95  backdrop-blur-xl border-t border-gray-100  pb-[env(safe-area-inset-bottom)] px-6 pt-3 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-around gap-4">
          <button onClick={() => setGameMode('1v1')} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${gameMode === '1v1' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' : 'bg-gray-100  text-gray-500 '}`}>
            <Swords className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-wide">1v1</span>
          </button>
          <button onClick={() => { setGameMode('group'); setGroupView('menu'); }} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${gameMode === 'group' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-100  text-gray-500 '}`}>
            <Users className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-wide">Grupa</span>
          </button>
          <button onClick={() => setGameMode('charades')} className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${gameMode === 'charades' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'bg-gray-100  text-gray-500 '}`}>
            <Edit3 className="w-6 h-6" /> <span className="text-[10px] font-black uppercase tracking-wide">Kalambury</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerHub;