import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// --- IMPORTY KOMPONENTÓW ---
import BottomNav from './components/BottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import TopBar from './components/TopBar';
import HomePage from './components/HomePage';
import LessonMap from './components/LessonMap';
import QuizSession from './components/QuizSession';
import ExamSection from './components/ExamSection';
import CreatorSection from './components/CreatorSection';
import ProfileSection from './components/ProfileSection';
import BugReportButton from './components/BugReportButton';
import FeedbackSection from './components/FeedbackSection';
import IntroScreen from './screens/IntroScreen';
import AuthScreen from './screens/AuthScreen';
import LeaderboardSection from './components/LeaderboardSection';
import FriendsSection from './components/FriendsSection';
import ScienceSection from './components/ScienceSection';
import MultiplayerHub from './components/MultiplayerHub';
import LobbyScreen from './components/LobbyScreen';
import MultiplayerGameScreen from './components/MultiplayerGameScreen';
import CharadesGameScreen from './components/CharadesGameScreen';
import ClanPanel from './components/ClanPanel';

import CalendarSection from './components/CalendarSection';
import AddToCalendarPrompt from './components/AddToCalendarPrompt';
import DailyReminderPopup from './components/DailyReminderPopup';
import Notification, { NotificationType } from './components/Notification';
import MatchmakingScreen from './components/MatchmakingScreen';
import InvitePendingPopup from './components/InvitePendingPopup';
import IncomingInvitePopup from './components/IncomingInvitePopup';
import FriendRequestPopup from './components/FriendRequestPopup';
import TopicActionMenu from './components/TopicActionMenu';
import SettingsView from '@/components/SettingsView';
import ReleaseNotesPopup from './components/ReleaseNotesPopup';
import UpdateRequiredScreen from './components/UpdateRequiredScreen';
import { subscribeToIncomingInvites, GameInvite } from './services/gameInviteService';
import { checkForUpdate, UpdateStatus } from './services/versionService';
import { initializeAdMob, showRewardedAd } from './services/adService';

// --- TYPY I SERWISY ---
import { UserStats, Unit, Topic } from './types';
import { calculateNextReview, isReviewDue } from './services/srsService';
import { showInstantNotification, requestWebNotificationPermission } from './services/notificationService';
import { checkAchievements } from './services/achievementService';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useMultiplayer, GameStatus } from './hooks/useMultiplayer';
import { useDataLoader } from './hooks/useDataLoader';
import { useCloudSync } from './hooks/useCloudSync';

import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { wasEmergencyRefresh, clearEmergencySave } from './services/emergencySaveService';
import OfflineIndicator from './components/OfflineIndicator';

// --- IKONY ---
import { ChevronLeft, RefreshCw, Play, Users } from 'lucide-react';

// --- FIREBASE ---
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from "./components/firebaseConfig";

// --- KONFIGURACJA UI ---
const INITIAL_STATS: UserStats = {
  name: 'BioMistrz',
  avatar: '',
  bio: 'Ambitny maturzysta dążący do perfekcji w biologii.',
  streak: 0,
  xp: 0,
  gems: 100,
  elo: 0,
  completedLessons: [],
  totalQuestionsAnswered: 0,
  dailyQuestionsAnswered: 0,
  dailyGoalCompleted: false,
  lastQuestionDate: '',
  lastGoalCompletedAt: 0
};


