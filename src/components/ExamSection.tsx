import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText, CheckCircle2, RefreshCw,
  AlertCircle, Calculator, Clock, Table,
  Play, BookOpen, ChevronLeft, Columns,
  PlusCircle, Check, Save, RotateCcw,
  Maximize2, X, Shuffle, Layers, Dices, ArrowRight
} from 'lucide-react';
import { ExamTask, TaskBlock } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ExamSectionProps {
  onExamFinish?: (points: number) => void;
}

// --- KONFIGURACJA ARKUSZY ---
const AVAILABLE_EXAMS = [
  {
    id: 'matura2025',
    title: 'Matura 2025 - PEŁNA',
    file: 'matura_2025_FULL.json',
    level: 'Rozszerzony',
    time: '180 min',
    desc: 'Kompletny arkusz maturalny. Biochemia, Metabolizm i Genetyka.',
    color: 'bg-purple-600'
  },
  {
    id: 'matura2025staraformuła',
    title: 'Matura 2025 formuła 2015',
    file: 'matura_2025___formu_a_2015__FULL.json',
    level: 'Rozszerzony',
    time: '180 min',
    desc: 'Kompletny arkusz maturalny.',
    color: 'bg-purple-600'
  },
];

// --- GRUPOWANIE BLOKÓW W ZADANIA ---
// Zadanie = ciągła sekwencja bloków zaczynająca się od bloku tekstowego z "Zadanie"
interface TaskGroup {
  taskNumber: string;
  blocks: TaskBlock[];
  examId: string;
  examTitle: string;
}

const groupBlocksIntoTasks = (blocks: TaskBlock[], examId: string, examTitle: string): TaskGroup[] => {
  const tasks: TaskGroup[] = [];
  let currentGroup: TaskBlock[] = [];
  let currentTaskNumber = '';

  for (const block of blocks) {
    const isTaskStart = block.type === 'text' && /^Zadanie\s+\d+/i.test(block.value || '');

    if (isTaskStart) {
      // Save previous group if it has question-type blocks
      if (currentGroup.length > 0 && currentGroup.some(b =>
        b.type === 'question' || b.type === 'true_false_table' || b.type === 'split_match_table' || b.type === 'grid_table'
      )) {
        tasks.push({ taskNumber: currentTaskNumber, blocks: currentGroup, examId, examTitle });
      }
      // Start new group
      const match = (block.value || '').match(/^Zadanie\s+(\d+[\w.]*)/i);
      currentTaskNumber = match ? `Zadanie ${match[1]}` : 'Zadanie';
      currentGroup = [block];
    } else {
      currentGroup.push(block);
    }
  }

  // Push last group
  if (currentGroup.length > 0 && currentGroup.some(b =>
    b.type === 'question' || b.type === 'true_false_table' || b.type === 'split_match_table' || b.type === 'grid_table'
  )) {
    tasks.push({ taskNumber: currentTaskNumber, blocks: currentGroup, examId, examTitle });
  }

  return tasks;
};

