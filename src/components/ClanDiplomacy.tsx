import React, { useState, useEffect } from 'react';
import { Clan, TradeOffer, InventoryItem } from '../types';
import { requestAlliance, createTradeOffer, getOpenTradeOffers, acceptTradeOffer } from '../services/clanService';
import { ITEMS_DB, getInventory } from '../services/inventoryService';
import { Globe, ArrowRightLeft, Handshake, AlertCircle, Loader2, Plus, ShoppingCart, Tag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ClanDiplomacyProps {
    clan: Clan;
    userId: string;
}

const ClanDiplomacy: React.FC<ClanDiplomacyProps> = ({ clan, userId }) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'menu' | 'alliance' | 'trade'>('menu');
    const [tradeView, setTradeView] = useState<'list' | 'create'>('list');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [offers, setOffers] = useState<TradeOffer[]>([]);
    const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);

    // Form inputs
    const [targetClanId, setTargetClanId] = useState('');
    const [offerGems, setOfferGems] = useState(50);
    const [requestItem, setRequestItem] = useState('');

    const loadOffers = async () => {
        setLoading(true);
        const data = await getOpenTradeOffers();
        setOffers(data);
        setLoading(false);
    };

    const loadInventory = async () => {
        const inv = await getInventory(userId);
        setUserInventory(inv);

        // Auto-select first available item if we have any
        if (inv.length > 0 && !requestItem) {
            const firstItem = ITEMS_DB[inv[0].baseId];
            if (firstItem) setRequestItem(firstItem.name);
        }
    };

    const handleRequestAlliance = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const res = await requestAlliance(clan.id, targetClanId);
        if (res.success) {
            setSuccess(t.clans.diplomacy.allianceSent);
            setTargetClanId('');
        } else {
            setError(res.error || t.common.error);
        }
        setLoading(false);
    };

    const handleCreateTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestItem) {
            setError(t.clans.diplomacy.errorNoItem);
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const res = await createTradeOffer(userId, clan.id, offerGems, [requestItem]);
        if (res.success) {
            setSuccess(t.clans.diplomacy.offerPosted);
            setOfferGems(50);
            setTradeView('list');
            loadOffers();
        } else {
            setError(res.error || t.common.error);
        }
        setLoading(false);
    };

    const handleBuy = async (trade: TradeOffer) => {
        const itemName = trade.offer?.items?.[0] || t.clans.diplomacy.sellItem;
        const price = trade.request?.gems || 0;
        if (!confirm(t.clans.diplomacy.buyConfirm.replace('$1', itemName).replace('$2', price.toString()))) return;
        setLoading(true);
        setError('');
        setSuccess('');

        const res = await acceptTradeOffer(trade.id, userId);
        if (res.success) {
            setSuccess(t.clans.diplomacy.itemBought);
            loadOffers();
        } else {
            setError(res.error || t.clans.diplomacy.errorBuy);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (view === 'trade') {
            if (tradeView === 'list') {
                loadOffers();
            } else if (tradeView === 'create') {
                loadInventory();
            }
        }
    }, [view, tradeView]);

    // Unique items in inventory for selection
    const availableItems = Array.from(new Set(userInventory.map(i => i.baseId)))
        .map(baseId => ITEMS_DB[baseId])
        .filter(item => !!item);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {view === 'menu' && (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setView('alliance')}
                        className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-3xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-3"
                    >
                        <Handshake className="w-12 h-12 text-blue-400" />
                        <div>
                            <h4 className="font-black text-white">{t.clans.diplomacy.alliances}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{t.clans.diplomacy.alliancesDesc}</p>
                        </div>
                    </button>
                    <button
                        onClick={() => { setView('trade'); setTradeView('list'); }}
                        className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-3xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-3"
                    >
                        <ArrowRightLeft className="w-12 h-12 text-orange-400" />
                        <div>
                            <h4 className="font-black text-white">{t.clans.diplomacy.market}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{t.clans.diplomacy.marketDesc}</p>
                        </div>
                    </button>
                </div>
            )}

            {/* ERROR & SUCCESS */}
            {(error || success) && (
                <div className={`flex items-center gap-2 p-3 border rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-2 ${error ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Globe className="w-4 h-4 shrink-0" />}
                    {error || success}
                </div>
            )}

            {/* ALLIANCE VIEW */}
            {view === 'alliance' && (
                <div className="bg-gray-800/50 p-5 rounded-3xl border border-gray-700 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-white text-lg flex items-center gap-2">
                            <Handshake className="w-5 h-5 text-blue-400" /> {t.clans.diplomacy.proposeAlliance}
                        </h3>
                        <button onClick={() => { setView('menu'); setError(''); setSuccess(''); }} className="text-xs font-bold text-gray-400 hover:text-white uppercase">{t.common.back}</button>
                    </div>

                    <form onSubmit={handleRequestAlliance} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.clans.diplomacy.targetClanId}</label>
                            <input
                                type="text"
                                required
                                value={targetClanId}
                                onChange={e => setTargetClanId(e.target.value)}
                                placeholder={t.clans.diplomacy.targetClanPlaceholder}
                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !targetClanId.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                            {t.clans.diplomacy.sendInvite}
                        </button>
                    </form>
                </div>
            )}

            {/* TRADE VIEW */}
            {view === 'trade' && (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-white text-lg flex items-center gap-2">
                            <Tag className="w-5 h-5 text-orange-400" /> {tradeView === 'create' ? t.clans.diplomacy.createOffer : t.clans.diplomacy.availableOffers}
                        </h3>
                        <div className="flex gap-3">
                            {tradeView === 'list' && (
                                <button
                                    onClick={() => setTradeView('create')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-black rounded-xl transition-colors uppercase tracking-wider"
                                >
                                    <Plus className="w-3.5 h-3.5" /> {t.clans.diplomacy.postOffer}
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (tradeView === 'create') setTradeView('list');
                                    else setView('menu');
                                    setError('');
                                    setSuccess('');
                                }}
                                className="text-xs font-bold text-gray-400 hover:text-white uppercase"
                            >
                                {t.common.back}
                            </button>
                        </div>
                    </div>

                    {tradeView === 'list' ? (
                        <div className="space-y-3">
                            {loading && <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}
                            {!loading && offers.length === 0 && <div className="text-center py-10 text-gray-500 font-bold bg-gray-800/30 rounded-3xl border border-gray-700">{t.clans.diplomacy.emptyMarket}</div>}
                            {offers.map(offer => {
                                const itemName = offer.offer?.items?.[0];
                                const item = itemName ? Object.values(ITEMS_DB).find(i => i.name === itemName) : null;
                                return (
                                    <div
                                        key={offer.id}
                                        className="bg-gray-800/60 border border-gray-700 p-4 rounded-3xl flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl border border-gray-700">
                                                {item?.icon || '📦'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-sm">{itemName || t.clans.diplomacy.sellItem}</h4>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">
                                                    {t.clans.diplomacy.from}: {typeof offer.senderClanId === 'string' ? offer.senderClanId.substring(0, 8) : '???'}...
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-orange-400 flex items-center gap-1 justify-end">
                                                    {offer.request?.gems || 0} <span className="text-sm">🌰</span>
                                                </p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{t.clans.diplomacy.price}</p>
                                            </div>
                                            <button
                                                onClick={() => handleBuy(offer)}
                                                disabled={loading || offer.senderId === userId}
                                                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all disabled:opacity-30 disabled:grayscale"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 p-5 rounded-3xl border border-gray-700 animate-in fade-in duration-300">
                            {availableItems.length > 0 ? (
                                <form onSubmit={handleCreateTrade} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.clans.diplomacy.sellItem}</label>
                                            <select
                                                value={requestItem}
                                                onChange={e => setRequestItem(e.target.value)}
                                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:border-orange-500 focus:outline-none transition-colors appearance-none"
                                            >
                                                {availableItems.map(item => (
                                                    <option key={item.id} value={item.name}>
                                                        {item.icon} {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t.clans.diplomacy.sellPrice}</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="1000"
                                                required
                                                value={offerGems}
                                                onChange={e => setOfferGems(parseInt(e.target.value))}
                                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-black focus:border-orange-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
                                        {t.clans.diplomacy.postOffer}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-6">
                                    <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t.clans.diplomacy.emptyInventory}</p>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">{t.clans.diplomacy.emptyInventoryTip}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClanDiplomacy;
