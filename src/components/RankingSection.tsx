// src/components/RankingSection.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Flame, TrendingUp, TrendingDown, Swords, ChevronRight, Loader2 } from 'lucide-react';
import {
    getPlayerRanking,
    getTierFromElo,
    getProgressToNextTier,
    getWinrate,
    getTopPlayers,
    TIERS,
    PlayerRanking,
    TierInfo,
    TopPlayer
} from '../services/rankingService';

interface RankingSectionProps {
    userId: string;
    onStartMatch?: () => void;
}

const RankingSection: React.FC<RankingSectionProps> = ({ userId, onStartMatch }) => {
    const [ranking, setRanking] = useState<PlayerRanking | null>(null);
    const [loading, setLoading] = useState(true);
    const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
    const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                const data = await getPlayerRanking(userId);
                setRanking(data);
                setTierInfo(getTierFromElo(data.elo));
            } catch (error) {
                console.error('Failed to load ranking:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchTopPlayers = async () => {
            try {
                const top = await getTopPlayers();
                setTopPlayers(top);
            } catch (error) {
                console.error('Failed to load top players:', error);
            }
        };

        if (userId) {
            fetchRanking();
            fetchTopPlayers();
        }
    }, [userId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
                <p className="font-bold animate-pulse">Ładowanie rankingu...</p>
            </div>
        );
    }

    if (!ranking || !tierInfo) {
        return (
            <div className="text-center text-gray-400 py-10">
                Nie udało się załadować rankingu
            </div>
        );
    }

    const progress = getProgressToNextTier(ranking.elo);
    const winrate = getWinrate(ranking.wins, ranking.losses);
    const tierIndex = TIERS.findIndex(t => t.tier === tierInfo.tier);
    const nextTier = tierIndex < TIERS.length - 1 ? TIERS[tierIndex + 1] : null;

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-black text-gray-800  flex items-center justify-center gap-2">
                    <Swords className="w-8 h-8 text-red-500" />
                    Ranking 1v1
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                    Twoja pozycja w pojedynkach
                </p>
            </div>

            {/* Podium Section */}
            {topPlayers.length >= 3 && (
                <div className="relative w-screen sm:w-full mb-6 mx-[-1rem] sm:mx-0 overflow-visible">
                    {/* Container with aspect ratio to preserve SVG proportions */}
                    <div className="relative w-full" style={{ aspectRatio: '1131.83 / 701.92' }}>
                        {/* Layer 1: Background SVG */}
                        <img
                            src="/ranking_background.svg"
                            alt="Podium background"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ zIndex: 1 }}
                        />

                        {/* Layer 2: Avatars in windows */}
                        <div className="absolute inset-0" style={{ zIndex: 10 }}>
                            {/* Position #2 (left window) */}
                            <div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ top: '42%', left: '25%' }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                    className="relative"
                                >
                                    {topPlayers[1]?.avatar ? (
                                        <img
                                            src={topPlayers[1].avatar}
                                            alt={topPlayers[1].username}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-400 object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-400 bg-gray-500 flex items-center justify-center text-2xl">
                                            🥈
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Position #1 (center window) */}
                            <div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ top: '28%', left: '50%' }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.1, duration: 0.5 }}
                                    className="relative"
                                >
                                    {topPlayers[0]?.avatar ? (
                                        <img
                                            src={topPlayers[0].avatar}
                                            alt={topPlayers[0].username}
                                            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 bg-yellow-500 flex items-center justify-center text-3xl shadow-lg">
                                            🥇
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Position #3 (right window) */}
                            <div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ top: '42%', left: '75%' }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="relative"
                                >
                                    {topPlayers[2]?.avatar ? (
                                        <img
                                            src={topPlayers[2].avatar}
                                            alt={topPlayers[2].username}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-600 object-cover"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-600 bg-orange-500 flex items-center justify-center text-2xl">
                                            🥉
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Layer 3: Overlay SVG */}
                        <img
                            src="/ranking_overlay.svg"
                            alt="Podium overlay"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ zIndex: 20 }}
                        />

                        {/* Layer 4: "Podium" text */}
                        <div
                            className="absolute -translate-x-1/2"
                            style={{ bottom: '8%', left: '50%', zIndex: 30 }}
                        >
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-2xl md:text-3xl font-black text-white tracking-wider"
                                style={{
                                    fontFamily: "'Comfortaa', 'Nunito', 'Segoe UI', system-ui, sans-serif",
                                    textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)'
                                }}
                            >
                                Podium
                            </motion.h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Rank Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative overflow-hidden rounded-3xl p-6 ${tierInfo.bgColor} border-2 border-white/10`}
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 text-9xl opacity-10 -mr-4 -mt-4">
                    {tierInfo.icon}
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    {/* Tier Icon */}
                    <div className="text-6xl">{tierInfo.icon}</div>

                    {/* Tier Name */}
                    <div>
                        <h3 className={`text-3xl font-black ${tierInfo.color}`}>
                            {tierInfo.name}
                        </h3>
                        <p className="text-5xl font-black text-white mt-2">
                            {ranking.elo} <span className="text-xl text-gray-400">ELO</span>
                        </p>
                    </div>

                    {/* Progress to next tier */}
                    {nextTier && (
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>{tierInfo.name}</span>
                                <span>{nextTier.name}</span>
                            </div>
                            <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full ${tierInfo.color.replace('text-', 'bg-')} rounded-full`}
                                />
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                {nextTier.minElo - ranking.elo} ELO do awansu
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Wins */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
                    <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-green-500">{ranking.wins}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase">Wygrane</p>
                </div>

                {/* Losses */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
                    <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-red-500">{ranking.losses}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase">Przegrane</p>
                </div>

                {/* Winrate */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
                    <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-purple-500">{winrate}%</p>
                    <p className="text-xs font-bold text-gray-400 uppercase">Winrate</p>
                </div>

                {/* Best Streak */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 text-center">
                    <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-3xl font-black text-orange-500">{ranking.bestStreak}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase">Najlepsza seria</p>
                </div>
            </div>

            {/* Current Win Streak */}
            {ranking.winStreak > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <Flame className="w-8 h-8 text-white animate-pulse" />
                        <div>
                            <p className="text-white font-black text-lg">Seria zwycięstw!</p>
                            <p className="text-orange-100 text-sm font-bold">Nie daj się pokonać</p>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-white">{ranking.winStreak}</p>
                </motion.div>
            )}

            {/* Tier Progress List */}
            <div className="space-y-2">
                <h4 className="text-sm font-black uppercase text-gray-400 px-2">Drabinka rankingowa</h4>
                <div className="space-y-1">
                    {TIERS.slice().reverse().slice(0, 8).map((tier) => {
                        const isCurrentTier = tier.tier === tierInfo.tier;
                        const isAchieved = ranking.elo >= tier.minElo;

                        return (
                            <div
                                key={tier.tier}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${isCurrentTier
                                    ? `${tier.bgColor} border-2 border-white/30 scale-105`
                                    : isAchieved
                                        ? 'bg-white/5 opacity-60'
                                        : 'bg-gray-800/50 opacity-40'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{tier.icon}</span>
                                    <span className={`font-bold ${isCurrentTier ? tier.color : 'text-gray-400'}`}>
                                        {tier.name}
                                    </span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">
                                    {tier.minElo}+
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Find Match Button */}
            {onStartMatch && (
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onStartMatch}
                    className="w-full p-5 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-white font-black text-lg uppercase tracking-wider"
                >
                    <Swords className="w-6 h-6" />
                    Znajdź przeciwnika
                    <ChevronRight className="w-6 h-6" />
                </motion.button>
            )}

            {/* Season Info */}
            <div className="text-center text-xs text-gray-500 pt-4">
                <p>Sezon 1 • Rozegrane mecze: {ranking.seasonGames}</p>
            </div>
        </div>
    );
};

export default RankingSection;
