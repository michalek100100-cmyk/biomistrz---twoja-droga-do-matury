import React, { useState, useEffect } from 'react';
import { X, PackageOpen, Loader2, Sparkles } from 'lucide-react';
import { InventoryItem, ActiveBuff } from '../types';
import { getInventory, ITEMS_DB, getRarityColor, getRarityLabel, useItem, getActiveBuffsClean } from '../services/inventoryService';

interface InventoryModalProps {
    userId: string;
    onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ userId, onClose }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingItemId, setUsingItemId] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        const [inv, buffs] = await Promise.all([
            getInventory(userId),
            getActiveBuffsClean(userId)
        ]);
        // Sort items by rarity internally if needed, or just by amount
        setItems(inv);
        setActiveBuffs(buffs);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleUseItem = async (instanceId: string) => {
        setUsingItemId(instanceId);
        await useItem(userId, instanceId);
        await loadData(); // refresh
        setUsingItemId(null);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <PackageOpen className="w-6 h-6 text-purple-400" /> Plecak
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">

                    {/* Active Buffs Section */}
                    {activeBuffs.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aktywne Wzmocnienia</h3>
                            <div className="grid gap-2">
                                {activeBuffs.map(buff => (
                                    <div key={buff.id} className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-emerald-400" />
                                            <div>
                                                <p className="font-bold text-white text-sm">{buff.sourceItemName}</p>
                                                <p className="text-xs text-emerald-400 font-black">
                                                    Mnożnik x{buff.multiplier.toFixed(1)} {buff.type === 'xp_multiplier' ? 'XP' : 'ELO'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 font-bold bg-black/30 px-2 py-1 rounded-lg">
                                            Wygasa: {new Date(buff.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inventory Items */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Twoje Przedmioty</h3>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                                <PackageOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400 font-bold mb-1">Twój plecak jest pusty</p>
                                <p className="text-xs text-gray-500">Zdobywaj nagrody by otrzymać rzadkie przedmioty!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {items.map(item => {
                                    const base = ITEMS_DB[item.baseId];
                                    if (!base) return null;

                                    const isUsing = usingItemId === item.instanceId;
                                    const colorClasses = getRarityColor(item.rarity);

                                    return (
                                        <div
                                            key={item.instanceId}
                                            className={`relative flex flex-col items-center justify-between p-3 rounded-2xl border-2 transition-transform hover:scale-105 ${colorClasses}`}
                                        >
                                            {/* Amount Badge */}
                                            {item.amount > 1 && (
                                                <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-inherit">
                                                    {item.amount}
                                                </div>
                                            )}

                                            <div className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2 mt-1">
                                                {base.icon}
                                            </div>

                                            <div className="text-center w-full mb-3">
                                                <h4 className="font-black text-white text-sm leading-tight mb-1">{base.name}</h4>
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{getRarityLabel(item.rarity)}</p>
                                            </div>

                                            <button
                                                onClick={() => handleUseItem(item.instanceId)}
                                                disabled={isUsing}
                                                className="w-full py-1.5 bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex justify-center items-center"
                                            >
                                                {isUsing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Użyj'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
