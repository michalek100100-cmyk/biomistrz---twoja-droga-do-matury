// src/hooks/useMultiplayer.ts
import { useState, useCallback } from 'react';
import { doc, collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, set, get, remove, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import { db, rtdb } from '../components/firebaseConfig';
import { Question, Unit, UserStats } from '../types';
import { generateBotProfile } from '../services/botService';
import { getRandomWord } from '../data/charadesWords';

export type GameStatus = 'LOBBY' | 'GAME' | 'WAITING_1V1' | null;

interface UseMultiplayerProps {
    user: { uid: string } | null;
    stats: UserStats;
    units: Unit[];
    showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface UseMultiplayerReturn {
    currentLobbyId: string | null;
    setCurrentLobbyId: (id: string | null) => void;
    isHost: boolean;
    setIsHost: (isHost: boolean) => void;
    lobbyStatus: GameStatus;
    setLobbyStatus: (status: GameStatus) => void;
    showMultiplayer: boolean;
    setShowMultiplayer: (show: boolean) => void;
    isMultiplayerGameActive: boolean;
    setIsMultiplayerGameActive: (active: boolean) => void;
    multiplayerQuestions: Question[];
    setMultiplayerQuestions: (questions: Question[]) => void;
    multiplayerTimePerQuestion: number;
    setMultiplayerTimePerQuestion: (time: number) => void;
    generateBattleQuestions: () => Question[];
    handleFind1v1Match: () => Promise<void>;
    handleCreateLobby: () => Promise<void>;
    handleJoinLobby: (pin: string, nick: string) => Promise<void>;
    handleHostExit: (lobbyId: string) => void;
    handleStartCharadesGame: (lobbyId: string, duration?: number, rounds?: number) => Promise<void>;
    handleAddBot: (lobbyId: string) => Promise<void>;
}

export function useMultiplayer({
    user,
    stats,
    units,
    showNotification
}: UseMultiplayerProps): UseMultiplayerReturn {
    const [currentLobbyId, setCurrentLobbyId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [lobbyStatus, setLobbyStatus] = useState<GameStatus>(null);
    const [showMultiplayer, setShowMultiplayer] = useState(false);
    const [isMultiplayerGameActive, setIsMultiplayerGameActive] = useState(false);
    const [multiplayerQuestions, setMultiplayerQuestions] = useState<Question[]>([]);
    const [multiplayerTimePerQuestion, setMultiplayerTimePerQuestion] = useState(15);

    // Generate battle questions from random topics
    const generateBattleQuestions = useCallback(() => {
        const shuffledUnits = [...units].sort(() => 0.5 - Math.random());
        const selectedUnits = shuffledUnits.slice(0, 4);
        let battleQuestions: Question[] = [];

        selectedUnits.forEach(unit => {
            const randomTopic = unit.topics[Math.floor(Math.random() * unit.topics.length)];
            const shuffledQuestions = [...randomTopic.questions].sort(() => 0.5 - Math.random());
            const questionsFromTopic = shuffledQuestions.slice(0, 3).map(q => ({
                ...q,
                topicName: randomTopic.title
            }));
            battleQuestions = [...battleQuestions, ...questionsFromTopic];
        });

        return battleQuestions;
    }, [units]);

    // Find 1v1 match (Atomic matching with RTDB)
    const handleFind1v1Match = useCallback(async () => {
        if (!user) {
            showNotification("Musisz być zalogowany!", 'error');
            return;
        }


        try {
            const queueRef = ref(rtdb, 'matchmaking/1v1/queue');
            const snapshot = await get(queueRef);

            let matchFound = false;
            let opponentUid = '';

            if (snapshot.exists()) {
                const queue = snapshot.val();
                opponentUid = Object.keys(queue).find(uid => uid !== user.uid) || '';
                if (opponentUid) matchFound = true;
            }

            if (matchFound) {
                const opponentData = snapshot.val()[opponentUid];
                await remove(ref(rtdb, `matchmaking/1v1/queue/${opponentUid}`));

                const gameId = `game_${opponentUid}_${user.uid}_${Date.now()}`;
                const questions = generateBattleQuestions();

                const gameData = {
                    type: '1v1',
                    status: 'GAME',
                    createdAt: rtdbTimestamp(),
                    players: {
                        [opponentUid]: {
                            uid: opponentUid,
                            nick: opponentData.nick,
                            avatar: opponentData.avatar,
                            score: 0,
                            status: 'ready'
                        },
                        [user.uid]: {
                            uid: user.uid,
                            nick: stats.name,
                            avatar: stats.avatar || '',
                            score: 0,
                            status: 'ready'
                        }
                    }
                };

                await set(ref(rtdb, `games/1v1/${gameId}`), gameData);

                // Host zapisał swoje lobbyId w kolejce RTDB — aktualizujemy TO SAMO lobby
                const hostLobbyId = opponentData.lobbyId;

                if (hostLobbyId) {
                    // Aktualizuj ISTNIEJĄCE lobby hosta (żeby App.tsx hosta to wykrył)
                    const lobbyRef = doc(db, 'lobbies', hostLobbyId);
                    await updateDoc(lobbyRef, {
                        status: 'GAME',
                        rtdbGameId: gameId,
                        gameQuestions: questions,
                        timePerQuestion: 12,
                        [`players.${user.uid}`]: {
                            uid: user.uid,
                            nick: stats.name,
                            avatar: stats.avatar || '',
                            score: 0,
                            status: 'ready'
                        }
                    });
                    setCurrentLobbyId(hostLobbyId);
                } else {
                    // Fallback: stwórz nowe lobby (nie powinno się zdarzyć)
                    const lobbyData = {
                        type: '1v1',
                        status: 'GAME',
                        rtdbGameId: gameId,
                        gameQuestions: questions,
                        timePerQuestion: 12,
                        players: gameData.players,
                        createdAt: serverTimestamp()
                    };
                    const docRef = await addDoc(collection(db, 'lobbies'), lobbyData);
                    setCurrentLobbyId(docRef.id);
                }

                setIsHost(false);
            } else {
                // Najpierw tworzymy lobby w Firestore...
                const lobbyData = {
                    type: '1v1',
                    status: 'WAITING_1V1',
                    hostId: user.uid,
                    createdAt: serverTimestamp(),
                    players: {
                        [user.uid]: {
                            uid: user.uid,
                            nick: stats.name,
                            avatar: stats.avatar || '',
                            score: 0,
                            status: 'waiting'
                        }
                    }
                };
                const docRef = await addDoc(collection(db, 'lobbies'), lobbyData);
                setCurrentLobbyId(docRef.id);
                setIsHost(true);
                setLobbyStatus('WAITING_1V1');

                // ...potem dodajemy się do kolejki RTDB Z lobbyId (żeby joiner mógł je znaleźć)
                const myQueueRef = ref(rtdb, `matchmaking/1v1/queue/${user.uid}`);
                await set(myQueueRef, {
                    nick: stats.name,
                    avatar: stats.avatar || '',
                    elo: stats.elo || 0,
                    lobbyId: docRef.id,  // <--- KLUCZ DO NAPRAWY
                    joinedAt: rtdbTimestamp()
                });

                onDisconnect(myQueueRef).remove();
            }

        } catch (error) {
            console.error(error);
            showNotification("Błąd łączenia z Realtime DB.", 'error');
        }
    }, [user, stats, generateBattleQuestions, showNotification]);

    const handleCreateLobby = useCallback(async (type: 'group' | 'charades' = 'group') => {
        if (!user) {
            showNotification("Musisz być zalogowany!", 'error');
            return;
        }

        try {
            const pin = Math.floor(100000 + Math.random() * 900000).toString();

            const lobbyData = {
                type: type,
                pin: pin,
                hostId: user.uid,
                hostName: stats.name,
                topic: null,
                status: 'LOBBY',
                currentQuestionIndex: 0,
                createdAt: serverTimestamp(),
                players: {
                    [user.uid]: {
                        uid: user.uid,
                        nick: stats.name,
                        avatar: stats.avatar || '',
                        score: 0,
                        lastSyncIndex: -1,
                        status: 'waiting'
                    }
                }
            };

            const docRef = await addDoc(collection(db, 'lobbies'), lobbyData);
            setCurrentLobbyId(docRef.id);
            setIsHost(true);
            setLobbyStatus('LOBBY');
            showNotification(`Pokój utworzony! Kod PIN: ${pin}`, 'success');

        } catch (error: any) {
            console.error(error);
            showNotification("Nie udało się utworzyć pokoju.", 'error');
        }
    }, [user, stats, showNotification]);

    const handleStartCharadesGame = useCallback(async (lobbyId: string, duration: number = 60, rounds: number = 3) => {
        if (!user) return;

        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            const gameId = `charades_lobby_${lobbyId}_${Date.now()}`;
            const word = getRandomWord();

            const lobbySnap = await getDoc(lobbyRef);
            if (!lobbySnap.exists()) return;
            const lobbyData = lobbySnap.data() as any;
            const playerIds = Object.keys(lobbyData.players || {});
            if (playerIds.length === 0) return;

            // Create a shuffled drawer order for round rotation
            const drawerOrder = [...playerIds].sort(() => 0.5 - Math.random());
            const drawerId = drawerOrder[0];

            const gameData = {
                state: {
                    currentWord: word,
                    drawerId: drawerId,
                    startTime: Date.now(),
                    status: 'drawing',
                    duration: duration,
                    totalRounds: rounds,
                    currentRound: 1,
                    drawerOrder: drawerOrder,
                    guessedBy: [],
                    revealedIndices: []
                },
                players: lobbyData.players
            };

            await set(ref(rtdb, `games/charades/${gameId}`), gameData);

            await updateDoc(lobbyRef, {
                status: 'GAME',
                rtdbGameId: gameId,
                timePerQuestion: duration
            });

        } catch (error) {
            console.error("Błąd startu Kalambur:", error);
            showNotification("Błąd podczas startu gry.", 'error');
        }
    }, [user, showNotification]);

    const handleJoinLobby = useCallback(async (pin: string, nick: string) => {
        if (!user) {
            showNotification("Musisz być zalogowany!", 'error');
            return;
        }

        try {
            const q = query(collection(db, 'lobbies'), where('pin', '==', pin));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                showNotification("Błędny kod PIN.", 'error');
                return;
            }

            const lobbyDoc = querySnapshot.docs[0];
            const lobbyId = lobbyDoc.id;
            const lobbyData = lobbyDoc.data();

            if (lobbyData.status !== 'LOBBY') {
                showNotification("Gra już trwa!", 'error');
                return;
            }

            const playerRef = doc(db, 'lobbies', lobbyId);

            await updateDoc(playerRef, {
                [`players.${user.uid}`]: {
                    uid: user.uid,
                    nick: nick,
                    avatar: stats.avatar || '',
                    score: 0,
                    lastSyncIndex: -1,
                    status: 'waiting'
                }
            });

            setCurrentLobbyId(lobbyId);
            setIsHost(false);
            setLobbyStatus('LOBBY');
            showNotification("Dołączono pomyślnie!", 'success');

        } catch (error: any) {
            showNotification("Wystąpił błąd podczas dołączania.", 'error');
        }
    }, [user, stats, showNotification]);

    const handleHostExit = useCallback((lobbyIdToDelete: string) => {
        setIsMultiplayerGameActive(false);
        setCurrentLobbyId(null);
        setShowMultiplayer(false);
        setLobbyStatus(null);
        showNotification("Lobby zostanie zamknięte za 10 sekund.", 'info');

        setTimeout(async () => {
            try {
                await deleteDoc(doc(db, 'lobbies', lobbyIdToDelete));
            } catch (error) {
                console.error("Błąd automatycznego usuwania lobby:", error);
            }
        }, 10000);
    }, [showNotification]);

    const handleAddBot = useCallback(async (lobbyId: string) => {
        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            const botProfile = generateBotProfile(stats.elo || 0);
            const questions = generateBattleQuestions();

            await updateDoc(lobbyRef, {
                status: 'GAME',
                gameQuestions: questions,
                timePerQuestion: 12,
                questionStartAt: serverTimestamp(),
                [`players.${botProfile.uid}`]: {
                    uid: botProfile.uid,
                    nick: botProfile.displayName,
                    avatar: botProfile.photoURL,
                    score: 0,
                    status: 'ready',
                    isBot: true,
                    botElo: botProfile.stats.elo
                }
            });
            showNotification("Dołączył przeciwnik (BOT)!", 'success');
        } catch (e) {
            console.error("Error adding bot manually:", e);
            showNotification("Błąd dodawania bota.", 'error');
        }
    }, [stats.elo, generateBattleQuestions, showNotification]);

    return {
        currentLobbyId,
        setCurrentLobbyId,
        isHost,
        setIsHost,
        lobbyStatus,
        setLobbyStatus,
        showMultiplayer,
        setShowMultiplayer,
        isMultiplayerGameActive,
        setIsMultiplayerGameActive,
        multiplayerQuestions,
        setMultiplayerQuestions,
        multiplayerTimePerQuestion,
        setMultiplayerTimePerQuestion,
        generateBattleQuestions,
        handleFind1v1Match,
        handleCreateLobby,
        handleJoinLobby,
        handleHostExit,
        handleStartCharadesGame,
        handleAddBot
    };
}

export default useMultiplayer;
