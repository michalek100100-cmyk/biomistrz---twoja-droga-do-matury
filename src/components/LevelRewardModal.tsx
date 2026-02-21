import React, { useState } from 'react';
import { X, Gift, Loader2, PackageOpen } from 'lucide-react';
import { claimLevelReward } from '../services/levelRewardService';
import { ITEMS_DB, getRarityColor, getRarityLabel } from '../services/inventoryService';
import { ItemRarity } from '../types';

interface LevelRewardModalProps {
    userId: string;
    unclaimedLevels: number[];
    onClose: () => void;
    onClaimSuccess: (level: number) => void;
}

const LevelRewardModal: React.FC<LevelRewardModalProps> = ({ userId, unclaimedLevels, onClose, onClaimSuccess }) => {
    const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});
    const [revealedItem, setRevealedItem] = useState<{ level: number, baseId: string, rarity: ItemRarity } | null>(null);

    const handleClaim = async (level: number) => {
        setLoadingMap(prev => ({ ...prev, [level]: true }));
        const res = await claimLevelReward(userId, level);
        setLoadingMap(prev => ({ ...prev, [level]: false }));

        if (res.success && res.itemGranted) {
            setRevealedItem({ level, ...res.itemGranted });
            onClaimSuccess(level);
        } else {
            alert(res.error || 'Błąd odbierania nagrody.');
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="bg-gray-900 border border-purple-500/50 w-full max-w-sm rounded-[3rem] shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="p-6 text-center">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                        <Gift className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">Skrzynki Zapasów</h2>
                    <p className="text-sm font-bold text-gray-400 mb-6">Odbierz nagrody za zdobyte poziomy. Każda skrzynka zawiera losowy przedmiot!</p>

                    {/* Revealed Item Overlay */}
                    {revealedItem && (
                        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                            <h3 className="text-xl font-black text-white mb-6">Otwarto Skrzynkę ({revealedItem.level} lvl)!</h3>

                            <div className={`p-8 rounded-[3rem] border-4 bg-gray-800 flex flex-col items-center justify-center w-full mb-6 ${getRarityColor(revealedItem.rarity)} shadow-2xl scale-110 animate-in zoom-in-50 duration-500`}>
                                <div className="text-6xl mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                    {ITEMS_DB[revealedItem.baseId]?.icon}
                                </div>
                                <h4 className="font-black text-2xl text-white mb-1">{ITEMS_DB[revealedItem.baseId]?.name}</h4>
                                <p className="font-black uppercase tracking-widest text-sm opacity-90">{getRarityLabel(revealedItem.rarity)}</p>
                            </div>

                            <button
                                onClick={() => setRevealedItem(null)}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl text-white font-black uppercase tracking-widest text-sm transition-transform active:scale-95"
                            >
                                Kontynuuj
                            </button>
                        </div>
                    )}

                    {/* List of unlcaimed chests */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto px-2 pb-4">
                        {unclaimedLevels.length === 0 ? (
                            <div className="py-8 bg-gray-800/50 rounded-3xl border border-gray-800 border-dashed">
                                <PackageOpen className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 font-bold text-sm">Brak skrzynek do odebrania.</p>
                                <p className="text-gray-600 text-xs mt-1">Graj i zdobywaj poziomy!</p>
                            </div>
                        ) : (
                            unclaimedLevels.map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => handleClaim(lvl)}
                                    disabled={loadingMap[lvl]}
                                    className="w-full relative overflow-hidden group bg-gradient-to-r from-gray-800 to-gray-700 hover:from-purple-900/50 hover:to-pink-900/50 p-4 rounded-2xl border border-gray-600 hover:border-purple-500 transition-all flex items-center justify-between shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-700 relative z-10">
                                            <Gift className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="text-left relative z-10">
                                            <h4 className="font-black text-white text-md">Skrzynia Poziomu</h4>
                                            <p className="text-xs font-bold text-gray-400">Za osiągnięcie {lvl} lvl</p>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        {loadingMap[lvl] ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                        ) : (
                                            <div className="bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-lg uppercase tracking-wider group-hover:bg-purple-500 transition-colors">
                                                Otwórz
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelRewardModal;