const ExamSection: React.FC<ExamSectionProps> = ({ onExamFinish }) => {
  const { t } = useLanguage();
  const [currentExam, setCurrentExam] = useState<ExamTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);

  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [savedExams, setSavedExams] = useState<string[]>([]);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Tryb widoku
  const [viewMode, setViewMode] = useState<'selection' | 'full' | 'random'>('selection');

  // Losowanie: ustawienia
  const [randomCount, setRandomCount] = useState(5);
  const [randomTasks, setRandomTasks] = useState<TaskGroup[] | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>(AVAILABLE_EXAMS.map(e => e.id));

  useEffect(() => {
    const saves = AVAILABLE_EXAMS.filter(exam =>
      localStorage.getItem(`exam_progress_${exam.id}`)
    ).map(e => e.id);
    setSavedExams(saves);
  }, [currentExam]);

  // Ładowanie pliku JSON ze strumieniowym feedbackiem
  const loadJsonFile = async (file: string, onProgress?: (msg: string) => void): Promise<ExamTask> => {
    onProgress?.(t.exam.active.loadingTitle);
    const response = await fetch(`/tasks/${file}`);
    if (!response.ok) throw new Error(`${t.exam.active.errorLoad}: ${file}`);

    // Dla dużych plików - czytamy przez reader aby pokazać postęp
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1_000_000 && response.body) {
      onProgress?.('Wczytywanie danych (plik jest duży, poczekaj chwilę)...');
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      const total = parseInt(contentLength);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const pct = Math.round((received / total) * 100);
        onProgress?.(`Wczytywanie: ${pct}%`);
      }

      onProgress?.('Parsowanie danych...');
      await new Promise(r => setTimeout(r, 10)); // yield to React

      const combined = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      const text = new TextDecoder('utf-8').decode(combined);
      return JSON.parse(text) as ExamTask;
    }

    return await response.json() as ExamTask;
  };

  const loadExamFromFile = async (examDef: typeof AVAILABLE_EXAMS[0]) => {
    setLoading(true);
    setError(null);
    setIsChecked(false);
    setUserAnswers({});
    setManualScores({});
    setLoadingProgress('');

    try {
      const data = await loadJsonFile(examDef.file, setLoadingProgress);

      const savedDataString = localStorage.getItem(`exam_progress_${examDef.id}`);
      if (savedDataString) {
        const savedData = JSON.parse(savedDataString);
        setUserAnswers(savedData.userAnswers || {});
        setManualScores(savedData.manualScores || {});
        setIsChecked(savedData.isChecked || false);
      }

      setCurrentExam({ ...data, id: examDef.id });
    } catch (err) {
      console.error(err);
      setError(t.exam.active.errorLoad);
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  // Losowanie zadań ze wszystkich wybranych arkuszy
  const handleDrawTasks = useCallback(async () => {
    if (selectedExamIds.length === 0) return;
    setRandomLoading(true);
    setError(null);

    try {
      const allTaskGroups: TaskGroup[] = [];

      for (const examId of selectedExamIds) {
        const examDef = AVAILABLE_EXAMS.find(e => e.id === examId);
        if (!examDef) continue;

        const data = await loadJsonFile(examDef.file, () => { });
        const groups = groupBlocksIntoTasks(data.blocks, examDef.id, examDef.title);
        allTaskGroups.push(...groups);
      }

      if (allTaskGroups.length === 0) {
        setError(t.exam.randomSetup.errorNoTasks);
        return;
      }

      // Losuj N zadań bez powtórzeń
      const shuffled = [...allTaskGroups].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, Math.min(randomCount, shuffled.length));

      setRandomTasks(picked);
      setUserAnswers({});
      setManualScores({});
      setIsChecked(false);

      // Build a fake ExamTask from picked groups
      const combined: ExamTask = {
        id: 'random_session',
        title: `${t.exam.randomSetup.title} – ${picked.length}`,
        year: new Date().getFullYear().toString(),
        tags: ['losowe'],
        points: picked.length,
        blocks: picked.flatMap(t => t.blocks),
      };
      setCurrentExam(combined);
    } catch (err) {
      console.error(err);
      setError(t.exam.randomSetup.errorGeneral);
    } finally {
      setRandomLoading(false);
    }
  }, [selectedExamIds, randomCount]);

  const handleAnswerChange = (id: string, value: string) => {
    if (isChecked) return;
    setUserAnswers(prev => ({ ...prev, [id]: value }));
  };

  const toggleManualPoint = (uniqueId: string, maxPoints: number) => {
    setManualScores(prev => {
      const current = prev[uniqueId] || 0;
      return { ...prev, [uniqueId]: current > 0 ? 0 : maxPoints };
    });
  };

  const maxPossiblePoints = useMemo(() => {
    if (!currentExam) return 0;
    let total = 0;
    currentExam.blocks.forEach(block => {
      if (block.type === 'question' && block.questionRows) total += block.questionRows.length;
      if (block.type === 'true_false_table' && block.tableRows) total += block.tableRows.length;
      if (block.type === 'split_match_table') total += 2;
    });
    return total;
  }, [currentExam]);

  const currentTotalScore = useMemo(() => {
    return Object.values(manualScores).reduce((sum, val) => sum + val, 0);
  }, [manualScores]);

  const checkAnswers = () => {
    if (!currentExam) return;
    setIsChecked(true);
    if (currentExam.id !== 'random_session') saveProgressToLocal(true);
  };

  const saveProgressToLocal = (checkedStatus: boolean = isChecked) => {
    if (!currentExam || currentExam.id === 'random_session') return;
    const dataToSave = {
      userAnswers,
      manualScores,
      isChecked: checkedStatus,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem(`exam_progress_${currentExam.id}`, JSON.stringify(dataToSave));
  };

  const handleSaveAndExit = () => {
    saveProgressToLocal();
    closeExam();
  };

  const finishExam = () => {
    if (onExamFinish) onExamFinish(currentTotalScore * 10);
    alert(`${t.quiz.success} ${t.exam.active.yourScore}: ${currentTotalScore} / ${maxPossiblePoints} pkt.`);
    if (currentExam?.id && currentExam.id !== 'random_session') {
      localStorage.removeItem(`exam_progress_${currentExam.id}`);
    }
    closeExam();
  };

  const handleRestartExam = (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (confirm(t.exam.restartConfirm)) {
      localStorage.removeItem(`exam_progress_${examId}`);
      setSavedExams(prev => prev.filter(id => id !== examId));
    }
  };

  const closeExam = () => {
    setCurrentExam(null);
    setIsChecked(false);
    setUserAnswers({});
    setManualScores({});
    setRandomTasks(null);
  };

  // ====== RENDER: LOADING ======
  <div className="flex flex-col items-center justify-center py-40 gap-4">
    <RefreshCw className="w-12 h-12 text-purple-600 animate-spin" />
    <p className="font-bold text-gray-500 text-lg">{t.exam.active.loadingTitle}</p>
    {loadingProgress && (
      <p className="text-sm text-gray-400 animate-pulse">{t.exam.active.loadingProgress.replace('$1', loadingProgress)}</p>
    )}
    <p className="text-xs text-gray-300 max-w-xs text-center">
      {t.exam.active.loadingDesc}
    </p>
  </div>

  // ====== RENDER: RANDOM LOADING ======
  if (randomLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Dices className="w-12 h-12 text-blue-500 animate-bounce" />
        <p className="font-bold text-gray-500 text-lg">{t.exam.randomSetup.loadingTitle}</p>
        <p className="text-xs text-gray-300 max-w-xs text-center">
          {t.exam.randomSetup.loadingDesc}
        </p>
      </div>
    );
  }

  // ====== RENDER: EXAM VIEW (active exam) ======
  if (currentExam) {
    const isRandom = currentExam.id === 'random_session';

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 mb-8 -mx-4 px-4 md:-mx-8 md:px-8 shadow-sm transition-all flex justify-between items-center">
          <button
            onClick={isRandom ? closeExam : handleSaveAndExit}
            className="flex items-center gap-2 text-gray-500 hover:text-purple-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            {isRandom ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isRandom ? t.exam.active.finish : t.exam.active.saveAndExit}
          </button>

          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            {isChecked ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t.exam.active.checkMode}</span> : t.exam.active.solveMode}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex justify-between items-start mb-4">
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${isRandom ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {isRandom ? t.exam.active.randomBadge : currentExam?.year || 'ARKUSZ'}
            </span>
            <span className="flex items-center gap-1 text-gray-400 font-bold text-sm">
              <Calculator className="w-4 h-4" /> {t.exam.active.points.replace('$1', maxPossiblePoints.toString())}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">
            {currentExam?.title}
          </h1>
          {isRandom && randomTasks && (
            <div className="mt-3 flex flex-wrap gap-2">
              {randomTasks.map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                  {t.taskNumber} ({t.examTitle.split(' ').slice(0, 2).join(' ')})
                </span>
              ))}
            </div>
          )}
          {!isRandom && (
            <div className="flex flex-wrap gap-2 mt-4">
              {currentExam?.tags?.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {currentExam?.blocks.map((block) => (
            <div key={block.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
              {renderBlockContent(
                block,
                userAnswers,
                isChecked,
                handleAnswerChange,
                manualScores,
                toggleManualPoint,
                setZoomedImage,
                t
              )}
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

            {isChecked && (
              <div className="flex items-center gap-4 bg-gray-100 px-6 py-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.exam.active.yourScore}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-purple-600">{currentTotalScore}</span>
                    <span className="text-sm font-bold text-gray-400">/ {maxPossiblePoints} pkt</span>
                  </div>
                </div>
                <div className="h-8 w-[1px] bg-gray-300 mx-2"></div>
                <span className="text-lg font-bold text-gray-600">
                  {maxPossiblePoints > 0 ? Math.round((currentTotalScore / maxPossiblePoints) * 100) : 0}%
                </span>
              </div>
            )}

            <div className="w-full md:w-auto">
              {!isChecked ? (
                <button
                  onClick={checkAnswers}
                  className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-wide shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  {t.exam.active.checkButton} <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </button>
              ) : (
                <button
                  onClick={finishExam}
                  className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-sm uppercase tracking-wide shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {t.exam.active.finishButton} <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              )}
            </div>
          </div>
        </div>

        {zoomedImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={zoomedImage}
              alt="Powiększenie"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ====== RENDER: SELECTION ======
  if (viewMode === 'selection') {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-800 mb-4">{t.exam.modes.title}</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            {t.exam.modes.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tryb Losowy */}
          <button
            onClick={() => setViewMode('random')}
            className="group relative overflow-hidden rounded-[2rem] border-2 border-gray-100 hover:border-blue-400 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-2 text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-bl-[4rem] transition-transform group-hover:scale-125 block" />
            <div className="p-4 rounded-2xl bg-blue-500 text-white w-fit mb-6 shadow-lg shadow-blue-500/30">
              <Shuffle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              {t.exam.modes.random.title}
            </h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {t.exam.modes.random.desc}
            </p>
          </button>

          {/* Tryb Pełny Arkusz */}
          <button
            onClick={() => setViewMode('full')}
            className="group relative overflow-hidden rounded-[2rem] border-2 border-gray-100 hover:border-purple-400 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-2 text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-5 rounded-bl-[4rem] transition-transform group-hover:scale-125 block" />
            <div className="p-4 rounded-2xl bg-purple-600 text-white w-fit mb-6 shadow-lg shadow-purple-600/30">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
              {t.exam.modes.full.title}
            </h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              {t.exam.modes.full.desc}
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ====== RENDER: RANDOM SETUP ======
  if (viewMode === 'random') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-right-8 duration-500">
        <button
          onClick={() => setViewMode('selection')}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> {t.exam.randomSetup.back}
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-blue-500 rounded-2xl text-white mb-4 shadow-lg shadow-blue-300">
            <Dices className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">{t.exam.randomSetup.title}</h2>
          <p className="text-gray-500">{t.exam.randomSetup.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-6 h-6 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">

          {/* Liczba zadań */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wide">
              {t.exam.randomSetup.taskCountLabel}
            </label>
            <div className="flex gap-3 flex-wrap">
              {[3, 5, 8, 10, 15].map(n => (
                <button
                  key={n}
                  onClick={() => setRandomCount(n)}
                  className={`px-5 py-3 rounded-xl font-black text-sm transition-all border-2 ${randomCount === n
                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Wybór arkuszy */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wide">
              {t.exam.randomSetup.sourceLabel}
            </label>
            <div className="space-y-2">
              {AVAILABLE_EXAMS.map(exam => (
                <label
                  key={exam.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExamIds.includes(exam.id)
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedExamIds.includes(exam.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedExamIds(prev => [...prev, exam.id]);
                      else setSelectedExamIds(prev => prev.filter(id => id !== exam.id));
                    }}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <div>
                    <p className="font-black text-gray-800 text-sm">{exam.title}</p>
                    <p className="text-xs text-gray-400">{exam.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleDrawTasks}
            disabled={selectedExamIds.length === 0}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg uppercase tracking-wide shadow-xl shadow-blue-200 transform hover:-translate-y-1 transition-all"
          >
            <Shuffle className="w-5 h-5" />
            {t.exam.randomSetup.actionButton.replace('$1', randomCount.toString())}
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-gray-400">
            {t.exam.randomSetup.loadingNote}
          </p>
        </div>
      </div>
    );
  }

  // ====== RENDER: FULL EXAM LIST ======
  return (
    <div className="max-w-6xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-right-8 duration-500">
      <button
        onClick={() => setViewMode('selection')}
        className="mb-8 flex items-center gap-2 text-gray-500 hover:text-purple-600 font-bold transition-colors"
      >
        <ChevronLeft className="w-5 h-5" /> {t.exam.randomSetup.back}
      </button>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-gray-800 mb-4">{t.exam.selection.title}</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{t.exam.selection.warning}</code>.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-6 h-6" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_EXAMS.map((exam) => {
          const hasProgress = savedExams.includes(exam.id);

          return (
            <div
              key={exam.id}
              onClick={() => loadExamFromFile(exam)}
              className={`group relative overflow-hidden rounded-3xl border-2 p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1
                ${hasProgress
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-100 hover:border-purple-300'
                }`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${exam.color} opacity-10 rounded-bl-[4rem] transition-transform group-hover:scale-110`} />

              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${exam.color} text-white shadow-lg`}>
                  <FileText className="w-8 h-8" />
                </div>
                {hasProgress ? (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-wide rounded-full animate-pulse">
                    {t.exam.selection.inProgress}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wide rounded-full">
                    {exam.level}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                {exam.title}
              </h3>
              <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">
                {exam.desc}
              </p>

              <div className="flex items-center gap-4 text-xs font-bold text-gray-400 border-t border-gray-100 pt-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.time}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> JSON</span>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-600 font-black text-sm">
                  {hasProgress ? t.exam.selection.resume : t.exam.selection.start} <Play className="w-4 h-4 fill-current" />
                </div>

                {hasProgress && (
                  <button
                    onClick={(e) => handleRestartExam(e, exam.id)}
                    className="p-2 hover:bg-red-100 text-red-400 rounded-full transition-colors"
                    title="Zresetuj postęp i zacznij od nowa"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- PEŁNA FUNKCJA RENDERUJĄCA BLOKI ---
const renderBlockContent = (
  block: TaskBlock,
  userAnswers: Record<string, string>,
  isChecked: boolean,
  handleAnswerChange: (id: string, val: string) => void,
  manualScores: Record<string, number>,
  toggleManualPoint: (id: string, max: number) => void,
  onImageClick: (url: string) => void,
  t: any
) => {

  const ManualPointButton = ({ id, maxPoints = 1 }: { id: string, maxPoints?: number }) => {
    const isAwarded = (manualScores[id] || 0) > 0;

    if (!isChecked) return null;

    return (
      <button
        onClick={() => toggleManualPoint(id, maxPoints)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 shrink-0
          ${isAwarded
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200'
            : 'bg-white border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-500'
          }
        `}
      >
        {isAwarded ? (
          <><Check className="w-3 h-3" /> {t.common.save} (+{maxPoints})</>
        ) : (
          <><PlusCircle className="w-3 h-3" /> {t.exam.active.checkButton}</>
        )}
      </button>
    );
  };

  switch (block.type) {
    case 'text':
      return <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">{block.value}</div>;

    case 'image':
      return block.value ? (
        <div className="flex justify-center my-6 group relative cursor-zoom-in" onClick={() => onImageClick(block.value!)}>
          <img
            src={block.value}
            alt="Zadanie"
            className="max-h-[500px] rounded-xl border border-gray-200 shadow-sm transition-opacity hover:opacity-95"
          />
          <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <Maximize2 className="w-5 h-5" />
          </div>
        </div>
      ) : null;

    case 'question':
      return (
        <div className="space-y-4">
          {block.label && <h4 className="font-black text-gray-800 text-lg border-l-4 border-emerald-500 pl-3">{block.label}</h4>}
          <div className="space-y-4">
            {block.questionRows?.map((row) => {
              const uniqueId = `${block.id}_${row.id}`;
              const userAnswer = userAnswers[uniqueId] || '';

              return (
                <div key={row.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <span className="font-black text-gray-400 select-none">{row.points}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="font-medium text-gray-800">{row.text}</p>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => handleAnswerChange(uniqueId, e.target.value)}
                          placeholder={row.placeholder || t.quiz.check}
                          rows={2}
                          className={`w-full p-3 rounded-lg border-2 outline-none transition-all font-medium resize-none
                              ${isChecked
                              ? 'border-gray-300 bg-gray-100 text-gray-600'
                              : 'border-gray-200 focus:border-purple-400 bg-white'
                            }`}
                          disabled={isChecked}
                        />
                      </div>
                    </div>
                    {isChecked && (
                      <div className="mt-2 pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in">
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase text-emerald-600 mb-1 block">{t.quiz.correctAnswerTitle}</span>
                          <p className="text-sm font-bold text-gray-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            {row.answerKey}
                          </p>
                        </div>
                        <ManualPointButton id={uniqueId} maxPoints={1} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'true_false_table':
      return (
        <div className="space-y-2">
          {block.label && <h4 className="font-black text-blue-600 text-xs uppercase tracking-wide mb-2"><Table className="inline w-3 h-3 mr-1" /> {block.label}</h4>}
          <div className="bg-white rounded-xl border border-blue-100 overflow-x-auto">
            <div className="min-w-[500px] md:min-w-0">
              {block.tableRows?.map((row, idx) => {
                const uniqueId = `${block.id}_${row.id}`;
                const userVal = userAnswers[uniqueId];
                return (
                  <div key={row.id} className={`flex items-center justify-between p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                    <div className="flex-1 pr-4 min-w-[200px]">
                      <span className="font-medium text-sm text-gray-700">{row.statement}</span>
                      {isChecked && (
                        <div className="text-[10px] mt-1 text-emerald-600 font-bold">Prawidłowa: {row.correctAnswer}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex gap-1">
                        {['P', 'F'].map((opt) => {
                          const isSelected = userVal === opt;
                          let btnClass = "bg-gray-100 text-gray-400";
                          if (isSelected) btnClass = "bg-blue-500 text-white shadow-md";

                          return (
                            <button
                              key={opt}
                              onClick={() => handleAnswerChange(uniqueId, opt)}
                              disabled={isChecked}
                              className={`w-8 h-8 rounded-lg font-black text-xs transition-all ${btnClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <ManualPointButton id={uniqueId} maxPoints={1} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

    case 'grid_table':
      return (
        <div className="space-y-4">
          {block.label && <h4 className="font-black text-gray-800 text-sm uppercase tracking-wide text-center mb-2">{block.label}</h4>}
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  {block.gridHeaders?.map((h, i) => <th key={i} className="px-4 py-3 font-black text-center border-r border-gray-200 last:border-0">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {block.gridRows?.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell) => {
                      const cellUniqueId = `${block.id}_${row.id}_${cell.id}`;
                      return (
                        <td key={cell.id} className="p-2 border-r border-gray-100 last:border-0 min-w-[120px]">
                          {cell.type === 'static' ? (
                            <span className="font-bold text-gray-700 pl-2">{cell.content}</span>
                          ) : (
                            <input
                              type="text"
                              value={userAnswers[cellUniqueId] || ''}
                              onChange={(e) => handleAnswerChange(cellUniqueId, e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-center focus:border-purple-400 outline-none"
                              disabled={isChecked}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isChecked && (
            <div className="flex justify-end mt-2">
              <ManualPointButton id={block.id} maxPoints={2} />
            </div>
          )}
        </div>
      );

    case 'split_match_table':
      return (
        <div className="space-y-4">
          {block.label && <h4 className="font-black text-indigo-600 text-xs uppercase tracking-wide mb-2"><Columns className="inline w-3 h-3 mr-1" /> {block.label}</h4>}
          <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center min-w-[500px] md:min-w-0">
              <div className="space-y-2">
                {block.splitMatchLeft?.map((text, i) => (
                  <div key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="font-black text-indigo-500 w-6">{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm font-medium text-gray-700">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 py-4 md:py-0">
                <span className="text-xs font-black uppercase text-indigo-300">{block.splitMatchConnector || 'ponieważ'}</span>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border-2 border-indigo-100 shadow-sm">
                  <input
                    maxLength={1}
                    className="w-10 h-10 text-center font-black rounded-lg bg-indigo-50 border-transparent focus:bg-white focus:border-indigo-400 outline-none uppercase"
                    placeholder="A"
                    value={userAnswers[`${block.id}_left`] || ''}
                    onChange={(e) => handleAnswerChange(`${block.id}_left`, e.target.value.toUpperCase())}
                    disabled={isChecked}
                  />
                  <span className="font-black text-gray-300">+</span>
                  <input
                    maxLength={1}
                    className="w-10 h-10 text-center font-black rounded-lg bg-indigo-50 border-transparent focus:bg-white focus:border-indigo-400 outline-none"
                    placeholder="1"
                    value={userAnswers[`${block.id}_right`] || ''}
                    onChange={(e) => handleAnswerChange(`${block.id}_right`, e.target.value)}
                    disabled={isChecked}
                  />
                </div>
                {isChecked && (
                  <div className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded">
                    Klucz: {String.fromCharCode(65 + parseInt(block.correctPair?.left || '0'))} + {parseInt(block.correctPair?.right || '0') + 1}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {block.splitMatchRight?.map((text, i) => (
                  <div key={i} className="flex gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                    <span className="font-black text-indigo-500 w-6">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {isChecked && (
              <div className="flex justify-end mt-4">
                <ManualPointButton id={block.id} maxPoints={2} />
              </div>
            )}
          </div>
        </div>
      );

    default: return null;
  }
};

export default ExamSection;