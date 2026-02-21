import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, CheckCircle2, RefreshCw,
  AlertCircle, Calculator, Clock, Table,
  Play, BookOpen, ChevronLeft, Columns,
  PlusCircle, Check, Save, RotateCcw,
  Maximize2, X, Shuffle, Layers
} from 'lucide-react';
import { ExamTask, TaskBlock } from '../types';

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

const ExamSection: React.FC<ExamSectionProps> = ({ onExamFinish }) => {
  const [currentExam, setCurrentExam] = useState<ExamTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);

  const [manualScores, setManualScores] = useState<Record<string, number>>({});
  const [savedExams, setSavedExams] = useState<string[]>([]);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Nowy stan: tryb widoku początkowego
  const [viewMode, setViewMode] = useState<'selection' | 'full' | 'random'>('selection');

  useEffect(() => {
    const saves = AVAILABLE_EXAMS.filter(exam =>
      localStorage.getItem(`exam_progress_${exam.id}`)
    ).map(e => e.id);
    setSavedExams(saves);
  }, [currentExam]);

  const loadExamFromFile = async (examDef: typeof AVAILABLE_EXAMS[0]) => {
    setLoading(true);
    setError(null);
    setIsChecked(false);
    setUserAnswers({});
    setManualScores({});

    try {
      const response = await fetch(`/tasks/${examDef.file}`);
      if (!response.ok) throw new Error(`Nie znaleziono pliku: ${examDef.file}`);
      const data: ExamTask = await response.json();

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
      setError("Nie udało się wczytać arkusza.");
    } finally {
      setLoading(false);
    }
  };

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
    saveProgressToLocal(true);
  };

  const saveProgressToLocal = (checkedStatus: boolean = isChecked) => {
    if (!currentExam) return;
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
    alert(`Zakończono! Twój wynik to ${currentTotalScore} / ${maxPossiblePoints} pkt.`);
    if (currentExam?.id) {
      localStorage.removeItem(`exam_progress_${currentExam.id}`);
    }
    closeExam();
  }

  const handleRestartExam = (e: React.MouseEvent, examId: string) => {
    e.stopPropagation();
    if (confirm("Czy na pewno chcesz zresetować postęp tego arkusza?")) {
      localStorage.removeItem(`exam_progress_${examId}`);
      setSavedExams(prev => prev.filter(id => id !== examId));
    }
  };

  const closeExam = () => {
    setCurrentExam(null);
    setIsChecked(false);
    setUserAnswers({});
    setManualScores({});
  };

  if (!currentExam && !loading) {
    if (viewMode === 'selection') {
      return (
        <div className="max-w-5xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-800  mb-4">Wybierz Tryb</h2>
            <p className="text-gray-500  max-w-lg mx-auto">
              Wybierz w jaki sposób chcesz dzisiaj ćwiczyć materiał.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Tryb Losowy */}
            <button
              onClick={() => {
                alert("Tryb losowy jeszcze w przygotowaniu!");
                // docelowo: setViewMode('random');
              }}
              className="group relative overflow-hidden rounded-[2rem] border-2 border-gray-100 hover:border-blue-400 bg-white p-8 transition-all hover:shadow-2xl hover:-translate-y-2 text-left"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 rounded-bl-[4rem] transition-transform group-hover:scale-125 block" />
              <div className="p-4 rounded-2xl bg-blue-500 text-white w-fit mb-6 shadow-lg shadow-blue-500/30">
                <Shuffle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                Losuj zadania
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Narzędzie dobierze losowe pytania z różnych arkuszy, tworząc dla Ciebie unikalny sprawdzian wiedzy.
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
                Cały Arkusz
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Klasyczne rozwiązywanie pełnego arkusza od A do Z, w formie symulacji prawdziwego egzaminu maturalnego.
              </p>
            </button>
          </div>
        </div>
      );
    }

    // Widok: 'full' (Pełny arkusz)
    return (
      <div className="max-w-6xl mx-auto py-10 px-4 animate-in fade-in slide-in-from-right-8 duration-500">
        <button
          onClick={() => setViewMode('selection')}
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-purple-600 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Wróć do wyboru trybu
        </button>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-800  mb-4">Wybierz Arkusz</h2>
          <p className="text-gray-500  max-w-lg mx-auto">
            <code className="bg-gray-100  px-2 py-1 rounded text-sm font-mono">Arkusze Maturalne Będą dodawane stopniowo</code>.
          </p>
        </div>

        {error && (
          <div className="bg-red-50  text-red-600  p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-100 ">
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
                    ? 'bg-blue-50  border-blue-200 '
                    : 'bg-white  border-gray-100  hover:border-purple-300 '
                  }`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${exam.color} opacity-10 rounded-bl-[4rem] transition-transform group-hover:scale-110`} />

                <div className="flex items-start justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${exam.color} text-white shadow-lg group-hover:shadow-${exam.color}/50`}>
                    <FileText className="w-8 h-8" />
                  </div>
                  {hasProgress ? (
                    <span className="px-3 py-1 bg-blue-100  text-blue-600  text-xs font-black uppercase tracking-wide rounded-full animate-pulse">
                      W trakcie
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100  text-gray-600  text-xs font-black uppercase tracking-wide rounded-full">
                      {exam.level}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-gray-900  mb-2 group-hover:text-purple-600  transition-colors">
                  {exam.title}
                </h3>
                <p className="text-sm text-gray-500  font-medium mb-6 line-clamp-2">
                  {exam.desc}
                </p>

                <div className="flex items-center gap-4 text-xs font-bold text-gray-400  border-t border-gray-100  pt-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.time}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> JSON</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600  font-black text-sm">
                    {hasProgress ? 'Wznów' : 'Rozpocznij'} <Play className="w-4 h-4 fill-current" />
                  </div>

                  {hasProgress && (
                    <button
                      onClick={(e) => handleRestartExam(e, exam.id)}
                      className="p-2 hover:bg-red-100  text-red-400 rounded-full transition-colors"
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
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="font-bold text-gray-500">Wczytywanie arkusza...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-40 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="sticky top-0 z-40 bg-white/95  backdrop-blur-sm border-b border-gray-200  pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 mb-8 -mx-4 px-4 md:-mx-8 md:px-8 shadow-sm transition-all flex justify-between items-center">
        <button
          onClick={handleSaveAndExit}
          className="flex items-center gap-2 text-gray-500  hover:text-purple-600  font-bold transition-colors bg-white  px-4 py-2 rounded-xl border border-gray-200  shadow-sm"
        >
          <Save className="w-4 h-4" /> Zapisz i wyjdź
        </button>

        <div className="text-xs font-bold text-gray-400  uppercase tracking-widest flex items-center gap-2">
          {isChecked ? <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Tryb sprawdzania</span> : 'Tryb rozwiązywania'}
        </div>
      </div>

      <div className="bg-white  rounded-3xl p-8 border border-gray-200  shadow-sm relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
        <div className="flex justify-between items-start mb-4">
          <span className="bg-purple-100  text-purple-700  px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
            {currentExam?.year || 'ARKUSZ'}
          </span>
          <span className="flex items-center gap-1 text-gray-400 font-bold text-sm">
            <Calculator className="w-4 h-4" /> {maxPossiblePoints} pkt
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900  mb-2 leading-tight">
          {currentExam?.title}
        </h1>
        <div className="flex flex-wrap gap-2 mt-4">
          {currentExam?.tags?.map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-gray-100  text-gray-600  rounded-full text-xs font-bold border border-gray-200 ">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {currentExam?.blocks.map((block) => (
          <div key={block.id} className="bg-white  p-6 md:p-8 rounded-3xl border border-gray-200  shadow-sm">
            {renderBlockContent(
              block,
              userAnswers,
              isChecked,
              handleAnswerChange,
              manualScores,
              toggleManualPoint,
              setZoomedImage
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white/90  backdrop-blur-md border-t border-gray-200  p-4 z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          {isChecked && (
            <div className="flex items-center gap-4 bg-gray-100  px-6 py-3 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Twój Wynik</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-purple-600 ">{currentTotalScore}</span>
                  <span className="text-sm font-bold text-gray-400">/ {maxPossiblePoints} pkt</span>
                </div>
              </div>
              <div className="h-8 w-[1px] bg-gray-300  mx-2"></div>
              <span className="text-lg font-bold text-gray-600 ">
                {Math.round((currentTotalScore / maxPossiblePoints) * 100)}%
              </span>
            </div>
          )}

          <div className="w-full md:w-auto">
            {!isChecked ? (
              <button
                onClick={checkAnswers}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-gray-900  text-white  rounded-2xl font-black text-sm uppercase tracking-wide shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Sprawdź odpowiedzi <CheckCircle2 className="w-5 h-5 text-emerald-400 " />
              </button>
            ) : (
              <button
                onClick={finishExam}
                className="w-full md:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-sm uppercase tracking-wide shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                Zakończ egzamin <ChevronLeft className="w-4 h-4 rotate-180" />
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
};

// --- PEŁNA FUNKCJA RENDERUJĄCA BLOKI ---
const renderBlockContent = (
  block: TaskBlock,
  userAnswers: Record<string, string>,
  isChecked: boolean,
  handleAnswerChange: (id: string, val: string) => void,
  manualScores: Record<string, number>,
  toggleManualPoint: (id: string, max: number) => void,
  onImageClick: (url: string) => void
) => {

  const ManualPointButton = ({ id, maxPoints = 1 }: { id: string, maxPoints?: number }) => {
    const isAwarded = (manualScores[id] || 0) > 0;

    if (!isChecked) return null;

    return (
      <button
        onClick={() => toggleManualPoint(id, maxPoints)}
        // ZMIANA: Dodane shrink-0 aby przycisk nie był zgniatany
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 shrink-0
          ${isAwarded
            ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 '
            : 'bg-white  border-gray-200  text-gray-400 hover:border-emerald-400 hover:text-emerald-500'
          }
        `}
      >
        {isAwarded ? (
          <>
            <Check className="w-3 h-3" /> Zaliczono (+{maxPoints})
          </>
        ) : (
          <>
            <PlusCircle className="w-3 h-3" /> Zalicz punkt
          </>
        )}
      </button>
    );
  };

  switch (block.type) {
    case 'text':
      return <div className="prose max-w-none text-gray-800  whitespace-pre-wrap leading-relaxed">{block.value}</div>;

    case 'image':
      return block.value ? (
        <div className="flex justify-center my-6 group relative cursor-zoom-in" onClick={() => onImageClick(block.value!)}>
          <img
            src={block.value}
            alt="Zadanie"
            className="max-h-[500px] rounded-xl border border-gray-200  shadow-sm transition-opacity hover:opacity-95"
          />
          <div className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
            <Maximize2 className="w-5 h-5" />
          </div>
        </div>
      ) : null;

    case 'question':
      return (
        <div className="space-y-4">
          {block.label && <h4 className="font-black text-gray-800  text-lg border-l-4 border-emerald-500 pl-3">{block.label}</h4>}
          <div className="space-y-4">
            {block.questionRows?.map((row) => {
              const uniqueId = `${block.id}_${row.id}`;
              const userAnswer = userAnswers[uniqueId] || '';

              return (
                <div key={row.id} className="bg-gray-50  p-4 rounded-xl border border-gray-200 ">
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <span className="font-black text-gray-400 select-none">{row.points}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="font-medium text-gray-800 ">{row.text}</p>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => handleAnswerChange(uniqueId, e.target.value)}
                          placeholder={row.placeholder || "Wpisz odpowiedź..."}
                          rows={2}
                          className={`w-full p-3 rounded-lg border-2 outline-none transition-all font-medium resize-none
                              ${isChecked
                              ? 'border-gray-300 bg-gray-100 text-gray-600   '
                              : 'border-gray-200  focus:border-purple-400 bg-white  '
                            }`}
                          disabled={isChecked}
                        />
                      </div>
                    </div>
                    {isChecked && (
                      <div className="mt-2 pt-4 border-t border-gray-200  flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in">
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase text-emerald-600  mb-1 block">Przykładowa odpowiedź:</span>
                          <p className="text-sm font-bold text-gray-700  bg-emerald-50  p-2 rounded-lg border border-emerald-100 ">
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
          {block.label && <h4 className="font-black text-blue-600  text-xs uppercase tracking-wide mb-2"><Table className="inline w-3 h-3 mr-1" /> {block.label}</h4>}

          {/* ZMIANA TUTAJ: Dodano overflow-x-auto, aby tabela była przewijalna na małych ekranach */}
          <div className="bg-white  rounded-xl border border-blue-100  overflow-x-auto">
            {/* ZMIANA TUTAJ: Dodano min-w- wrapper, aby wymusić szerokość i zapobiec ucinaniu */}
            <div className="min-w-[500px] md:min-w-0">
              {block.tableRows?.map((row, idx) => {
                const uniqueId = `${block.id}_${row.id}`;
                const userVal = userAnswers[uniqueId];
                return (
                  <div key={row.id} className={`flex items-center justify-between p-3 ${idx % 2 === 0 ? 'bg-white ' : 'bg-blue-50/30 '}`}>
                    <div className="flex-1 pr-4 min-w-[200px]">
                      <span className="font-medium text-sm text-gray-700 ">{row.statement}</span>
                      {isChecked && (
                        <div className="text-[10px] mt-1 text-emerald-600 font-bold">Prawidłowa: {row.correctAnswer}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex gap-1">
                        {['P', 'F'].map((opt) => {
                          const isSelected = userVal === opt;
                          let btnClass = "bg-gray-100  text-gray-400 ";
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
          {block.label && <h4 className="font-black text-gray-800  text-sm uppercase tracking-wide text-center mb-2">{block.label}</h4>}
          <div className="overflow-x-auto rounded-xl border border-gray-200  shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100  text-gray-600  uppercase text-xs">
                <tr>
                  {block.gridHeaders?.map((h, i) => <th key={i} className="px-4 py-3 font-black text-center border-r border-gray-200  last:border-0">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200  bg-white ">
                {block.gridRows?.map((row) => (
                  <tr key={row.id}>
                    {row.cells.map((cell) => {
                      const cellUniqueId = `${block.id}_${row.id}_${cell.id}`;
                      return (
                        <td key={cell.id} className="p-2 border-r border-gray-100  last:border-0 min-w-[120px]">
                          {cell.type === 'static' ? (
                            <span className="font-bold text-gray-700  pl-2">{cell.content}</span>
                          ) : (
                            <input
                              type="text"
                              value={userAnswers[cellUniqueId] || ''}
                              onChange={(e) => handleAnswerChange(cellUniqueId, e.target.value)}
                              className="w-full bg-gray-50  border border-gray-200  rounded p-2 text-center focus:border-purple-400 outline-none "
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
          {block.label && <h4 className="font-black text-indigo-600  text-xs uppercase tracking-wide mb-2"><Columns className="inline w-3 h-3 mr-1" /> {block.label}</h4>}
          <div className="bg-indigo-50/30  rounded-2xl p-6 border border-indigo-100  overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center min-w-[500px] md:min-w-0">
              <div className="space-y-2">
                {block.splitMatchLeft?.map((text, i) => (
                  <div key={i} className="flex gap-3 bg-white  p-3 rounded-xl border border-indigo-100  shadow-sm">
                    <span className="font-black text-indigo-500 w-6">{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm font-medium text-gray-700 ">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4 py-4 md:py-0">
                <span className="text-xs font-black uppercase text-indigo-300">{block.splitMatchConnector || 'ponieważ'}</span>
                <div className="flex items-center gap-2 bg-white  p-2 rounded-xl border-2 border-indigo-100  shadow-sm">
                  <input
                    maxLength={1}
                    className="w-10 h-10 text-center font-black rounded-lg bg-indigo-50  border-transparent focus:bg-white focus:border-indigo-400 outline-none uppercase "
                    placeholder="A"
                    value={userAnswers[`${block.id}_left`] || ''}
                    onChange={(e) => handleAnswerChange(`${block.id}_left`, e.target.value.toUpperCase())}
                    disabled={isChecked}
                  />
                  <span className="font-black text-gray-300">+</span>
                  <input
                    maxLength={1}
                    className="w-10 h-10 text-center font-black rounded-lg bg-indigo-50  border-transparent focus:bg-white focus:border-indigo-400 outline-none "
                    placeholder="1"
                    value={userAnswers[`${block.id}_right`] || ''}
                    onChange={(e) => handleAnswerChange(`${block.id}_right`, e.target.value)}
                    disabled={isChecked}
                  />
                </div>
                {isChecked && (
                  <div className="text-[10px] font-black bg-green-100  text-green-700  px-2 py-1 rounded">
                    Klucz: {String.fromCharCode(65 + parseInt(block.correctPair?.left || '0'))} + {parseInt(block.correctPair?.right || '0') + 1}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {block.splitMatchRight?.map((text, i) => (
                  <div key={i} className="flex gap-3 bg-white  p-3 rounded-xl border border-indigo-100  shadow-sm">
                    <span className="font-black text-indigo-500 w-6">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-700 ">{text}</span>
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