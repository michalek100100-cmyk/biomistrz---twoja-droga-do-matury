import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LogOut, Loader2, Crown, Clock, BookOpen, ChevronRight, Edit3, Play } from 'lucide-react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Lobby, Unit, Topic } from '../types';

interface LobbyScreenProps {
    lobbyId: string;
    currentUserId: string;
    units: Unit[]; // <--- NOWE: Przekazujemy listę działów z App.tsx
    onLeave: () => void;
    onGameStart: (questions: any[], timePerQuestion: number) => void;
    onStartCharades?: (duration: number, rounds: number) => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
    lobbyId,
    currentUserId,
    units,
    onLeave,
    onGameStart,
    onStartCharades
}) => {
    const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
    const [loading, setLoading] = useState(true);

    // --- STAN KONFIGURACJI HOSTA ---
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [timePerQuestion, setTimePerQuestion] = useState(15); // Domyślnie 15 sekund
    const [numberOfRounds, setNumberOfRounds] = useState(3); // Domyślnie 3 rundy
    const [showTopicSelector, setShowTopicSelector] = useState(false);

    // 1. NASŁUCHIWANIE
    useEffect(() => {
        const lobbyRef = doc(db, 'lobbies', lobbyId);
        const unsubscribe = onSnapshot(lobbyRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Lobby;
                setLobbyData(data);

                // Jeśli gra ruszyła, a my jesteśmy graczem -> pobieramy pytania z bazy i startujemy
                if (data.status === 'GAME') {
                    if (data.type === 'charades' && data.timePerQuestion) {
                        onStartCharades?.(data.timePerQuestion, 3);
                    } else if (data.gameQuestions) {
                        onGameStart(data.gameQuestions, data.timePerQuestion || 15);
                    }
                }
            } else {
                onLeave();
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [lobbyId, onGameStart, onLeave]);

    // 2. START GRY (HOST)
    const handleStartGame = async () => {
        if (!lobbyData || !selectedTopic) {
            alert("Wybierz temat przed startem!");
            return;
        }

        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);

            // Uploadujemy wybrane pytania i ustawienia do Firebase
            // Dzięki temu każdy gracz dostanie ten sam zestaw
            await updateDoc(lobbyRef, {
                status: 'GAME',
                gameQuestions: selectedTopic.questions, // Zapisujemy tylko te ~15 pytań
                timePerQuestion: timePerQuestion,
                questionStartAt: serverTimestamp()
            });

            // Host też startuje
            onGameStart(selectedTopic.questions, timePerQuestion);

        } catch (error) {
            console.error("Błąd startu:", error);
        }
    };

    if (loading) return <div className="fixed inset-0 bg-purple-900 flex items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    if (!lobbyData) return null;

    const isHost = lobbyData.hostId === currentUserId;
    const playersList = Object.values(lobbyData.players || {});

    return (
        <div className="fixed inset-0 z-[70] bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col text-white animate-in fade-in duration-500 overflow-y-auto">

            {/* HEADER */}
            <div className="p-6 flex justify-between items-start">
                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-200">Kod PIN</p>
                    <p className="text-4xl font-black tracking-widest font-mono">{lobbyData.pin}</p>
                </div>
                <button onClick={onLeave} className="p-3 bg-white/10 hover:bg-red-500/20 rounded-full transition-colors text-white/70 hover:text-red-300">
                    <LogOut className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8 max-w-4xl mx-auto w-full">

                {/* TYTUŁ */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black drop-shadow-lg">
                        {isHost ? "Panel Organizatora" : "Poczekalnia"}
                    </h1>
                    <p className="text-purple-200 font-medium flex items-center justify-center gap-2">
                        <Users className="w-5 h-5" /> {playersList.length} Graczy
                    </p>
                </div>

                {/* --- SEKCJA KONFIGURACJI (TYLKO DLA HOSTA - GRUPA) --- */}
                {isHost && lobbyData.type !== 'charades' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-6">

                        {/* 1. Wybór Tematu */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Temat quizu
                            </label>

                            {!selectedTopic ? (
                                <button
                                    onClick={() => setShowTopicSelector(true)}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 rounded-2xl text-purple-200 font-bold hover:text-white transition-all"
                                >
                                    + Kliknij, aby wybrać temat
                                </button>
                            ) : (
                                <div className="flex items-center justify-between bg-purple-600 px-6 py-4 rounded-2xl shadow-lg cursor-pointer hover:bg-purple-500 transition-colors" onClick={() => setShowTopicSelector(true)}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{selectedTopic.icon}</span>
                                        <div className="text-left">
                                            <h3 className="font-black text-white">{selectedTopic.title}</h3>
                                            <p className="text-xs text-purple-200">{selectedTopic.questions.length} pytań</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">ZMIEŃ</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Suwak Czasu */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Czas na pytanie
                                </label>
                                <span className="font-black text-xl text-yellow-400">{timePerQuestion} s</span>
                            </div>
                            <input
                                type="range"
                                min="3"
                                max="30"
                                step="1"
                                value={timePerQuestion}
                                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                                className="w-full h-3 bg-purple-900/50 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                            <div className="flex justify-between text-[10px] text-purple-400 font-bold uppercase">
                                <span>Speed (3s)</span>
                                <span>Standard (15s)</span>
                                <span>Long (30s)</span>
                            </div>
                        </div>

                        {/* START */}
                        <button
                            onClick={handleStartGame}
                            disabled={!selectedTopic}
                            className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-xl transition-all ${selectedTopic
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 hover:scale-[1.02]'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Rozpocznij Wyścig
                        </button>
                    </motion.div>
                )}

                {/* --- SEKCJA KONFIGURACJI KALAMBUR (TYLKO DLA HOSTA) --- */}
                {isHost && lobbyData.type === 'charades' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-2xl mx-auto flex items-center justify-center border border-purple-500/30">
                                <Edit3 className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-black">Ustawienia Kalambur</h2>
                            <p className="text-sm text-purple-200">Wybierz czas na rysowanie. Temat zostanie wylosowany!</p>
                        </div>

                        {/* Suwak Czasu */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Czas na rundę
                                </label>
                                <span className="font-black text-2xl text-yellow-400">{timePerQuestion} s</span>
                            </div>
                            <input
                                type="range"
                                min="30"
                                max="180"
                                step="15"
                                value={timePerQuestion}
                                onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}
                                className="w-full h-3 bg-purple-900/50 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                            <div className="flex justify-between text-[10px] text-purple-400 font-bold uppercase tracking-tighter">
                                <span>Szybka Gra (30s)</span>
                                <span>Standard (60s)</span>
                                <span>Długa (180s)</span>
                            </div>
                        </div>

                        {/* Suwak Liczby Rund */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                                    🔁 Liczba rund
                                </label>
                                <span className="font-black text-2xl text-yellow-400">{numberOfRounds}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={numberOfRounds}
                                onChange={(e) => setNumberOfRounds(parseInt(e.target.value))}
                                className="w-full h-3 bg-purple-900/50 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                            />
                            <div className="flex justify-between text-[10px] text-purple-400 font-bold uppercase tracking-tighter">
                                <span>1 runda</span>
                                <span>5 rund</span>
                                <span>10 rund</span>
                            </div>
                        </div>

                        <button
                            onClick={() => onStartCharades?.(timePerQuestion, numberOfRounds)}
                            className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl font-black text-xl uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Play className="w-6 h-6 fill-white" /> Startuj Kalambury
                        </button>
                    </motion.div>
                )}

                {/* LISTA GRACZY */}
                <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
                    {playersList.map((player) => (
                        <div key={player.uid} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                                {player.avatar ? <img src={player.avatar} className="w-full h-full rounded-full" /> : player.nick.charAt(0)}
                            </div>
                            <div className="truncate">
                                <p className="font-bold text-sm truncate text-purple-100">{player.nick}</p>
                                {lobbyData.hostId === player.uid && <p className="text-[9px] text-yellow-300 font-black uppercase tracking-wider flex items-center gap-1"><Crown className="w-3 h-3" /> Host</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL WYBORU TEMATU */}
            <AnimatePresence>
                {showTopicSelector && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex flex-col pt-10"
                    >
                        <div className="p-6 flex justify-between items-center bg-gray-900 border-b border-gray-800">
                            <h2 className="text-xl font-black text-white">Wybierz Temat</h2>
                            <button onClick={() => setShowTopicSelector(false)} className="text-gray-400 hover:text-white font-bold">ZAMKNIJ</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {units.map(unit => (
                                <div key={unit.id} className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 tracking-widest ml-2">{unit.title}</h3>
                                    <div className="grid gap-3">
                                        {unit.topics.map(topic => (
                                            <button
                                                key={topic.id}
                                                onClick={() => { setSelectedTopic(topic); setShowTopicSelector(false); }}
                                                className="flex items-center justify-between bg-gray-800 hover:bg-gray-700 p-4 rounded-xl border border-gray-700 transition-colors text-left group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-2xl group-hover:scale-110 transition-transform">{topic.icon}</span>
                                                    <div>
                                                        <h4 className="font-bold text-white">{topic.title}</h4>
                                                        <p className="text-xs text-gray-400">{topic.questions.length} pytań</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LobbyScreen;