// src/components/BottomNav.tsx
// Główna nawigacja aplikacji - 5 zakładek
import React from 'react';
import { Home, Swords, BookOpen, Trophy, User, Shield } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    reviewCount: number;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    color: string;
    activeColor: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, reviewCount }) => {

    const navItems: NavItem[] = [
        { id: 'home', label: 'Start', icon: Home, color: 'text-white/60', activeColor: 'text-white' },
        { id: 'multiplayer', label: 'Arena', icon: Swords, color: 'text-white/60', activeColor: 'text-white' },
        { id: 'clan', label: 'Klan', icon: Shield, color: 'text-white/60', activeColor: 'text-white' },
        { id: 'practice', label: 'Powtórki', icon: BookOpen, color: 'text-white/60', activeColor: 'text-white' },
        { id: 'leaderboard', label: 'Ranking', icon: Trophy, color: 'text-white/60', activeColor: 'text-white' },
        { id: 'profile', label: 'Profil', icon: User, color: 'text-white/60', activeColor: 'text-white' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)] md:hidden bg-[#2ca02c]/85 border-[#228b22]/30"
        >
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id || (item.id === 'multiplayer' && activeTab === 'multiplayer');
                    const showBadge = item.id === 'practice' && reviewCount > 0;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 my-1 mx-1 border-transparent transition-all duration-300 ${isActive ? 'crayon-border bg-white/10 shadow-sm' : 'hover:bg-white/5'}`}
                        >


                            {/* Icon */}
                            <div className="relative">
                                <Icon
                                    className={`w-6 h-6 transition-all duration-200 ${isActive
                                        ? `${item.activeColor} scale-110`
                                        : `${item.color} group-hover:text-gray-600`
                                        }`}
                                />

                                {/* Badge for practice */}
                                {showBadge && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-orange-500 text-[9px] text-white font-bold">
                                            {reviewCount > 9 ? '9+' : reviewCount}
                                        </span>
                                    </span>
                                )}
                            </div>

                            {/* Label */}
                            <span className={`text-[10px] font-bold mt-1 transition-colors ${isActive ? item.activeColor : 'text-white/60'
                                }`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
