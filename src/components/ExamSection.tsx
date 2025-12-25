import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, RefreshCw, 
  AlertCircle, Calculator, Clock, Table, 
  Play, BookOpen, Star, ChevronLeft, Columns
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
    file: 'matura_2025_FULL.json', // <--- TWÓJ PLIK
    level: 'Rozszerzony',
    time: '180 min',
    desc: 'Kompletny arkusz maturalny. Biochemia, Metabolizm i Genetyka.',
    color: 'bg-purple-600'
  },
  { 
    id: 'demo1',
    title: 'Testowy Arkusz (Demo)', 
    file: 'moje_zadanie.json', 
    level: 'Podstawowy',
    time: '45 min',
    desc: 'Przykładowy arkusz do testowania aplikacji.',
    color: 'bg-emerald-600'
  },
];

const ExamSection: React.FC<ExamSectionProps> = ({ onExamFinish }) => {
  const [currentExam, setCurrentExam] = useState<ExamTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isChecked, setIsChecked] = useState(false);

  // Funkcja pobierająca plik JSON
  const loadExamFromFile = async (filename: string) => {
    setLoading(true);
    setError(null);
    setIsChecked(false);
    setUserAnswers({});

    try {
      const response = await fetch(`/tasks/${filename}`);
      if (!response.ok) throw new Error(`Nie znaleziono pliku: ${filename}`);
      const data: ExamTask = await response.json();
      setCurrentExam(data);
    } catch (err) {
      console.error(err);
      setError("Nie udało się wczytać arkusza. Upewnij się, że plik .json jest w folderze public/tasks/.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    if (isChecked) return;
    setUserAnswers(prev => ({ ...prev, [id]: value }));
  };

  const checkAnswers = () => {
    if (!currentExam) return;
    setIsChecked(true);

    let totalPoints = 0;
    currentExam.blocks.forEach(block => {
      // Punktacja za pytania otwarte/krótkiej odpowiedzi
      if (block.type === 'question' && block.questionRows) {
        block.questionRows.forEach(row => {
          const uniqueId = `${block.id}_${row.id}`;
          const userAnswer = userAnswers[uniqueId] || '';
          if (userAnswer.trim().toLowerCase() === row.answerKey.trim().toLowerCase()) {
            totalPoints += 1;
          }
        });
      }
      // Punktacja za Prawda/Fałsz
      if (block.type === 'true_false_table' && block.tableRows) {
        block.tableRows.forEach(row => {
           const uniqueId = `${block.id}_${row.id}`;
           if (userAnswers[uniqueId] === row.correctAnswer) totalPoints += 1;
        });
      }
      // Punktacja za Split Match (Wybór + Uzasadnienie)
      if (block.type === 'split_match_table' && block.correctPair) {
         const leftId = `${block.id}_left`;
         const rightId = `${block.id}_right`;
         const userLeft = userAnswers[leftId];
         const userRight = userAnswers[rightId];
         
         const correctLeftChar = String.fromCharCode(65 + parseInt(block.correctPair.left));
         const correctRightNum = (parseInt(block.correctPair.right) + 1).toString();

         if (userLeft === correctLeftChar && userRight === correctRightNum) {
           totalPoints += 2; // Np. 2 punkty za całe poprawne dopasowanie
         }
      }
    });

    alert(`Egzamin zakończony! Zdobywasz ${totalPoints} punktów.`);
    if (onExamFinish) onExamFinish(totalPoints * 10);
  };

  const closeExam = () => {
    setCurrentExam(null);
    setIsChecked(false);
    setUserAnswers({});
  };

  // --- WIDOK WYBORU ARKUSZA ---
  if (!currentExam && !loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-800 mb-4">Wybierz Arkusz</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Wybierz jeden z dostępnych egzaminów z bazy lokalnej. Pliki ładowane są z folderu <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">public/tasks</code>.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-6 h-6" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_EXAMS.map((exam) => (
            <div 
              key={exam.id}
              onClick={() => loadExamFromFile(exam.file)}
              className="group bg-white rounded-3xl border-2 border-gray-100 hover:border-purple-300 p-6 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${exam.color} opacity-10 rounded-bl-[4rem] transition-transform group-hover:scale-110`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className={`p-4 rounded-2xl ${exam.color} text-white shadow-lg group-hover:shadow-${exam.color}/50`}>
                  <FileText className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wide rounded-full">
                  {exam.level}
                </span>
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

              <div className="mt-4 flex items-center gap-2 text-purple-600 font-black text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                Rozpocznij <Play className="w-4 h-4 fill-current" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- EKRAN ŁADOWANIA ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="font-bold text-gray-500">Wczytywanie arkusza...</p>
      </div>
    );
  }

  // --- WIDOK ARKUSZA (Rozwiązywanie) ---
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Pasek nawigacji */}
      <div className="mb-6">
        <button 
          onClick={closeExam}
          className="flex items-center gap-2 text-gray-500 hover:text-purple-600 font-bold transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Wróć do listy
        </button>
      </div>

      {/* NAGŁÓWEK ARKUSZA */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex justify-between items-start mb-4">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
              {currentExam?.year || 'ARKUSZ'}
            </span>
            <span className="flex items-center gap-1 text-gray-400 font-bold text-sm">
              <Calculator className="w-4 h-4"/> {currentExam?.points} pkt
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 leading-tight">
            {currentExam?.title}
          </h1>
          <div className="flex flex-wrap gap-2 mt-4">
            {currentExam?.tags?.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200">
                #{tag}
              </span>
            ))}
          </div>
      </div>

      {/* LISTA ZADAŃ */}
      <div className="space-y-8">
        {currentExam?.blocks.map((block) => (
          <div key={block.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
              {renderBlockContent(block, userAnswers, isChecked, handleAnswerChange)}
          </div>
        ))}
      </div>

      {/* STOPKA */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {!isChecked ? (
              <button 
                onClick={checkAnswers}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-wide shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Sprawdź odpowiedzi <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-between animate-in slide-in-from-bottom-2">
                <span className="text-emerald-600 font-black uppercase text-sm">Sprawdzono</span>
                <button 
                  onClick={closeExam}
                  className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold shadow-lg"
                >
                  Zakończ i wyjdź
                </button>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

// --- PEŁNA FUNKCJA RENDERUJĄCA BLOKI ---
const renderBlockContent = (
  block: TaskBlock, 
  userAnswers: Record<string, string>, 
  isChecked: boolean, 
  handleAnswerChange: (id: string, val: string) => void
) => {
  switch (block.type) {
    case 'text':
      return <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">{block.value}</div>;
      
    case 'image':
      return block.value ? <div className="flex justify-center my-6"><img src={block.value} alt="Zadanie" className="max-h-[500px] rounded-xl border border-gray-200 shadow-sm" /></div> : null;
      
    case 'question':
      return (
        <div className="space-y-4">
            {block.label && <h4 className="font-black text-gray-800 text-lg border-l-4 border-emerald-500 pl-3">{block.label}</h4>}
            <div className="space-y-4">
              {block.questionRows?.map((row) => {
                const uniqueId = `${block.id}_${row.id}`;
                const userAnswer = userAnswers[uniqueId] || '';
                const isCorrect = isChecked && userAnswer.trim().toLowerCase() === row.answerKey.trim().toLowerCase();
                return (
                  <div key={row.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex gap-4">
                      <span className="font-black text-gray-400 select-none">{row.points}.</span>
                      <div className="flex-1 space-y-3">
                        <p className="font-medium text-gray-800">{row.text}</p>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={userAnswer}
                            onChange={(e) => handleAnswerChange(uniqueId, e.target.value)}
                            placeholder={row.placeholder}
                            className={`w-full p-3 rounded-lg border-2 outline-none transition-all font-medium ${isChecked ? (isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-gray-200 focus:border-purple-400 bg-white'}`}
                            disabled={isChecked}
                          />
                          {isChecked && !isCorrect && <div className="mt-2 text-xs font-bold text-emerald-600 animate-in fade-in">Prawidłowa odpowiedź: {row.answerKey}</div>}
                        </div>
                      </div>
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
          {block.label && <h4 className="font-black text-blue-600 text-xs uppercase tracking-wide mb-2"><Table className="inline w-3 h-3 mr-1"/> {block.label}</h4>}
          <div className="bg-white rounded-xl border border-blue-100 overflow-hidden">
            {block.tableRows?.map((row, idx) => {
              const uniqueId = `${block.id}_${row.id}`;
              const userVal = userAnswers[uniqueId];
              return (
                <div key={row.id} className={`flex items-center justify-between p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}`}>
                  <span className="flex-1 font-medium text-sm pr-4 text-gray-700">{row.statement}</span>
                  <div className="flex gap-1">
                    {['P', 'F'].map((opt) => {
                       const isSelected = userVal === opt;
                       let btnClass = "bg-gray-100 text-gray-400 hover:bg-gray-200";
                       if (!isChecked) {
                         if (isSelected) btnClass = opt === 'P' ? "bg-green-500 text-white shadow-md transform scale-105" : "bg-red-500 text-white shadow-md transform scale-105";
                       } else {
                         if (opt === row.correctAnswer) btnClass = "bg-green-600 text-white ring-2 ring-green-300"; 
                         else if (isSelected && opt !== row.correctAnswer) btnClass = "bg-red-500 text-white opacity-50"; 
                       }
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
                </div>
              );
            })}
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
          {isChecked && <p className="text-xs text-center text-gray-400 italic">Tabele uniwersalne wymagają ręcznej oceny przez nauczyciela.</p>}
        </div>
      );

    case 'split_match_table':
      return (
        <div className="space-y-4">
          {block.label && <h4 className="font-black text-indigo-600 text-xs uppercase tracking-wide mb-2"><Columns className="inline w-3 h-3 mr-1"/> {block.label}</h4>}
          <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100">
             <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
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
                        className={`w-10 h-10 text-center font-black rounded-lg bg-indigo-50 border-transparent focus:bg-white focus:border-indigo-400 outline-none uppercase
                          ${isChecked && (userAnswers[`${block.id}_left`] === String.fromCharCode(65 + parseInt(block.correctPair?.left || '0')) ? 'text-green-600' : 'text-red-500 line-through')}
                        `}
                        placeholder="A"
                        value={userAnswers[`${block.id}_left`] || ''}
                        onChange={(e) => handleAnswerChange(`${block.id}_left`, e.target.value.toUpperCase())}
                        disabled={isChecked}
                      />
                      <span className="font-black text-gray-300">+</span>
                      <input 
                        maxLength={1}
                        className={`w-10 h-10 text-center font-black rounded-lg bg-indigo-50 border-transparent focus:bg-white focus:border-indigo-400 outline-none
                          ${isChecked && (userAnswers[`${block.id}_right`] === (parseInt(block.correctPair?.right || '0') + 1).toString() ? 'text-green-600' : 'text-red-500 line-through')}
                        `}
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
          </div>
        </div>
      );

    default: return null;
  }
};

export default ExamSection;