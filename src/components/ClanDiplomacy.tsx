import React, { useState } from 'react';
import { Clan } from '../types';
import { requestAlliance, createTradeOffer } from '../services/clanService';
import { Globe, ArrowRightLeft, Handshake, AlertCircle, Loader2 } from 'lucide-react';

interface ClanDiplomacyProps {
    clan: Clan;
    userId: string;
}

const ClanDiplomacy: React.FC<ClanDiplomacyProps> = ({ clan, userId }) => {
    const [view, setView] = useState<'menu' | 'alliance' | 'trade'>('menu');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form inputs
    const [targetClanId, setTargetClanId] = useState('');
    const [offerGems, setOfferGems] = useState(50);
    const [requestItem, setRequestItem] = useState('Notatka Egzaminacyjna');

    const handleRequestAlliance = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const res = await requestAlliance(clan.id, targetClanId);
        if (res.success) {
            setSuccess('Zaproszenie do sojuszu wysłane pomyślnie!');
            setTargetClanId('');
        } else {
            setError(res.error || 'Wystąpił błąd.');
        }
        setLoading(false);
    };

    const handleCreateTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const res = await createTradeOffer(userId, clan.id, offerGems, [requestItem]);
        if (res.success) {
            setSuccess('Oferta handlowa wystawiona!');
            setOfferGems(50);
        } else {
            setError(res.error || 'Wystąpił błąd.');
        }
        setLoading(false);
    };

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
                            <h4 className="font-black text-white">Sojusze</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Pakty o nieagresji</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setView('trade')}
                        className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-3xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-3"
                    >
                        <ArrowRightLeft className="w-12 h-12 text-orange-400" />
                        <div>
                            <h4 className="font-black text-white">Rynek Klanu</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Handluj zasobami</p>
                        </div>
                    </button>
                </div>
            )}

            {/* ERROR & SUCCESS */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    <Globe className="w-4 h-4 shrink-0" /> {success}
                </div>
            )}

            {/* ALLIANCE VIEW */}
            {view === 'alliance' && (
                <div className="bg-gray-800/50 p-5 rounded-3xl border border-gray-700 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-white text-lg flex items-center gap-2">
                            <Handshake className="w-5 h-5 text-blue-400" /> Zaproponuj Sojusz
                        </h3>
                        <button onClick={() => { setView('menu'); setError(''); setSuccess(''); }} className="text-xs font-bold text-gray-400 hover:text-white uppercase">Wróć</button>
                    </div>

                    <form onSubmit={handleRequestAlliance} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID Klanu Docelowego</label>
                            <input
                                type="text"
                                required
                                value={targetClanId}
                                onChange={e => setTargetClanId(e.target.value)}
                                placeholder="Wpisz ID klanu..."
                                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !targetClanId.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
                            Wyślij Zaproszenie
                        </button>
                    </form>
                </div>
            )}

            {/* TRADE VIEW */}
            {view === 'trade' && (
                <div className="bg-gray-800/50 p-5 rounded-3xl border border-gray-700 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-white text-lg flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-orange-400" /> Wystaw Ofertę
                        </h3>
                        <button onClick={() => { setView('menu'); setError(''); setSuccess(''); }} className="text-xs font-bold text-gray-400 hover:text-white uppercase">Wróć</button>
                    </div>

                    <form onSubmit={handleCreateTrade} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Oferujesz (Kasztany)</label>
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
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Zadasz Przedmiotu</label>
                                <select
                                    value={requestItem}
                                    onChange={e => setRequestItem(e.target.value)}
                                    className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white font-bold focus:border-orange-500 focus:outline-none transition-colors appearance-none"
                                >
                                    <option>Notatka Egzaminacyjna</option>
                                    <option>Bilet na Bossa</option>
                                    <option>Mnożnik XP x2</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}
                            Wystaw na Rynek
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ClanDiplomacy;
