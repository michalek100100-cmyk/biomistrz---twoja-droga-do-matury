import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
// Komponenty
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LessonMap from './components/LessonMap';
import QuizSession from './components/QuizSession';
import ExamSection from './components/ExamSection';
import CreatorSection from './components/CreatorSection';
import ProfileSection from './components/ProfileSection';
// Typy i serwisy
import { UserStats, Unit, Topic, ExamTask, Question } from './types';
import { calculateNextReview, isReviewDue } from './services/srsService';
// Ikony
import { ChevronLeft, RefreshCw, Play, Sparkles } from 'lucide-react';
// Firebase
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from "./components/firebaseConfig";
import AuthScreen from './screens/AuthScreen';
import LeaderboardSection from './components/LeaderboardSection';

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

const App: React.FC = () => {
  // --- STANY APLIKACJI ---
  const [activeTab, setActiveTab] = useState('learn');
  
  // Stan użytkownika (lokalny + fallback)
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('biomistrz_stats');
    return saved ? JSON.parse(saved) : INITIAL_STATS;
  });
  
  // Dane merytoryczne
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  
  // UWAGA: customTasks zostawiamy w stanie, żeby nie psuć starej logiki Firebase,
  // ale nie będziemy ich już używać w nowym ExamSection (bo ten ładuje pliki z folderu).
  const [customTasks, setCustomTasks] = useState<ExamTask[]>([]);

  // --- STANY FIREBASE I ŁADOWANIA ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Ładowanie użytkownika
  const [dataLoading, setDataLoading] = useState(true); // Ładowanie pytań z JSON

  // 1. POBIERANIE DANYCH UŻYTKOWNIKA (FIREBASE)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.stats) setStats(data.stats);
            // Wczytujemy stare zadania customowe, jeśli jakieś były w bazie
            if (data.customTasks) setCustomTasks(data.customTasks);
          }
        } catch (error) {
          console.error("Błąd pobierania z Firebase:", error);
        }
      }
      setAuthLoading(false); // Auth sprawdzony
    });
    return () => unsubscribe();
  }, []);

  // 2. AUTOMATYCZNY ZAPIS DO CHMURY
  useEffect(() => {
    // Zapisz lokalnie (zawsze)
    localStorage.setItem('biomistrz_stats', JSON.stringify(stats));

    // Jeśli zalogowany - wyślij do Firebase
    if (user && !authLoading) {
      const saveToCloud = async () => {
        try {
          // Usuwamy undefined przed wysłaniem do Firebase, żeby uniknąć błędów
          const cleanStats = JSON.parse(JSON.stringify(stats));
          
          await setDoc(doc(db, 'users', user.uid), {
            stats: cleanStats,
            // customTasks: customTasks, // Opcjonalnie: można przestać to wysyłać, jeśli przechodzisz w 100% na pliki
            lastActive: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error("Błąd zapisu:", error);
        }
      };
      
      const timeoutId = setTimeout(saveToCloud, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [user, stats, customTasks, authLoading]);

  // 3. POBIERANIE DANYCH MERYTORYCZNYCH (JSON)
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Ładowanie ikon
        const iconsResponse = await fetch('/Icons.json');
        const iconsData: any = await iconsResponse.json();

        // Ładowanie pytań
        const questionsResponse = await fetch('/questions.json');
        if (!questionsResponse.ok) throw new Error('Błąd pliku questions.json');
        const questionsData = await questionsResponse.json();
        
        let processedUnits: Unit[] = [];
        let colorIndex = 0;

        questionsData.forEach((section: any) => {
          const { sectionName, questions } = section;

          // Mapowanie pytań na typ Question
          const sanitizeQuestions = (qs: any[]): Question[] => qs.map(q => ({
            id: q.id || Math.random().toString(36).substr(2, 9),
            type: q.options ? 'multiple_choice' : 'true_false',
            question: q.question,
            options: q.options,
            correctAnswer: q.answer || q.correctAnswer,
            explanation: q.explanation || "Brak dodatkowego wyjaśnienia.",
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
                nextReviewDate: undefined
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
                description: `Samodzielny temat: ${topicTitle}`,
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

        // Wczytywanie postępów z localStorage
        const savedProgress = localStorage.getItem('biomistrz_progress');
        if (savedProgress) {
          const progressMap = JSON.parse(savedProgress);
          processedUnits = processedUnits.map(u => ({
            ...u,
            topics: u.topics.map(t => ({ ...t, ...(progressMap[t.id] || {}) }))
          }));
        }

        setUnits(processedUnits);
      } catch (error) {
        console.error("Krytyczny błąd ładowania danych:", error);
      } finally {
        setTimeout(() => setDataLoading(false), 600);
      }
    };

    loadAllData();
  }, []);

  // Zapis postępów (Unit/Topics) do localStorage
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

  // Obliczanie powtórek
  const dueReviews = useMemo(() => {
    return units
      .reduce((acc, unit) => [...acc, ...unit.topics], [] as Topic[])
      .filter(t => isReviewDue(t.nextReviewDate));
  }, [units]);

  // --- RENDEROWANIE WIDOKÓW ---

  // 1. Ekran ładowania
  if (dataLoading || authLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 1.5 }} 
          className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full mb-4 shadow-lg" 
        />
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter">Wczytywanie BioMistrza...</h1>
      </div>
    );
  }

  // 2. Ekran Logowania
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Główna Aplikacja
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <motion.div className="fixed top-0 left-0 right-0 h-1.5 bg-blue-500 z-[70] origin-left" style={{ scaleX }} />
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} reviewCount={dueReviews.length} />
      
      <main className="flex-1 flex flex-col md:max-w-4xl md:mx-auto w-full pb-24 md:pb-0 relative">
        <TopBar stats={stats} />
        
        <div className="p-4 md:p-8 flex-1">
          <AnimatePresence mode="wait">
            
            {/* --- SEKCJA NAUKI --- */}
            {activeTab === 'learn' && (
              <motion.div key="learn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                {!selectedUnit ? (
                  <>
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group"
                    >
                      <div className="relative z-10">
                        <span className="bg-white/20 text-[9px] font-black uppercase px-3 py-1 rounded-full mb-4 inline-block tracking-widest">Matura 2025</span>
                        <h2 className="text-4xl font-black mb-3 tracking-tight">Witaj, BioMistrzu!</h2>
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
                            className="bg-white rounded-[2.5rem] p-8 border-2 border-gray-100 hover:border-blue-500 cursor-pointer shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row items-center gap-8 duo-button-shadow group"
                          >
                            <div className="text-7xl p-6 bg-gray-50 rounded-[2rem] group-hover:scale-105 transition-transform">
                              {unit.icon}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h3 className="text-2xl font-black text-gray-800 mb-1">{unit.title}</h3>
                              <p className="text-gray-400 font-bold text-sm mb-4">{unit.description}</p>
                              <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden border border-gray-50">
                                 <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${progress}%` }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                 />
                              </div>
                            </div>
                            <div className="bg-blue-50 px-6 py-3 rounded-2xl border-2 border-blue-100 text-center min-w-[100px]">
                               <span className="text-xl font-black text-blue-600 block">{completed}/{total}</span>
                               <span className="text-[9px] font-black uppercase text-blue-300 tracking-widest whitespace-nowrap">Tematy</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <button 
                      onClick={() => setSelectedUnit(null)}
                      className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] hover:translate-x-[-2px] transition-transform bg-white px-5 py-2.5 rounded-full shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" /> Wróć do Mapy
                    </button>
                    
                    <motion.div 
                      layoutId={`unit-header-${selectedUnit.id}`}
                      className="bg-gray-800 rounded-[2.5rem] p-10 text-white border-b-[10px] border-blue-600 shadow-xl relative overflow-hidden"
                    >
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
                      onStartTopic={(topic) => setActiveTopic(topic)} 
                      onResetTopic={() => {}}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* --- SEKCJA POWTÓREK --- */}
            {activeTab === 'practice' && (
               <div className="max-w-2xl mx-auto py-8">
                 <h2 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
                   <RefreshCw className="w-8 h-8 text-orange-500" /> Centrum Powtórek
                 </h2>
                 {dueReviews.length === 0 ? (
                   <div className="bg-white rounded-[3rem] p-20 text-center border-4 border-dashed border-gray-100">
                     <div className="text-7xl mb-6">🏆</div>
                     <h3 className="text-xl font-black text-gray-700">Wszystko utrwalone!</h3>
                     <p className="text-gray-400 mt-2">Wróć jutro, aby sprawdzić nową dawkę powtórek.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {dueReviews.map(topic => (
                        <button 
                          key={topic.id} 
                          onClick={() => setActiveTopic(topic)}
                          className="w-full bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 flex justify-between items-center hover:border-orange-400 transition-all duo-button-shadow"
                        >
                          <div className="flex items-center gap-6">
                            <span className="text-5xl">{topic.icon}</span>
                            <h4 className="text-xl font-black text-gray-800">{topic.title}</h4>
                          </div>
                          <Play className="w-10 h-10 text-orange-500" />
                        </button>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {/* --- SEKCJA EGZAMINÓW (ZMODYFIKOWANA NA PLIKI JSON) --- */}
            {/* --- SEKCJA EGZAMINÓW --- */}
            {activeTab === 'exams' && (
              <ExamSection 
                onExamFinish={(xpEarned) => {
                  // Aktualizacja statystyk
                  setStats(prev => ({
                    ...prev,
                    xp: prev.xp + xpEarned,
                    gems: prev.gems + 5, // Bonusowe diamenty za ukończenie
                    // Możesz też zwiększyć licznik zadań
                    totalQuestionsAnswered: prev.totalQuestionsAnswered + 1 
                  }));
                  
                  // Opcjonalnie: Zapisz od razu do Firebase (jeśli user zalogowany)
                  // saveToCloud(); <- to zadziała automatycznie dzięki useEffect w App.tsx
                }}
              />
            )}

            {/* --- SEKCJA KREATORA (ZMODYFIKOWANA NA ZAPIS PLIKÓW) --- */}
            {activeTab === 'creator' && (
               <CreatorSection onPublish={(t) => {
                 // Tutaj plik już został pobrany na dysk.
                 // Możemy opcjonalnie zaktualizować statystyki, ale nie dodajemy do customTasks,
                 // żeby nie zapychać Firebase i nie mieszać lokalnych plików z chmurą.
                 console.log("Wygenerowano plik JSON:", t.title);
               }} />
            )}

            {activeTab === 'leaderboard' && <LeaderboardSection />}  
            {activeTab === 'profile' && <ProfileSection stats={stats} onUpdate={(u) => setStats({...stats, ...u})} onResetAll={() => {}} />}
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {activeTopic && (
          <QuizSession 
            questions={activeTopic.questions}
            onFinish={(score) => {
              const passed = score >= activeTopic.questions.length * 0.6;
              const { nextLevel, nextDate } = calculateNextReview(activeTopic.srsLevel, passed);
              setUnits(prev => prev.map(u => ({
                ...u, 
                topics: u.topics.map(t => t.id === activeTopic.id ? { ...t, progress: 100, srsLevel: nextLevel, nextReviewDate: nextDate } : t)
              })));
              setStats(s => ({
                ...s,
                xp: s.xp + (passed ? 100 : 20),
                gems: s.gems + (passed ? 25 : 5),
                totalQuestionsAnswered: s.totalQuestionsAnswered + activeTopic.questions.length
              }));
              setActiveTopic(null);
            }}
            onQuit={() => setActiveTopic(null)}
            onXpChange={(xp) => setStats(prev => ({ ...prev, xp: prev.xp + xp }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;