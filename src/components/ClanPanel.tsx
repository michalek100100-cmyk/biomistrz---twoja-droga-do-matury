// src/components/ClanPanel.tsx
// Main Clan management panel: Create / Join / Dashboard / Chat
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Shield, Plus, Users, Search, Crown, LogOut,
    Send, Lock, Globe, ChevronRight, Loader2,
    MapPin, AlertCircle, ArrowLeft, UserPlus, X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clan, ClanChatMessage } from '../types';
import {
    createClan,
    joinClan,
    leaveClan,
    getUserClan,
    getPublicClans,
    sendClanMessage,
    subscribeToClanChat,
    TEST_MODE,
    addFriendToClan
} from '../services/clanService';
import { getPlayerRanking } from '../services/rankingService';
import { getFriends, Friend } from '../services/friendsService';

import ClanTerritoryMap from './ClanTerritoryMap';
import ClanBossRaid from './ClanBossRaid';
import ClanDiplomacy from './ClanDiplomacy';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ClanPanelProps {
    userId: string;
    userName: string;
    userAvatar: string;
    userGems: number;
    userElo?: number;
    onGemsSpent: (amount: number) => void;
}

// Map click handler component
const LocationPicker: React.FC<{
    onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

type PanelView = 'loading' | 'no-clan' | 'create' | 'join' | 'dashboard';
type DashboardTab = 'info' | 'map' | 'boss' | 'diplomacy';

const ClanPanel: React.FC<ClanPanelProps> = ({
    userId, userName, userAvatar, userGems, userElo, onGemsSpent
}) => {
    const [view, setView] = useState<PanelView>('loading');
    const [dashboardTab, setDashboardTab] = useState<DashboardTab>('info');
    const [clan, setClan] = useState<Clan | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Create form state
    const [clanName, setClanName] = useState('');
    const [clanAvatar, setClanAvatar] = useState('🏰');
    const [clanMinElo, setClanMinElo] = useState(0);
    const [clanIsPublic, setClanIsPublic] = useState(true);
    const [clanLocation, setClanLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Join view state
    const [publicClans, setPublicClans] = useState<Clan[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingClans, setLoadingClans] = useState(false);

    // Chat state
    const [messages, setMessages] = useState<ClanChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatError, setChatError] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Ranking data for the user
    const [actualElo, setActualElo] = useState(userElo ?? 0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);

    // Friend invitation state
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [friendsList, setFriendsList] = useState<Friend[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [addingFriendUid, setAddingFriendUid] = useState<string | null>(null);

    // Fetch user ranking and clan on mount
    useEffect(() => {
        const init = async () => {
            try {
                const ranking = await getPlayerRanking(userId);
                setActualElo(ranking.elo);
                setWins(ranking.wins);
                setLosses(ranking.losses);
            } catch { }

            const userClan = await getUserClan(userId);
            if (userClan) {
                setClan(userClan);
                setView('dashboard');
            } else {
                setView('no-clan');
            }
        };
        init();
    }, [userId]);

    // Subscribe to chat when in dashboard
    useEffect(() => {
        if (!clan) return;
        const unsub = subscribeToClanChat(clan.id, (msg) => {
            setMessages(prev => {
                // Avoid duplicates
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });
        return unsub;
    }, [clan]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- HANDLERS ---

    const handleCreateClan = async () => {
        setError('');
        setLoading(true);

        const result = await createClan(
            userId, userName, userAvatar, actualElo, wins, losses, userGems,
            {
                name: clanName,
                avatar: clanAvatar,
                isPublic: clanIsPublic,
                minElo: clanMinElo,
                ...(clanLocation ? { location: clanLocation } : {})
            }
        );

        if (result.success && result.clanId) {
            onGemsSpent(TEST_MODE ? 0 : 100);
            const newClan = await getUserClan(userId);
            setClan(newClan);
            setView('dashboard');
        } else {
            setError(result.error || 'Nie udało się stworzyć klanu.');
        }
        setLoading(false);
    };

    const handleJoinClan = async (targetClanId: string) => {
        setError('');
        setLoading(true);

        const result = await joinClan(
            targetClanId, userId, userName, userAvatar, actualElo, wins, losses
        );

        if (result.success) {
            const newClan = await getUserClan(userId);
            setClan(newClan);
            setView('dashboard');
        } else {
            setError(result.error || 'Nie udało się dołączyć.');
        }
        setLoading(false);
    };

    const handleLeaveClan = async () => {
        if (!clan) return;
        if (!confirm(clan.leaderId === userId
            ? 'Jesteś liderem. Opuszczenie klanu spowoduje jego rozwiązanie. Kontynuować?'
            : 'Czy na pewno chcesz opuścić klan?'
        )) return;

        setLoading(true);
        const result = await leaveClan(clan.id, userId);
        if (result.success) {
            setClan(null);
            setMessages([]);
            setView('no-clan');
        } else {
            setError(result.error || 'Błąd.');
        }
        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!clan || !chatInput.trim()) return;
        setChatError('');

        const result = await sendClanMessage(clan.id, userId, userName, userAvatar, chatInput);
        if (result.success) {
            setChatInput('');
        } else {
            setChatError(result.error || 'Błąd wysyłania.');
        }
    };

    const handleOpenFriendModal = async () => {
        setShowFriendModal(true);
        setLoadingFriends(true);
        setError('');
        const fList = await getFriends(userId);
        setFriendsList(fList);
        setLoadingFriends(false);
    };

    const handleAddFriend = async (friendUid: string) => {
        if (!clan) return;
        setAddingFriendUid(friendUid);
        setError('');
        const result = await addFriendToClan(clan.id, friendUid);
        if (result.success) {
            const newClan = await getUserClan(userId);
            setClan(newClan);
            setShowFriendModal(false);
        } else {
            setError(result.error || 'Błąd.');
        }
        setAddingFriendUid(null);
    };

    const loadPublicClans = useCallback(async () => {
        setLoadingClans(true);
        const clans = await getPublicClans();
        setPublicClans(clans);
        setLoadingClans(false);
    }, []);

    useEffect(() => {
        if (view === 'join') loadPublicClans();
    }, [view, loadPublicClans]);

    const filteredClans = publicClans.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const AVATAR_OPTIONS = ['🏰', '⚔️', '🛡️', '🐉', '🦁', '🐺', '🔥', '🌟', '💀', '🏴', '🦅', '🐍'];

    // ========================
    // RENDER
    // ========================

    if (view === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                <p className="font-bold animate-pulse">Ładowanie klanu...</p>
            </div>
        );
    }

    // --- NO CLAN VIEW ---
    if (view === 'no-clan') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-black text-gray-800  flex items-center justify-center gap-2">
                        <Shield className="w-8 h-8 text-emerald-500" />
                        Klany
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                        Dołącz do klanu lub stwórz własny
                    </p>
                </div>

                <div className="space-y-4">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setView('create')}
                        className="w-full p-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl flex items-center justify-between text-white font-black text-lg uppercase tracking-wider"
                    >
                        <div className="flex items-center gap-3">
                            <Plus className="w-6 h-6" />
                            Stwórz Klan
                        </div>
                        <ChevronRight className="w-6 h-6" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setView('join')}
                        className="w-full p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl flex items-center justify-between text-white font-black text-lg uppercase tracking-wider"
                    >
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6" />
                            Dołącz do Klanu
                        </div>
                        <ChevronRight className="w-6 h-6" />
                    </motion.button>
                </div>

                <div className="text-center text-xs text-gray-500 space-y-1 pt-4">
                    <p>Stworzenie klanu wymaga <strong>{TEST_MODE ? 0 : 100} ELO</strong> i <strong>{TEST_MODE ? 0 : 100} kasztanów</strong></p>
                    <p>Twoje ELO: <strong>{actualElo}</strong> • Kasztany: <strong>{userGems}</strong></p>
                </div>
            </div>
        );
    }

    // --- CREATE CLAN VIEW ---
    if (view === 'create') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button onClick={() => { setView('no-clan'); setError(''); }} className="flex items-center gap-1 text-gray-400 font-bold text-sm hover:text-gray-200 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Wróć
                </button>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-800 ">Stwórz Klan</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                        Koszt: {TEST_MODE ? 0 : 100} kasztanów
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-wider">Nazwa klanu</label>
                    <input
                        type="text"
                        value={clanName}
                        onChange={e => setClanName(e.target.value)}
                        maxLength={24}
                        placeholder="np. Berserkerzy"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500 text-right">{clanName.length}/24</p>
                </div>

                {/* Avatar */}
                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-wider">Profilowe</label>
                    <div className="flex flex-wrap gap-2">
                        {AVATAR_OPTIONS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => setClanAvatar(emoji)}
                                className={`text-3xl p-2 rounded-xl transition-all ${clanAvatar === emoji
                                    ? 'bg-emerald-600/30 ring-2 ring-emerald-400 scale-110'
                                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                                    }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Min ELO */}
                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-wider">
                        Minimalne ELO
                    </label>
                    <input
                        type="number"
                        value={clanMinElo}
                        onChange={e => setClanMinElo(Math.max(0, parseInt(e.target.value) || 0))}
                        min={0}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                {/* Public / Private toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                    <div className="flex items-center gap-3">
                        {clanIsPublic
                            ? <Globe className="w-5 h-5 text-emerald-400" />
                            : <Lock className="w-5 h-5 text-yellow-400" />
                        }
                        <span className="font-bold text-white">
                            {clanIsPublic ? 'Publiczny' : 'Prywatny'}
                        </span>
                    </div>
                    <button
                        onClick={() => setClanIsPublic(!clanIsPublic)}
                        className={`w-14 h-8 rounded-full transition-colors relative ${clanIsPublic ? 'bg-emerald-500' : 'bg-gray-600'
                            }`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${clanIsPublic ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                    </button>
                </div>

                {/* Map Location Picker */}
                <div className="space-y-2">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Lokalizacja na mapie <span className="text-gray-600">(opcjonalne)</span>
                    </label>
                    <div className="rounded-xl overflow-hidden border border-gray-700 h-48">
                        <MapContainer
                            center={[52.0, 19.5]}
                            zoom={5}
                            style={{ width: '100%', height: '100%' }}
                            attributionControl={false}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationPicker onLocationSelect={(lat, lng) => setClanLocation({ lat, lng })} />
                            {clanLocation && (
                                <Marker position={[clanLocation.lat, clanLocation.lng]} />
                            )}
                        </MapContainer>
                    </div>
                    {clanLocation && (
                        <p className="text-xs text-emerald-400 font-bold">
                            📍 Wybrano: {clanLocation.lat.toFixed(4)}, {clanLocation.lng.toFixed(4)}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateClan}
                    disabled={loading || !clanName.trim()}
                    className="w-full p-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-white font-black text-lg uppercase tracking-wider disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                    {loading ? 'Tworzę...' : `Stwórz Klan (-${TEST_MODE ? 0 : 100} 🌰)`}
                </motion.button>
            </div>
        );
    }

    // --- JOIN CLAN VIEW ---
    if (view === 'join') {
        return (
            <div className="max-w-md mx-auto p-4 space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button onClick={() => { setView('no-clan'); setError(''); }} className="flex items-center gap-1 text-gray-400 font-bold text-sm hover:text-gray-200 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Wróć
                </button>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-gray-800  flex items-center justify-center gap-2">
                        <Users className="w-7 h-7 text-blue-500" />
                        Dołącz do Klanu
                    </h2>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Szukaj klanu..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loadingClans ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    </div>
                ) : filteredClans.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 font-bold">
                        Brak publicznych klanów do wyświetlenia
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredClans.map(c => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-4 bg-gray-800/40 border border-gray-700 rounded-xl hover:bg-gray-700/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{c.avatar}</span>
                                    <div>
                                        <p className="font-black text-white">{c.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {c.memberCount} członków • {c.totalElo} ELO
                                            {c.minElo > 0 && ` • Min. ${c.minElo}`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleJoinClan(c.id)}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                                >
                                    Dołącz
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- DASHBOARD VIEW ---
    if (view === 'dashboard' && clan) {
        const members = Object.values(clan.members);
        const myRole = clan.members[userId]?.role;
        const isLeader = myRole === 'leader';
        const isCoLeader = myRole === 'co-leader';
        const canInvite = isLeader || isCoLeader;

        return (
            <div className="max-w-md mx-auto p-4 space-y-5 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Clan Header */}
                <div className="text-center space-y-3">
                    <div className="text-6xl">{clan.avatar}</div>
                    <h2 className="text-2xl font-black text-white">{clan.name}</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
                        {isLeader && <Crown className="inline w-4 h-4 text-yellow-400 mr-1" />}
                        {members.length} członków
                    </p>
                </div>

                {/* Clan Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-emerald-400">{clan.totalElo}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase">Łączne ELO</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-purple-400">{clan.averageWinrate}%</p>
                        <p className="text-xs font-bold text-gray-400 uppercase">Śr. Winrate</p>
                    </div>
                </div>

                {/* Dashboard Tabs Navigation */}
                <div className="flex bg-gray-800/50 rounded-xl p-1 shrink-0 overflow-x-auto hide-scrollbar">
                    {(['info', 'map', 'boss', 'diplomacy'] as DashboardTab[]).map(tab => {
                        const labels: Record<DashboardTab, string> = {
                            info: 'Przegląd',
                            map: 'Terytoria',
                            boss: 'Boss',
                            diplomacy: 'Dyplomacja'
                        };
                        return (
                            <button
                                key={tab}
                                onClick={() => setDashboardTab(tab)}
                                className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap px-2 ${dashboardTab === tab
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                                    }`}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT: INFO */}
                {dashboardTab === 'info' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Members List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-sm font-black uppercase text-gray-400">Członkowie</h4>
                                {canInvite && (
                                    <button
                                        onClick={handleOpenFriendModal}
                                        className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded-lg"
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Zaproś znajomego
                                    </button>
                                )}
                            </div>

                            {/* Error from invitations */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold mb-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                {members
                                    .sort((a, b) => b.elo - a.elo)
                                    .map(member => (
                                        <div
                                            key={member.uid}
                                            className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-600" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-white text-sm flex items-center gap-1">
                                                        {member.name}
                                                        {member.role === 'leader' && <Crown className="w-4 h-4 text-yellow-400" />}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {member.wins}W / {member.losses}L
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="font-black text-emerald-400">{member.elo}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>

                        {/* Clan Chat */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-black uppercase text-gray-400 px-2">Czat klanowy</h4>
                            <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden">
                                {/* Messages */}
                                <div className="h-48 overflow-y-auto p-3 space-y-2">
                                    {messages.length === 0 && (
                                        <p className="text-center text-gray-600 text-sm py-6">Brak wiadomości. Napisz pierwszą!</p>
                                    )}
                                    {messages.map(msg => (
                                        <div key={msg.id} className={`flex items-start gap-2 ${msg.senderId === userId ? 'flex-row-reverse' : ''}`}>
                                            {msg.senderAvatar ? (
                                                <img src={msg.senderAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <div className={`max-w-[70%] ${msg.senderId === userId ? 'text-right' : ''}`}>
                                                <p className="text-[10px] text-white font-bold">{msg.senderName}</p>
                                                <div className={`px-3 py-1.5 rounded-xl text-sm font-medium ${msg.senderId === userId
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-800 text-gray-200'
                                                    }`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-2 border-t border-gray-700 flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Napisz wiadomość..."
                                        maxLength={200}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-medium placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim()}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                {chatError && (
                                    <p className="text-xs text-red-400 px-3 pb-2">{chatError}</p>
                                )}
                            </div>
                        </div>

                        {/* Leave Clan button */}
                        <button
                            onClick={handleLeaveClan}
                            disabled={loading || addingFriendUid !== null}
                            className="w-full p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors mt-8"
                        >
                            <LogOut className="w-5 h-5" />
                            {isLeader && members.length === 1 ? 'Rozwiąż klan' : 'Opuść klan'}
                        </button>
                    </div>
                )}

                {/* TAB CONTENT: MAP */}
                {dashboardTab === 'map' && (
                    <div className="animate-in fade-in duration-300">
                        <ClanTerritoryMap clan={clan} userId={userId} />
                    </div>
                )}

                {/* TAB CONTENT: BOSS */}
                {dashboardTab === 'boss' && (
                    <div className="animate-in fade-in duration-300">
                        <ClanBossRaid clan={clan} userId={userId} />
                    </div>
                )}

                {/* TAB CONTENT: DIPLOMACY */}
                {dashboardTab === 'diplomacy' && (
                    <div className="animate-in fade-in duration-300">
                        <ClanDiplomacy clan={clan} userId={userId} />
                    </div>
                )}

                {/* Friend Invitation Modal */}
                {showFriendModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/30">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-emerald-400" />
                                    Zaproś do klanu
                                </h3>
                                <button
                                    onClick={() => { setShowFriendModal(false); setError(''); }}
                                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto flex-1">
                                {loadingFriends ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 space-y-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                        <p className="font-bold text-sm">Pobieranie znajomych...</p>
                                    </div>
                                ) : friendsList.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="font-bold">Nie masz jeszcze znajomych,</p>
                                        <p className="text-xs">których mógłbyś zaprosić.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {friendsList.map(friend => {
                                            const isAlreadyInClan = !!clan.members[friend.uid];
                                            const isFriendLoading = addingFriendUid === friend.uid;

                                            return (
                                                <div key={friend.uid} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        {friend.avatar ? (
                                                            <img src={friend.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                                <UserPlus className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-white text-sm">{friend.name}</span>
                                                    </div>

                                                    {isAlreadyInClan ? (
                                                        <span className="text-xs font-bold text-gray-500 px-3 py-1 bg-gray-800 rounded-lg">W klanie</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleAddFriend(friend.uid)}
                                                            disabled={isFriendLoading}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors"
                                                        >
                                                            {isFriendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zaproś'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default ClanPanel;
