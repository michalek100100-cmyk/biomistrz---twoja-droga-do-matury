// src/types.ts

// --- CZĘŚĆ 1: TYPY DO NAUKI (Quizy, Mapa, Statystyki) ---

export interface UserStats {
  name: string;
  avatar: string;
  bio: string;
  streak: number;
  xp: number;
  gems: number;
  completedLessons: string[];
  totalQuestionsAnswered: number;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[]; // Opcjonalne dla T/F
  correctAnswer: string;
  explanation: string;
  category: string;
  topic: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: Question[];
  progress: number;       // 0 - 100
  srsLevel: number;       // Poziom powtórek (0-5)
  nextReviewDate?: string; // Data następnej powtórki (ISO string)
}

export interface Unit {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  topics: Topic[];
}

// --- CZĘŚĆ 2: TYPY DO KREATORA I EGZAMINÓW (Pliki JSON) ---

export interface ExamTask {
  id: string;
  title: string;
  blocks: TaskBlock[];
  tags: string[];
  year: string;
  points: number;
}

export type TaskBlockType = 
  | 'text' 
  | 'image' 
  | 'question'          
  | 'grid_table'        
  | 'true_false_table' 
  | 'split_match_table';

export interface TaskBlock {
  id: string;
  type: TaskBlockType;
  value?: string;       // Dla tekstu i obrazka (base64)
  align?: 'left' | 'center' | 'right';
  label?: string;       // Np. "Zadanie 5"
  attribution?: string;

  // --- Pola dla 'true_false_table' ---
  tableRows?: TableRow[];

  // --- Pola dla 'split_match_table' ---
  splitMatchLeft?: string[];
  splitMatchRight?: string[];
  splitMatchConnector?: string;
  correctPair?: { left: string; right: string };

  // --- Pola dla 'question' (Zadanie z wierszami) ---
  questionRows?: QuestionRow[];

  // --- Pola dla 'grid_table' (Tabela uniwersalna) ---
  gridHeaders?: string[];
  gridRows?: GridRow[];
}

// --- Typy pomocnicze do bloków ---

export interface TableRow {
  id: string;
  statement: string;
  correctAnswer: 'P' | 'F';
}

export interface QuestionRow {
  id: string;
  type: 'prompt';
  text: string;        // Treść pytania
  answerKey: string;   // Klucz odpowiedzi
  placeholder: string; // Co widzi uczeń w polu (np. "Wpisz wynik")
  points: number;      // Punkty lub numer podpunktu
  align?: 'left' | 'center' | 'right';
}

export interface GridRow {
  id: string;
  cells: GridCell[];
}

export interface GridCell {
  id: string;
  type: 'static' | 'input';
  content: string;
}