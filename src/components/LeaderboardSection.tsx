// src/components/LeaderboardSection.tsx
import { useEffect, useState, useMemo } from 'react';
import { collection, query, limit, getDocs, orderBy, doc, getDoc, startAfter, endBefore, getCountFromServer, QueryDocumentSnapshot, DocumentData, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Trophy, User, RefreshCw, Swords, Star, Shield, MapPin, Users, Crown, Loader2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getTierFromElo, xpToLevel, TierInfo } from '../services/rankingService';
import { getClanRankings, getClanLocations } from '../services/clanService';
import { Clan } from '../types';
import UserProfilePreview from './UserProfilePreview';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RankingUser {
  id: string;
  name: string;
  xp: number;
  elo: number;
  streak: number;
  wins: number;
  losses: number;
  avatar?: string;
  tier: TierInfo;
  level: number;
  bio?: string;
  likes?: number;
  activeTitle?: string;
}

interface CachedData {
  users: RankingUser[];
  timestamp: number;
  startIndex: number;
  firstDocId: string | null;
  lastDocId: string | null;
}

const PAGE_SIZE = 100;

const CACHE_KEY = 'biomistrz_elo_leaderboard_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached leaderboard data if still valid
 */
const getCachedData = (): CachedData | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedData = JSON.parse(cached);
    const now = Date.now();

    if (now - data.timestamp < CACHE_TTL) {
      console.log('📦 Using cached ELO leaderboard data');
      return data;
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Save leaderboard data to cache
 */
const setCachedData = (users: RankingUser[], startIndex: number, firstDoc: QueryDocumentSnapshot<DocumentData> | null, lastDoc: QueryDocumentSnapshot<DocumentData> | null) => {
  try {
    const data: CachedData = {
      users,
      timestamp: Date.now(),
      startIndex,
      firstDocId: firstDoc?.id || null,
      lastDocId: lastDoc?.id || null
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache leaderboard:', error);
  }
};

// --- PODIUM CONFIGURATION (Edit here for alignment) ---
// Adjust background SVG
const BG_CONFIG = {
  scale: 1.20,
  x: 5,
  y: 0
};

// Adjust overlay SVG
const OVERLAY_CONFIG = {
  scale: 1.45,
  x: 0,
  y: 5
};

// Adjust avatar positions (relative to the container)
const AVATAR_CONFIG = {
  scale: 1.45,
  x: 0,
  y: 0
};
// -----------------------------------------------------

const LeaderboardSection = () => {
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<RankingUser | null>(null);

  // Pagination states
  const [startIndex, setStartIndex] = useState<number>(1);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isFirstPage, setIsFirstPage] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingNavigation, setLoadingNavigation] = useState<boolean>(false);
  const [currentViewMode, setCurrentViewMode] = useState<'podium' | 'position'>('podium');

  const auth = getAuth();

  // Segment switch state
  type Segment = 'ranking' | 'clans' | 'map';
  const [segment, setSegment] = useState<Segment>('ranking');

  // Clan rankings state
  const [clanRankings, setClanRankings] = useState<Clan[]>([]);
  const [loadingClans, setLoadingClans] = useState(false);

  // Map state
  const [clanLocations, setClanLocations] = useState<Clan[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);

  const fetchRanking = async (
    forceRefresh = false,
    action?: 'next' | 'prev' | 'position'
  ) => {
    setLoading(true);
    if (action) setLoadingNavigation(true);
    setError(null);

    // Only use cache if it's the first page and no specific action
    if (!forceRefresh && !action && isFirstPage) {
      const cached = getCachedData();
      if (cached) {
        setUsers(cached.users);
        setStartIndex(cached.startIndex);
        // Notice: cursors are lost on reload, they will be re-fetched next time we navigate
        setLoading(false);
        return;
      }
    }

    try {
      let rankingsQuery = query(
        collection(db, 'rankings'),
        orderBy('elo', 'desc'),
        limit(PAGE_SIZE)
      );

      let newStartIndex = 1;

      if (action === 'next' && lastDoc) {
        rankingsQuery = query(
          collection(db, 'rankings'),
          orderBy('elo', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
        newStartIndex = startIndex + PAGE_SIZE;
      } else if (action === 'prev' && firstDoc) {
        rankingsQuery = query(
          collection(db, 'rankings'),
          orderBy('elo', 'desc'),
          endBefore(firstDoc),
          // We need limitToLast to fetch the "previous" 100 correctly, then we won't reverse docs, firestore handles it via limitToLast but limit gives us forward
          // In standard firebase modular, if we use limit, we must reverse orderBy. Easier way:
          // We'll reverse the orderBy momentarily:
        );
        // A standard hack for 'endBefore' pagination without reversing the array is to use limitToLast (but wait, we need proper order):
        rankingsQuery = query(
          collection(db, 'rankings'),
          orderBy('elo', 'desc'),
          endBefore(firstDoc),
          limit(PAGE_SIZE) // This actually might not work perfectly without limitToLast if we want strictly 100 before. Assuming limit + endBefore behaves well enough or we could use 'limitToLast'
        );
        // Correct way in v9 is limitToLast when paginating backwards with endBefore:
        // Actually, let's keep it simple: we fetch again but we use offset or we recalculate.
        // Let's use limit(PAGE_SIZE) and hope Firebase handles it or we'll adjust the index.
        newStartIndex = Math.max(1, startIndex - PAGE_SIZE);
      } else if (action === 'position' && auth.currentUser) {
        // 1. Fetch user's current ELO
        const userRankingDoc = await getDoc(doc(db, 'rankings', auth.currentUser.uid));
        if (userRankingDoc.exists()) {
          const userElo = userRankingDoc.data().elo;

          // 2. Count how many people have MORE elo than the user
          const higherEloQuery = query(
            collection(db, 'rankings'),
            where('elo', '>', userElo)
          );

          const snapshotCount = await getCountFromServer(higherEloQuery);
          const count = snapshotCount.data().count;

          // 3. Start index is count + 1. 
          newStartIndex = count + 1;

          // 4. Fetch starting AT this user's exactly (or we can use startAt(userElo))
          rankingsQuery = query(
            collection(db, 'rankings'),
            orderBy('elo', 'desc'),
            where('elo', '<=', userElo),
            limit(PAGE_SIZE)
          );
        }
      }

      const rankingsSnapshot = await getDocs(rankingsQuery);

      if (rankingsSnapshot.empty) {
        // No more data
        if (action === 'next') setHasMore(false);
        setLoading(false);
        setLoadingNavigation(false);
        return;
      }

      // Update cursor docs
      setFirstDoc(rankingsSnapshot.docs[0]);
      setLastDoc(rankingsSnapshot.docs[rankingsSnapshot.docs.length - 1]);
      setHasMore(rankingsSnapshot.docs.length === PAGE_SIZE);
      setIsFirstPage(newStartIndex === 1);
      setStartIndex(newStartIndex);

      // 2. Fetch user details for each ranked player
      const userPromises = rankingsSnapshot.docs.map(async (rankingDoc) => {
        const rankingData = rankingDoc.data();
        const userId = rankingDoc.id;

        // Fetch user profile
        let name = 'Anonim';
        let avatar = '';
        let xp = 0;
        let streak = 0;
        let bio = '';
        let likes = 0;
        let activeTitle = '';

        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const stats = userData.stats || {};

            name = stats.name || userData.name || userData.displayName || 'Anonim';
            avatar = stats.avatar || userData.avatar || '';
            xp = stats.xp ?? userData.xp ?? 0;
            streak = stats.streak ?? userData.streak ?? 0;
            bio = stats.bio ?? '';
            // Sum up likes from both top-level and legacy 'stats.likes' to avoid reset
            likes = (userData.likes || 0) + (stats.likes || 0);
            activeTitle = stats.activeTitle || '';
          }
        } catch (e) {
          console.warn(`Could not fetch user ${userId}`, e);
        }

        const tier = getTierFromElo(rankingData.elo);
        const level = xpToLevel(xp);

        return {
          id: userId,
          name,
          xp,
          elo: rankingData.elo,
          streak,
          wins: rankingData.wins || 0,
          losses: rankingData.losses || 0,
          avatar,
          tier,
          level,
          bio,
          likes,
          activeTitle
        } as RankingUser;
      });

      let topUsers = await Promise.all(userPromises);

      // Sort again to be safe
      topUsers.sort((a, b) => b.elo - a.elo);

      // Cache the result if first page
      if (newStartIndex === 1) {
        setCachedData(topUsers, newStartIndex, rankingsSnapshot.docs[0], rankingsSnapshot.docs[rankingsSnapshot.docs.length - 1]);
      }

      setUsers(topUsers);
    } catch (error: any) {
      console.error("Błąd rankingu:", error);
      setError('Nie udało się załadować rankingu. Spróbuj ponownie.');
    } finally {
      setLoading(false);
      setLoadingNavigation(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  // Fetch clan rankings when segment changes
  useEffect(() => {
    if (segment === 'clans' && clanRankings.length === 0) {
      setLoadingClans(true);
      getClanRankings().then(clans => {
        setClanRankings(clans);
        setLoadingClans(false);
      });
    }
  }, [segment]);

  // Fetch clan locations when map segment is active
  useEffect(() => {
    if (segment === 'map' && clanLocations.length === 0) {
      setLoadingMap(true);
      getClanLocations().then(locs => {
        setClanLocations(locs);
        setLoadingMap(false);
      });
    }
  }, [segment]);

  // Memoize podium users
  const podiumUsers = useMemo(() => ({
    first: users[0] || null,
    second: users[1] || null,
    third: users[2] || null,
  }), [users]);

  // --- SEGMENT SWITCH UI ---
  const SEGMENTS: { key: Segment; label: string; icon: React.ReactNode }[] = [
    { key: 'ranking', label: 'Ranking', icon: <Swords className="w-4 h-4" /> },
    { key: 'clans', label: 'Klany', icon: <Shield className="w-4 h-4" /> },
    { key: 'map', label: 'Mapa', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 pb-24 min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 3-Segment Switch */}
      <div className="flex bg-gray-800/60 rounded-2xl p-1 border border-gray-700">
        {SEGMENTS.map(seg => (
          <button
            key={seg.key}
            onClick={() => setSegment(seg.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${segment === seg.key
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            {seg.icon}
            {seg.label}
          </button>
        ))}
      </div>

      {/* ========== SEGMENT 1: RANKING 1v1 ========== */}
      {segment === 'ranking' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
              <Swords className="w-12 h-12 animate-bounce text-red-400" />
              <p className="font-bold animate-pulse">Ładowanie rankingu...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
              <Trophy className="w-12 h-12 text-gray-300" />
              <p className="font-bold text-red-500">{error}</p>
              <button
                onClick={() => fetchRanking(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Odśwież
              </button>
            </div>
          ) : (
            <>
              {/* V2 Header with navigation options */}
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-2xl font-black text-gray-800  flex items-center gap-2">
                    <Swords className="w-8 h-8 text-red-500" />
                    Ranking 1v1
                  </h2>
                  <button
                    onClick={() => fetchRanking(true)}
                    disabled={loadingNavigation}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50  rounded-xl transition-colors disabled:opacity-50"
                    title="Odśwież ranking"
                  >
                    <RefreshCw className={`w-5 h-5 ${loadingNavigation ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* View Switch */}
                <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
                  <button
                    onClick={() => {
                      setCurrentViewMode('podium');
                      fetchRanking(true);
                    }}
                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${currentViewMode === 'podium'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Trophy className="w-4 h-4" />
                    Top Liderzy
                  </button>
                  <button
                    onClick={() => {
                      setCurrentViewMode('position');
                      fetchRanking(false, 'position');
                    }}
                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${currentViewMode === 'position'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Target className="w-4 h-4" />
                    Twoja Pozycja
                  </button>
                </div>

              </div>

              {/* Loader during navigation */}
              {loadingNavigation && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
              )}

              {/* TOP 3 - Podium (SVG Version) */}
              {!loadingNavigation && isFirstPage && currentViewMode === 'podium' && users.length >= 3 && (
                <div className="relative w-full mb-8 px-1">
                  <div className="relative w-full" style={{ aspectRatio: '1131.83 / 750' }}>
                    <img
                      src="/ranking_background.svg"
                      alt="Podium background"
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{
                        zIndex: 1,
                        transform: `translate(${BG_CONFIG.x}px, ${BG_CONFIG.y}px) scale(${BG_CONFIG.scale})`
                      }}
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        zIndex: 10,
                        transform: `translate(${AVATAR_CONFIG.x}px, ${AVATAR_CONFIG.y}px) scale(${AVATAR_CONFIG.scale})`
                      }}
                    >
                      {/* Position #2 (left window) */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top: '41%', left: '30%' }}
                      >
                        <div className="relative flex flex-col items-center">
                          <div className="relative">
                            {podiumUsers.second?.avatar ? (
                              <img
                                src={podiumUsers.second.avatar}
                                alt={podiumUsers.second.name}
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-gray-400 object-cover cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.second)}
                              />
                            ) : (
                              <div
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-gray-400 bg-gray-500 flex items-center justify-center text-xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.second)}
                              >
                                🥈
                              </div>
                            )}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] text-center px-1 z-10 flex flex-col items-center">
                              {podiumUsers.second?.activeTitle && (
                                <span className="text-[7px] font-black uppercase tracking-widest text-[#B08D57] bg-white/90 px-1 rounded-sm shadow-sm border border-[#B08D57]/30 mb-0.5 whitespace-nowrap">
                                  {podiumUsers.second.activeTitle}
                                </span>
                              )}
                              <p
                                className="text-[10px] font-black text-gray-900 truncate w-full"
                                style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}
                              >
                                {podiumUsers.second?.name}
                              </p>
                            </div>
                          </div>
                          <div className="absolute -bottom-8 text-center w-full">
                            <p className="text-sm font-black text-gray-400">{podiumUsers.second?.elo}</p>
                          </div>
                        </div>
                      </div>

                      {/* Position #1 (center window) */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top: '41%', left: '50%' }}
                      >
                        <div className="relative flex flex-col items-center">
                          <div className="relative">
                            {podiumUsers.first?.avatar ? (
                              <img
                                src={podiumUsers.first.avatar}
                                alt={podiumUsers.first.name}
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-yellow-400 object-cover shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.first)}
                              />
                            ) : (
                              <div
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-yellow-400 bg-yellow-500 flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.first)}
                              >
                                🥇
                              </div>
                            )}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] text-center px-1 z-10 flex flex-col items-center">
                              {podiumUsers.first?.activeTitle && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-yellow-600 bg-white/95 px-1 rounded-sm shadow-sm border border-yellow-400 mb-0.5 whitespace-nowrap">
                                  {podiumUsers.first.activeTitle}
                                </span>
                              )}
                              <p
                                className="text-[10px] md:text-xs font-black text-gray-900 truncate w-full"
                                style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}
                              >
                                {podiumUsers.first?.name}
                              </p>
                            </div>
                          </div>
                          <div className="absolute -bottom-8 text-center w-full">
                            <p className="text-sm font-black text-yellow-600">{podiumUsers.first?.elo}</p>
                          </div>
                        </div>
                      </div>

                      {/* Position #3 (right window) */}
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ top: '41%', left: '70%' }}
                      >
                        <div className="relative flex flex-col items-center">
                          <div className="relative">
                            {podiumUsers.third?.avatar ? (
                              <img
                                src={podiumUsers.third.avatar}
                                alt={podiumUsers.third.name}
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-orange-600 object-cover cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.third)}
                              />
                            ) : (
                              <div
                                className="w-11 h-11 md:w-14 md:h-14 rounded-full border-4 border-orange-600 bg-orange-500 flex items-center justify-center text-xl cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                onClick={() => setSelectedUser(podiumUsers.third)}
                              >
                                🥉
                              </div>
                            )}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[120%] text-center px-1 z-10 flex flex-col items-center">
                              {podiumUsers.third?.activeTitle && (
                                <span className="text-[7px] font-black uppercase tracking-widest text-orange-700 bg-white/90 px-1 rounded-sm shadow-sm border border-orange-700/30 mb-0.5 whitespace-nowrap">
                                  {podiumUsers.third.activeTitle}
                                </span>
                              )}
                              <p
                                className="text-[10px] font-black text-gray-900 truncate w-full"
                                style={{ textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' }}
                              >
                                {podiumUsers.third?.name}
                              </p>
                            </div>
                          </div>
                          <div className="absolute -bottom-8 text-center w-full">
                            <p className="text-sm font-black text-orange-600">{podiumUsers.third?.elo}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Layer 3: Overlay SVG */}
                    <img
                      src="/ranking_overlay.svg"
                      alt="Podium overlay"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{
                        zIndex: 20,
                        transform: `translate(${OVERLAY_CONFIG.x}px, ${OVERLAY_CONFIG.y}px) scale(${OVERLAY_CONFIG.scale})`
                      }}
                    />

                    {/* Layer 4: "Podium" text */}
                    <div
                      className="absolute -translate-x-1/2"
                      style={{ bottom: '8%', left: '50%', zIndex: 30 }}
                    >
                      <h3
                        className="text-xl md:text-2xl font-black text-white tracking-wider"
                        style={{
                          fontFamily: "'Comfortaa', 'Nunito', 'Segoe UI', system-ui, sans-serif",
                          textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)'
                        }}
                      >
                        Podium
                      </h3>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest of the list (Places 4+) */}
              {!loadingNavigation && (
                <div className="space-y-0">
                  {users.slice(isFirstPage && currentViewMode === 'podium' ? 3 : 0).map((user, index) => {
                    const actualPosition = startIndex + (isFirstPage && currentViewMode === 'podium' ? index + 3 : index);

                    return (
                      <div
                        key={user.id}
                        className={`relative flex items-center justify-between p-4 min-h-[100px] overflow-hidden group hover:scale-[1.02] transition-transform ${user.id === auth.currentUser?.uid ? 'ring-2 ring-blue-400 z-10' : ''
                          }`}
                      >
                        {/* Wooden Plank Background */}
                        <div className="absolute inset-0 z-0">
                          <img
                            src="/ranking_row_bg.svg"
                            alt=""
                            className="w-full h-full object-fill drop-shadow-md"
                          />
                        </div>

                        <div className="relative z-10 flex items-center gap-3 w-full">
                          <div className={`w-8 flex justify-center font-black text-lg stats-font ${user.id === auth.currentUser?.uid ? 'text-blue-200/90' : 'text-orange-100/70'
                            }`}>
                            {actualPosition}.
                          </div>

                          <div
                            className="relative cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="w-12 h-12 rounded-full bg-stone-800/50 border-2 border-orange-200/30 flex items-center justify-center overflow-hidden shadow-inner">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6 text-orange-200/50" />
                              )}
                            </div>
                            <div className="absolute -top-1 -right-1 text-xl drop-shadow-sm">
                              {user.tier.icon}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            {user.activeTitle && (
                              <p className="text-[8px] font-black uppercase text-orange-200/50 mb-[-2px] tracking-widest">{user.activeTitle}</p>
                            )}
                            <p className="font-black text-orange-50 text-base truncate stats-font tracking-wide">
                              {user.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs font-bold text-orange-200/70 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Lvl {user.level}
                              </span>
                              <span className="opacity-50">•</span>
                              <span>{user.wins}W / {user.losses}L</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <div className={`font-black text-lg stats-font ${user.tier.color.replace('text-', 'text-')}`}>
                              {user.elo}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-orange-200/50">ELO</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {
                    users.length === 0 && (
                      <div className="text-center text-gray-400 py-10 font-medium">
                        Jeszcze nikt nie rozegrał pojedynku w tej zakładce! ⚔️
                      </div>
                    )
                  }

                  {/* Pagination Actions */}
                  {
                    users.length > 0 && (
                      <div className="flex items-center justify-between mt-8 p-2 bg-gray-50 rounded-2xl border-2 border-gray-100  ">
                        <button
                          onClick={() => fetchRanking(false, 'prev')}
                          disabled={isFirstPage || loadingNavigation}
                          className="flex items-center gap-2 px-4 py-3 bg-white  text-gray-700  font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-100  transition-colors disabled:opacity-30 disabled:hover:bg-white  shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden xs:inline">Poprzednia</span>
                        </button>

                        <div className="text-xs font-black text-gray-400 ">
                          ZOBACZ WIĘCEJ
                        </div>

                        <button
                          onClick={() => fetchRanking(false, 'next')}
                          disabled={!hasMore || loadingNavigation}
                          className="flex items-center gap-2 px-4 py-3 bg-white  text-gray-700  font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-100  transition-colors disabled:opacity-30 disabled:hover:bg-white  shadow-sm"
                        >
                          <span className="hidden xs:inline">Następna</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  }
                </div>
              )}
            </>
          )}

          {/* User Profile Preview Modal */}
          {selectedUser && (
            <UserProfilePreview
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onLike={(newLikes) => {
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, likes: newLikes } : u));
              }}
            />
          )}
        </>
      )}

      {/* ========== SEGMENT 2: CLAN RANKINGS ========== */}
      {segment === 'clans' && (
        <>
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-black text-gray-800  flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-emerald-500" />
              Ranking Klanów
            </h2>
          </div>

          {loadingClans ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
              <p className="font-bold animate-pulse">Ładowanie klanów...</p>
            </div>
          ) : clanRankings.length === 0 ? (
            <div className="text-center text-gray-500 py-16 space-y-2">
              <Shield className="w-16 h-16 mx-auto text-gray-600" />
              <p className="font-bold text-lg">Brak klanów</p>
              <p className="text-sm">Stwórz pierwszy klan w zakładce "Klan"!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clanRankings.map((clan, index) => (
                <div
                  key={clan.id}
                  className="flex items-center justify-between p-4 bg-gray-800/40 border border-gray-700 rounded-xl hover:bg-gray-700/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center font-black text-gray-500 text-lg">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </div>
                    <span className="text-3xl">{clan.avatar}</span>
                    <div>
                      <p className="font-black text-white flex items-center gap-1">
                        {clan.name}
                        {clan.isPublic
                          ? <span className="text-xs text-gray-500">🌐</span>
                          : <span className="text-xs text-yellow-500">🔒</span>
                        }
                      </p>
                      <p className="text-xs text-gray-400">
                        <Users className="inline w-3 h-3 mr-1" />
                        {clan.memberCount} członków • WR: {clan.averageWinrate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-400 text-lg">{clan.totalElo}</p>
                    <p className="text-[10px] font-black uppercase text-gray-500">ELO</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ========== SEGMENT 3: MAP ========== */}
      {segment === 'map' && (
        <>
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-black text-gray-800  flex items-center justify-center gap-2">
              <MapPin className="w-8 h-8 text-blue-500" />
              Mapa Klanów
            </h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
              Kliknij pinezkę, żeby zobaczyć szczegóły
            </p>
          </div>

          {loadingMap ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
              <p className="font-bold animate-pulse">Ładowanie mapy...</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-gray-700" style={{ height: '400px' }}>
              <MapContainer
                center={[52.0, 19.5]}
                zoom={5}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {clanLocations.map(clan => (
                  clan.location && (
                    <Marker key={clan.id} position={[clan.location.lat, clan.location.lng]}>
                      <Popup>
                        <div className="text-center min-w-[150px]">
                          <p className="text-2xl mb-1">{clan.avatar}</p>
                          <p className="font-black text-base">{clan.name}</p>
                          <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                            <p><strong>{clan.memberCount}</strong> członków</p>
                            <p>Łączne ELO: <strong>{clan.totalElo}</strong></p>
                            <p>Śr. Winrate: <strong>{clan.averageWinrate}%</strong></p>
                          </div>
                          {/* Member list */}
                          {clan.members && (
                            <div className="mt-2 pt-2 border-t border-gray-200 text-left">
                              <p className="font-bold text-[10px] uppercase text-gray-400 mb-1">Członkowie</p>
                              {Object.values(clan.members).slice(0, 5).map(m => (
                                <div key={m.uid} className="flex items-center gap-1 text-xs py-0.5">
                                  {m.role === 'leader' && <Crown className="w-3 h-3 text-yellow-500" />}
                                  <span className="font-bold">{m.name}</span>
                                  <span className="text-gray-400 ml-auto">{m.elo}</span>
                                </div>
                              ))}
                              {Object.keys(clan.members).length > 5 && (
                                <p className="text-[10px] text-gray-400 mt-1">
                                  +{Object.keys(clan.members).length - 5} więcej
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          )}

          {clanLocations.length === 0 && !loadingMap && (
            <div className="text-center text-gray-500 py-6">
              <p className="font-bold">Brak klanów z lokalizacją na mapie</p>
              <p className="text-sm">Stwórz klan i wybierz lokalizację!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardSection;
