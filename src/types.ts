// src/types.ts

// --- CZĘŚĆ 1: TYPY DO NAUKI (Quizy, Mapa, Statystyki) ---

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;       // emoji string or URL
  unlocked: boolean;
  unlockedAt?: number; // timestamp
  progress: number;
  target: number;
  category: 'knowledge' | 'systematic' | 'social' | 'economy';
  reward: { xp: number, gems: number };
}

export interface UserStats {
  name: string;
  avatar: string;
  bio: string;
  streak: number;
  xp: number;
  gems: number;
  elo?: number;  // ELO rating for multiplayer ranking (default 1000)
  completedLessons: string[];
  totalQuestionsAnswered: number;
  dailyQuestionsAnswered: number; // Questions answered today
  dailyGoalCompleted: boolean;    // Has today's goal of 10 questions been met?
  lastQuestionDate: string;       // Date of last question answered (ISO string)
  lastGoalCompletedAt: number;    // Timestamp when goal was last completed (for 24h countdown)
  claimedEloRewards?: number[];   // ELO milestones already claimed (e.g. [100, 200, 300])
  themeColor?: string;            // Active background color (hex or CSS color)
  purchasedThemes?: string[];     // Array of purchased theme color IDs
  likes?: number;                 // Number of profile likes
  achievements?: Record<string, Achievement>; // User's achievements
  activeTitle?: string;           // Title displayed next to name
  inventory?: InventoryItem[];    // Items owned by the user
  activeBuffs?: ActiveBuff[];     // Temporary buffs acting on the user (XP/ELO multipliers)
  claimedLevelRewards?: number[]; // Array of level milestones already claimed
}

// --- NEW DATA STRUCTURES FOR INVENTORY SYSTEM ---

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface BaseItem {
  id: string; // e.g. 'wool', 'magic_carrot'
  name: string;
  description: string;
  icon: string; // emoji e.g. 🧶, 🥕
  type: 'xp_multiplier' | 'elo_multiplier' | 'other';
}

export interface InventoryItem {
  instanceId: string; // unique string (e.g. timestamp + random)
  baseId: string; // ref to BaseItem
  rarity: ItemRarity;
  amount: number;
}

export interface ActiveBuff {
  id: string;
  type: 'xp_multiplier' | 'elo_multiplier';
  multiplier: number;
  expiresAt: number; // timestamp
  sourceItemName: string;
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

  // 👇👇👇 DODANO TO POLE 👇👇👇
  topicName?: string; // Nazwa działu (np. "Chemia"), opcjonalna, używana w Battle Mode
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
  inCalendar?: boolean;   // Whether user added this topic to their study calendar
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

// --- DODAJ TO NA KOŃCU PLIKU src/types.ts ---

export type GameStatus = 'LOBBY' | 'GAME' | 'LEADERBOARD' | 'FINISHED' | 'WAITING_1V1'; // Dodałem WAITING_1V1 na wszelki wypadek

export interface MultiplayerPlayer {
  uid: string;
  nick: string;
  avatar: string;
  score: number;
  lastSyncIndex?: number; // Ważne dla naszego systemu "Batching" (30%, 60%)!
  status: 'waiting' | 'ready' | 'finished'; // Dodałem 'ready'
  isBot?: boolean;
  botElo?: number;
}

export interface Lobby {
  id: string;         // ID dokumentu w Firebase
  pin?: string;       // Kod PIN (opcjonalny dla 1v1)
  hostId: string;     // UID nauczyciela/twórcy
  hostName?: string;
  topic?: Topic | null;
  status: GameStatus;
  currentQuestionIndex?: number;
  createdAt: any;  // Timestamp
  players: Record<string, MultiplayerPlayer>; // Mapa graczy

  // Pola opcjonalne (dla gry)
  gameQuestions?: Question[];
  timePerQuestion?: number;
  questionStartAt?: any;
  topicName?: string;
  type?: 'group' | '1v1' | 'charades'; // Rozróżnienie typu pokoju
}

// --- CZĘŚĆ 3: BIOLOGICZNE KALAMBURY ---

export interface DrawingPoint {
  x: number;
  y: number;
  type: 'start' | 'draw'; // start = zacznij nową linię, draw = kontynuuj
  color?: string;
  width?: number;
}

export interface CharadesGameState {
  currentWord: string;
  drawerId: string;
  guessId?: string;
  startTime: number;
  duration?: number;
  status: 'drawing' | 'finished' | 'round_end';
  winnerId?: string;
  revealedIndices?: number[];
  guessedBy?: string[];
  totalRounds?: number;
  currentRound?: number;
  drawerOrder?: string[]; // Ordered list of player UIDs for drawer rotation
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderNick: string;
  text: string;
  timestamp: number;
  isCorrect?: boolean;
}

export interface CharadesSession {
  gameId: string;
  drawing: DrawingPoint[];
  state: CharadesGameState;
  players: Record<string, MultiplayerPlayer>;
}

// --- CZĘŚĆ 5: SYSTEM KLANÓW ---

export interface ClanMember {
  uid: string;
  name: string;
  avatar: string;
  elo: number;
  wins: number;
  losses: number;
  joinedAt: number;
  role: 'leader' | 'co-leader' | 'member';
}

export interface Clan {
  id: string;
  name: string;
  avatar: string;            // URL or emoji
  leaderId: string;
  leaderName: string;
  isPublic: boolean;
  minElo: number;            // Minimum ELO to join
  members: Record<string, ClanMember>;
  memberCount: number;
  totalElo: number;          // Sum of all members' ELO
  averageWinrate: number;    // Average winrate across all members
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: number;

  // Advanced features
  territoryIds?: string[];
  activeBossId?: string;
  tradeOfferIds?: string[];
  allianceIds?: string[];
}

export interface ClanAlliance {
  id: string; // usually clanA_id_clanB_id
  clanIds: [string, string];
  status: 'pending' | 'active';
  createdAt: number;
}

export interface Territory {
  id: string;
  name: string;
  location: { lat: number; lng: number; radius: number };
  ownerClanId: string | null;
  contestedBy: Record<string, number>; // clanId -> capture points
  resourceYield: { gems: number; elo: number }; // per hour/day
}

export interface ClanBoss {
  id: string;
  name: string;
  avatar: string; // boss emoji or image
  maxHp: number;
  currentHp: number;
  activeUntil: number; // timestamp
  participants: Record<string, number>; // memberUid -> damage dealt
  rewards: { gems: number; elo: number; loot: string };
}

export interface TradeOffer {
  id: string;
  senderId: string; // User ID
  senderClanId: string;
  recipientId?: string; // If direct trade, else open to clan/alliance
  offer: { gems: number };
  request: { items: string[] }; // or other resources
  status: 'open' | 'completed' | 'cancelled';
  createdAt: number;
}

export interface ClanChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}