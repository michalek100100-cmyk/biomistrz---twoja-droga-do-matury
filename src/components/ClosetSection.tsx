import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Lock, Palette } from 'lucide-react';
import { UserStats } from '../types';

// 20 theme colors with Polish names
const THEME_COLORS = [
    { id: 'midnight', name: 'Północ', color: '#0f172a', price: 50 },
    { id: 'slate', name: 'Łupek', color: '#1e293b', price: 50 },
    { id: 'charcoal', name: 'Węgiel', color: '#18181b', price: 50 },
    { id: 'navy', name: 'Granat', color: '#172554', price: 75 },
    { id: 'ocean', name: 'Ocean', color: '#0c4a6e', price: 75 },
    { id: 'forest', name: 'Las', color: '#14532d', price: 75 },
    { id: 'emerald', name: 'Szmaragd', color: '#064e3b', price: 75 },
    { id: 'wine', name: 'Wino', color: '#4c0519', price: 100 },
    { id: 'burgundy', name: 'Bordo', color: '#7f1d1d', price: 100 },
    { id: 'plum', name: 'Śliwka', color: '#581c87', price: 100 },
    { id: 'violet', name: 'Fiolet', color: '#4c1d95', price: 100 },
    { id: 'indigo', name: 'Indygo', color: '#312e81', price: 100 },
    { id: 'teal', name: 'Morski', color: '#134e4a', price: 125 },
    { id: 'cyan', name: 'Cyan', color: '#164e63', price: 125 },
    { id: 'rose', name: 'Róża', color: '#4a0420', price: 125 },
    { id: 'amber', name: 'Bursztyn', color: '#451a03', price: 125 },
    { id: 'copper', name: 'Miedź', color: '#431407', price: 150 },
    { id: 'sunset', name: 'Zachód', color: '#7c2d12', price: 150 },
    { id: 'aurora', name: 'Zorza', color: '#1a2e44', price: 200 },
    { id: 'obsidian', name: 'Obsydian', color: '#09090b', price: 200 },
];

interface ClosetSectionProps {
    stats: UserStats;
    onPurchaseTheme: (themeId: string, price: number) => void;
    onEquipTheme: (color: string | undefined) => void;
    onBack: () => void;
}

