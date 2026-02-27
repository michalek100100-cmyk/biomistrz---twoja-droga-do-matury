// src/components/DesktopSidebar.tsx
// Sidebar widoczny tylko na desktop (md+)
import React from 'react';
import {
    Home,
    Swords,
    BookOpen,
    Trophy,
    User,
    FileText,
    MessageSquare,
    Settings,
    Coffee,
    Sparkles,
    Calendar,
    Shield
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

interface DesktopSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    reviewCount: number;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    color: string;
    badge?: number;
    divider?: boolean;
    external?: string;
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, setActiveTab, reviewCount }) => {
    const { t } = useLanguage();

    const menuItems: MenuItem[] = [
        { id: 'learn', label: t.home.tiles.learn.label, icon: Home, color: 'text-blue-500' },
        { id: 'multiplayer', label: t.home.tiles.arena.label, icon: Swords, color: 'text-red-500' },
        { id: 'calendar', label: t.home.tiles.calendar.label, icon: Calendar, color: 'text-orange-500' },
        { id: 'practice', label: t.practiceCenter.title, icon: BookOpen, color: 'text-green-500', badge: reviewCount },
        { id: 'leaderboard', label: t.home.tiles.leaderboard.label, icon: Trophy, color: 'text-yellow-500' },
        { id: 'clan', label: t.home.tiles.clan.label, icon: Shield, color: 'text-emerald-500' },
        { id: 'divider1', label: '', icon: Home, color: '', divider: true },
        { id: 'exams', label: t.home.tiles.exams.label, icon: FileText, color: 'text-indigo-500' },
        { id: 'survey', label: t.home.tiles.survey.label, icon: MessageSquare, color: 'text-pink-500' },
        { id: 'divider2', label: '', icon: Home, color: '', divider: true },
        { id: 'profile', label: t.home.tiles.profile.label, icon: User, color: 'text-purple-500' },
        { id: 'settings', label: t.home.tiles.settings.label, icon: Settings, color: 'text-gray-500' },
        { id: 'divider3', label: '', icon: Home, color: '', divider: true },
        { id: 'support', label: t.home.tiles.support.label, icon: Coffee, color: 'text-rose-500' },
    ];

    const handleClick = (item: MenuItem) => {
        if (item.external) {
            window.open(item.external, '_blank');
        } else {
            setActiveTab(item.id);
        }
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-[#2ca02c]/95 backdrop-blur-md border-r border-[#228b22]/30 p-4 sticky top-0">

            {/* Logo */}
            <div className="mb-8 px-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-white" />
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter">BioMistrz</h1>
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Matura 2026</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                    if (item.divider) {
                        return <div key={item.id} className="h-px bg-gray-100 my-3" />;
                    }

                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => handleClick(item)}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 group ${isActive
                                ? 'crayon-border bg-white text-green-700 shadow-sm scale-[1.02]'
                                : 'crayon-border border-transparent hover:border-white/50 hover:bg-white/10 text-white/80'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-white/60 group-hover:text-white'}`} />
                            <span className="font-bold text-sm">{item.label}</span>

                            {/* Badge */}
                            {typeof item.badge === 'number' && item.badge > 0 && (
                                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {(item.badge as number) > 9 ? '9+' : item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Support Button */}
            <button
                onClick={() => setActiveTab('support')}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm"
            >
                <Coffee className="w-5 h-5" />
                <span>Wesprzyj projekt</span>
            </button>
        </aside>
    );
};

export default DesktopSidebar;
