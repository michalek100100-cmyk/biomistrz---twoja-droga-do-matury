import React, { useEffect, useState } from 'react';
import { ClanBoss, Clan } from '../types';
import { subscribeToClanBoss, spawnClanBossIfNeeded, attackClanBoss } from '../services/bossService';
import { Loader2, Shield, Sword, Sparkles, Timer } from 'lucide-react';

interface ClanBossRaidProps {
    clan: Clan;
    userId: string;
}

const ClanBossRaid: React.FC<ClanBossRaidProps> = ({ clan, userId }) => {
    const [boss, setBoss] = useState<ClanBoss | null>(null);
    const [loading, setLoading] = useState(true);
    const [attacking, setAttacking] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const checkBoss = async () => {
            await spawnClanBossIfNeeded(clan.id);
        };
        checkBoss();

        const unsub = subscribeToClanBoss(clan.id, (b) => {
            if (isMounted) {
                setBoss(b);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            unsub();
        };
    }, [clan.id]);

    const handleAttack = async (type: 'normal' | 'heavy') => {
        if (!boss || boss.currentHp <= 0) return;
        setAttacking(true);
        setError('');

        // Normal attack: 50 | Heavy: 200 (Mock values)
        // In real game, heavy might deduct user Kasztany/ELO as cost
        const damage = type === 'normal' ? 50 : 200;

        const result = await attackClanBoss(clan.id, userId, damage);
        if (!result.success) {
            setError(result.error || 'Błąd ataku!');
        }

        // Simple cooldown simulation
        setTimeout(() => setAttacking(false), 500);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-700 rounded-3xl">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!boss) {
        return (
            <div className="text-center py-10 bg-gray-800/50 rounded-3xl border border-gray-700">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h3 className="text-xl font-black text-white">Brak aktywnego bossa</h3>
                <p className="text-gray-400 text-sm mt-2">Wróc później, lider klanu wkrótce przyzwie nową bestię.</p>
            </div>
        );
    }

    const hpPercent = Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100));
    const isDead = boss.currentHp <= 0;
    const isExpired = boss.activeUntil < Date.now();

    // Sort attackers
    const topAttackers = Object.entries(boss.participants)
        .map(([uid, dmg]) => ({ uid, dmg }))
        .sort((a, b) => b.dmg - a.dmg)
        .slice(0, 5); // top 5

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className={`p-6 rounded-3xl border ${isDead ? 'border-emerald-500 bg-emerald-900/20' : 'border-purple-500 bg-purple-900/20'} relative overflow-hidden text-center`}>
                {/* Boss display */}
                <div className="text-8xl mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    {boss.avatar}
                </div>
                <h3 className="text-2xl font-black text-white">{boss.name}</h3>
                <div className="flex justify-center items-center gap-2 mt-1 mb-4 text-xs font-bold text-gray-300">
                    <Timer className="w-4 h-4 text-orange-400" />
                    <span>Zniknie: {new Date(boss.activeUntil).toLocaleString()}</span>
                </div>

                {/* HP BAR */}
                <div className="px-4 mb-6">
                    <div className="flex justify-between text-xs font-black text-white mb-2 uppercase tracking-wide">
                        <span>HP</span>
                        <span>{boss.currentHp} / {boss.maxHp}</span>
                    </div>
                    <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div className={`h-full transition-all duration-300 ${isDead ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }} />
                    </div>
                </div>

                {/* Action Buttons */}
                {!isDead && !isExpired ? (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => handleAttack('normal')}
                            disabled={attacking}
                            className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 rounded-2xl text-white font-black uppercase text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                        >
                            <Sword className="w-5 h-5 text-gray-400" /> Atak (Darmowy)
                        </button>
                        <button
                            onClick={() => handleAttack('heavy')}
                            disabled={attacking}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] rounded-2xl text-white font-black uppercase text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                        >
                            <Sparkles className="w-5 h-5" /> Super Cios (10 🌰)
                        </button>
                    </div>
                ) : (
                    <div className="py-4 font-black uppercase tracking-widest text-lg">
                        {isDead ? (
                            <span className="text-emerald-400 flex justify-center items-center gap-2">Boss Pokonany! 🏆 Odbierz nagrody</span>
                        ) : (
                            <span className="text-red-400">Czas uciekł! 🏃‍♂️ Boss zbiegł.</span>
                        )}
                    </div>
                )}
                {error && <p className="text-red-400 text-xs font-bold mt-3">{error}</p>}
            </div>

            {/* Ranking of attackers */}
            <div className="bg-gray-800/50 p-4 rounded-3xl border border-gray-700">
                <h4 className="font-black text-gray-400 text-sm uppercase tracking-wider mb-3 px-2">Najwięcej Obrażeń</h4>
                {topAttackers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-xs font-bold">Nikt jeszcze nie zaatakował.</p>
                ) : (
                    <div className="space-y-2">
                        {topAttackers.map((a, i) => {
                            const pName = clan.members[a.uid]?.name || 'Nieznany';
                            return (
                                <div key={a.uid} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-xl">
                                    <span className="font-bold text-white text-sm">#{i + 1} {pName}</span>
                                    <span className="font-black text-purple-400">{a.dmg} DMG</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClanBossRaid;