const ClosetSection: React.FC<ClosetSectionProps> = ({
    stats,
    onPurchaseTheme,
    onEquipTheme,
    onBack
}) => {
    const purchasedThemes = stats.purchasedThemes ?? [];
    const currentTheme = stats.themeColor;
    const [selectedTheme, setSelectedTheme] = useState<typeof THEME_COLORS[0] | null>(null);

    const handleThemeAction = (theme: typeof THEME_COLORS[0]) => {
        const isOwned = purchasedThemes.includes(theme.id);
        const isEquipped = currentTheme === theme.color;

        if (isEquipped) {
            // Unequip - reset to default
            onEquipTheme(undefined);
        } else if (isOwned) {
            // Equip
            onEquipTheme(theme.color);
        } else {
            // Show purchase confirmation
            setSelectedTheme(theme);
        }
    };

    const handlePurchase = () => {
        if (!selectedTheme) return;
        if ((stats.gems || 0) < selectedTheme.price) return;
        onPurchaseTheme(selectedTheme.id, selectedTheme.price);
        setSelectedTheme(null);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gray-950 text-white flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 px-6 flex items-center justify-between bg-gray-900/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/10">
                <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <span className="font-black text-sm uppercase tracking-widest">Szafa</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/30">
                    <img src="/Kasztany.png" alt="Kasztan" className="w-3.5 h-3.5 object-contain" />
                    <span className="text-xs font-black text-cyan-400">{stats.gems || 0}</span>
                </div>
            </div>

            {/* Info */}
            <div className="px-6 py-4 text-center">
                <h2 className="text-xl font-black tracking-tight">Motywy Aplikacji</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">Zmień kolor tła całej aplikacji</p>
                {currentTheme && (
                    <button
                        onClick={() => onEquipTheme(undefined)}
                        className="mt-2 px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold text-gray-300 hover:bg-white/20 transition-colors"
                    >
                        Przywróć domyślne tło
                    </button>
                )}
            </div>

            {/* Theme Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-24">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    {THEME_COLORS.map(theme => {
                        const isOwned = purchasedThemes.includes(theme.id);
                        const isEquipped = currentTheme === theme.color;

                        return (
                            <motion.button
                                key={theme.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleThemeAction(theme)}
                                className={`relative rounded-2xl overflow-hidden border-2 transition-all ${isEquipped
                                    ? 'border-purple-500 shadow-lg shadow-purple-500/30 ring-2 ring-purple-500/50'
                                    : isOwned
                                        ? 'border-white/20 hover:border-white/40'
                                        : 'border-white/5 hover:border-white/15'
                                    }`}
                            >
                                {/* Color preview */}
                                <div
                                    className="w-full aspect-[4/3] relative"
                                    style={{ backgroundColor: theme.color }}
                                >
                                    {/* Mock UI elements in the preview */}
                                    <div className="absolute inset-2 flex flex-col gap-1.5 opacity-40">
                                        <div className="h-3 bg-white/20 rounded-full w-3/4" />
                                        <div className="h-2 bg-white/10 rounded-full w-1/2" />
                                        <div className="flex-1" />
                                        <div className="h-4 bg-white/15 rounded-lg" />
                                    </div>

                                    {/* Status badge */}
                                    {isEquipped && (
                                        <div className="absolute top-2 right-2 bg-purple-500 p-1 rounded-full">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    {!isOwned && (
                                        <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full">
                                            <Lock className="w-3 h-3 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-3 bg-gray-900">
                                    <p className="text-xs font-black text-white truncate">{theme.name}</p>
                                    {isEquipped ? (
                                        <p className="text-[10px] font-bold text-purple-400 uppercase">W użyciu</p>
                                    ) : isOwned ? (
                                        <p className="text-[10px] font-bold text-green-400 uppercase">Posiadane</p>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <img src="/Kasztany.png" alt="Kasztan" className="w-3 h-3 object-contain" />
                                            <span className="text-[10px] font-black text-cyan-400">{theme.price}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Purchase Confirmation Modal */}
            <AnimatePresence>
                {selectedTheme && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setSelectedTheme(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
                        >
                            {/* Preview */}
                            <div
                                className="w-full h-32 rounded-2xl mb-4 border border-white/10"
                                style={{ backgroundColor: selectedTheme.color }}
                            >
                                <div className="p-4 flex flex-col gap-2 opacity-40">
                                    <div className="h-3 bg-white/20 rounded-full w-3/4" />
                                    <div className="h-2 bg-white/10 rounded-full w-1/2" />
                                    <div className="flex-1" />
                                    <div className="h-5 bg-white/15 rounded-lg" />
                                </div>
                            </div>

                            <h3 className="text-lg font-black mb-1">{selectedTheme.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">Czy chcesz kupić ten motyw?</p>

                            <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl">
                                <span className="text-sm font-bold text-gray-400">Koszt</span>
                                <div className="flex items-center gap-1">
                                    <img src="/Kasztany.png" alt="Kasztan" className="w-4 h-4 object-contain" />
                                    <span className="font-black text-cyan-400">{selectedTheme.price}</span>
                                </div>
                            </div>

                            {(stats.gems || 0) < selectedTheme.price ? (
                                <div className="text-center py-3">
                                    <p className="text-sm font-bold text-red-400">Nie masz wystarczająco kasztanów!</p>
                                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-gray-500">
                                        Potrzebujesz jeszcze {selectedTheme.price - (stats.gems || 0)}
                                        <img src="/Kasztany.png" alt="Kasztan" className="w-3 h-3 object-contain" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedTheme(null)}
                                        className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handlePurchase}
                                        className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        KUP <img src="/Kasztany.png" alt="Kasztan" className="w-5 h-5 object-contain invert" /> {selectedTheme.price}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { THEME_COLORS };
export default ClosetSection;
