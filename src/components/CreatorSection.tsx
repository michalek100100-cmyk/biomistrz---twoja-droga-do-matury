import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Type, Image as ImageIcon, MessageSquare, Send, Trash2, 
  Save, MoveUp, MoveDown, UserCheck, Table, Download, Upload, 
  History, FileJson, X, AlignLeft, AlignCenter, AlignRight, HelpCircle, Bold, Italic, 
  List, Eye, Grid3X3, Columns, CheckCircle2, MoreHorizontal
} from 'lucide-react';
import { ExamTask, TaskBlock } from '../types';

interface CreatorSectionProps {
  onPublish: (task: ExamTask) => void;
}

interface Draft {
  id: string;
  title: string;
  blocks: TaskBlock[];
  date: string;
}

const CreatorSection: React.FC<CreatorSectionProps> = ({ onPublish }) => {
  const [blocks, setBlocks] = useState<TaskBlock[]>([]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string>('Biochemia');
  const [points, setPoints] = useState(1);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedDrafts = localStorage.getItem('biohelp_creator_drafts');
    if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
  }, []);

  // --- FUNKCJE POMOCNICZE ---
  const addBlock = (type: TaskBlock['type']) => {
    const newBlock: TaskBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: '',
      align: 'left',
      label: (type === 'question' || type === 'true_false_table' || type === 'grid_table' || type === 'split_match_table') ? 'Polecenie...' : undefined,
      questionRows: type === 'question' ? [{ 
        id: 'q1', 
        type: 'prompt', 
        text: 'Treść pytania...', 
        answerKey: 'Poprawna odpowiedź', 
        placeholder: 'Miejsce na odpowiedź...', 
        points: 1 
      }] : undefined,
      attribution: type === 'image' ? '' : undefined,
      tableRows: type === 'true_false_table' ? [{ id: 'r1', statement: 'Stwierdzenie...', correctAnswer: 'P' as const }] : undefined,
      gridHeaders: type === 'grid_table' ? ['Kol 1', 'Kol 2', 'Kol 3'] : undefined,
      gridRows: type === 'grid_table' ? [{ 
        id: 'gr1', 
        cells: [
          { id: 'c1', type: 'input', content: '' },
          { id: 'c2', type: 'input', content: '' },
          { id: 'c3', type: 'input', content: '' }
        ]
      }] : undefined,
      splitMatchLeft: type === 'split_match_table' ? ['A', 'B'] : undefined,
      splitMatchRight: type === 'split_match_table' ? ['1', '2'] : undefined,
      splitMatchConnector: type === 'split_match_table' ? 'ponieważ' : undefined,
      correctPair: type === 'split_match_table' ? { left: '0', right: '0' } : undefined
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<TaskBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // --- SZKICE ---
  const saveAsDraft = () => {
    if (!title) { alert("Podaj tytuł!"); return; }
    const newDraft: Draft = { id: `draft_${Date.now()}`, title, blocks: [...blocks], date: new Date().toLocaleString() };
    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem('biohelp_creator_drafts', JSON.stringify(updated));
    alert("Zapisano szkic!");
  };

  const loadDraft = (draft: Draft) => {
    if (blocks.length > 0 && !confirm("Wczytać szkic?")) return;
    setBlocks(draft.blocks); setTitle(draft.title); setShowDrafts(false);
  };

  const deleteDraft = (e: React.MouseEvent, draftId: string) => {
    e.stopPropagation();
    const updated = drafts.filter(d => d.id !== draftId);
    setDrafts(updated);
    localStorage.setItem('biohelp_creator_drafts', JSON.stringify(updated));
  };

  // --- PUBLIKACJA DO JSON ---
  const handlePublishAndDownload = () => {
    if (!title || blocks.length === 0) {
      alert("Brak tytułu lub bloków!");
      return;
    }

    const newTaskData: ExamTask = {
      id: `task_${Date.now()}`,
      title: title,
      blocks: [...blocks],
      tags: tags.split(',').map(t => t.trim()),
      year: 'AUTORSKIE 2025',
      points: points
    };

    const jsonString = JSON.stringify(newTaskData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeFilename}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Zakomentowane wywołanie onPublish, aby uniknąć błędów Firebase przy pracy lokalnej
    // onPublish(newTaskData);

    setBlocks([]);
    setTitle('');
    
    alert(`Zadanie pobrane jako "${safeFilename}.json"!`);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-in fade-in duration-500 pb-44 px-4">
      
      {/* NAGŁÓWEK */}
      <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Save className="w-8 h-8 text-purple-600" />
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">BioCreator <span className="text-purple-400 text-xl font-bold">JSON</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDrafts(!showDrafts)} className="p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-purple-50 hover:text-purple-600 transition-all border border-gray-100 flex items-center gap-2">
              <History className="w-5 h-5" /><span className="text-xs font-black uppercase">Szkice</span>
            </button>
            <button onClick={() => {
                if (blocks.length === 0) return;
                const data = { title, blocks, tags, exportDate: new Date().toISOString(), type: 'BIO_HELP_BACKUP' };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = 'backup.bio'; a.click();
            }} disabled={blocks.length === 0} className="p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 disabled:opacity-30">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-100">
              <Upload className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".bio,.json" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target?.result as string);
                        if (data.type === 'BIO_HELP_BACKUP' || Array.isArray(data.blocks)) {
                            setBlocks(data.blocks);
                            setTitle(data.title);
                            if(data.tags) setTags(Array.isArray(data.tags) ? data.tags.join(', ') : data.tags);
                            if(data.points) setPoints(data.points);
                            alert("Wczytano!");
                        }
                    } catch (err) { alert("Błąd pliku"); }
                };
                reader.readAsText(file);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }} />
          </div>
        </div>

        {showDrafts && (
          <div className="animate-in slide-in-from-top-2 duration-300 bg-purple-50 border-2 border-purple-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest">Szkice Lokalne</h4>
              <button onClick={() => setShowDrafts(false)}><X className="w-4 h-4 text-purple-300" /></button>
            </div>
            {drafts.length === 0 ? (
              <p className="text-center py-6 text-purple-300 text-sm font-bold italic">Brak zapisanych szkiców.</p>
            ) : (
              <div className="grid gap-2 max-h-60 overflow-y-auto pr-2">
                {drafts.map(draft => (
                  <div key={draft.id} onClick={() => loadDraft(draft)} className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100 hover:border-purple-400 cursor-pointer transition-all">
                    <div><p className="font-black text-gray-700 text-sm truncate">{draft.title}</p><p className="text-[10px] text-gray-400">{draft.date}</p></div>
                    <button onClick={(e) => deleteDraft(e, draft.id)} className="p-1.5 text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tytuł arkusza" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-purple-400 outline-none font-bold" />
          <div className="flex items-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-2xl px-6">
            <span className="text-xs font-black text-gray-400 uppercase">Pkt:</span>
            <input type="number" value={points} onChange={(e) => setPoints(parseInt(e.target.value))} className="w-full bg-transparent py-4 focus:outline-none font-black text-lg" />
          </div>
        </div>
      </div>

      {/* LISTA BLOKÓW */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div key={block.id} className="group bg-white rounded-3xl border-2 border-dashed border-gray-200 p-6 hover:border-purple-300 transition-all relative">
            
            {/* Przyciski sortowania i usuwania */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => moveBlock(index, 'up')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><MoveUp className="w-4 h-4 text-gray-400" /></button>
               <button onClick={() => moveBlock(index, 'down')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"><MoveDown className="w-4 h-4 text-gray-400" /></button>
            </div>
            
            <button onClick={() => removeBlock(block.id)} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Trash2 className="w-4 h-4" />
            </button>

            {/* --- BLOK TEKSTOWY --- */}
            {block.type === 'text' && (
              <textarea 
                value={block.value} 
                onChange={(e) => updateBlock(block.id, { value: e.target.value })} 
                placeholder="Treść merytoryczna..." 
                className="w-full min-h-[100px] bg-transparent outline-none font-medium text-lg text-gray-700 resize-none" 
              />
            )}
            
            {/* --- BLOK ZDJĘCIA --- */}
            {block.type === 'image' && (
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase"><ImageIcon className="w-3 h-3" /> Obraz</div>
                 {block.value ? (
                   <div className="relative rounded-xl overflow-hidden border border-gray-200">
                     <img src={block.value} alt="Preview" className="w-full h-auto max-h-[400px] object-contain bg-gray-50" />
                     <button onClick={() => updateBlock(block.id, { value: '' })} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"><X className="w-4 h-4"/></button>
                   </div>
                 ) : (
                   <label className="block w-full p-8 border-2 border-dashed border-gray-200 rounded-2xl hover:bg-orange-50 cursor-pointer transition-colors text-center">
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onloadend = () => updateBlock(block.id, { value: reader.result as string });
                         reader.readAsDataURL(file);
                       }
                     }} />
                     <span className="text-gray-400 text-sm font-bold">Kliknij, aby dodać zdjęcie</span>
                   </label>
                 )}
               </div>
            )}

            {/* --- BLOK ZADANIA Z WIERSZAMI --- */}
            {block.type === 'question' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                   <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase">
                     <List className="w-3 h-3" /> Zadanie z podpunktami
                   </div>
                   <input 
                     type="text" 
                     value={block.label} 
                     onChange={(e) => updateBlock(block.id, { label: e.target.value })} 
                     placeholder="Wpisz główne polecenie (np. Zadanie 5)" 
                     className="w-1/2 bg-emerald-50 border-2 border-emerald-100 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-emerald-300 outline-none text-right" 
                   />
                </div>

                <div className="space-y-4">
                  {block.questionRows?.map((row, rIdx) => (
                    <div key={row.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3 relative group/row">
                      <button 
                        onClick={() => {
                          const newRows = block.questionRows?.filter(r => r.id !== row.id);
                          updateBlock(block.id, { questionRows: newRows });
                        }}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-3">
                         <div className="flex flex-col gap-1 w-16">
                            <span className="text-[9px] uppercase font-black text-gray-400">ID/Pkt</span>
                            <input 
                              type="number" 
                              value={row.points} 
                              onChange={(e) => {
                                const newRows = [...block.questionRows!];
                                newRows[rIdx].points = parseInt(e.target.value);
                                updateBlock(block.id, { questionRows: newRows });
                              }}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 font-black text-center"
                            />
                         </div>

                         <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-black text-gray-400">Treść pytania</span>
                            <textarea 
                              value={row.text}
                              onChange={(e) => {
                                const newRows = [...block.questionRows!];
                                newRows[rIdx].text = e.target.value;
                                updateBlock(block.id, { questionRows: newRows });
                              }}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium min-h-[60px] resize-none"
                              placeholder="Wpisz treść pytania..."
                            />
                         </div>
                      </div>

                      <div className="flex gap-3">
                         <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-black text-gray-400">Placeholder (dla ucznia)</span>
                            <input 
                              type="text" 
                              value={row.placeholder}
                              onChange={(e) => {
                                const newRows = [...block.questionRows!];
                                newRows[rIdx].placeholder = e.target.value;
                                updateBlock(block.id, { questionRows: newRows });
                              }}
                              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-500 italic"
                              placeholder="Np. Tutaj wpisz odpowiedź..."
                            />
                         </div>

                         <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[9px] uppercase font-black text-emerald-500">Klucz odpowiedzi</span>
                            <input 
                              type="text" 
                              value={row.answerKey}
                              onChange={(e) => {
                                const newRows = [...block.questionRows!];
                                newRows[rIdx].answerKey = e.target.value;
                                updateBlock(block.id, { questionRows: newRows });
                              }}
                              className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-2 text-sm font-bold text-emerald-800"
                              placeholder="Wpisz klucz..."
                            />
                         </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={() => updateBlock(block.id, { 
                      questionRows: [...block.questionRows!, { 
                        id: Math.random().toString(36), 
                        type: 'prompt', 
                        text: '', 
                        answerKey: '', 
                        placeholder: 'Odpowiedź...', 
                        points: (block.questionRows?.length || 0) + 1 
                      }] 
                    })} 
                    className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl border-2 border-dashed border-emerald-100 font-black uppercase text-[10px] hover:bg-emerald-100 transition-colors"
                  >
                    + Dodaj kolejny podpunkt
                  </button>
                </div>
              </div>
            )}

            {/* --- BLOK TABELI UNIWERSALNEJ --- */}
            {block.type === 'grid_table' && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600 font-black text-[10px] uppercase">
                      <Grid3X3 className="w-3 h-3" /> Tabela uniwersalna
                    </div>
                    <input type="text" value={block.label} onChange={(e) => updateBlock(block.id, { label: e.target.value })} className="w-32 bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-1 text-xs font-black text-center" />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {block.gridHeaders?.map((header, hIdx) => (
                            <th key={hIdx} className="p-1 min-w-[100px]">
                              <input 
                                value={header}
                                onChange={(e) => {
                                  const newHeaders = [...block.gridHeaders!];
                                  newHeaders[hIdx] = e.target.value;
                                  updateBlock(block.id, { gridHeaders: newHeaders });
                                }}
                                className="w-full bg-gray-100 rounded-lg p-2 text-xs font-black text-center uppercase border border-transparent focus:border-purple-300"
                              />
                            </th>
                          ))}
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.gridRows?.map((row, rIdx) => (
                          <tr key={row.id}>
                            {row.cells.map((cell, cIdx) => (
                              <td key={cell.id} className="p-1">
                                <input 
                                  value={cell.content}
                                  onChange={(e) => {
                                    const newRows = [...block.gridRows!];
                                    newRows[rIdx].cells[cIdx].content = e.target.value;
                                    updateBlock(block.id, { gridRows: newRows });
                                  }}
                                  className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                                />
                              </td>
                            ))}
                            <td className="text-center">
                              <button onClick={() => {
                                const newRows = block.gridRows?.filter(r => r.id !== row.id);
                                updateBlock(block.id, { gridRows: newRows });
                              }} className="text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => {
                     const newRowId = Math.random().toString(36);
                     const newCells = block.gridHeaders!.map((_, idx) => ({ id: `${newRowId}_c${idx}`, type: 'input' as const, content: '' }));
                     updateBlock(block.id, { gridRows: [...block.gridRows!, { id: newRowId, cells: newCells }] });
                  }} className="w-full py-2 bg-gray-50 text-gray-500 rounded-xl border-2 border-dashed border-gray-200 font-black uppercase text-[10px] hover:bg-gray-100">
                    + Dodaj wiersz tabeli
                  </button>
               </div>
            )}

            {/* --- BLOK SPLIT MATCH --- */}
            {block.type === 'split_match_table' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase">
                    <Columns className="w-3 h-3" /> Tabela wyboru z uzasadnieniem
                  </div>
                  <input type="text" value={block.label} onChange={(e) => updateBlock(block.id, { label: e.target.value })} className="w-24 bg-indigo-50 border-2 border-indigo-100 rounded-xl px-3 py-1 font-black text-xs text-center" />
                </div>

                <div className="grid grid-cols-[1fr_120px_1fr] gap-4 items-center">
                  <div className="space-y-2">
                    <h5 className="text-[9px] font-black uppercase text-gray-400 text-center">Hipoteza / Teza</h5>
                    {block.splitMatchLeft?.map((item, i) => (
                      <div key={i} className="flex gap-1">
                        <button 
                          onClick={() => updateBlock(block.id, { correctPair: { ...block.correctPair!, left: i.toString() } })}
                          className={`w-8 h-10 rounded-lg font-black text-xs ${block.correctPair?.left === i.toString() ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {String.fromCharCode(65 + i)}
                        </button>
                        <input 
                          value={item} 
                          onChange={(e) => {
                            const newList = [...block.splitMatchLeft!];
                            newList[i] = e.target.value;
                            updateBlock(block.id, { splitMatchLeft: newList });
                          }}
                          className="flex-1 bg-gray-50 rounded-lg px-3 text-xs font-bold border border-transparent focus:border-indigo-300"
                        />
                        <button onClick={() => updateBlock(block.id, { splitMatchLeft: block.splitMatchLeft?.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                    <button onClick={() => updateBlock(block.id, { splitMatchLeft: [...block.splitMatchLeft!, ''] })} className="w-full py-1.5 border-2 border-dashed border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-400">+ Dodaj A, B...</button>
                  </div>

                  <div className="flex flex-col items-center">
                      <h5 className="text-[9px] font-black uppercase text-gray-400 mb-2">Łącznik</h5>
                      <input 
                      value={block.splitMatchConnector} 
                      onChange={(e) => updateBlock(block.id, { splitMatchConnector: e.target.value })}
                      className="w-full bg-indigo-50/50 rounded-xl p-3 text-center text-xs font-black text-indigo-600 border-2 border-indigo-100"
                      placeholder="ponieważ"
                      />
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[9px] font-black uppercase text-gray-400 text-center">Uzasadnienie</h5>
                    {block.splitMatchRight?.map((item, i) => (
                      <div key={i} className="flex gap-1">
                        <button 
                          onClick={() => updateBlock(block.id, { correctPair: { ...block.correctPair!, right: i.toString() } })}
                          className={`w-8 h-10 rounded-lg font-black text-xs ${block.correctPair?.right === i.toString() ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {i + 1}
                        </button>
                        <input 
                          value={item} 
                          onChange={(e) => {
                            const newList = [...block.splitMatchRight!];
                            newList[i] = e.target.value;
                            updateBlock(block.id, { splitMatchRight: newList });
                          }}
                          className="flex-1 bg-gray-50 rounded-lg px-3 text-xs font-bold border border-transparent focus:border-indigo-300"
                        />
                        <button onClick={() => updateBlock(block.id, { splitMatchRight: block.splitMatchRight?.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><X className="w-3 h-3"/></button>
                      </div>
                    ))}
                    <button onClick={() => updateBlock(block.id, { splitMatchRight: [...block.splitMatchRight!, ''] })} className="w-full py-1.5 border-2 border-dashed border-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-400">+ Dodaj 1, 2...</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* --- BLOK PRAWDA/FAŁSZ --- */}
            {block.type === 'true_false_table' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase"><Table className="w-3 h-3" /> Tabela Prawda/Fałsz</div>
                  <input type="text" value={block.label} onChange={(e) => updateBlock(block.id, { label: e.target.value })} className="w-20 bg-white border-2 border-blue-100 rounded-xl px-3 py-1 text-xs font-black text-center" />
                </div>
                <div className="space-y-3">
                  {block.tableRows?.map((row, rIdx) => (
                    <div key={row.id} className="flex gap-2 items-center bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                      <span className="text-xs font-black text-gray-300 w-4">{rIdx + 1}.</span>
                      <input type="text" value={row.statement} onChange={(e) => {
                        const newRows = [...block.tableRows!];
                        newRows[rIdx].statement = e.target.value;
                        updateBlock(block.id, { tableRows: newRows });
                      }} placeholder="Stwierdzenie..." className="flex-1 bg-transparent outline-none font-bold text-sm text-gray-600" />
                      <div className="flex gap-1">
                        {(['P', 'F'] as const).map(opt => (
                          <button key={opt} onClick={() => {
                            const newRows = [...block.tableRows!];
                            newRows[rIdx].correctAnswer = opt;
                            updateBlock(block.id, { tableRows: newRows });
                          }} className={`w-8 h-8 rounded-lg font-black text-xs ${row.correctAnswer === opt ? (opt === 'P' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-100 text-gray-400'}`}>{opt}</button>
                        ))}
                      </div>
                      <button onClick={() => {
                        const newRows = block.tableRows?.filter(r => r.id !== row.id);
                        updateBlock(block.id, { tableRows: newRows });
                      }} className="ml-2 text-gray-300 hover:text-red-500"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <button onClick={() => updateBlock(block.id, { tableRows: [...block.tableRows!, { id: Math.random().toString(36), statement: '', correctAnswer: 'P' }] })} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl border-2 border-dashed border-blue-100 font-black uppercase text-[10px]">+ Dodaj wiersz</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PASEK NARZĘDZI */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-xl border-2 border-gray-200 p-3 rounded-3xl shadow-2xl z-50 overflow-x-auto max-w-[95vw]">
        <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><Type className="w-4 h-4" /> Tekst</button>
        <button onClick={() => addBlock('image')} className="flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><ImageIcon className="w-4 h-4" /> Zdjęcie</button>
        <button onClick={() => addBlock('question')} className="flex items-center gap-2 px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><List className="w-4 h-4" /> Zadanie</button>
        <button onClick={() => addBlock('grid_table')} className="flex items-center gap-2 px-4 py-3 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><Grid3X3 className="w-4 h-4" /> Tabela</button>
        
        <div className="w-px h-8 bg-gray-200 mx-2 flex-shrink-0" />
        <button onClick={() => addBlock('split_match_table')} className="flex items-center gap-2 px-4 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><Columns className="w-4 h-4" /> Wybór</button>
        <button onClick={() => addBlock('true_false_table')} className="flex items-center gap-2 px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><Table className="w-4 h-4" /> P/F</button>
        
        <div className="w-px h-8 bg-gray-200 mx-2 flex-shrink-0" />
        
        <button onClick={saveAsDraft} className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black uppercase text-[10px] whitespace-nowrap"><FileJson className="w-4 h-4" /> Szkic</button>
        
        <button onClick={handlePublishAndDownload} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-xs whitespace-nowrap shadow-lg shadow-purple-200">
          <Send className="w-4 h-4" /> Zapisz JSON
        </button>
      </div>
    </div>
  );
};

export default CreatorSection;