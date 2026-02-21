import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Trophy, BookOpen, Swords, TrendingUp, TrendingDown } from 'lucide-react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, update, onValue } from 'firebase/database';
import { db, rtdb } from './firebaseConfig';
import { Question, MultiplayerPlayer } from '../types';
import { updateRankingAfterMatch, getPlayerRanking, formatEloChange } from '../services/rankingService';
import { getBotDelay, shouldBotAnswerCorrectly } from '../services/botService';

const SOUNDS = {
  count3: '/sounds/countdown_3.mp3',
  count2: '/sounds/countdown_2.mp3',
  count1: '/sounds/countdown_1.mp3',
  go: '/sounds/countdown_go.mp3',
  music1: '/sounds/Biomistrz-multiplayer-Loop-slow.mp3',
  music2: '/sounds/Biomistrz-multiplayer-Loop-Medium.mp3',
  music3: '/sounds/Biomistrz-multiplayer-Loop-High.mp3',
  music4: '/sounds/Biomistrz-multiplayer-Loop-High.mp3',
};

interface MultiplayerGameScreenProps {
  lobbyId: string;
  rtdbGameId?: string; // <--- NOWY PROP
  userId: string;
  isHost: boolean;
  questions: Question[];
  timePerQuestion: number;
  onExit: () => void;
  is1v1Game?: boolean;
}

