import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';

// --- IMPORTY KOMPONENTÓW ---
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
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
import ScienceSection from './components/ScienceSection'; // Funkcja z Kodu 1

// --- TYPY I SERWISY ---
import { UserStats, Unit, Topic, ExamTask, Question } from './types';
import { calculateNextReview, isReviewDue } from './services/srsService';

// --- IKONY ---
import { 
  ChevronLeft, RefreshCw, Play, Sparkles, 
  Moon, Sun, Bell, Volume2, Shield, LogOut, Info,
  BookOpen, BrainCircuit // Ikony do menu wyboru (Kod 1)
} from 'lucide-react';

// --- FIREBASE ---
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from "./components/firebaseConfig";

// --- KONFIGURACJA UI ---
const INITIAL_STATS: UserStats = {
  name: 'BioMistrz',
  avatar: '',
  bio: 'Ambitny maturzysta dążący do perfekcji w biologii.',
  streak: 0,
  xp: 0,
  gems: 100,
  completedLessons: [],
  totalQuestionsAnswered: 0
};

const COLORS = ['blue', 'emerald', 'purple', 'rose', 'orange', 'indigo', 'cyan', 'amber', 'lime', 'violet'];

// --- KOMPONENTY POMOCNICZE (Menu Wyboru Akcji - z Kodu 1) ---
const TopicActionMenu = ({ 
  topic, 
  onClose, 
  onStartQuiz, 
  onStartLearn 
}: { 
  topic: Topic, 
  onClose: () => void, 
  onStartQuiz: () => void, 
  onStartLearn: () => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600" />
        
        <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2 text-center">{topic.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm font-bold mb-8">Wybierz tryb pracy</p>

        <div className="grid gap-4">
          {/* PRZYCISK: NAUKA */}
          <button 
            onClick={onStartLearn}
            className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-2 border-blue-100 dark:border-blue-800 transition-all group text-left"
          >
            <div className="p-3 bg-white dark:bg-blue-900 rounded-xl shadow-sm text-blue-600 dark:text-blue-300 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-blue-900 dark:text-blue-100">Nauka (Teoria)</h3>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-bold opacity-70">Artykuły, wideo i przykłady</p>
            </div>
          </button>

          {/* PRZYCISK: QUIZ */}
          <button 
            onClick={onStartQuiz}
            className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-2 border-purple-100 dark:border-purple-800 transition-all group text-left"
          >
            <div className="p-3 bg-white dark:bg-purple-900 rounded-xl shadow-sm text-purple-600 dark:text-purple-300 group-hover:scale-110 transition-transform">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-purple-900 dark:text-purple-100">Ćwiczenia (Quiz)</h3>
              <p className="text-xs text-purple-600 dark:text-purple-300 font-bold opacity-70">Sprawdź wiedzę w praktyce</p>
            </div>
          </button>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-3 rounded-xl font-black text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm uppercase tracking-wider"
        >
          Anuluj
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- KOMPONENT USTAWIEŃ (SCALONY) ---
interface SettingsProps {
  settings: { darkMode: boolean; sound: boolean; notifications: boolean };
  onToggle: (key: string) => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({ settings, onToggle, onLogout }) => {
  const ToggleItem = ({ label, icon: Icon, active, onClick, description }: any) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl mb-3 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-gray-800 dark:text-white">{label}</h4>
          {description && <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
      </div>
      <button 
        onClick={onClick}
        className={`w-14 h-8 rounded-full flex items-center p-1 transition-all duration-300 ${active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3">
        <Shield className="w-8 h-8 text-blue-600" /> Ustawienia
      </h2>
      <div className="space-y-8">
        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Wygląd i Dźwięk</h3>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <ToggleItem label="Tryb Ciemny" icon={settings.darkMode ? Moon : Sun} active={settings.darkMode} onClick={() => onToggle('darkMode')} description="Oszczędzaj oczy podczas nocnej nauki" />
            <ToggleItem label="Efekty Dźwiękowe" icon={Volume2} active={settings.sound} onClick={() => onToggle('sound')} description="Dźwięki przy poprawnych odpowiedziach" />
          </div>
        </section>

        {/* Sekcja Powiadomień przywrócona z Kodu 2 */}
        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Powiadomienia</h3>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
            <ToggleItem 
              label="Przypomnienia o nauce" 
              icon={Bell} 
              active={settings.notifications} 
              onClick={() => onToggle('notifications')} 
              description="Powiadom mnie, gdy nadejdzie czas powtórki" 
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Konto</h3>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
             <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300 mb-4"><Info className="w-5 h-5" /><span className="text-sm">Wersja aplikacji: 1.2.5 (Ultimate)</span></div>
             <button onClick={onLogout} className="w-full py-4 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors border border-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400"><LogOut className="w-5 h-5" /> Wyloguj się</button>
          </div>
        </section>
      </div>
    </div>
  );
};

// --- GŁÓWNY KOMPONENT APP ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('learn');
  const [contentRefreshKey, setContentRefreshKey] = useState(0);

  // Stats & Settings
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('biomistrz_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('biomistrz_settings');
    return saved ? JSON.parse(saved) : { darkMode: false, sound: true, notifications: true };
  });

  // Theme Effect
  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('biomistrz_settings', JSON.stringify(settings));
  }, [settings]);

  // Watchdog Refresh (z Kodu 2 dla stabilności UI)
  useEffect(() => {
    const timer = setTimeout(() => setContentRefreshKey(prev => prev + 1), 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const [showIntro, setShowIntro] = useState<boolean>(false);
  const [introChecked, setIntroChecked] = useState<boolean>(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  
  // --- ROZSZERZONE STANY WYBORU (z Kodu 1 dla obsługi Nauki) ---
  const [selectedTopicForAction, setSelectedTopicForAction] = useState<Topic | null>(null);
  const [activeQuizTopic, setActiveQuizTopic] = useState<Topic | null>(null); // W kodzie 2 to było activeTopic
  const [activeLearnTopic, setActiveLearnTopic] = useState<Topic | null>(null);
  
  const [quizProgress, setQuizProgress] = useState<Record<string, { index: number; score: number; wrongIndices: number[] }>>(() => {
    const saved = localStorage.getItem('biomistrz_quiz_progress');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [customTasks, setCustomTasks] = useState<ExamTask[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // 1. POBIERANIE DANYCH UŻYTKOWNIKA - LOGIKA HYBRYDOWA (Użycie Kodu 2 dla bezpieczeństwa)
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
            
            // --- NAPRAWA ZNIKAJĄCYCH DANYCH (Logika z Kodu 2) ---
            let currentStats = { ...INITIAL_STATS, ...data.stats };
            
            // Fallback do danych Google jeśli brak w bazie
            if (!currentStats.avatar && currentUser.photoURL) currentStats.avatar = currentUser.photoURL;
            if ((!currentStats.name || currentStats.name === 'BioMistrz') && currentUser.displayName) currentStats.name = currentUser.displayName;

            const lastActiveDate = data.lastActive;
            // Streak Logic
            if (lastActiveDate) {
              const lastDate = new Date(lastActiveDate);
              const today = new Date();
              lastDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              const diffTime = today.getTime() - lastDate.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) currentStats.streak = (currentStats.streak || 0) + 1;
              else if (diffDays > 1) currentStats.streak = 1;
            } else {
              currentStats.streak = 1;
            }
            
            setStats(currentStats);
            if (data.customTasks) setCustomTasks(data.customTasks);
            if (data.quizProgress) setQuizProgress(data.quizProgress);
          } else {
            // Pierwsze logowanie - inicjalizacja z Google (z Kodu 2)
            const newStats = { ...INITIAL_STATS, name: currentUser.displayName || 'BioMistrz', avatar: currentUser.photoURL || '' };
            setStats(newStats);
          }
        } catch (error) { console.error("Błąd Firebase:", error); }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. AUTOMATYCZNY ZAPIS (Z Kodu 2 - lepsza obsługa błędów)
  useEffect(() => {
    localStorage.setItem('biomistrz_stats', JSON.stringify(stats));
    localStorage.setItem('biomistrz_quiz_progress', JSON.stringify(quizProgress));
    
    if (user && !authLoading) {
      const saveToCloud = async () => {
        try {
          // Deep copy aby uniknąć referencji
          const cleanStats = JSON.parse(JSON.stringify(stats));
          const cleanQuizProgress = JSON.parse(JSON.stringify(quizProgress));

          await setDoc(doc(db, 'users', user.uid), { 
            stats: cleanStats, 
            quizProgress: cleanQuizProgress, 
            settings: settings, 
            lastActive: new Date().toISOString() 
          }, { merge: true });
        } catch (error) { console.error("❌ Błąd zapisu:", error); }
      };
      const timeoutId = setTimeout(saveToCloud, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [user, stats, authLoading, quizProgress, settings]); 

  // INTRO
  useEffect(() => {
    if (!authLoading) {
      const hasSeen = localStorage.getItem('hasSeenIntro');
      setShowIntro(hasSeen !== 'true');
      setIntroChecked(true);
    }
  }, [authLoading]);

  // 3. POBIERANIE DANYCH MERYTORYCZNYCH (Z Kodu 2 - lepszy Error Handling)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const iconsResponse = await fetch('/Icons.json');
        const iconsData: any = await iconsResponse.json();
        const questionsResponse = await fetch('/questions.json');
        if (!questionsResponse.ok) throw new Error('Błąd pliku questions.json');
        const questionsData = await questionsResponse.json();
        
        let processedUnits: Unit[] = [];
        let colorIndex = 0;

        questionsData.forEach((section: any) => {
          const { sectionName, questions } = section;
          const sanitizeQuestions = (qs: any[]): Question[] => qs.map(q => ({
            id: q.id || Math.random().toString(36).substr(2, 9),
            type: q.options ? 'multiple_choice' : 'true_false',
            question: q.question,
            options: q.options,
            correctAnswer: q.answer || q.correctAnswer,
            explanation: q.explanation || "Brak wyjaśnienia.",
            category: q.category || "Ogólne",
            topic: q.topic || "Inne"
          }));

          const groupByTopic = (qs: any[]) => {
            const map: Record<string, Question[]> = {};
            const cleanQs = sanitizeQuestions(qs);
            cleanQs.forEach(q => {
              const t = q.topic || "Inne";
              if (!map[t]) map[t] = [];
              map[t].push(q);
            });
            return map;
          };

          if (sectionName !== "Blank" && sectionName !== "") {
            const topicsMap = groupByTopic(questions);
            processedUnits.push({
              id: `unit_${sectionName}`,
              title: sectionName,
              icon: iconsData.sections[sectionName] || iconsData.topics["Domyślny"],
              description: `Opanuj dział: ${sectionName}`,
              color: COLORS[colorIndex % COLORS.length],
              topics: Object.keys(topicsMap).map((topicTitle, idx) => ({
                id: `topic_${sectionName}_${idx}`,
                title: topicTitle,
                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                description: `Zadania: ${topicTitle}`,
                questions: topicsMap[topicTitle],
                progress: 0,
                srsLevel: 0,
                nextReviewDate: undefined // Bezpieczniejszy typ z Kodu 2
              }))
            });
            colorIndex++;
          } else {
             const topicsMap = groupByTopic(questions);
             Object.keys(topicsMap).forEach((topicTitle) => {
              processedUnits.push({
                id: `unit_loose_${topicTitle}`,
                title: topicTitle,
                icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                description: `Temat: ${topicTitle}`,
                color: COLORS[colorIndex % COLORS.length],
                topics: [{
                  id: `topic_single_${topicTitle}`,
                  title: topicTitle,
                  icon: iconsData.topics[topicTitle] || iconsData.topics["Domyślny"],
                  description: `Kompletna baza zadań`,
                  questions: topicsMap[topicTitle],
                  progress: 0,
                  srsLevel: 0,
                  nextReviewDate: undefined
                }]
              });
              colorIndex++;
            });
          }
        });

        const savedProgress = localStorage.getItem('biomistrz_progress');
        if (savedProgress) {
          const progressMap = JSON.parse(savedProgress);
          processedUnits = processedUnits.map(u => ({
            ...u,
            topics: u.topics.map(t => ({ ...t, ...(progressMap[t.id] || {}) }))
          }));
        }
        setUnits(processedUnits);
      } catch (error) { console.error("Krytyczny błąd danych:", error); } 
      finally { setTimeout(() => setDataLoading(false), 600); }
    };
    loadAllData();
  }, []);

  // Update selectedUnit if data changes (z Kodu 2)
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
        progressToSave[t.id] = { progress: t.progress, srsLevel: t.srsLevel, nextReviewDate: t.nextReviewDate };
      }));
      localStorage.setItem('biomistrz_progress', JSON.stringify(progressToSave));
    }
  }, [units]);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const dueReviews = useMemo(() => {
    return units.reduce((acc, unit) => [...acc, ...unit.topics], [] as Topic[]).filter(t => isReviewDue(t.nextReviewDate));
  }, [units]);

  const handleLogout = () => { setUser(null); setStats(INITIAL_STATS); auth.signOut(); };
  const handleToggleSettings = (key: string) => { setSettings((prev: any) => ({ ...prev, [key]: !prev[key] })); };

  if (dataLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-[100]">
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full mb-4 shadow-lg" />
        <h1 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">Wczytywanie BioMistrza...</h1>
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!introChecked) return null;
  if (showIntro) return <IntroScreen onFinish={() => setShowIntro(false)} userName={stats.name || user.displayName || 'BioMistrzu'} />;

  return (
    <div className={`flex flex-col md:flex-row min-h-screen transition-colors duration-300 ${settings.darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-blue-500 z-[70] origin-left" style={{ scaleX }} />
      <BugReportButton />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} reviewCount={dueReviews.length} />
      
      <main className="flex-1 flex flex-col md:max-w-4xl md:mx-auto w-full pb-24 md:pb-0 relative">
        <TopBar stats={stats} onNavigate={setActiveTab} reviewCount={dueReviews.length} />
        
        <div key={contentRefreshKey} className="p-4 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'learn' && (
              <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                {!selectedUnit ? (
                  <>
                    <motion.div whileHover={{ y: -2 }} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <span className="bg-white/20 text-[9px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">Matura 2025</span>
                        <h2 className="text-4xl font-black mb-3 tracking-tight">Witaj, {stats.name}!</h2>
                        <p className="text-blue-100 font-bold opacity-90">Twój dzisiejszy cel: +150 XP. Wybierz moduł do nauki.</p>
                      </div>
                      <Sparkles className="absolute -right-8 -bottom-8 w-64 h-64 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                    </motion.div>

                    <div className="grid grid-cols-1 gap-6">
                      {units.map((unit, index) => {
                        const completed = unit.topics.filter(t => t.progress === 100).length;
                        const total = unit.topics.length;
                        const progress = total > 0 ? Math.floor((completed / total) * 100) : 0;
                        return (
                          <motion.div 
                            key={unit.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedUnit(unit)}
                            className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-8 duo-button-shadow group"
                          >
                            <div className="text-7xl p-6 bg-gray-50 dark:bg-gray-700 rounded-[2rem] group-hover:scale-105 transition-transform">{unit.icon}</div>
                            <div className="flex-1 text-center md:text-left">
                              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-1">{unit.title}</h3>
                              <p className="text-gray-400 dark:text-gray-400 font-bold text-sm mb-4">{unit.description}</p>
                              <div className="w-full bg-gray-100 dark:bg-gray-700 h-3.5 rounded-full overflow-hidden border border-gray-50 dark:border-gray-600">
                                 <motion.div initial={{ width: 0 }} whileInView={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                              </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/30 px-6 py-3 rounded-2xl border-2 border-blue-100 dark:border-blue-800/50 text-center min-w-[100px]">
                               <span className="text-xl font-black text-blue-600 dark:text-blue-400 block">{completed}/{total}</span>
                               <span className="text-[9px] font-black uppercase text-blue-300 dark:text-blue-500 tracking-widest whitespace-nowrap">Tematy</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <button onClick={() => setSelectedUnit(null)} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase text-[10px] hover:translate-x-[-2px] transition-transform bg-white dark:bg-gray-800 px-5 py-2.5 rounded-full shadow-sm"><ChevronLeft className="w-4 h-4" /> Wróć do Mapy</button>
                    <motion.div layoutId={`unit-header-${selectedUnit.id}`} className="bg-gray-800 rounded-[2.5rem] p-10 text-white border-b-[10px] border-blue-600 shadow-xl relative overflow-hidden">
                      <div className="flex items-center gap-6 relative z-10">
                        <span className="bg-white/10 p-5 rounded-[1.8rem] backdrop-blur-md text-6xl">{selectedUnit.icon}</span>
                        <div>
                          <h2 className="text-4xl font-black tracking-tight mb-1">{selectedUnit.title}</h2>
                          <p className="text-blue-200 font-bold text-lg opacity-80 italic">{selectedUnit.description}</p>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Tutaj zachowujemy funkcjonalność Kodu 1: Otwieranie Menu Akcji zamiast od razu Quizu */}
                    <LessonMap 
                      topics={selectedUnit.topics} 
                      onStartTopic={(topic) => setSelectedTopicForAction(topic)} 
                      onResetTopic={() => {}}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'practice' && (
               <div className="max-w-2xl mx-auto py-8">
                 <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-8 flex items-center gap-3"><RefreshCw className="w-8 h-8 text-orange-500" /> Centrum Powtórek</h2>
                 {dueReviews.length === 0 ? (
                   <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-20 text-center border-4 border-dashed border-gray-100 dark:border-gray-700"><div className="text-7xl mb-6">🏆</div><h3 className="text-xl font-black text-gray-700 dark:text-gray-200">Wszystko utrwalone!</h3><p className="text-gray-400 dark:text-gray-500 mt-2">Wróć jutro, aby sprawdzić nową dawkę powtórek.</p></div>
                 ) : (
                   <div className="space-y-4">
                     {dueReviews.map(topic => (
                        <button key={topic.id} onClick={() => setActiveQuizTopic(topic)} className="w-full bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border-2 border-gray-50 dark:border-gray-700 flex justify-between items-center hover:border-orange-400 transition-all duo-button-shadow">
                          <div className="flex items-center gap-6"><span className="text-5xl">{topic.icon}</span><h4 className="text-xl font-black text-gray-800 dark:text-gray-100">{topic.title}</h4></div>
                          <Play className="w-10 h-10 text-orange-500" />
                        </button>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {activeTab === 'exams' && (
              <ExamSection 
                onExamFinish={(xp) => setStats(p => ({
                  ...p, 
                  xp: p.xp + xp, 
                  gems: p.gems + 5,
                  totalQuestionsAnswered: p.totalQuestionsAnswered + 1
                }))} 
              />
            )}
            
            {activeTab === 'creator' && <CreatorSection onPublish={(t) => console.log("Wygenerowano:", t.title)} />}
            {activeTab === 'survey' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><FeedbackSection /></motion.div>}
            {activeTab === 'leaderboard' && <LeaderboardSection />}  
            
            {activeTab === 'profile' && (
              <ProfileSection 
                stats={stats} 
                onUpdate={(u) => setStats(p => ({...p, ...u}))} 
                onResetAll={() => { 
                  setStats(INITIAL_STATS); 
                  setUnits(prev => prev.map(u => ({...u, topics: u.topics.map(t => ({ ...t, progress: 0, srsLevel: 0, nextReviewDate: undefined }))}))); 
                  localStorage.clear(); 
                  alert("Postępy zostały wyzerowane."); 
                }} 
                onLogout={handleLogout} 
              />
            )}
            
            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <SettingsView settings={settings} onToggle={handleToggleSettings} onLogout={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

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
              setUnits(prev => prev.map(u => ({...u, topics: u.topics.map(t => t.id === activeQuizTopic.id ? { ...t, progress: Math.max(t.progress || 0, newProgress) } : t)})));
              setQuizProgress(prev => ({...prev, [activeQuizTopic.id]: { index: idx, score, wrongIndices: wrong }}));
            }}
            onFinish={(score) => {
              const passed = score >= activeQuizTopic.questions.length * 0.6;
              const { nextLevel, nextDate } = calculateNextReview(activeQuizTopic.srsLevel, passed);
              setUnits(prev => prev.map(u => ({...u, topics: u.topics.map(t => t.id === activeQuizTopic.id ? { ...t, progress: 100, srsLevel: nextLevel, nextReviewDate: nextDate } : t)})));
              setStats(s => ({ ...s, xp: s.xp + (passed ? 100 : 20), gems: s.gems + (passed ? 25 : 5), totalQuestionsAnswered: s.totalQuestionsAnswered + activeQuizTopic.questions.length }));
              setQuizProgress(prev => { const n = { ...prev }; delete n[activeQuizTopic.id]; return n; });
              setActiveQuizTopic(null);
            }}
            onQuit={() => setActiveQuizTopic(null)}
            onXpChange={(xp) => setStats(prev => ({ ...prev, xp: prev.xp + xp }))}
          />
        )}
      </AnimatePresence>

      {/* 3. WIDOK NAUKI (SCIENCE SECTION) - z Kodu 1 */}
      <AnimatePresence>
        {activeLearnTopic && (
          <ScienceSection 
            topicId={activeLearnTopic.id}
            topicTitle={activeLearnTopic.title}
            onBack={() => setActiveLearnTopic(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
