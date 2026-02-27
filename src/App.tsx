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
import PracticeHub from './components/PracticeHub';
import CreatorSection from './components/CreatorSection';
import ProfileSection from './components/ProfileSection';
import BugReportButton from './components/BugReportButton';
import FeedbackSection from './components/FeedbackSection';
import IntroScreen from './screens/IntroScreen';
import AuthScreen from './screens/AuthScreen';
import LanguageSelectScreen from './screens/LanguageSelectScreen';
import LeaderboardSection from './components/LeaderboardSection';
import FriendsSection from './components/FriendsSection';
import ScienceSection from './components/ScienceSection';
import MultiplayerHub from './components/MultiplayerHub';
import LobbyScreen from './components/LobbyScreen';
import MultiplayerGameScreen from './components/MultiplayerGameScreen';
import CharadesGameScreen from './components/CharadesGameScreen';
import ClanPanel from './components/ClanPanel';
import ShopSection from './components/ShopSection';
import InventoryModal from './components/InventoryModal';
import LevelRewardModal from './components/LevelRewardModal';
import ChestOpeningModal from './components/ChestOpeningModal';
import SupportSection from './components/SupportSection';

import CalendarSection from './components/CalendarSection';
import AddToCalendarPrompt from './components/AddToCalendarPrompt';
import DailyReminderPopup from './components/DailyReminderPopup';
import Notification, { NotificationType } from './components/Notification';
import MatchmakingScreen from './components/MatchmakingScreen';
import { useLanguage } from './contexts/LanguageContext';
import InvitePendingPopup from './components/InvitePendingPopup';
import IncomingInvitePopup from './components/IncomingInvitePopup';
import FriendRequestPopup from './components/FriendRequestPopup';
import TopicActionMenu from './components/TopicActionMenu';
import SettingsView from '@/components/SettingsView';
import ReleaseNotesPopup from './components/ReleaseNotesPopup';
import UpdateRequiredScreen from './components/UpdateRequiredScreen';
import { subscribeToIncomingInvites, GameInvite } from './services/gameInviteService';
import { checkForUpdate, UpdateStatus } from './services/versionService';
import { initializeAdMob } from './services/adService';
import { getUnclaimedMilestones } from './services/levelRewardService';
import { xpToLevel } from './services/rankingService';

// --- TYPY I SERWISY ---
import { UserStats, Unit, Topic, ItemRarity, Question } from './types';
import { calculateNextReview, isReviewDue } from './services/srsService';
import { showInstantNotification, requestWebNotificationPermission } from './services/notificationService';
import { checkAchievements } from './services/achievementService';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useMultiplayer, GameStatus } from './hooks/useMultiplayer';
import { useDataLoader } from './hooks/useDataLoader';
import { useCloudSync } from './hooks/useCloudSync';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';

import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { wasEmergencyRefresh, clearEmergencySave } from './services/emergencySaveService';
import OfflineIndicator from './components/OfflineIndicator';

// --- IKONY ---
import { ChevronLeft, Timer, Sparkles } from 'lucide-react';

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
  lastGoalCompletedAt: 0,
  supportValue: 0
};


// --- GŁÓWNY KOMPONENT APP ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const { t } = useLanguage();
  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  // Pomodoro timer – lives here so it persists across tab navigation
  const [pomodoroState, pomodoroControls] = usePomodoroTimer();

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

  const [showInventory, setShowInventory] = useState(false);
  const [showLevelRewards, setShowLevelRewards] = useState(false);
  const [openingChest, setOpeningChest] = useState<{ chestId: string; reward: { baseId: string; rarity: ItemRarity } } | null>(null);

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

  // Language selection: show if user hasn't chosen a language yet
  const [showLanguageSelect, setShowLanguageSelect] = useState<boolean>(
    () => localStorage.getItem('hasSelectedLanguage') !== 'true'
  );

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
  // Use data loader hook for questions/units
  const { units, setUnits, dataLoading, subject, setSubject, chemistryNotTranslated } = useDataLoader();

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
            t.common.reviewReminderTitle,
            t.common.reviewReminderSingle.replace('$1', dueTopics[0].title),
            'srs_reminder'
          );
        } else {
          showInstantNotification(
            t.common.reviewReminderTitle,
            t.common.reviewReminderMultiple.replace('$1', dueTopics.length.toString()),
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
                    showNotification(t.achievements.unlocked.replace('$1', t.achievements.items[ach.id]?.name || ach.name), 'success');
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

            // Sync country and language from onboarding if not already in stats
            const savedCountry = localStorage.getItem('app_country');
            if (savedCountry && !currentStats.country) {
              currentStats.country = savedCountry;
            } else if (!currentStats.country) {
              // Default to PL for legacy users or those who skipped selection
              currentStats.country = 'PL';
            }
            const savedLang = localStorage.getItem('app_language');
            if (savedLang && !currentStats.language) {
              currentStats.language = savedLang;
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

  // --- HELPER: Resolve question IDs to full Question objects from local units ---
  // Used for cross-language 1v1 — each player resolves the same IDs in their own language
  const resolveQuestionsFromIds = (ids: number[]): Question[] => {
    const idSet = new Set(ids);
    const idOrder = new Map(ids.map((id, idx) => [id, idx]));
    const resolved: Question[] = [];

    units.forEach(unit => {
      unit.topics.forEach(topic => {
        topic.questions.forEach(q => {
          const numId = typeof q.id === 'number' ? q.id : parseFloat(q.id as any);
          if (idSet.has(numId)) {
            resolved.push({ ...q, topicName: topic.title });
          }
        });
      });
    });

    // Preserve the original random order chosen by the host
    resolved.sort((a, b) => {
      const aId = typeof a.id === 'number' ? a.id : parseFloat(a.id as any);
      const bId = typeof b.id === 'number' ? b.id : parseFloat(b.id as any);
      return (idOrder.get(aId) ?? 0) - (idOrder.get(bId) ?? 0);
    });

    return resolved;
  };

  // --- NASŁUCHIWANIE NA START GRY ---
  useEffect(() => {
    if (!currentLobbyId) return;

    let isStarting = false;

    const unsub = onSnapshot(doc(db, 'lobbies', currentLobbyId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Jeśli gra wystartowała, a my jeszcze o tym nie wiemy (w tym listenerze)
        if (data.status === 'GAME' && !isStarting) {
          isStarting = true;
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

                // 1v1: resolve question IDs locally (each player sees their own language)
                if (data.type === '1v1' && data.gameQuestionIds?.length) {
                  const localQuestions = resolveQuestionsFromIds(data.gameQuestionIds);
                  console.log(`🌐 Rozwiązano ${localQuestions.length}/${data.gameQuestionIds.length} pytań lokalnie`);
                  setMultiplayerQuestions(localQuestions);
                } else if (data.gameQuestions) {
                  // Fallback: old format or charades
                  setMultiplayerQuestions(data.gameQuestions);
                }

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
      showNotification(t.common.emergencyRefresh, 'info');
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
      const progressKey = `biomistrz_progress_${subject} `;
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
          showNotification(t.achievements.unlocked.replace('$1', t.achievements.items[ach.id]?.name || ach.name), 'success');
        });
      }
    }
  }, [stats.gems]);

  if (dataLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#f0fdf4] to-[#d7f4d7] flex flex-col items-center justify-center z-[100]">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full mb-4 shadow-lg" />
        <h1 className="text-2xl font-black text-blue-600  tracking-tighter">{t.common.loadingApp}</h1>
      </div>
    );
  }

  if (showLanguageSelect) return <LanguageSelectScreen onSelect={() => setShowLanguageSelect(false)} />;
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
    showNotification(t.common.eloReward.replace('$1', gems.toString()).replace('$2', milestone.toString()), 'success');
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

      {/* Floating Pomodoro mini-widget – visible when timer is running on another tab */}
      <AnimatePresence>
        {pomodoroState.phase !== 'idle' && activeTab !== 'studyhelp' && (
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            onClick={() => handleTabChange('studyhelp')}
            className={`fixed bottom-20 right-4 md:bottom-6 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-black text-sm text-white transition-all hover:scale-105 active:scale-95 ${pomodoroState.phase === 'work'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-300'
              : pomodoroState.phase === 'longBreak'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-300'
                : 'bg-gradient-to-r from-orange-400 to-amber-500 shadow-orange-300'
              }`}
          >
            {/* Pulse dot */}
            {pomodoroState.running && (
              <span className="flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
            )}
            {!pomodoroState.running && <Timer className="w-4 h-4" />}
            <span>
              {Math.floor(pomodoroState.secondsLeft / 60).toString().padStart(2, '0')}
              :{(pomodoroState.secondsLeft % 60).toString().padStart(2, '0')}
            </span>
            <span className="text-white/70 text-[10px] font-bold">
              {pomodoroState.phase === 'work' ? 'Nauka' : pomodoroState.phase === 'longBreak' ? 'Przerwa' : 'Przerwa'}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Friend invite popups */}
      {pendingInvite && (
        <InvitePendingPopup
          inviteId={pendingInvite.id}
          friendName={pendingInvite.friendName}
          onAccepted={(lobbyId) => {
            setPendingInvite(null);
            setCurrentLobbyId(lobbyId);
            setShowMultiplayer(true);
            showNotification(t.common.gameStarted.replace('$1', pendingInvite.friendName), 'success');
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
            showNotification(t.common.joinedGame.replace('$1', incomingInvite.fromUserName), 'success');
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
          <TopBar
            stats={stats}
            userId={user?.uid}
            onNavigate={handleTabChange}
            onOpenInventory={() => setShowInventory(true)}
          />

          <div key={contentRefreshKey} className="p-4 md:p-8 flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <div className="animate-in fade-in duration-300">
                  <HomePage
                    stats={stats}
                    reviewCount={dueReviews.length}
                    onNavigate={handleTabChange}
                    onOpenMultiplayer={() => setShowMultiplayer(true)}
                    onOpenLevelRewards={() => setShowLevelRewards(true)}
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
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                        >
                          {t.home.subjects.biology}
                        </button>
                        <button
                          onClick={() => setSubject('chemistry')}
                          className={`flex-1 py-3 px-6 rounded-2xl font-black text-sm transition-all ${subject === 'chemistry'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg scale-105'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                        >
                          {t.home.subjects.chemistry}
                        </button>
                      </div>

                      {chemistryNotTranslated ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="max-w-2xl mx-auto"
                        >
                          <div className="p-10 rounded-[3rem] bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white shadow-2xl relative overflow-hidden border-b-[12px] border-purple-800/30">
                            <div className="relative z-10 flex flex-col items-center text-center">
                              <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-xl mb-8 shadow-inner border border-white/30 animate-pulse">
                                <Sparkles className="w-12 h-12 text-white" />
                              </div>
                              <h3 className="text-4xl font-black mb-6 tracking-tight">
                                {t.home.subjects.chemistry}
                              </h3>
                              <p className="text-xl font-bold leading-relaxed opacity-95 max-w-lg">
                                {t.science.noChemistryMessage}
                              </p>
                            </div>
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-400/20 rounded-full blur-[100px]" />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {units.map((unit, index) => {
                            const completed = unit.topics.filter(t => t.progress === 100).length;
                            const total = unit.topics.length;
                            const progress = total > 0 ? Math.floor((completed / total) * 100) : 0;
                            const CIRCUMFERENCE = 226;
                            const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

                            return (
                              <motion.div
                                key={unit.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedUnit(unit)}
                                className="bg-white p-5 rounded-[2rem] shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer flex items-center gap-6 transition-all duration-300"
                              >
                                <div className="relative w-20 h-20 flex-shrink-0">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                                    <motion.circle
                                      cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-blue-500" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE}
                                      initial={{ strokeDashoffset: CIRCUMFERENCE }}
                                      whileInView={{ strokeDashoffset: offset }}
                                      viewport={{ once: true }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center text-3xl">{unit.icon}</div>
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-xl font-black text-gray-800 mb-1">{unit.title}</h3>
                                  <p className="text-sm text-gray-500 font-medium mb-2">{unit.description}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                                      {t.home.module} {index + 1}
                                    </span>
                                    {progress === 100 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1">{t.common.confirm}</span>}
                                  </div>
                                </div>
                                <div className="pr-4 text-gray-300"><ChevronLeft className="w-6 h-6 rotate-180" /></div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-8">
                      <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] hover:translate-x-[-2px] transition-transform bg-white px-5 py-2.5 rounded-full shadow-sm"><ChevronLeft className="w-4 h-4" /> {t.common.backToMap}</button>
                      <motion.div layoutId={`unit-header-${selectedUnit.id}`} className="bg-gray-800 rounded-[2.5rem] p-10 text-white border-b-[10px] border-blue-600 shadow-xl relative overflow-hidden">
                        <div className="flex items-center gap-6 relative z-10">
                          <span className="bg-white/10 p-5 rounded-[1.8rem] backdrop-blur-md text-6xl">{selectedUnit.icon}</span>
                          <div>
                            <h2 className="text-4xl font-black tracking-tight mb-1">{selectedUnit.title}</h2>
                            <p className="text-blue-200 font-bold text-lg opacity-80 italic">{selectedUnit.description}</p>
                          </div>
                        </div>
                      </motion.div>
                      <LessonMap topics={selectedUnit.topics} onStartTopic={(topic) => setSelectedTopicForAction(topic)} onResetTopic={() => { }} />
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'practice' && (
                <div className="space-y-8">
                  {chemistryNotTranslated && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-2xl mx-auto"
                    >
                      <div className="p-10 rounded-[3rem] bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white shadow-2xl relative overflow-hidden border-b-[12px] border-purple-800/30">
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="bg-white/20 p-5 rounded-[2rem] backdrop-blur-xl mb-8 shadow-inner border border-white/30 animate-pulse">
                            <Sparkles className="w-12 h-12 text-white" />
                          </div>
                          <h3 className="text-4xl font-black mb-6 tracking-tight">
                            {t.home.subjects.chemistry}
                          </h3>
                          <p className="text-xl font-bold leading-relaxed opacity-95 max-w-lg">
                            {t.science.noChemistryMessage}
                          </p>
                        </div>
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-400/20 rounded-full blur-[100px]" />
                      </div>
                    </motion.div>
                  )}
                  <PracticeHub
                    pomodoroState={pomodoroState}
                    pomodoroControls={pomodoroControls}
                    dueReviews={dueReviews}
                    savedQuestions={savedQuestions}
                    units={units}
                    onStartTopic={(topic) => setActiveQuizTopic(topic)}
                    onStartSavedQuestions={() => {
                      const allQuestions = units.flatMap(u => u.topics.flatMap(t => t.questions));
                      const questionsToPlay = allQuestions.filter(q => savedQuestions.includes(q.id));
                      if (questionsToPlay.length === 0) return;
                      setActiveQuizTopic({
                        id: 'saved_questions_session',
                        title: t.practiceCenter.savedQuestions,
                        icon: '❤️',
                        description: t.practiceCenter.savedQuestionsDesc,
                        questions: questionsToPlay,
                        progress: 0,
                        srsLevel: 0,
                        nextReviewDate: undefined
                      });
                    }}
                    onStartArena={() => setShowMultiplayer(true)}
                  />
                </div>
              )}
            </AnimatePresence>

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
                units={units}
                onGemsSpent={(amount: number) => setStats(prev => ({ ...prev, gems: prev.gems - amount }))}
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
                  alert(t.common.resetSuccess);
                }}
                onLogout={handleLogout}
                isSoundEnabled={settings.sound}
                onToggleSound={() => handleToggleSettings('sound')}

              />
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SettingsView
                  settings={settings}
                  onToggle={handleToggleSettings}
                  onLogout={handleLogout}
                  stats={stats}
                  onUpdateStats={(newStats) => {
                    setStats(newStats);
                    // Debounced sync will happen automatically, but we can nudge it
                    setTimeout(() => window.dispatchEvent(new Event('force-sync')), 50);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'support' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SupportSection
                  stats={stats}
                  onUpdateStats={(newStats) => {
                    setStats(newStats);
                    setTimeout(() => window.dispatchEvent(new Event('force-sync')), 50);
                  }}
                />
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

            {activeTab === 'shop' && user && (
              <ShopSection
                userId={user.uid}
                userGems={stats.gems}
                onPurchaseSuccess={(amount: number) => {
                  // Update stats immediately to reflect deducted gems
                  setStats(prev => ({ ...prev, gems: Math.max(0, prev.gems - amount) }));

                  // forceSync will ensure local and remote are consistent
                  setTimeout(() => {
                    window.dispatchEvent(new Event('force-sync'));
                  }, 100);
                }}
              />
            )}
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
                    showNotification(`Odblokowano osiągnięcie: ${ach.name} ! 🎉`, 'success');
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
              showNotification(t.common.addedToCalendar.replace('$1', showAddToCalendarPrompt.title), 'success');
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

      {/* Global Inventory Modal */}
      {
        showInventory && user && (
          <InventoryModal
            userId={user.uid}
            onClose={() => setShowInventory(false)}
            onOpenChest={(chestId, reward) => setOpeningChest({ chestId, reward })}
          />
        )
      }

      {/* Global Level Reward Modal */}
      {
        showLevelRewards && user && (
          <LevelRewardModal
            userId={user.uid}
            unclaimedLevels={getUnclaimedMilestones(xpToLevel(stats.xp), stats.claimedLevelRewards || [])}
            onClose={() => setShowLevelRewards(false)}
            onClaimSuccess={(level) => {
              setStats(prev => ({
                ...prev,
                claimedLevelRewards: [...(prev.claimedLevelRewards || []), level]
              }));
            }}
            onOpenChest={(chestId, reward) => setOpeningChest({ chestId, reward })}
          />
        )
      }

      {/* 4. Chest Opening Animation Overlay */}
      <AnimatePresence>
        {openingChest && (
          <ChestOpeningModal
            chestId={openingChest.chestId}
            reward={openingChest.reward}
            onClose={() => setOpeningChest(null)}
          />
        )}
      </AnimatePresence>
    </div >
  );
};

export default App;