const MultiplayerGameScreen: React.FC<MultiplayerGameScreenProps> = ({ lobbyId, rtdbGameId, userId, isHost, questions, timePerQuestion, onExit, is1v1Game = false }) => {
  // --- STAN STARTOWY ---
  const [startCountdown, setStartCountdown] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);

  // --- STAN GRY ---
  const [localIndex, setLocalIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [localScore, setLocalScore] = useState(0);
  const [combo, setCombo] = useState(0);

  // --- BLOKADA PRZEJŚCIA ---
  const [isProcessing, setIsProcessing] = useState(false);

  // --- STAN PRZERWY (INTERMISSION) ---
  const [isIntermission, setIsIntermission] = useState(false);
  const [intermissionPhase, setIntermissionPhase] = useState<'rank' | 'countdown'>('rank');
  const [intermissionCountdown, setIntermissionCountdown] = useState(3);
  const [myCurrentRank, setMyCurrentRank] = useState(0);
  const [top5Players, setTop5Players] = useState<MultiplayerPlayer[]>([]);

  // --- Ikonki i Wyniki ---
  const [persistentRank, setPersistentRank] = useState<number | null>(null);
  const [liveLeaderboard, setLiveLeaderboard] = useState<MultiplayerPlayer[]>([]);

  // --- 1v1 Ranking State ---
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [newTierName, setNewTierName] = useState<string | null>(null);
  const [rankingUpdated, setRankingUpdated] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- DANE PYTANIA I TEMATU ---
  const currentQuestion = questions[localIndex];

  // Shuffle options so correct answer isn't always in the same position
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion?.options) return [];
    return [...currentQuestion.options].sort(() => 0.5 - Math.random());
  }, [currentQuestion?.id, localIndex]);

  // Tu pobieramy temat AKTUALNEGO pytania
  const currentTopicName = currentQuestion?.topicName || "Ogólne";

  // Tu sprawdzamy temat NASTĘPNEGO pytania (dla ekranu przerwy)
  const nextQuestionIndex = localIndex + 1;
  const nextTopicName = questions[nextQuestionIndex]?.topicName || "Finał";

  const isFinished = localIndex >= questions.length;
  const progressPercent = questions.length > 0 ? (localIndex / questions.length) * 100 : 0;
  const currentSegment = progressPercent >= 90 ? 3 : progressPercent >= 60 ? 2 : progressPercent >= 30 ? 1 : 0;

  // --- DEFINICJA PROGÓW ---
  const checkpoints = useMemo(() => {
    const qCount = questions.length;
    if (qCount < 3) return [qCount - 1];
    return [
      Math.floor(qCount * 0.3) - 1,
      Math.floor(qCount * 0.6) - 1,
      Math.floor(qCount * 0.9) - 1,
      qCount - 1
    ];
  }, [questions]);

  // --- 1. ODLICZANIE NA STARCIE ---
  useEffect(() => {
    if (gameStarted) return;
    playCountdownSound(startCountdown);

    if (startCountdown > 0) {
      const timer = setTimeout(() => setStartCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setGameStarted(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [startCountdown, gameStarted]);

  // --- POMOCNICZE ---
  const playSound = (file: string, volume = 0.5) => {
    try { const audio = new Audio(file); audio.volume = volume; audio.play().catch(() => { }); } catch (e) { }
  };

  const playCountdownSound = (count: number) => {
    if (count === 3) playSound(SOUNDS.count3);
    if (count === 2) playSound(SOUNDS.count2);
    if (count === 1) playSound(SOUNDS.count1);
    if (count === 0) playSound(SOUNDS.go);
  };

  // --- 2. MUZYKA I TŁO ---
  const getBackgroundGradient = () => {
    if (progressPercent >= 90) return 'bg-gradient-to-b from-red-900 via-red-950 to-black';
    if (progressPercent >= 60) return 'bg-gradient-to-br from-orange-700 to-red-900';
    if (progressPercent >= 30) return 'bg-gradient-to-br from-yellow-600 to-orange-800';
    return 'bg-gradient-to-br from-green-700 to-emerald-900';
  };

  // --- 🎵 FIX MUZYKI (LOOPING BEZ PRZERWY) 🎵 ---
  useEffect(() => {
    if (!gameStarted || isFinished) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      return;
    }

    let targetTrack = SOUNDS.music1;
    if (progressPercent >= 90) targetTrack = SOUNDS.music4;
    else if (progressPercent >= 60) targetTrack = SOUNDS.music3;
    else if (progressPercent >= 30) targetTrack = SOUNDS.music2;

    if (!audioRef.current || !audioRef.current.src.includes(targetTrack)) {
      if (audioRef.current) {
        audioRef.current.pause();
        // Ważne: usuwamy stary listener, żeby nie dublować
        audioRef.current.ontimeupdate = null;
      }

      try {
        audioRef.current = new Audio(targetTrack);
        audioRef.current.volume = 0.3;
        // UWAGA: Wyłączamy standardowy loop, bo robimy go ręcznie
        audioRef.current.loop = false;

        // RĘCZNE ZAPĘTLANIE (Ucina ostatnią sekundę, żeby uniknąć ciszy)
        audioRef.current.ontimeupdate = () => {
          if (audioRef.current) {
            const buffer = 0.25; // Ucinamy 1 sekundę z końca
            if (audioRef.current.currentTime > audioRef.current.duration - buffer) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }
        };

        audioRef.current.play().catch(() => { });
      } catch (e) { }
    }
  }, [gameStarted, progressPercent, isFinished]);

  // --- 3. TIMER GRY ---
  useEffect(() => {
    if (!gameStarted || isFinished || isProcessing || isIntermission) return;

    setTimeLeft(timePerQuestion);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [localIndex, isFinished, gameStarted, isIntermission, isProcessing]);

  // --- 4. LOGIKA INTERMISSION ---
  useEffect(() => {
    if (isIntermission && intermissionPhase === 'countdown') {
      playCountdownSound(intermissionCountdown);
      if (intermissionCountdown > 0) {
        const timer = setTimeout(() => setIntermissionCountdown(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsIntermission(false);
          setIsProcessing(false);
          goToNextQuestion();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isIntermission, intermissionPhase, intermissionCountdown]);

  const handleTimeUp = () => {
    if (isProcessing) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsProcessing(true);
    setAnswerStatus('wrong');
    setCombo(0);
    saveProgress(localIndex, localScore);
    handlePostAnswerTransition();
  };

  const handleAnswer = (option: string) => {
    if (isProcessing || answerStatus !== 'idle') return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsProcessing(true);
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    let newScore = localScore;

    if (isCorrect) {
      setAnswerStatus('correct');
      const speedBonus = Math.floor((timeLeft / timePerQuestion) * 500);
      const points = 1000 + (combo * 50) + speedBonus;
      newScore += points;
      setLocalScore(newScore);
      setCombo(prev => prev + 1);
    } else {
      setAnswerStatus('wrong');
      setCombo(0);
    }

    saveProgress(localIndex, newScore);
    handlePostAnswerTransition();
  };

  const handlePostAnswerTransition = () => {
    const isCheckpoint = checkpoints.includes(localIndex);
    const isLastQuestion = localIndex >= questions.length - 1;

    setTimeout(() => {
      if (isCheckpoint && !isLastQuestion && !is1v1Game) {
        // Intermission tylko dla trybu grupowego
        startIntermission();
      } else {
        setIsProcessing(false);
        goToNextQuestion();
      }
    }, 1500);
  };

  const startIntermission = () => {
    let currentRank = 0;
    if (liveLeaderboard.length > 0) {
      const myIndex = liveLeaderboard.findIndex(p => p.uid === userId);
      currentRank = myIndex !== -1 ? myIndex + 1 : 0;
    }
    setMyCurrentRank(currentRank);
    setTop5Players(liveLeaderboard.slice(0, 5));
    setPersistentRank(currentRank);

    setIsIntermission(true);
    setIntermissionPhase('rank');

    setTimeout(() => {
      setIntermissionPhase('countdown');
      setIntermissionCountdown(3);
    }, 2500);
  };

  const goToNextQuestion = () => {
    setAnswerStatus('idle');
    setSelectedOption(null);
    setLocalIndex(prev => prev + 1);
  };

  // --- 5. SYNCHRONIZACJA (WYBIERZ BAZĘ) ---
  const saveProgress = async (idx: number, currentScore: number) => {
    try {
      if (is1v1Game && rtdbGameId) {
        // RTDB SYNC
        const playerRef = ref(rtdb, `games/1v1/${rtdbGameId}/players/${userId}`);
        const updateData: any = {
          score: currentScore,
          lastSyncIndex: idx
        };
        if (idx >= questions.length - 1) {
          updateData.status = 'finished';
        }
        await update(playerRef, updateData);
      } else {
        // FIRESTORE SYNC (Tryb grupowy)
        const playerRef = doc(db, 'lobbies', lobbyId);
        const updateData: any = {
          [`players.${userId}.score`]: currentScore,
          [`players.${userId}.lastSyncIndex`]: idx
        };
        if (idx >= questions.length - 1) {
          updateData[`players.${userId}.status`] = 'finished';
        }
        await updateDoc(playerRef, updateData);
      }
    } catch (error) { }
  };

  useEffect(() => {
    if (is1v1Game && rtdbGameId) {
      // RTDB LISTENER
      const gameRef = ref(rtdb, `games/1v1/${rtdbGameId}/players`);
      const unsub = onValue(gameRef, (snapshot) => {
        if (snapshot.exists()) {
          const playersData = snapshot.val();
          const playersArray = Object.values(playersData) as MultiplayerPlayer[];
          const sorted = playersArray.sort((a, b) => (b.score || 0) - (a.score || 0));
          setLiveLeaderboard(sorted);
        }
      });
      return () => unsub();
    } else {
      // FIRESTORE LISTENER
      const lobbyRef = doc(db, 'lobbies', lobbyId);
      const unsub = onSnapshot(lobbyRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const playersData = data.players || {};
          const playersArray = (Object.values(playersData) as MultiplayerPlayer[]).filter(p => p && p.uid);
          const sorted = playersArray.sort((a, b) => {
            const scoreDiff = (b.score || 0) - (a.score || 0);
            if (scoreDiff !== 0) return scoreDiff;
            return (a.nick || "").localeCompare(b.nick || "");
          });
          setLiveLeaderboard(sorted);
        }
      });
      return () => unsub();
    }
  }, [lobbyId, rtdbGameId, is1v1Game]);

  // --- BOT GAMEPLAY LOGIC ---
  useEffect(() => {
    if (!gameStarted || isFinished) return;

    // Identify if there is a bot opponent
    const botPlayer = liveLeaderboard.find(p => p.isBot && p.uid !== userId);

    if (botPlayer && isHost) {
      // Only the host simulates the bot
      const currentBotIndex = botPlayer.lastSyncIndex !== undefined ? botPlayer.lastSyncIndex : -1;

      // If bot is behind current question (simulating real-time play)
      // We trigger bot move for the *current* localIndex of the game 
      // OR we can make the bot independent. 
      // Let's make the bot answer the `localIndex` question.

      if (currentBotIndex < localIndex) {
        const botElo = botPlayer.botElo || 0;
        const delay = getBotDelay(botElo);

        // Schedule bot answer
        const timerId = setTimeout(async () => {
          try {
            const isCorrect = shouldBotAnswerCorrectly(botElo);
            const points = isCorrect ? 1000 + Math.floor(Math.random() * 200) : 0; // Natural numbers only

            const newScore = (botPlayer.score || 0) + points;

            const lobbyRef = doc(db, 'lobbies', lobbyId);
            const updateData: any = {
              [`players.${botPlayer.uid}.score`]: newScore,
              [`players.${botPlayer.uid}.lastSyncIndex`]: localIndex
            };

            if (localIndex >= questions.length - 1) {
              updateData[`players.${botPlayer.uid}.status`] = 'finished';
            }

            await updateDoc(lobbyRef, updateData);
          } catch (e) {
            console.error("Bot move error:", e);
          }
        }, delay);

        return () => clearTimeout(timerId);
      }
    }
  }, [gameStarted, isFinished, localIndex, liveLeaderboard, isHost, userId, lobbyId, questions.length]);

  // --- 1v1 RANKING UPDATE ---
  useEffect(() => {
    if (!isFinished || !is1v1Game || rankingUpdated) return;
    if (liveLeaderboard.length !== 2) return; // Only for 1v1

    const updateRanking = async () => {
      try {
        const myIndex = liveLeaderboard.findIndex(p => p.uid === userId);
        const opponentIndex = myIndex === 0 ? 1 : 0;
        const opponent = liveLeaderboard[opponentIndex];

        // Get opponent's ELO (fetch from Firebase)
        const opponentRanking = await getPlayerRanking(opponent.uid);
        const won = myIndex === 0; // First place = winner

        const result = await updateRankingAfterMatch(userId, opponentRanking.elo, won);

        setEloChange(result.eloChange);
        setNewTierName(result.newTier.name);
        setRankingUpdated(true);

        console.log(`🏆 1v1 Result: ${won ? 'WON' : 'LOST'}, ELO: ${result.eloChange > 0 ? '+' : ''}${result.eloChange}`);
      } catch (error) {
        console.error('Failed to update ranking:', error);
        setRankingUpdated(true); // Prevent retry loop
      }
    };

    updateRanking();
  }, [isFinished, is1v1Game, liveLeaderboard, userId, rankingUpdated]);

  if (!gameStarted) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white">
        <AnimatePresence mode='wait'>
          <motion.div
            key={startCountdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 3, opacity: 0 }}
            className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"
          >
            {startCountdown === 0 ? "GO!" : startCountdown}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col text-white p-6 overflow-hidden animate-in fade-in duration-500">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
        <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full">
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2" />
            <h1 className="text-3xl font-black uppercase">Wyniki</h1>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-4">
            {liveLeaderboard.map((player, index) => {
              const isMe = player.uid === userId;
              const safeNick = player.nick || "Gracz";
              let rankColor = "bg-gray-800 border-gray-700";
              if (index === 0) rankColor = "bg-yellow-900/30 border-yellow-500/50";
              if (index === 1) rankColor = "bg-slate-800 border-slate-400/50";
              if (index === 2) rankColor = "bg-orange-900/30 border-orange-500/50";

              return (
                <motion.div key={player.uid || index} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 ${rankColor} ${isMe ? 'ring-2 ring-purple-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500 w-6 text-center">{index + 1}</span>
                    <p className={`font-bold text-sm ${isMe ? 'text-white' : 'text-gray-300'}`}>
                      {safeNick} {isMe && "(Ty)"}
                    </p>
                  </div>
                  <p className="text-lg font-black text-white">{player.score || 0}</p>
                </motion.div>
              );
            })}
          </div>

          {/* 1v1 ELO Change Display */}
          {is1v1Game && eloChange !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mb-4 p-4 rounded-2xl flex items-center justify-center gap-4 ${eloChange >= 0
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-red-500/20 border border-red-500/50'
                }`}
            >
              {eloChange >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
              <div className="text-center">
                <p className={`text-3xl font-black ${eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatEloChange(eloChange)} ELO
                </p>
                {newTierName && (
                  <p className="text-sm text-gray-400 font-bold">Ranga: {newTierName}</p>
                )}
              </div>
            </motion.div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-800 shrink-0">
            <button onClick={onExit} className="w-full py-4 bg-white text-gray-900 rounded-xl font-black uppercase">Powrót</button>
          </div>
        </div>
      </div>
    );
  }

  // --- EKRAN PRZERWY ---
  if (isIntermission) {
    return (
      <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-white">
        <AnimatePresence mode='wait'>
          {intermissionPhase === 'rank' ? (
            <motion.div
              key="rank-view"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              className="text-center w-full max-w-md px-6"
            >
              <h2 className="text-xl font-bold text-purple-400 mb-6 uppercase tracking-widest">Liderzy Etapu</h2>
              <div className="space-y-3 mb-10">
                {top5Players.map((player, index) => (
                  <motion.div
                    key={player.uid}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex justify-between items-center p-3 rounded-xl ${player.uid === userId ? 'bg-purple-600 border border-purple-400' : 'bg-gray-800'}`}
                  >
                    <span className="font-black w-6">{index + 1}.</span>
                    <span className="flex-1 text-left px-2 truncate">{player.nick || "Gracz"}</span>
                    <span className="font-mono">{player.score}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/10 p-6 rounded-3xl border border-white/20">
                <p className="text-gray-400 text-sm uppercase font-bold">Twoja pozycja</p>
                <p className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">#{myCurrentRank}</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="countdown-view"
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                key={intermissionCountdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 3, opacity: 0 }}
                className="text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600"
              >
                {intermissionCountdown === 0 ? "GO!" : intermissionCountdown}
              </motion.div>

              {/* WIZUALIZACJA NASTĘPNEGO TEMATU */}
              <div className="mt-8 flex flex-col items-center animate-in slide-in-from-bottom duration-500">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Następny etap</p>
                <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full border border-white/20">
                  <Swords className="w-5 h-5 text-purple-400 animate-pulse" />
                  <span className="text-2xl font-black text-white">{nextTopicName}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Dane przeciwnika (dla 1v1)
  const opponentPlayer = is1v1Game ? liveLeaderboard.find(p => p.uid !== userId) : null;
  const opponentScore = opponentPlayer?.score || 0;
  const opponentQuestionIndex = (opponentPlayer?.lastSyncIndex !== undefined ? opponentPlayer.lastSyncIndex + 1 : 0);

  return (
    <div className={`fixed inset-0 z-[80] text-white flex flex-col p-4 md:p-6 overflow-hidden transition-colors duration-1000 scientific-font ${getBackgroundGradient()}`}>

      {/* TŁO OCHRONNE */}
      <div className="absolute inset-0 bg-gray-900 -z-10" />

      <div className="mb-6 space-y-4 relative z-10">
        <div className="flex gap-2 w-full h-3">
          {[0, 1, 2, 3].map((segmentIndex) => {
            let bgColor = "bg-white/10";
            if (segmentIndex < currentSegment) bgColor = "bg-white";
            if (segmentIndex === currentSegment) bgColor = "bg-yellow-400 animate-pulse";
            return (
              <div key={segmentIndex} className={`flex-1 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 ${segmentIndex > currentSegment ? 'opacity-30' : 'opacity-100'}`}>
                <div className={`h-full w-full ${bgColor} shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
              </div>
            );
          })}
        </div>

        {is1v1Game ? (
          /* === HEADER 1v1: Twój wynik vs Przeciwnik === */
          <div className="flex justify-between items-center bg-black/30 p-3 rounded-2xl backdrop-blur-md border border-white/10 relative">
            {/* LEWA: Ty */}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Ty</span>
              <motion.span
                key={localScore}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-white"
              >
                {localScore}
              </motion.span>
              <span className="text-[10px] text-gray-400 font-bold">Pyt. {localIndex + 1}/{questions.length}</span>
            </div>

            {/* ŚRODEK: Timer + VS */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center gap-1 font-black text-xl ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                <Clock className="w-4 h-4" /> {timeLeft}s
              </div>
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">VS</span>
            </div>

            {/* PRAWA: Przeciwnik */}
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold truncate max-w-[80px]">
                {opponentPlayer?.nick || 'Rywal'}
              </span>
              <motion.span
                key={opponentScore}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="text-2xl font-black text-white"
              >
                {opponentScore}
              </motion.span>
              <span className="text-[10px] text-gray-400 font-bold">Pyt. {opponentQuestionIndex}/{questions.length}</span>
            </div>
          </div>
        ) : (
          /* === HEADER GRUPOWY (BEZ ZMIAN) === */
          <div className="flex justify-between items-center bg-black/20 p-3 rounded-2xl backdrop-blur-md border border-white/10 relative">
            <div className="flex items-center gap-3">
              {persistentRank && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center font-black text-black shadow-lg border-2 border-yellow-300"
                >
                  {persistentRank}
                </motion.div>
              )}
              <span className="bg-white/10 px-3 py-1 rounded-lg text-sm font-black text-white/80">
                {localIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-300">
              <BookOpen className="w-3 h-3 text-blue-400" />
              <AnimatePresence mode='wait'>
                <motion.span
                  key={currentTopicName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-[100px] truncate"
                >
                  {currentTopicName}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className={`flex items-center gap-2 font-black text-xl ${timeLeft <= 5 ? 'text-red-400 animate-pulse scale-110' : 'text-white'}`}>
              <Clock className="w-5 h-5" /> {timeLeft}s
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full space-y-8 pb-10 relative z-10 overflow-y-auto custom-scrollbar pr-2">
        <div className="text-center">
          <AnimatePresence mode='wait'>
            <motion.h2
              key={currentQuestion?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg scientific-font"
            >
              {currentQuestion?.question}
            </motion.h2>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shuffledOptions.map((option, idx) => {
            let btnClass = "bg-white/10 hover:bg-white/20 border-white/20";

            // LOGIKA KOLOROWANIA PRZYCISKÓW:
            // Jeśli użytkownik już odpowiedział, pokazujemy kolory.
            // Jeśli nie odpowiedział (stan 'idle'), pokazujemy neutralne.
            if (answerStatus !== 'idle') {
              if (option === currentQuestion.correctAnswer) {
                btnClass = "bg-green-500 text-white border-green-400 shadow-[0_0_30px_rgba(34,197,94,0.6)] scale-105";
              } else if (option === selectedOption) {
                btnClass = "bg-red-500 text-white border-red-400 opacity-80";
              } else {
                btnClass = "bg-black/20 text-gray-400 border-transparent opacity-30 blur-[1px]";
              }
            }

            return (
              <motion.button
                key={`${currentQuestion?.id}-${idx}`}
                whileTap={answerStatus === 'idle' ? { scale: 0.95 } : {}}
                disabled={answerStatus !== 'idle'} // Blokujemy klikanie po odpowiedzi
                onClick={() => handleAnswer(option)}
                className={`p-6 rounded-2xl border-2 font-bold text-lg text-left transition-all duration-300 relative overflow-hidden flex justify-between items-center backdrop-blur-sm scientific-font ${btnClass}`}
              >
                <span className="z-10 relative">{option}</span>
                {/* Ikona sukcesu/porażki */}
                {answerStatus !== 'idle' && option === currentQuestion.correctAnswer && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </motion.div>
                )}
                {answerStatus !== 'idle' && option === selectedOption && option !== currentQuestion.correctAnswer && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <XCircle className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGameScreen;