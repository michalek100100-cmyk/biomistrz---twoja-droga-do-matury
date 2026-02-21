// src/components/UserProfilePreview.tsx
import React, { useState } from 'react';
import { X, Heart, Swords, Zap, Flag } from 'lucide-react';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { xpToLevel } from '../services/rankingService';

interface UserProfilePreviewProps {
    user: {
        id: string;
        name: string;
        avatar?: string;
        xp: number;
        bio?: string;
        likes?: number;
        elo: number;
        wins: number;
        losses: number;
    };
    onLike?: (newLikes: number) => void;
    onClose: () => void;
}

const UserProfilePreview: React.FC<UserProfilePreviewProps> = ({ user, onClose, onLike }) => {
    const [likes, setLikes] = useState(user.likes || 0);
    const [isLiking, setIsLiking] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    const level = xpToLevel(user.xp);

    const handleLike = async () => {
        if (hasLiked || isLiking) return;

        setIsLiking(true);
        try {
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                'likes': increment(1)
            });
            const newLikes = (likes || 0) + 1;
            setLikes(newLikes);
            setHasLiked(true);
            if (onLike) onLike(newLikes);
        } catch (error) {
            console.error("Błąd polubienia:", error);
            alert("Wystąpił błąd podczas dodawania polubienia.");
        } finally {
            setIsLiking(false);
        }
    };
    const handleReport = async () => {
        if (!reportReason.trim() || isReporting) return;

        setIsReporting(true);
        try {
            const reportsRef = collection(db, 'reports');
            await addDoc(reportsRef, {
                reportedUserId: user.id,
                reportedUserName: user.name,
                reporterId: auth.currentUser?.uid || 'anonymous',
                reason: reportReason.trim(),
                timestamp: serverTimestamp()
            });
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason('');
            }, 3000);
        } catch (error) {
            console.error("Błąd wysyłania zgłoszenia:", error);
            alert("Wystąpił błąd podczas wysyłania zgłoszenia.");
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-sm bg-white  rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-orange-200/50 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header/Banner Colors */}
                <div className="h-24 bg-gradient-to-r from-orange-400 to-amber-500" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Profile Info Container */}
                <div className="relative px-6 pb-8 -mt-12 text-center">
                    {/* Avatar */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full border-4 border-white  overflow-hidden bg-stone-200 shadow-xl">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-500 text-white text-3xl">
                                    👤
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-stone-900 px-2 py-0.5 rounded-full text-xs font-black shadow-md border-2 border-white">
                            Lvl {level}
                        </div>
                    </div>

                    {/* Name & Bio */}
                    <div className="mt-4 space-y-2">
                        <h2 className="text-2xl font-black text-stone-800  tracking-tight">
                            {user.name}
                        </h2>
                        <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-stone-400">
                            <span className="flex items-center gap-1">
                                <Swords className="w-3 h-3 text-red-500" /> {user.elo} ELO
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" /> {user.xp} XP
                            </span>
                        </div>

                        <div className="bg-stone-50  rounded-2xl p-4 mt-4 text-stone-600  text-sm font-medium italic min-h-[60px] border border-stone-100 ">
                            {user.bio || "Ten użytkownik jeszcze nie dodał opisu... 🍃"}
                        </div>
                    </div>

                    {/* Grid Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-orange-50  p-3 rounded-2xl border border-orange-100 ">
                            <p className="text-[10px] font-black uppercase text-orange-400 tracking-tighter">Zwycięstwa</p>
                            <p className="text-xl font-black text-orange-600">{user.wins}</p>
                        </div>
                        <div className="bg-stone-50  p-3 rounded-2xl border border-stone-100 ">
                            <p className="text-[10px] font-black uppercase text-stone-400 tracking-tighter">Przegrane</p>
                            <p className="text-xl font-black text-stone-600">{user.losses}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={handleLike}
                            disabled={hasLiked || isLiking}
                            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${hasLiked
                                ? 'bg-red-500 text-white cursor-default'
                                : 'bg-white  border-2 border-red-500 text-red-500 hover:bg-red-50 '
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${hasLiked ? 'fill-white' : ''}`} />
                            {likes} {hasLiked ? 'Polubione!' : 'Lubię to!'}
                        </button>

                        <button
                            onClick={() => setShowReportModal(true)}
                            className="px-6 py-4 bg-stone-100  text-stone-400 hover:text-red-500 hover:bg-red-50  rounded-2xl transition-all active:scale-95"
                            title="Zgłoś użytkownika"
                        >
                            <Flag className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-xs bg-white  rounded-3xl p-6 shadow-2xl border-2 border-stone-100  animate-in zoom-in-95 duration-200">
                        {reportSuccess ? (
                            <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-green-100  rounded-full flex items-center justify-center mx-auto">
                                    <Zap className="w-8 h-8 text-green-500 fill-green-500" />
                                </div>
                                <h3 className="text-xl font-black text-stone-800 ">Wysłano!</h3>
                                <p className="text-sm font-bold text-stone-500">
                                    Dziękuje za dbanie o bezpieczeństwo naszej społeczności!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-red-500">
                                    <Flag className="w-5 h-5 fill-red-500" />
                                    <h3 className="font-black uppercase tracking-widest text-sm">Zgłoś użytkownika</h3>
                                </div>

                                <p className="text-xs font-bold text-stone-500 leading-relaxed">
                                    Podaj powód zgłoszenia (np. wulgarna nazwa, nieodpowiedni opis):
                                </p>

                                <textarea
                                    autoFocus
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Wpisz powód tutaj..."
                                    className="w-full h-24 bg-stone-50  border-2 border-stone-100  rounded-2xl p-4 text-sm font-bold text-stone-700  outline-none focus:border-red-400 transition-colors resize-none"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="flex-1 py-3 bg-stone-100  text-stone-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!reportReason.trim() || isReporting}
                                        className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-500 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                    >
                                        {isReporting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePreview;
