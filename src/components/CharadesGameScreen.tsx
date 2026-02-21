import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, update, off, serverTimestamp, remove } from 'firebase/database';
import { rtdb } from './firebaseConfig';
import { CharadesGameState, MultiplayerPlayer, ChatMessage } from '../types';
import CharadesCanvas from './CharadesCanvas';
import { getRandomWord } from '../data/charadesWords';
import { Clock, Edit3, Send, Trophy, ArrowRight, Palette, Trash2, MessageSquare, Pencil, RotateCw } from 'lucide-react';

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.2); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(168,85,247,0.4); }
`;

interface CharadesGameScreenProps {
    gameId: string;
    userId: string;
    onExit: () => void;
}

const CharadesGameScreen: React.FC<CharadesGameScreenProps> = ({ gameId, userId, onExit }) => {
    const [gameState, setGameState] = useState<CharadesGameState | null>(null);
    const [players, setPlayers] = useState<Record<string, MultiplayerPlayer>>({});

    const [timeLeft, setTimeLeft] = useState(60);
    const [isCorrect, setIsCorrect] = useState(false);
    const [currentColor, setCurrentColor] = useState("#a855f7");
    const [currentLineWidth, setCurrentLineWidth] = useState(6);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const scrollRef = React.useRef<HTMLDivElement>(null);
    // Mobile: drawer switches between canvas and chat
    const [drawerActiveTab, setDrawerActiveTab] = useState<'canvas' | 'chat'>('canvas');

    const COLORS = [
        "#ffffff", "#000000", "#ef4444", "#22c55e", "#3b82f6",
        "#eab308", "#a855f7", "#ec4899", "#f97316", "#78350f"
    ];

    // --- DERIVED STATE ---
    const isDrawer = gameState?.drawerId === userId;
    const currentWord = gameState?.currentWord || "";
    const duration = gameState?.duration || 60;
    const revealedIndices = gameState?.revealedIndices || [];
    const guessedBy = gameState?.guessedBy || [];
    const hasGuessedCorrectly = guessedBy.includes(userId);
    const totalRounds = gameState?.totalRounds || 1;
    const currentRound = gameState?.currentRound || 1;
    const drawerOrder = gameState?.drawerOrder || [];
    const isHostDrawer = drawerOrder.length > 0 && drawerOrder[0] === userId;
    // Determine if current user should be the one managing next round (first player in drawer order)
    const isRoundManager = isHostDrawer || (drawerOrder.length === 0 && isDrawer);

    // Build revealed word display for guessers
    const revealedWordDisplay = useMemo(() => {
        if (isDrawer) return currentWord;
        return currentWord.split('').map((char, i) => {
            if (char === ' ') return '  ';
            if (revealedIndices.includes(i)) return char;
            return '_';
        }).join(' ');
    }, [currentWord, revealedIndices, isDrawer]);

    // --- 1. SUBSKRYPCJA STANU GRY ---
    useEffect(() => {
        const stateRef = ref(rtdb, `games/charades/${gameId}/state`);
        const playersRef = ref(rtdb, `games/charades/${gameId}/players`);
        const chatRef = ref(rtdb, `games/charades/${gameId}/chat`);

        const unsubState = onValue(stateRef, (snapshot) => {
            if (snapshot.exists()) setGameState(snapshot.val());
        });
        const unsubPlayers = onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) setPlayers(snapshot.val());
        });
        const unsubChat = onValue(chatRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const msgs = Object.keys(data).map(key => ({ id: key, ...data[key] }))
                    .sort((a, b) => a.timestamp - b.timestamp);
                setMessages(msgs);
            } else {
                setMessages([]);
            }
        });

        return () => {
            off(stateRef); off(playersRef); off(chatRef);
            unsubState(); unsubPlayers(); unsubChat();
        };
    }, [gameId]);

    // --- AUTO-SCROLL ---
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // --- 2. TIMER ---
    useEffect(() => {
        if (!gameState || gameState.status !== 'drawing') return;
        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(remaining);
            if (remaining === 0 && gameState.status === 'drawing') {
                handleRoundEnd(null);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState]);

    // --- 3. PROGRESSIVE LETTER REVEAL (only drawer runs this) ---
    useEffect(() => {
        if (!gameState || gameState.status !== 'drawing' || !isDrawer) return;
        if (!currentWord) return;

        const letterIndices = currentWord.split('').map((c, i) => c !== ' ' ? i : -1).filter(i => i !== -1);
        const totalLetters = letterIndices.length;
        if (totalLetters <= 1) return;

        // Reveal one letter every (duration / (totalLetters + 1)) seconds
        const intervalSec = Math.max(3, Math.floor(duration / (totalLetters + 1)));

        const interval = setInterval(async () => {
            // Re-read current state from RTDB to avoid stale closure
            const stateRef = ref(rtdb, `games/charades/${gameId}/state`);
            onValue(stateRef, async (snapshot) => {
                if (!snapshot.exists()) return;
                const currentState = snapshot.val() as CharadesGameState;
                if (currentState.status !== 'drawing') return;

                const currentRevealed = currentState.revealedIndices || [];
                const unrevealed = letterIndices.filter(i => !currentRevealed.includes(i));

                if (unrevealed.length <= 0) return;

                // Pick random unrevealed letter
                const randomIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
                const newRevealed = [...currentRevealed, randomIdx];

                await update(ref(rtdb, `games/charades/${gameId}/state`), {
                    revealedIndices: newRevealed
                });

                // If all letters revealed, nobody wins
                if (newRevealed.length >= totalLetters) {
                    handleRoundEnd(null);
                }
            }, { onlyOnce: true });
        }, intervalSec * 1000);

        return () => clearInterval(interval);
    }, [gameState?.status, isDrawer, currentWord, duration]);

    // --- 4. CHAT / GUESSING LOGIC ---
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = chatInput.trim();
        if (!text || !gameState) return;

        // Guessers: check if it's the correct answer
        if (!isDrawer && !hasGuessedCorrectly && gameState.status === 'drawing') {
            const normalizedGuess = text.toLowerCase();
            const normalizedWord = currentWord.toLowerCase();
            if (normalizedGuess === normalizedWord) {
                // Correct guess!
                const timeLeftPercent = timeLeft / duration;
                const guesserPoints = Math.max(10, Math.round(100 * timeLeftPercent));
                const drawerPoints = Math.max(5, Math.round(50 * timeLeftPercent));

                const newMessageRef = ref(rtdb, `games/charades/${gameId}/chat/${Date.now()}`);
                await update(newMessageRef, {
                    senderId: userId,
                    senderNick: players[userId]?.nick || "Gracz",
                    text: `ODGADŁ HASŁO! 🎉 (+${guesserPoints} pkt)`,
                    timestamp: Date.now(),
                    isCorrect: true
                });

                // Add to guessedBy
                const newGuessedBy = [...guessedBy, userId];
                await update(ref(rtdb, `games/charades/${gameId}/state`), {
                    guessedBy: newGuessedBy
                });

                // Award points to guesser
                const guesserRef = ref(rtdb, `games/charades/${gameId}/players/${userId}`);
                const guesserScore = players[userId]?.score || 0;
                await update(guesserRef, { score: guesserScore + guesserPoints });

                // Award points to drawer
                const drawerRef = ref(rtdb, `games/charades/${gameId}/players/${gameState.drawerId}`);
                const drawerScore = players[gameState.drawerId]?.score || 0;
                await update(drawerRef, { score: drawerScore + drawerPoints });

                setIsCorrect(true);
                setChatInput("");

                // Check if all guessers have guessed → end round
                const allPlayerIds = Object.keys(players);
                const guesserIds = allPlayerIds.filter(id => id !== gameState.drawerId);
                if (guesserIds.every(id => newGuessedBy.includes(id))) {
                    handleRoundEnd(userId);
                }
                return;
            }
        }

        // Normal message
        const newMessageRef = ref(rtdb, `games/charades/${gameId}/chat/${Date.now()}`);
        await update(newMessageRef, {
            senderId: userId,
            senderNick: players[userId]?.nick || "Gracz",
            text: text,
            timestamp: Date.now()
        });
        setChatInput("");
    };

    const handleRoundEnd = async (winnerId: string | null) => {
        if (gameState?.status === 'finished' || gameState?.status === 'round_end') return;

        const isLastRound = currentRound >= totalRounds;

        if (isLastRound) {
            // Game over
            await update(ref(rtdb, `games/charades/${gameId}/state`), {
                status: 'finished',
                winnerId,
                endTime: serverTimestamp()
            });
        } else {
            // More rounds to play
            await update(ref(rtdb, `games/charades/${gameId}/state`), {
                status: 'round_end',
                winnerId,
                endTime: serverTimestamp()
            });
        }
    };

    const handleNextRound = async () => {
        if (!gameState || gameState.status !== 'round_end') return;

        const nextRound = currentRound + 1;
        const nextDrawerIndex = (nextRound - 1) % drawerOrder.length;
        const nextDrawerId = drawerOrder[nextDrawerIndex];
        const newWord = getRandomWord();

        // Clear drawing canvas
        await remove(ref(rtdb, `games/charades/${gameId}/drawing`));
        // Clear chat
        await remove(ref(rtdb, `games/charades/${gameId}/chat`));

        // Update game state for new round
        await update(ref(rtdb, `games/charades/${gameId}/state`), {
            currentWord: newWord,
            drawerId: nextDrawerId,
            startTime: Date.now(),
            status: 'drawing',
            currentRound: nextRound,
            winnerId: null,
            endTime: null,
            revealedIndices: [],
            guessedBy: []
        });

        setIsCorrect(false);
    };

    const handleClearCanvas = async () => {
        if (!isDrawer || gameState?.status !== 'drawing') return;
        await remove(ref(rtdb, `games/charades/${gameId}/drawing`));
    };

    // --- MESSAGE DISPLAY LOGIC (hashing) ---
    const getMessageText = (m: ChatMessage): string => {
        if (!m.isCorrect) return m.text;
        // Correct guess → visible to drawer and the sender, hashed for everyone else
        if (isDrawer || m.senderId === userId) return m.text;
        return '•••••';
    };

    // --- LOADING ---
    if (!gameState) return (
        <div className="fixed inset-0 bg-gray-950 flex items-center justify-center text-white">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-sm text-gray-400">Ładowanie gry...</p>
            </div>
        </div>
    );

    // --- SHARED COMPONENTS ---
    const renderPlayersList = () => (
        <div className="space-y-2">
            {Object.values(players).map(p => (
                <motion.div
                    key={p.uid} layout
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${p.uid === gameState.drawerId ? 'bg-purple-500/20 border-purple-500/30' :
                        guessedBy.includes(p.uid) ? 'bg-green-500/10 border-green-500/20' :
                            'bg-white/5 border-transparent'
                        }`}
                >
                    <div className="relative">
                        {p.avatar ? (
                            <img src={p.avatar} alt={p.nick} className="w-10 h-10 rounded-xl border border-white/20 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl border border-white/20 bg-purple-600/30 flex items-center justify-center text-sm font-black text-purple-300">
                                {p.nick?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                        )}
                        {p.uid === gameState.drawerId && (
                            <div className="absolute -top-1 -right-1 bg-purple-500 p-1 rounded-md shadow-lg">
                                <Edit3 className="w-2.5 h-2.5 text-white" />
                            </div>
                        )}
                        {guessedBy.includes(p.uid) && p.uid !== gameState.drawerId && (
                            <div className="absolute -top-1 -right-1 bg-green-500 p-1 rounded-md shadow-lg text-[8px]">✓</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate">{p.nick}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{p.score || 0} pkt</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );

    const renderChat = () => (
        <div className="flex-1 flex flex-col min-h-0">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-4">
                        <MessageSquare className="w-8 h-8 mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Brak wiadomości</p>
                    </div>
                )}
                {messages.map(m => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        key={m.id}
                        className={`text-sm ${m.isCorrect && (isDrawer || m.senderId === userId) ? 'bg-green-500/20 p-2 rounded-lg border border-green-500/30' : m.isCorrect ? 'bg-gray-500/10 p-2 rounded-lg border border-gray-500/20' : ''}`}
                    >
                        <span className={`font-black tracking-tight mr-1 ${m.senderId === userId ? 'text-blue-400' : 'text-purple-400'}`}>
                            {m.senderNick}:
                        </span>
                        <span className={`font-medium ${m.isCorrect && (isDrawer || m.senderId === userId) ? 'text-green-400 font-black italic' : m.isCorrect ? 'text-gray-500' : 'text-gray-200'}`}>
                            {getMessageText(m)}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/5">
                <div className="relative">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={!isDrawer && !hasGuessedCorrectly ? "Zgadnij hasło..." : "Napisz na czacie..."}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pr-10 text-sm font-bold focus:border-purple-500 outline-none transition-all"
                        disabled={!isDrawer && hasGuessedCorrectly && gameState.status === 'drawing'}
                    />
                    <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-purple-400 hover:text-purple-300 transition-colors">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );

    const renderWordHint = () => (
        <div className="text-center">
            {isDrawer ? (
                <div className="bg-purple-600/20 px-4 py-2 rounded-2xl border border-purple-500/30 inline-block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-0.5">Twoje hasło</p>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">{currentWord}</h2>
                </div>
            ) : (
                <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 inline-block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Zgadnij hasło</p>
                    <h2 className="text-xl md:text-2xl font-black tracking-[0.3em] text-white font-mono">
                        {revealedWordDisplay}
                    </h2>
                </div>
            )}
        </div>
    );

    const renderTimer = () => (
        <div className="flex items-center gap-3">
            {totalRounds > 1 && (
                <div className="bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/30">
                    <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                        Runda {currentRound}/{totalRounds}
                    </span>
                </div>
            )}
            <div className={`flex items-center gap-2 p-2 rounded-xl ${timeLeft <= 10 ? 'bg-red-500/20 animate-pulse' : 'bg-white/5'}`}>
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-400' : 'text-gray-400'}`} />
                <span className={`text-lg font-black ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>{timeLeft}s</span>
            </div>
        </div>
    );

    const renderCanvas = () => (
        <div className="w-full h-full relative bg-gray-900/40 rounded-2xl md:rounded-[2.5rem] border border-white/5 shadow-inner overflow-hidden">
            <CharadesCanvas
                gameId={gameId}
                isDrawer={isDrawer}
                color={currentColor}
                lineWidth={currentLineWidth}
            />

            {/* Drawer Toolbar */}
            {isDrawer && gameState.status === 'drawing' && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 bg-gray-900/80 backdrop-blur-2xl p-2 md:p-3 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-1.5 px-1.5 border-r border-white/10">
                        {COLORS.slice(0, 5).map(c => (
                            <button key={c} onClick={() => setCurrentColor(c)}
                                className={`w-6 h-6 md:w-7 md:h-7 rounded-md transition-all ${currentColor === c ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-100'}`}
                                style={{ backgroundColor: c }} />
                        ))}
                        <button onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 ml-1">
                            <Palette className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5 px-1.5 border-r border-white/10">
                        {[3, 6, 12].map(size => (
                            <button key={size} onClick={() => setCurrentLineWidth(size)}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all ${currentLineWidth === size ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                                <div className="bg-current rounded-full" style={{ width: size / 2 + 3, height: size / 2 + 3 }} />
                            </button>
                        ))}
                    </div>
                    <button onClick={handleClearCanvas} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20" title="Wyczyść">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Color Picker Overlay */}
            <AnimatePresence>
                {showColorPicker && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-2xl p-3 rounded-2xl border border-white/20 shadow-2xl grid grid-cols-5 gap-2">
                        {COLORS.map(c => (
                            <button key={c} onClick={() => { setCurrentColor(c); setShowColorPicker(false); }}
                                className={`w-9 h-9 rounded-lg transition-all ${currentColor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c }} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Round End Overlay */}
            <AnimatePresence>
                {gameState.status === 'round_end' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center z-50 p-6 text-center">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                            className="bg-purple-500/20 p-5 rounded-full mb-4 border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
                            <RotateCw className="w-12 h-12 text-purple-400" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tighter">
                            KONIEC RUNDY {currentRound}
                        </h3>
                        <p className="text-lg text-gray-400 mb-2">Hasło: <span className="text-white font-black underline decoration-purple-500 underline-offset-4">{currentWord}</span></p>
                        <p className="text-sm text-gray-500 mb-6">
                            {gameState.winnerId ? `Odgadnięte!` : `Czas minął!`}
                        </p>

                        {/* Mini scoreboard */}
                        <div className="w-full max-w-xs space-y-2 mb-6">
                            {Object.values(players)
                                .sort((a, b) => (b.score || 0) - (a.score || 0))
                                .map((p, i) => (
                                    <div key={p.uid} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-gray-500">{i + 1}.</span>
                                            <span className="font-bold text-sm">{p.nick}</span>
                                        </div>
                                        <span className="font-black text-yellow-400">{p.score || 0} pkt</span>
                                    </div>
                                ))}
                        </div>

                        {isRoundManager ? (
                            <button onClick={handleNextRound}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl active:scale-95 group">
                                NASTĘPNA RUNDA <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <p className="text-sm text-gray-500 font-bold animate-pulse">Oczekiwanie na następną rundę...</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Finished Overlay */}
            <AnimatePresence>
                {gameState.status === 'finished' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm rounded-2xl md:rounded-[2.5rem] flex flex-col items-center justify-center z-50 p-6 text-center">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                            className="bg-yellow-500/20 p-5 rounded-full mb-4 border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.2)]">
                            <Trophy className="w-12 h-12 text-yellow-400" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 tracking-tighter">
                            {totalRounds > 1 ? "GRA ZAKOŃCZONA!" :
                                (gameState.winnerId
                                    ? (isCorrect ? "BRAWO! ODGADŁEŚ!" : isDrawer ? "KTOŚ ODGADŁ!" : "KTOŚ ODGADŁ!")
                                    : "CZAS MINĄŁ!")}
                        </h3>
                        <p className="text-lg text-gray-400 mb-2">Hasło: <span className="text-white font-black underline decoration-purple-500 underline-offset-4">{currentWord}</span></p>

                        {/* Final scoreboard */}
                        {totalRounds > 1 && (
                            <div className="w-full max-w-xs space-y-2 mb-6">
                                {Object.values(players)
                                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                                    .map((p, i) => (
                                        <div key={p.uid} className={`flex items-center justify-between px-4 py-2 rounded-xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-gray-500">{i === 0 ? '🏆' : `${i + 1}.`}</span>
                                                <span className="font-bold text-sm">{p.nick}</span>
                                            </div>
                                            <span className="font-black text-yellow-400">{p.score || 0} pkt</span>
                                        </div>
                                    ))}
                            </div>
                        )}

                        <button onClick={onExit}
                            className="bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-2xl font-black transition-all flex items-center gap-2 shadow-xl active:scale-95 group">
                            WRÓĆ DO MENU <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // =====================================================
    // MAIN LAYOUT
    // =====================================================
    return (
        <div className="fixed inset-0 z-[80] bg-gray-950 text-white flex flex-col overflow-hidden">
            <style>{scrollbarStyles}</style>

            {/* === MOBILE HEADER === */}
            <div className="flex items-center justify-between p-3 bg-gray-900/50 border-b border-white/10 backdrop-blur-md z-20 gap-3">
                {renderTimer()}
                <div className="flex-1 flex justify-center">{renderWordHint()}</div>
                <button onClick={onExit}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 transition-all shrink-0">
                    Wyjdź
                </button>
            </div>

            {/* === BODY === */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

                {/* --- DESKTOP SIDEBAR (lg+) --- */}
                <div className="hidden lg:flex lg:w-80 bg-gray-900/50 border-r border-white/10 flex-col h-full">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-300">Gracze</h2>
                        </div>
                        {renderPlayersList()}
                    </div>
                    <div className="flex-1 flex flex-col min-h-0 bg-black/20">
                        <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Czat</span>
                        </div>
                        {renderChat()}
                    </div>
                </div>

                {/* --- MAIN CONTENT --- */}
                {isDrawer ? (
                    // ========== DRAWER VIEW ==========
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        {/* Mobile: show active tab */}
                        <div className="flex-1 min-h-0 relative">
                            {drawerActiveTab === 'canvas' ? (
                                <div className="absolute inset-0 p-3 md:p-6 lg:p-10 flex items-center justify-center">
                                    {renderCanvas()}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col lg:hidden">
                                    <div className="p-3 border-b border-white/10 bg-white/5">
                                        {renderPlayersList()}
                                    </div>
                                    <div className="flex-1 flex flex-col min-h-0 bg-black/20">
                                        {renderChat()}
                                    </div>
                                </div>
                            )}
                            {/* Desktop: always show canvas */}
                            <div className="hidden lg:flex absolute inset-0 p-6 lg:p-10 items-center justify-center">
                                {renderCanvas()}
                            </div>
                        </div>

                        {/* Mobile FAB toggle (drawer only, lg:hidden) */}
                        <button
                            onClick={() => setDrawerActiveTab(drawerActiveTab === 'canvas' ? 'chat' : 'canvas')}
                            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-600 hover:bg-purple-500 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-90"
                        >
                            {drawerActiveTab === 'canvas' ? <MessageSquare className="w-6 h-6" /> : <Pencil className="w-6 h-6" />}
                        </button>

                        {/* Status pill */}
                        {gameState.status === 'drawing' && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 lg:bottom-4 lg:top-auto flex items-center gap-2 text-purple-400 font-black uppercase tracking-widest text-[10px] bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 z-10 pointer-events-none">
                                <Edit3 className="w-3 h-3" />
                                Gracze zgadują...
                            </div>
                        )}
                    </div>
                ) : (
                    // ========== GUESSER VIEW ==========
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Canvas area */}
                        <div className="flex-1 min-h-0 p-3 md:p-6 lg:p-10 flex items-center justify-center relative">
                            {renderCanvas()}

                            {/* Correct guess overlay */}
                            {hasGuessedCorrectly && gameState.status === 'drawing' && (
                                <div className="absolute inset-0 bg-green-500/5 flex items-center justify-center pointer-events-none z-10 rounded-2xl">
                                    <div className="bg-green-500/20 px-6 py-3 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                                        <p className="text-green-400 font-black uppercase tracking-widest text-sm">✓ Odgadłeś!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat panel (mobile: bottom 40%) */}
                        <div className="h-[40vh] lg:hidden border-t border-white/10 bg-gray-900/50 flex flex-col">
                            {/* Mini player bar */}
                            <div className="flex items-center gap-2 p-2 border-b border-white/10 bg-white/5 overflow-x-auto shrink-0">
                                {Object.values(players).map(p => (
                                    <div key={p.uid} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0 text-[10px] font-bold ${p.uid === gameState.drawerId ? 'bg-purple-500/20 text-purple-300' :
                                        guessedBy.includes(p.uid) ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-400'
                                        }`}>
                                        {p.uid === gameState.drawerId && <Edit3 className="w-2.5 h-2.5" />}
                                        {guessedBy.includes(p.uid) && p.uid !== gameState.drawerId && <span>✓</span>}
                                        {p.nick} <span className="text-gray-500">({p.score || 0})</span>
                                    </div>
                                ))}
                            </div>
                            {renderChat()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CharadesGameScreen;
