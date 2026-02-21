// src/components/HomePage.tsx
// Tile-based homepage with all app features
import React from 'react';
import { motion } from 'framer-motion';
import {
    Swords,
    Trophy,
    FileText,
    MessageSquare,
    Settings,
    Coffee,
    User,
    Flame,
    GraduationCap,
    Brain,
    Calendar,
    Shield
} from 'lucide-react';
import { UserStats } from '../types';
import LevelProgressBar from './LevelProgressBar';

interface HomePageProps {
    stats: UserStats;
    reviewCount: number;
    onNavigate: (tab: string) => void;
    onOpenMultiplayer: () => void;
    userId?: string;
    onClaimSuccess?: (level: number) => void;
    onWatchAd?: () => void;
}

interface TileItem {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgGradient: string;
    size: 'large' | 'medium' | 'small';
    badge?: number | string;
    external?: string;
    action?: 'multiplayer' | 'closet';
}

// --- PARAMETRY KROPEK KONTROLNYCH ---
const SHOW_DOTS = false; // Zmień na false, aby ukryć kropki
const DOTS_Y = 33;   // Pozycja pionowa (0-69)
const DOT_1_X = 50;  // Pozycja pozioma 1 kropki
const DOT_2_X = 120; // Pozycja pozioma 2 kropki (środek)
const DOT_3_X = 186; // Pozycja pozioma 3 kropki
// ------------------------------------

const PageBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden sm:rounded-b-[3rem]">
            {/* Unified Full-Page Nature SVG */}
            <svg
                viewBox="0 0 400 800"
                preserveAspectRatio="xMidYMin slice"
                className="w-full h-full opacity-100"
            >
                {/* Unified Full-Page Nature SVG (Transparent Background) */}

                {/* Flowing Botanical Vines */}
                <g opacity="0.4">
                    <path d="M-20 50C50 100 20 250 80 300S150 450 100 600" stroke="#1b4d3e" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <path d="M420 150C350 200 380 350 320 400S250 550 300 700" stroke="#1b4d3e" strokeWidth="10" fill="none" strokeLinecap="round" />
                </g>

                {/* Leaves and Flowers */}
                <g opacity="0.6">
                    {/* Top Left Cluster */}
                    <circle cx="20" cy="40" r="15" fill="#2d5a2d" />
                    <path d="M10 20C10 20 30 10 40 30C30 40 10 40 10 20Z" fill="#88c988" />

                    {/* Middle Right Cluster */}
                    <circle cx="380" cy="450" r="20" fill="#2d5a2d" />
                    <path d="M360 430C360 430 390 420 400 440C390 460 360 460 360 430Z" fill="#88c988" />

                    {/* Bottom Left Cluster */}
                    <path d="M30 750C30 750 60 740 70 760C60 780 30 780 30 750Z" fill="#88c988" opacity="0.3" />
                </g>

                {/* Subtle Texture/Noise Layer */}
                <rect width="400" height="800" fill="white" opacity="0.02" />
            </svg>

            {/* Glowing Accents */}
            <div className="absolute -left-24 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute -right-24 top-[20%] w-80 h-80 bg-green-500/10 rounded-full blur-[100px]"></div>
        </div>
    );
};

const StatsBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Transparent background (Main SVG is now in PageBackground) */}

            {/* Visual calibration dots (for development only) */}
            {SHOW_DOTS && (
                <div className="absolute inset-0">
                    <div
                        className="absolute w-2 h-2 bg-red-600 rounded-full"
                        style={{
                            left: `${(DOT_1_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                    <div
                        className="absolute w-2 h-2 bg-red-600 rounded-full"
                        style={{
                            left: `${(DOT_2_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                    <div
                        className="absolute w-2 h-2 bg-red-600 rounded-full"
                        style={{
                            left: `${(DOT_3_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ stats, reviewCount, onNavigate, onOpenMultiplayer, userId, onClaimSuccess, onWatchAd }) => {
    const tiles: TileItem[] = [
        {
            id: 'learn',
            label: 'Ucz się',
            description: 'Przeglądaj materiały',
            icon: GraduationCap,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'large'
        },
        {
            id: 'multiplayer',
            label: 'Arena 1v1',
            description: 'Pojedynki online',
            icon: Swords,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'large',
            action: 'multiplayer'
        },
        {
            id: 'practice',
            label: 'Powtórki',
            description: 'Ćwicz materiał',
            icon: Brain,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'medium',
            badge: reviewCount > 0 ? reviewCount : undefined
        },
        {
            id: 'clan',
            label: 'Klan',
            description: 'Twoja drużyna',
            icon: Shield,
            color: 'text-emerald-400',
            bgGradient: 'bg-transparent',
            size: 'medium'
        },
        {
            id: 'leaderboard',
            label: 'Ranking',
            description: 'Zobacz najlepszych',
            icon: Trophy,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'medium'
        },
        {
            id: 'exams',
            label: 'Arkusze',
            description: 'Zadania maturalne',
            icon: FileText,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'medium'
        },
        {
            id: 'friends',
            label: 'Znajomi',
            description: 'Twoi znajomi',
            icon: User,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'medium'
        },
        {
            id: 'profile',
            label: 'Profil',
            description: 'Twoje konto',
            icon: User,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'small'
        },
        {
            id: 'survey',
            label: 'Ankieta',
            description: 'Oceń aplikację',
            icon: MessageSquare,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'small'
        },
        {
            id: 'settings',
            label: 'Ustawienia',
            description: 'Dostosuj',
            icon: Settings,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'small'
        },
        {
            id: 'coffee',
            label: 'Wesprzyj',
            description: 'Kup mi kawę',
            icon: Coffee,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'small',
            external: 'https://buycoffee.to/biomistrz?tab=subs'
        },
        {
            id: 'calendar',
            label: 'Kalendarz',
            description: 'Twoje cele',
            icon: Calendar,
            color: 'text-orange-50',
            bgGradient: 'bg-transparent',
            size: 'medium'
        },
    ];

    const handleClick = (tile: TileItem) => {
        if (tile.external) {
            window.open(tile.external, '_blank');
        } else if (tile.action === 'multiplayer') {
            onOpenMultiplayer();
        } else {
            onNavigate(tile.id);
        }
    };

    const largeTiles = tiles.filter(t => t.size === 'large');
    const mediumTiles = tiles.filter(t => t.size === 'medium');
    const smallTiles = tiles.filter(t => t.size === 'small');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 pb-8 relative"
        >
            <PageBackground />
            {/* Welcome Header (Transparent Background - Integrated with PageBackground) */}
            <div className="relative -mx-4 md:-mx-8 -mt-6 overflow-hidden pt-3 pb-2 mb-0">
                {/* No local background color - using PageBackground */}

                {/* Glassy Grain/Texture */}
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

                <div className="relative z-10 text-center space-y-2">
                    <h1 className="text-4xl font-black text-green-900 stats-font break-words leading-tight px-6 tracking-tight drop-shadow-sm">
                        Witaj, {stats.name}!
                    </h1>
                    {userId && onClaimSuccess && (
                        <div className="px-8 mt-2">
                            <LevelProgressBar stats={stats} userId={userId} onClaimSuccess={onClaimSuccess} />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="relative overflow-hidden sm:rounded-2xl min-h-[110px] flex items-center justify-center -mx-4 md:-mx-8">
                {/* Background SVG */}
                <StatsBackground />

                {/* Stats Content - Pinned to Dots (Pixel Perfect Centering) */}
                <div className="absolute inset-0 z-10 text-green-900 pointer-events-none">
                    {/* XP - Dot 1 */}
                    <div
                        className="absolute stats-font"
                        style={{
                            left: `${(DOT_1_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <p className="text-4xl leading-none">{stats.xp}</p>
                        <span
                            className="absolute left-1/2 -translate-x-1/2 top-[95%] text-3xl font-black text-blue-600 whitespace-nowrap"
                        >
                            XP
                        </span>
                    </div>

                    {/* Streak - Dot 2 */}
                    <div
                        className="absolute stats-font"
                        style={{
                            left: `${(DOT_2_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <p className="text-4xl leading-none">{stats.streak}</p>
                        <span className="absolute right-[100%] top-1/2 -translate-y-1/2 text-2xl pr-1">
                            🔥
                        </span>
                    </div>

                    {/* Kasztany - Dot 3 */}
                    <div
                        className="absolute stats-font"
                        style={{
                            left: `${(DOT_3_X / 238.35) * 100}%`,
                            top: `${(DOTS_Y / 69.36) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <p className="text-4xl leading-none">{stats.gems}</p>
                        <img
                            src="/Kasztany.png"
                            alt="Kasztan"
                            className="absolute left-1/2 -translate-x-1/2 top-[65%] w-16 h-16 object-contain"
                        />
                    </div>
                </div>

                {/* Watch Ad Button Overlay (Small corner button) */}
                {onWatchAd && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onWatchAd();
                        }}
                        className="absolute bottom-2 right-4 z-20 bg-white/20 hover:bg-white/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-[10px] font-black text-green-900 pointer-events-auto flex items-center gap-1 shadow-sm transition-all active:scale-95"
                    >
                        <span>📺 Bonus</span>
                        <span className="text-orange-600">+25 🌰</span>
                    </button>
                )}
            </div>

            {/* Large Tiles - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
                {largeTiles.map((tile, index) => {
                    const Icon = tile.icon;
                    return (
                        <motion.button
                            key={tile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleClick(tile)}
                            className={`relative flex flex-col items-center justify-center p-6 bg-transparent rounded-2xl shadow-xl active:scale-[0.98] transition-transform min-h-[140px] overflow-hidden group`}
                        >
                            <div className="absolute inset-0 bg-[url('/tile_wood_bg.svg')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <Icon className={`w-12 h-12 ${tile.color} mb-3 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`} />
                                <span className={`font-black text-lg ${tile.color} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>{tile.label}</span>
                                <span className={`text-xs ${tile.color} opacity-90 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]`}>{tile.description}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Medium Tiles - 3 columns on larger screens, 2 on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {mediumTiles.map((tile, index) => {
                    const Icon = tile.icon;
                    return (
                        <motion.button
                            key={tile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (largeTiles.length + index) * 0.1 }}
                            onClick={() => handleClick(tile)}
                            className={`relative flex flex-col items-center justify-center p-5 bg-transparent rounded-xl shadow-md active:scale-[0.98] transition-transform min-h-[100px] overflow-hidden group`}
                        >
                            <div className="absolute inset-0 bg-[url('/tile_wood_bg.svg')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <Icon className={`w-8 h-8 ${tile.color} mb-2 filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`} />
                                <span className={`font-bold text-sm ${tile.color} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>{tile.label}</span>
                                {tile.badge && (
                                    <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20">
                                        {tile.badge}
                                    </span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Small Tiles - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
                {smallTiles.map((tile, index) => {
                    const Icon = tile.icon;
                    return (
                        <motion.button
                            key={tile.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (largeTiles.length + mediumTiles.length + index) * 0.1 }}
                            onClick={() => handleClick(tile)}
                            className={`relative flex flex-col items-center justify-center p-3 bg-transparent rounded-lg shadow active:scale-[0.98] transition-transform overflow-hidden group`}
                        >
                            <div className="absolute inset-0 bg-[url('/tile_wood_bg.svg')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center w-full">
                                <Icon className={`w-6 h-6 ${tile.color} mb-1 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]`} />
                                <span className={`font-bold text-[10px] ${tile.color} truncate w-full text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]`}>{tile.label}</span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Streak Reminder */}
            {stats.streak > 0 && (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center gap-4"
                >
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="text-white font-black">🔥 {stats.streak} dni serii!</p>
                        <p className="text-orange-100 text-xs font-medium">Nie przegap dzisiejszej nauki</p>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default HomePage;