// --- GŁÓWNY KOMPONENT APP ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  const [showAddToCalendarPrompt, setShowAddToCalendarPrompt] = useState<Topic | null>(null);
  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [dailyReminderShownToday, setDailyReminderShownToday] = useState(false);

  // Initialize AdMob
  useEffect(() => {
    initializeAdMob();
  }, []);

  // Handle tab changes - special handling for multiplayer tab
  const handleTabChange = (tab: string) => {
    if (tab === 'multiplayer') {
      setShowMultiplayer(true);
    } else {
      setActiveTab(tab);
    }
  };

  // Offline detection
  const { isOnline, wasOffline } = useOfflineDetection();

  // Stats & Settings
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('biomistrz_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('biomistrz_settings');
    return saved ? JSON.parse(saved) : { darkMode: false, sound: true, notifications: true };
  });

  // Global Audio Configuration (expo-av)
  useEffect(() => {
    import('expo-av').then(({ Audio }) => {
      Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false, // Don't duck (lower volume) of other apps
        playThroughEarpieceAndroid: false,
      }).catch(err => console.warn('Audio.setAudioModeAsync error:', err));
    });
  }, []);



  // Saved Questions
  const [savedQuestions, setSavedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('biomistrz_saved_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleSavedQuestion = (questionId: string) => {
    setSavedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  // Powiadomienia
  const [notification, setNotification] = useState<{ msg: string; type: NotificationType; visible: boolean }>({
    msg: '', type: 'info', visible: false
  });

  const showNotification = (msg: string, type: NotificationType = 'info') => {
    setNotification({ msg, type, visible: true });
  };

  // Friend invite state
  const [pendingInvite, setPendingInvite] = useState<{ id: string; friendName: string } | null>(null);
  const [incomingInvite, setIncomingInvite] = useState<GameInvite | null>(null);

  // Theme Effect
  useEffect(() => {
    localStorage.setItem('biomistrz_settings', JSON.stringify(settings));
  }, [settings]);

  // Watchdog Refresh
  useEffect(() => {
    const timer = setTimeout(() => setContentRefreshKey(prev => prev + 1), 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [introChecked, setIntroChecked] = useState<boolean>(false);

  // Version check state
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);

  // Check for updates on mount
  useEffect(() => {
    checkForUpdate().then((status) => {
      setUpdateStatus(status);
      if (status.updateAvailable || status.updateRequired) {
        setShowUpdateScreen(true);
      }
    });
  }, []);

  // Use data loader hook for questions/units
  const { units, setUnits, dataLoading, subject, setSubject } = useDataLoader();

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const [selectedTopicForAction, setSelectedTopicForAction] = useState<Topic | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<Topic | null>(null);
  const [activeLearnTopic, setActiveLearnTopic] = useState<Topic | null>(null);

  const [quizProgress, setQuizProgress] = useState<Record<string, { index: number; score: number; wrongIndices: number[] }>>(() => {
    const saved = localStorage.getItem('biomistrz_quiz_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Use multiplayer hook
  const {
    currentLobbyId,
    setCurrentLobbyId,
    isHost,
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
    handleFind1v1Match,
    handleCreateLobby,
    handleJoinLobby,
    handleHostExit,
    handleStartCharadesGame,
    handleAddBot
  } = useMultiplayer({
    user,
    stats,
    units,
    showNotification
  });

  const [is1v1Game, setIs1v1Game] = useState(false);
  const [isCharadesGame, setIsCharadesGame] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [opponentData, setOpponentData] = useState<any>(null);
  const [rtdbGameId, setRtdbGameId] = useState<string | undefined>(undefined);

  // Subscribe to incoming game invites
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToIncomingInvites(user.uid, (invite) => {
      setIncomingInvite(invite);
    });

    return () => unsubscribe();
  }, [user]);

  // Check for daily reminders
  useEffect(() => {
    if (!user || dailyReminderShownToday) return;

    const today = new Date().toISOString().split('T')[0];
    const lastShown = localStorage.getItem('lastDailyReminderDate');

    if (lastShown === today) {
      setDailyReminderShownToday(true);
      return;
    }

    // Find topics due for review today
    const dueTopics = units.flatMap(unit =>
      unit.topics
        .filter(topic => topic.inCalendar && isReviewDue(topic.nextReviewDate))
        .map(topic => ({ ...topic, unitTitle: unit.title }))
    );

    if (dueTopics.length > 0) {
      // Small delay to let the app load first
      setTimeout(() => {
        setShowDailyReminder(true);
        localStorage.setItem('lastDailyReminderDate', today);
        setDailyReminderShownToday(true);

        // Wyślij powiadomienie przeglądarkowe
        if (dueTopics.length === 1) {
          showInstantNotification(
            '📚 Czas na powtórkę!',
            `Powtórz "${dueTopics[0].title}" a zapamiętasz 500% lepiej!!`,
            'srs_reminder'
          );
        } else {
          showInstantNotification(
            '📚 Czas na powtórki!',
            `Masz ${dueTopics.length} tematów do powtórzenia. Zrób to teraz, a zapamiętasz 500% lepiej!!`,
            'srs_reminder'
          );
        }
      }, 2000);
    }
  }, [user, units, dailyReminderShownToday]);

  // Request notification permission on mount
  useEffect(() => {
    requestWebNotificationPermission();
  }, []);


  // 1. POBIERANIE DANYCH UŻYTKOWNIKA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthLoading(true);
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            let currentStats = { ...INITIAL_STATS, ...data.stats };
            if (!currentStats.avatar && currentUser.photoURL) currentStats.avatar = currentUser.photoURL;
            if ((!currentStats.name || currentStats.name === 'BioMistrz') && currentUser.displayName) currentStats.name = currentUser.displayName;

            // Merge top-level likes and legacy stats likes
            currentStats.likes = (data.likes || 0) + (data.stats?.likes || 0);

            const lastActiveDate = data.lastActive;
            if (lastActiveDate) {
              const lastDate = new Date(lastActiveDate);
              const today = new Date();
              lastDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              const diffTime = today.getTime() - lastDate.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                // Yesterday - only increment streak if yesterday's goal was completed
                if (currentStats.dailyGoalCompleted) {
                  currentStats.streak = (currentStats.streak || 0) + 1;
                } else {
                  // Didn't complete goal yesterday - reset streak
                  currentStats.streak = 0;
                }
                // Reset daily counters for new day
                currentStats.dailyQuestionsAnswered = 0;
                currentStats.dailyGoalCompleted = false;
              } else if (diffDays > 1) {
                // Missed more than 1 day - reset streak and daily counters
                currentStats.streak = 0;
                currentStats.dailyQuestionsAnswered = 0;
                currentStats.dailyGoalCompleted = false;
              }
              // diffDays === 0 means same day - keep everything as is
            } else {
              // First time user
              currentStats.streak = 0;
              currentStats.dailyQuestionsAnswered = 0;
              currentStats.dailyGoalCompleted = false;
            }

            // Check streak achievement on load if streak was updated
            if (currentStats.streak > 0) {
              const { newStats, newlyUnlocked } = checkAchievements(currentStats, { type: 'STREAK_UPDATED', newStreak: currentStats.streak });
              currentStats = newStats;
              if (newlyUnlocked.length > 0) {
                setTimeout(() => {
                  newlyUnlocked.forEach(ach => {
                    showNotification(`Odblokowano osiągnięcie: ${ach.name}! 🎉`, 'success');
                  });
                }, 2000);
              }
            }

            // Preserve locally-edited profile fields if they are newer
            const localStats = localStorage.getItem('biomistrz_stats');
            if (localStats) {
              const local = JSON.parse(localStats);
              // If local name/bio/avatar differ from Firebase, keep local version
              // (user may have edited profile before Firebase load completed)
              if (local.name && local.name !== 'BioMistrz') currentStats.name = local.name;
              if (local.bio) currentStats.bio = local.bio;
              if (local.avatar) currentStats.avatar = local.avatar;
            }

            setStats(currentStats);
            if (data.quizProgress) setQuizProgress(data.quizProgress);
            if (data.savedQuestions) setSavedQuestions(data.savedQuestions);

          } else {
            const newStats = { ...INITIAL_STATS, name: currentUser.displayName || 'BioMistrz', avatar: currentUser.photoURL || '' };
            setStats(newStats);
          }
        } catch (error) { console.error("Błąd Firebase:", error); }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- NASŁUCHIWANIE NA START GRY ---
  useEffect(() => {
    if (!currentLobbyId) return;

    let isStarting = false;

    const unsub = onSnapshot(doc(db, 'lobbies', currentLobbyId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Jeśli gra wystartowała, a my jeszcze o tym nie wiemy (w tym listenerze)
        if (data.status === 'GAME' && !isStarting) {
          isStarting = true; // Flaga lokalna zapobiegająca wielokrotnemu logowaniu w jednym cyklu życia listenera
          console.log("🎮 Wykryto status GAME dla lobby:", currentLobbyId, "Typ:", data.type, "PIN:", data.pin);

          // JEŚLI TO 1v1 LUB KALAMBURY (Matchmaking - bez PINu) I NIE MAMY JESZCZE FLAGI matchFound -> POKAŻ EKRAN "OPPONENT FOUND"
          if ((data.type === '1v1' || (data.type === 'charades' && !data.pin)) && !matchFound) {
            const players = data.players || {};
            const opponentId = Object.keys(players).find(uid => uid !== user?.uid);
            const opponent = opponentId ? players[opponentId] : null;

            if (opponent) {
              setOpponentData(opponent);
              setMatchFound(true);
              setIs1v1Game(data.type === '1v1');
              setIsCharadesGame(data.type === 'charades');
              if (data.rtdbGameId) setRtdbGameId(data.rtdbGameId);

              // Czekamy 3.5s na animację "VS"
              setTimeout(() => {
                setMatchFound(false);
                setOpponentData(null);
                console.log("🚀 Gra startuje po animacji!");
                if (data.gameQuestions) setMultiplayerQuestions(data.gameQuestions);
                if (data.timePerQuestion) setMultiplayerTimePerQuestion(data.timePerQuestion);
                setIsMultiplayerGameActive(true);
              }, 3500);
              return;
            }
          }

          // Jeśli to nie 1V1 (czyli Grupa lub Kalambury z Lobby), albo już po animacji
          if (data.type !== '1v1' && (data.type !== 'charades' || data.pin)) {
            console.log("🚀 Gra startuje (Grupa/Charades Lobby)!");
            if (data.gameQuestions) setMultiplayerQuestions(data.gameQuestions);
            if (data.timePerQuestion) setMultiplayerTimePerQuestion(data.timePerQuestion);
            if (data.rtdbGameId) setRtdbGameId(data.rtdbGameId);

            setIs1v1Game(false);
            setIsCharadesGame(data.type === 'charades');
            setIsMultiplayerGameActive(true);
          }
        } else if (data.status !== 'GAME') {
          // Jeśli status się zmienił z powrotem (np. wyjście z gry), resetujemy flagę lokalną
          isStarting = false;
          if (!isMultiplayerGameActive) {
            setLobbyStatus(data.status as GameStatus);
          }
        }
      } else {
        // Lobby usunięte
        setCurrentLobbyId(null);
        setIsMultiplayerGameActive(false);
        setLobbyStatus(null);
        setShowMultiplayer(false);
      }
    });

    return () => unsub();
  }, [currentLobbyId]);

  // Use cloud sync hook for automatic saving
  const { forceSync } = useCloudSync({
    user,
    stats,
    quizProgress,
    settings,
    savedQuestions,
    authLoading
  });

  // Use performance monitor for detecting lag
  usePerformanceMonitor({
    stats,
    quizProgress,
    settings,
    enabled: !dataLoading && !authLoading
  });

  // Check for emergency refresh and show notification
  useEffect(() => {
    if (wasEmergencyRefresh()) {
      showNotification('Aplikacja została odświeżona z powodu problemów z wydajnością.', 'info');
      clearEmergencySave();
    }
  }, []);


  // INTRO
  useEffect(() => {
    if (!authLoading) {
      const hasSeen = localStorage.getItem('hasSeenIntro');
      setShowIntro(hasSeen !== 'true');
      setIntroChecked(true);
    }
  }, [authLoading]);


  useEffect(() => {
    if (selectedUnit) {
      const updatedUnit = units.find(u => u.id === selectedUnit.id);
      if (updatedUnit && JSON.stringify(updatedUnit) !== JSON.stringify(selectedUnit)) {
        setSelectedUnit(updatedUnit);
      }
    }
  }, [units, selectedUnit]);

  useEffect(() => {
    if (units.length > 0) {
      const progressToSave: Record<string, any> = {};
      units.forEach(u => u.topics.forEach(t => {
        progressToSave[t.id] = {
          progress: t.progress,
          srsLevel: t.srsLevel,
          nextReviewDate: t.nextReviewDate,
          inCalendar: t.inCalendar
        };
      }));
      const progressKey = `biomistrz_progress_${subject}`;
      localStorage.setItem(progressKey, JSON.stringify(progressToSave));
    }
  }, [units, subject]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const dueReviews = useMemo(() => {
    return units.reduce((acc, unit) => [...acc, ...unit.topics], [] as Topic[]).filter(t => isReviewDue(t.nextReviewDate));
  }, [units]);

  const handleLogout = () => { setUser(null); setStats(INITIAL_STATS); auth.signOut(); };
  const handleToggleSettings = (key: string) => { setSettings((prev: any) => ({ ...prev, [key]: !prev[key] })); };

  // Helper to record daily questions and check streak goal (10 questions = day completed)
  const DAILY_GOAL = 10;
  const recordDailyQuestions = (count: number) => {
    setStats(prev => {
      const newDailyCount = prev.dailyQuestionsAnswered + count;
      const goalJustCompleted = prev.dailyQuestionsAnswered < DAILY_GOAL && newDailyCount >= DAILY_GOAL;

      return {
        ...prev,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + count,
        dailyQuestionsAnswered: newDailyCount,
        dailyGoalCompleted: prev.dailyGoalCompleted || newDailyCount >= DAILY_GOAL,
        // Streak is NOT incremented here — it's handled in onAuthStateChanged on next login
        // (which checks the date difference to avoid double-incrementing)
        lastGoalCompletedAt: goalJustCompleted ? Date.now() : prev.lastGoalCompletedAt
      };
    });
  };

  // Push Notifications
  const { scheduleReminders, isSupported: pushSupported } = usePushNotifications();

  // Schedule reminders when dueReviews or streak changes
  useEffect(() => {
    if (pushSupported && settings.notifications && user) {
      scheduleReminders({
        srsTopicCount: dueReviews.length,
        currentStreak: stats.streak,
        remainingXP: 150 - (stats.xp % 150) // Daily goal: 150 XP
      });
    }
  }, [dueReviews.length, stats.streak, pushSupported, settings.notifications, user]);

  // Effect to watch gems update and check investor achievement
  useEffect(() => {
    if (stats.gems > 0) {
      const { newStats, newlyUnlocked } = checkAchievements(stats, { type: 'GEMS_UPDATED', currentGems: stats.gems });
      if (newlyUnlocked.length > 0) {
        setStats(newStats);
        newlyUnlocked.forEach(ach => {
          showNotification(`Odblokowano osiągnięcie: ${ach.name}! 🎉`, 'success');
        });
      }
    }
  }, [stats.gems]);

  if (dataLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#f0fdf4] to-[#d7f4d7] flex flex-col items-center justify-center z-[100]">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full mb-4 shadow-lg" />
        <h1 className="text-2xl font-black text-blue-600  tracking-tighter">Wczytywanie BioMistrza...</h1>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!introChecked) return null;
  if (showIntro) return <IntroScreen onFinish={() => setShowIntro(false)} userName={stats.name || user.displayName || 'BioMistrzu'} />;

  // Handle claiming ELO rewards
  const handleClaimReward = (milestone: number, gems: number) => {
    setStats(prev => ({
      ...prev,
      gems: (prev.gems || 0) + gems,
      claimedEloRewards: [...(prev.claimedEloRewards || []), milestone]
    }));
    showNotification(`+${gems} 🌰 kasztanów za ${milestone} ELO!`, 'success');
  };

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen transition-colors duration-300 text-gray-900"
    >
      {/* Dark Mode Overlay - semi-transparent black overlay */}
      {settings.darkMode && (
        <div
          className="fixed inset-0 bg-black pointer-events-none transition-opacity duration-300"
          style={{
            opacity: 0.55,
            zIndex: 9999
          }}
        />
      )}


      {/* VERSION UPDATE SCREEN */}
      <AnimatePresence>
        {showUpdateScreen && updateStatus?.config && (
          <UpdateRequiredScreen
            config={updateStatus.config}
            isRequired={updateStatus.updateRequired}
            onDismiss={updateStatus.updateRequired ? undefined : () => setShowUpdateScreen(false)}
          />
        )}
      </AnimatePresence>

      {/* 1. GRA MULTIPLAYER */}
      <AnimatePresence>
        {isMultiplayerGameActive && currentLobbyId && user && (
          isCharadesGame ? (
            <CharadesGameScreen
              gameId={rtdbGameId || ""}
              userId={user.uid}
              onExit={() => {
                setRtdbGameId(undefined);
                setIsCharadesGame(false);
                setIsMultiplayerGameActive(false);
                setCurrentLobbyId(null);
                setShowMultiplayer(false);
                setLobbyStatus(null);
              }}
            />
          ) : (
            <MultiplayerGameScreen
              lobbyId={currentLobbyId}
              rtdbGameId={rtdbGameId}
              userId={user.uid}
              isHost={isHost}
              questions={multiplayerQuestions}
              timePerQuestion={multiplayerTimePerQuestion}
              is1v1Game={is1v1Game}
              onExit={() => {
                setRtdbGameId(undefined);
                if (isHost && currentLobbyId) handleHostExit(currentLobbyId);
                else {
                  setIsMultiplayerGameActive(false);
                  setCurrentLobbyId(null);
                  setShowMultiplayer(false);
                  setLobbyStatus(null);
                }
              }}
            />
          )
        )}
      </AnimatePresence>

      {/* 2. MATCHMAKING 1v1 (Visible if waiting OR match found) */}
      <AnimatePresence>
        {currentLobbyId && ((isHost && lobbyStatus === 'WAITING_1V1') || matchFound) && !isMultiplayerGameActive && (
          <MatchmakingScreen
            stats={stats}
            opponent={opponentData}
            onCancel={() => {
              if (currentLobbyId) handleHostExit(currentLobbyId);
              setLobbyStatus(null);
              setMatchFound(false);
              setOpponentData(null);
            }}
            onAddBot={() => {
              if (currentLobbyId) handleAddBot(currentLobbyId);
            }}
          />
        )}
      </AnimatePresence>

      {/* 3. LOBBY GRUPOWE */}
      <AnimatePresence>
        {currentLobbyId && user && lobbyStatus === 'LOBBY' && !isMultiplayerGameActive && (
          <LobbyScreen
            lobbyId={currentLobbyId}
            currentUserId={user.uid}
            units={units}
            onLeave={() => {
              setCurrentLobbyId(null);
              setShowMultiplayer(false);
              setLobbyStatus(null);
            }}
            onGameStart={(gameQuestions, time) => {
              setMultiplayerQuestions(gameQuestions);
              setMultiplayerTimePerQuestion(time);
              setIsMultiplayerGameActive(true);
            }}
            onStartCharades={(duration, rounds) => {
              if (currentLobbyId) handleStartCharadesGame(currentLobbyId, duration, rounds);
            }}
          />
        )}
      </AnimatePresence>

      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-blue-500 z-[70] origin-left" style={{ scaleX }} />
      <OfflineIndicator isOnline={isOnline} wasOffline={wasOffline} />
      <BugReportButton />

      {/* Friend invite popups */}
      {pendingInvite && (
        <InvitePendingPopup
          inviteId={pendingInvite.id}
          friendName={pendingInvite.friendName}
          onAccepted={(lobbyId) => {
            setPendingInvite(null);
            setCurrentLobbyId(lobbyId);
            setShowMultiplayer(true);
            showNotification(`Gra ze znajomym ${pendingInvite.friendName} rozpoczęta!`, 'success');
          }}
          onClose={() => setPendingInvite(null)}
        />
      )}

      {incomingInvite && (
        <IncomingInvitePopup
          invite={incomingInvite}
          onAccepted={(lobbyId) => {
            setIncomingInvite(null);
            setCurrentLobbyId(lobbyId);
            setShowMultiplayer(true);
            showNotification(`Dołączono do gry z ${incomingInvite.fromUserName}!`, 'success');
          }}
          onClose={() => setIncomingInvite(null)}
        />
      )}

      {/* Release notes popup - shows once per new version */}
      <ReleaseNotesPopup />

      {/* Friend request popup */}
      {user && <FriendRequestPopup userId={user.uid} />}

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} reviewCount={dueReviews.length} />

      <div className="flex flex-1">
        <DesktopSidebar activeTab={activeTab} setActiveTab={handleTabChange} reviewCount={dueReviews.length} />

        <main className="flex-1 flex flex-col md:max-w-6xl md:mx-auto w-full pb-20 md:pb-0 relative">
          <TopBar stats={stats} userId={user?.uid} onNavigate={handleTabChange} />

          <div key={contentRefreshKey} className="p-4 md:p-8 flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <div className="animate-in fade-in duration-300">
                  <HomePage
                    stats={stats}
                    reviewCount={dueReviews.length}
                    onNavigate={handleTabChange}
                    onOpenMultiplayer={() => setShowMultiplayer(true)}
                    userId={user?.uid}
                    onClaimSuccess={(level) => {
                      setStats(prev => ({
                        ...prev,
                        claimedLevelRewards: [...(prev.claimedLevelRewards || []), level]
                      }));
                    }}
                    onWatchAd={() => {
                      showRewardedAd(() => {
                        setStats(prev => ({
                          ...prev,
                          gems: (prev.gems || 0) + 25
                        }));
                        showNotification(`+25 🌰 kasztanów za obejrzenie reklamy!`, 'success');
                      });
                    }}
                  />
                </div>
              )}
              {activeTab === 'learn' && (
                <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                  {!selectedUnit ? (
                    <>
                      {/* Subject Toggle */}
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <button
                          onClick={() => setSubject('biology')}
                          className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm transition-all ${subject === 'biology'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                            : 'bg-gray-200  text-gray-600  hover:bg-gray-300 '
                            }`}
                        >
                          🧬 Biologia
                        </button>
                        <button
                          onClick={() => setSubject('chemistry')}
                          className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm transition-all ${subject === 'chemistry'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105'
                            : 'bg-gray-200  text-gray-600  hover:bg-gray-300 '
                            }`}
                        >
                          ⚗️ Chemia
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {units.map((unit, index) => {
                          const completed = unit.topics.filter(t => t.progress === 100).length;
                          const total = unit.topics.length;
                          const progress = total > 0 ? Math.floor((completed / total) * 100) : 0;

                          // Obliczenia dla koła (promień 36 daje obwód ~226)
                          const CIRCUMFERENCE = 226;
                          const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

                          return (
                            <motion.div
                              key={unit.id}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} // Ważne: Animuje się tylko raz przy pojawieniu!
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedUnit(unit)}
                              className="bg-white  p-5 rounded-[2rem] shadow-sm hover:shadow-xl border border-gray-100  cursor-pointer flex items-center gap-6 transition-all duration-300"
                            >
                              {/* Okrągła ikona z STABILNĄ animacją postępu */}
                              <div className="relative w-20 h-20 flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                  {/* Tło koła (szare) */}
                                  <circle
                                    cx="40" cy="40" r="36"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-gray-100 "
                                  />
                                  {/* Pasek postępu (Kolorowy) - Animacja Offsetu */}
                                  <motion.circle
                                    cx="40" cy="40" r="36"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    className="text-blue-500"
                                    strokeLinecap="round"
                                    strokeDasharray={CIRCUMFERENCE} // Stała długość (cały obwód)
                                    initial={{ strokeDashoffset: CIRCUMFERENCE }} // Start: Puste
                                    whileInView={{ strokeDashoffset: offset }}    // Cel: Wypełnione
                                    viewport={{ once: true }} // Zapobiega miganiu przy szybkim przewijaniu
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                  {unit.icon}
                                </div>
                              </div>

                              <div className="flex-1">
                                <h3 className="text-xl font-black text-gray-800  mb-1">{unit.title}</h3>
                                <p className="text-sm text-gray-500  font-medium mb-2">{unit.description}</p>

                                <div className="flex items-center gap-2">
                                  <span className="bg-blue-100  text-blue-700  px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                                    Moduł {index + 1}
                                  </span>
                                  {progress === 100 && (
                                    <span className="bg-green-100  text-green-700  px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                                      Ukończono
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="pr-4 text-gray-300 ">
                                <ChevronLeft className="w-6 h-6 rotate-180" />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-8">
                      <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-2 text-blue-600  font-black uppercase text-[10px] hover:translate-x-[-2px] transition-transform bg-white  px-5 py-2.5 rounded-full shadow-sm"><ChevronLeft className="w-4 h-4" /> Wróć do Mapy</button>
                      <motion.div layoutId={`unit-header-${selectedUnit.id}`} className="bg-gray-800 rounded-[2.5rem] p-10 text-white border-b-[10px] border-blue-600 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-6 relative z-10">
                          <span className="bg-white/10 p-5 rounded-[1.8rem] backdrop-blur-md text-6xl">{selectedUnit.icon}</span>
                          <div>
                            <h2 className="text-4xl font-black tracking-tight mb-1">{selectedUnit.title}</h2>
                            <p className="text-blue-200 font-bold text-lg opacity-80 italic">{selectedUnit.description}</p>
                          </div>
                        </div>
                      </motion.div>

                      <LessonMap
                        topics={selectedUnit.topics}
                        onStartTopic={(topic) => setSelectedTopicForAction(topic)}
                        onResetTopic={() => { }}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'practice' && (
                <div className="max-w-2xl mx-auto py-8">
                  <h2 className="text-3xl font-black text-gray-800  mb-8 flex items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-orange-500" /> Centrum Powtórek
                  </h2>

                  {/* --- SEKCJA ZAPISANYCH ZADAŃ --- */}
                  {savedQuestions.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Biblioteka</h3>
                      <button
                        onClick={() => {
                          const allQuestions = units.flatMap(u => u.topics.flatMap(t => t.questions));
                          const questionsToPlay = allQuestions.filter(q => savedQuestions.includes(q.id));

                          if (questionsToPlay.length === 0) return;

                          setActiveQuizTopic({
                            id: 'saved_questions_session',
                            title: 'Zapisane Zadania',
                            icon: '❤️',
                            description: 'Twoja osobista kolekcja trudnych pytań',
                            questions: questionsToPlay,
                            progress: 0,
                            srsLevel: 0,
                            nextReviewDate: undefined
                          });
                        }}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-600 p-8 rounded-[2.5rem] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex justify-between items-center group relative overflow-hidden"
                      >
                        <div className="relative z-10 flex items-center gap-6">
                          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5 4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                          </div>
                          <div className="text-left">
                            <h4 className="text-2xl font-black text-white">Zapisane Zadania</h4>
                            <p className="text-pink-100 font-bold opacity-90">{savedQuestions.length} pytań do powtórzenia</p>
                          </div>
                        </div>
                        <Play className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform relative z-10" />
                        <div className="absolute -right-10 -bottom-10 bg-white/10 w-40 h-40 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                      </button>
                    </div>
                  )}

                  {/* --- SEKCJA SRS --- */}
                  <div className="mb-10">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Inteligentne Powtórki (SRS)</h3>
                    {dueReviews.length === 0 ? (
                      <div className="bg-white  rounded-[3rem] p-10 text-center border-4 border-dashed border-gray-100 ">
                        <div className="text-5xl mb-4">🏆</div>
                        <h3 className="text-lg font-black text-gray-700 ">Brak tematów SRS</h3>
                        <p className="text-gray-400  text-sm mt-1">Algorytm nie wyznaczył dziś żadnych tematów do powtórki.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dueReviews.map(topic => (
                          <button key={topic.id} onClick={() => setActiveQuizTopic(topic)} className="w-full bg-white  p-6 rounded-[2.5rem] border-2 border-gray-50  flex justify-between items-center hover:border-orange-400 transition-all duo-button-shadow">
                            <div className="flex items-center gap-5">
                              <span className="text-4xl">{topic.icon}</span>
                              <div className="text-left">
                                <h4 className="text-lg font-black text-gray-800 ">{topic.title}</h4>
                                <p className="text-xs font-bold text-orange-500 uppercase tracking-wide">Wymagana powtórka</p>
                              </div>
                            </div>
                            <Play className="w-8 h-8 text-orange-500" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- PRZYCISK MULTIPLAYER --- */}
                  <div className="mb-10">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Wspólna Nauka</h3>
                    <button
                      onClick={() => setShowMultiplayer(true)}
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 rounded-[2.5rem] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex justify-between items-center group relative overflow-hidden"
                    >
                      <div className="relative z-10 flex items-center gap-6">
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className="text-2xl font-black text-white">Tryb Grupowy</h4>
                          <p className="text-violet-100 font-bold opacity-90">Rywalizuj na żywo ze znajomymi</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'exams' && (
                <ExamSection
                  onExamFinish={(xp) => {
                    setStats(p => {
                      const multi = p.activeBuffs?.find(b => b.type === 'xp_multiplier' && b.expiresAt > Date.now())?.multiplier || 1;
                      return { ...p, xp: p.xp + Math.round(xp * multi), gems: p.gems + 5 };
                    });
                    recordDailyQuestions(1);
                  }}
                />
              )}

              {activeTab === 'creator' && <CreatorSection onPublish={(t) => console.log("Wygenerowano:", t.title)} />}
              {activeTab === 'survey' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FeedbackSection /></motion.div>}
              {activeTab === 'leaderboard' && <LeaderboardSection />}
              {activeTab === 'clan' && user && (
                <ClanPanel
                  userId={user.uid}
                  userName={stats.name}
                  userAvatar={stats.avatar}
                  userGems={stats.gems}
                  userElo={stats.elo}
                  onGemsSpent={(amount) => setStats(prev => ({ ...prev, gems: prev.gems - amount }))}
                />
              )}
              {activeTab === 'friends' && user && (
                <FriendsSection
                  userId={user.uid}
                  userName={stats.name}
                  userAvatar={stats.avatar}
                  onInviteSent={(inviteId, friendName) => setPendingInvite({ id: inviteId, friendName })}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileSection
                  stats={stats}
                  onUpdate={(u) => {
                    setStats(p => ({ ...p, ...u }));
                    // Force immediate sync to Firebase (no debounce)
                    setTimeout(() => forceSync(), 50);
                  }}
                  onResetAll={() => {
                    setStats(INITIAL_STATS);
                    setUnits(prev => prev.map(u => ({ ...u, topics: u.topics.map(t => ({ ...t, progress: 0, srsLevel: 0, nextReviewDate: undefined })) })));
                    localStorage.clear();
                    alert("Postępy zostały wyzerowane.");
                  }}
                  onLogout={handleLogout}
                  isSoundEnabled={settings.sound}
                  onToggleSound={() => handleToggleSettings('sound')}

                />
              )}

              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <SettingsView settings={settings} onToggle={handleToggleSettings} onLogout={handleLogout} />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <CalendarSection
                  units={units}
                  onStartQuiz={(topic) => {
                    setActiveQuizTopic(topic);
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* --- MODALE AKCJI --- */}

      {/* 1. Menu wyboru: Quiz vs Nauka */}
      <AnimatePresence>
        {selectedTopicForAction && (
          <TopicActionMenu
            topic={selectedTopicForAction}
            onClose={() => setSelectedTopicForAction(null)}
            onStartQuiz={() => { setActiveQuizTopic(selectedTopicForAction); setSelectedTopicForAction(null); }}
            onStartLearn={() => { setActiveLearnTopic(selectedTopicForAction); setSelectedTopicForAction(null); }}
          />
        )}
      </AnimatePresence>

      {/* 2. Aktywny Quiz */}
      <AnimatePresence>
        {activeQuizTopic && (
          <QuizSession
            questions={activeQuizTopic.questions}
            initialIndex={quizProgress[activeQuizTopic.id]?.index || 0}
            initialScore={quizProgress[activeQuizTopic.id]?.score || 0}
            initialWrongIndices={quizProgress[activeQuizTopic.id]?.wrongIndices || []}
            onProgress={(idx, score, wrong) => {
              const newProgress = Math.min(100, Math.round(((idx) / activeQuizTopic.questions.length) * 100));
              setUnits(prev => prev.map(u => ({ ...u, topics: u.topics.map(t => t.id === activeQuizTopic.id ? { ...t, progress: Math.max(t.progress || 0, newProgress) } : t) })));
              setQuizProgress(prev => ({ ...prev, [activeQuizTopic.id]: { index: idx, score, wrongIndices: wrong } }));
            }}
            onFinish={(score) => {
              const passed = score >= activeQuizTopic.questions.length * 0.6;
              const { nextLevel, nextDate } = calculateNextReview(activeQuizTopic.srsLevel, passed);
              setUnits(prev => prev.map(u => ({ ...u, topics: u.topics.map(t => t.id === activeQuizTopic.id ? { ...t, progress: 100, srsLevel: nextLevel, nextReviewDate: nextDate } : t) })));

              recordDailyQuestions(activeQuizTopic.questions.length);
              setQuizProgress(prev => { const n = { ...prev }; delete n[activeQuizTopic.id]; return n; });

              setStats(s => {
                const multi = s.activeBuffs?.find(b => b.type === 'xp_multiplier' && b.expiresAt > Date.now())?.multiplier || 1;
                const baseXP = passed ? 100 : 20;
                const updatedStats = { ...s, xp: s.xp + Math.round(baseXP * multi), gems: s.gems + (passed ? 25 : 5) };
                const { newStats, newlyUnlocked } = checkAchievements(updatedStats, { type: 'QUIZ_FINISHED', questionsAnswered: activeQuizTopic.questions.length });
                if (newlyUnlocked.length > 0) {
                  setTimeout(() => newlyUnlocked.forEach(ach => {
                    showNotification(`Odblokowano osiągnięcie: ${ach.name}! 🎉`, 'success');
                  }), 1000);
                }
                return newStats;
              });

              // Show calendar prompt if topic is not already in calendar
              if (!activeQuizTopic.inCalendar) {
                setShowAddToCalendarPrompt(activeQuizTopic);
              } else {
                setActiveQuizTopic(null);
              }
            }}
            onQuit={() => setActiveQuizTopic(null)}
            onXpChange={(xp) => setStats(prev => {
              const multi = prev.activeBuffs?.find(b => b.type === 'xp_multiplier' && b.expiresAt > Date.now())?.multiplier || 1;
              return { ...prev, xp: prev.xp + Math.round(xp * multi) };
            })}
            isSoundEnabled={settings.sound}
            savedQuestionIds={savedQuestions}
            onToggleSave={toggleSavedQuestion}
          />
        )}
      </AnimatePresence>

      {/* 3. WIDOK NAUKI (SCIENCE SECTION) */}
      <AnimatePresence>
        {activeLearnTopic && (
          <ScienceSection
            topicId={activeLearnTopic.id}
            topicTitle={activeLearnTopic.title}
            onBack={() => setActiveLearnTopic(null)}
          />
        )}
      </AnimatePresence>

      {/* Widok Multiplayer */}
      <AnimatePresence>
        {showMultiplayer && (
          <MultiplayerHub
            stats={stats}
            onBack={() => setShowMultiplayer(false)}
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            onFind1v1Match={handleFind1v1Match}
            onClaimReward={handleClaimReward}
          />
        )}

      </AnimatePresence>



      {/* Add to Calendar Prompt */}
      <AnimatePresence>
        {showAddToCalendarPrompt && (
          <AddToCalendarPrompt
            topicTitle={showAddToCalendarPrompt.title}
            onYes={() => {
              setUnits(prev => prev.map(u => ({
                ...u,
                topics: u.topics.map(t =>
                  t.id === showAddToCalendarPrompt.id ? { ...t, inCalendar: true } : t
                )
              })));
              showNotification(`"${showAddToCalendarPrompt.title}" dodany do kalendarza!`, 'success');
              setShowAddToCalendarPrompt(null);
              setActiveQuizTopic(null);
            }}
            onNo={() => {
              setShowAddToCalendarPrompt(null);
              setActiveQuizTopic(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Daily Reminder Popup */}
      <AnimatePresence>
        {showDailyReminder && (
          <DailyReminderPopup
            topics={units.flatMap(unit =>
              unit.topics
                .filter(topic => topic.inCalendar && isReviewDue(topic.nextReviewDate))
                .map(topic => ({ ...topic, unitTitle: unit.title }))
            )}
            onStartQuiz={(topic) => {
              setActiveQuizTopic(topic);
            }}
            onDismiss={() => setShowDailyReminder(false)}
          />
        )}
      </AnimatePresence>

      {/* Komponent Powiadomień */}
      <Notification
        message={notification.msg}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default App;