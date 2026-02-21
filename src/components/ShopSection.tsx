import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ITEMS_DB, buyItem } from '../services/inventoryService';
import { BaseItem, ItemRarity } from '../types';

interface ShopSectionProps {
    userId: string;
    userGems: number;
    onPurchaseSuccess: (amount: number) => void;
}

const ShopSection: React.FC<ShopSectionProps> = ({ userId, userGems, onPurchaseSuccess }) => {
    const [buyingId, setBuyingId] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const itemsForSale = Object.values(ITEMS_DB).filter(item => item.price);

    const handleBuy = async (item: BaseItem) => {
        if (!item.price || userGems < item.price) return;

        setBuyingId(item.id);
        setStatus(null);

        const result = await buyItem(userId, item.id, 'common' as ItemRarity);

        if (result.success) {
            setStatus({ type: 'success', msg: `Kupiono: ${item.name}! 🎉` });
            onPurchaseSuccess(item.price || 0);
        } else {
            setStatus({ type: 'error', msg: result.error || 'Błąd zakupu' });
        }

        setBuyingId(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-orange-500/20 rounded-2xl">
                    <ShoppingBag className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Sklepik</h2>
                    <p className="text-orange-100/60 font-bold text-sm">Zainwestuj swoje kasztany w rozwój</p>
                </div>
            </div>

            <div className="bg-gray-900/50 border-2 border-orange-500/30 rounded-[2.5rem] p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-20 h-20 text-orange-500" />
                </div>

                <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/Kasztany.png" alt="Kasztany" className="w-12 h-12" />
                        <div>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Twój portfel</p>
                            <p className="text-3xl font-black text-white leading-none">{userGems}</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-bold text-sm">{status.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4">
                {itemsForSale.map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={item.id}
                        className="bg-gray-800/40 border border-gray-700/50 rounded-3xl p-5 flex items-center gap-4 hover:bg-gray-800/60 transition-colors"
                    >
                        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                            {item.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-white truncate">{item.name}</h3>
                            <p className="text-gray-400 text-xs font-medium leading-snug line-clamp-2">{item.description}</p>
                        </div>

                        <div className="text-right">
                            <button
                                onClick={() => handleBuy(item)}
                                disabled={buyingId !== null || userGems < (item.price || 0)}
                                className={`px-4 py-2 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all active:scale-95 ${userGems < (item.price || 0)
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20'
                                    }`}
                            >
                                {buyingId === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <span>{item.price}</span>
                                        <img src="/Kasztany.png" alt="🌰" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    Nowe przedmioty wkrótce... 🤫
                </p>
            </div>
        </motion.div>
    );
};

export default ShopSection;
