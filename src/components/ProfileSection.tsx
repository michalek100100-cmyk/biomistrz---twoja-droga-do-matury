import React, { useState, useRef } from 'react';
// 1. Dodałem ikony Volume2 i VolumeX
import { Camera, Save, User as UserIcon, AlignLeft, Info, RefreshCw, Trash2, LogOut, Shield, Award, Lock } from 'lucide-react';
import { UserStats } from '../types';
import { getAuth, deleteUser, signOut } from 'firebase/auth';
import { useLanguage } from '../contexts/LanguageContext';

const POLICY_URL = "https://docs.google.com/document/d/e/2PACX-1vRlTtVsfqBj7YFibRZXc4QYcZyNu8G1N2Y0GARW2S1fbHXFQaavHqQHQl45NoW7OEahqiJb-0S_S5Eq/pub";

interface ProfileSectionProps {
  stats: UserStats;
  onUpdate: (updates: Partial<UserStats>) => void;
  onResetAll: () => void;
  onLogout: () => void;
  // 2. Nowe propsy do obsługi dźwięku
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  stats,
  onUpdate,
  onResetAll,
  onLogout
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(stats.name);
  const [bio, setBio] = useState(stats.bio);
  const [avatar, setAvatar] = useState(stats.avatar);
  const [activeTitle, setActiveTitle] = useState(stats.activeTitle || '');
  const [showAchievements, setShowAchievements] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unlockedTitles = stats.achievements
    ? Object.values(stats.achievements).filter(a => a.unlocked).map(a => a.name)
    : [];

  const auth = getAuth();

  const handleSave = () => {
    onUpdate({ name, bio, avatar, activeTitle });
    alert(t.profile.actions.saveSuccess);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoutPress = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (error) {
      console.error("Błąd wylogowania:", error);
    }
  };

  const handleOpenPolicy = () => {
    window.open(POLICY_URL, '_blank');
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const confirm1 = window.confirm(t.profile.dangerZone.deleteConfirm1);
    if (!confirm1) return;
    const confirm2 = window.confirm(t.profile.dangerZone.deleteConfirm2);
    if (!confirm2) return;

    try {
      await deleteUser(user);
      alert(t.profile.dangerZone.deleteSuccess);
      onLogout();
    } catch (error: any) {
      console.error("Błąd usuwania konta:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert(t.profile.dangerZone.deleteErrorReauth);
        await signOut(auth);
        onLogout();
      } else {
        alert("Wystąpił błąd: " + error.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-32">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t.profile.title}</h2>
        <p className="text-gray-500 font-bold">{t.profile.subtitle}</p>
      </div>

      <div className="rounded-3xl border-2 p-8 shadow-sm space-y-8 bg-white border-gray-200">

        {/* --- NOWE: Gablota Osiągnięć --- */}
        <div className="pt-2 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-2xl">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">{t.profile.achievements.title}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.profile.achievements.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              {showAchievements ? t.profile.achievements.collapse : t.profile.achievements.expand}
            </button>
          </div>

          {showAchievements && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-300">
              {stats.achievements && Object.values(stats.achievements).map(ach => (
                <div
                  key={ach.id}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${ach.unlocked
                    ? 'bg-gradient-to-b from-yellow-50 to-amber-50 border-yellow-200 shadow-sm'
                    : 'bg-gray-50 border-gray-100 grayscale-[0.6] opacity-70'
                    }`}
                  title={`${t.achievements.items[ach.id]?.description || ach.description}\n${t.profile.achievements.reward.replace('$1', ach.reward.xp.toString()).replace('$2', ach.reward.gems.toString())}`}
                >
                  {!ach.unlocked && (
                    <div className="absolute top-2 right-2 bg-gray-200 p-1.5 rounded-full">
                      <Lock className="w-3 h-3 text-gray-500" />
                    </div>
                  )}

                  <div className="text-4xl mb-2 filter drop-shadow-sm group-hover:scale-110 transition-transform">{ach.icon}</div>
                  <h4 className={`text-[11px] font-black uppercase tracking-wide text-center leading-tight mb-2 ${ach.unlocked ? 'text-yellow-800' : 'text-gray-500'
                    }`}>
                    {t.achievements.items[ach.id]?.name || ach.name}
                  </h4>

                  {/* Pasek postępu dla zablokowanych */}
                  {!ach.unlocked && ach.target > 1 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (ach.progress / ach.target) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {(!stats.achievements || Object.keys(stats.achievements).length === 0) && (
                <div className="col-span-full py-8 text-center text-sm font-bold text-gray-400">
                  {t.profile.achievements.empty}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar Selection */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-100">
              <img
                src={avatar || `https://picsum.photos/seed/${stats.name}/128/128`}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-blue-500 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.profile.avatar.changeLabel}</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest ml-2">
              <UserIcon className="w-3 h-3" /> {t.profile.form.username}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.profile.form.usernamePlaceholder}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-blue-400 outline-none transition-colors font-bold text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest ml-2">
              <Award className="w-3 h-3" /> {t.profile.form.activeTitle}
            </label>
            <select
              value={activeTitle}
              onChange={(e) => setActiveTitle(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-blue-400 outline-none transition-colors font-bold text-gray-700 appearance-none"
            >
              <option value="">{t.profile.form.noTitle}</option>
              {unlockedTitles.map(title => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest ml-2">
              <AlignLeft className="w-3 h-3" /> {t.profile.form.bio}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.profile.form.bioPlaceholder}
              className="w-full min-h-[120px] bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-blue-400 outline-none transition-colors font-bold text-gray-700 resize-none"
            />
          </div>
        </div>



        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
            <span className="text-2xl font-black text-blue-600">{stats.xp}</span>
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">{t.profile.stats.totalXp}</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center">
            <span className="text-2xl font-black text-orange-600">{stats.streak}</span>
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-tighter">{t.profile.stats.streak}</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center">
            <span className="text-2xl font-black text-purple-600">{stats.totalQuestionsAnswered}</span>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-tighter">{t.profile.stats.questionsAnswered}</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all duo-button-shadow flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {t.profile.actions.saveChanges}
        </button>



        <button
          onClick={handleOpenPolicy}
          className="w-full py-4 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          {t.profile.actions.privacyPolicy}
        </button>

        <button
          onClick={handleLogoutPress}
          className="w-full py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t.profile.actions.logout}
        </button>

      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-white rounded-3xl border-2 border-red-100 p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2 mb-2">
            <Trash2 className="w-4 h-4" /> {t.profile.dangerZone.title}
          </h3>
          <p className="text-gray-500 text-sm font-bold">{t.profile.dangerZone.subtitle}</p>
        </div>

        <button
          onClick={() => {
            if (confirm(t.profile.dangerZone.resetConfirm1)) {
              onResetAll();
            }
          }}
          className="w-full py-4 border-2 border-red-200 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t.profile.dangerZone.resetProgress}
        </button>

        <div className="pt-4 border-t border-red-100">
          <p className="text-red-400 text-[10px] font-bold uppercase mb-3 text-center tracking-wide">
            {t.profile.dangerZone.deleteAccount}
          </p>
          <button
            onClick={handleDeleteAccount}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.profile.dangerZone.deleteAccount}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-gray-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-gray-200 rounded-lg">
          <Info className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-gray-700 text-sm">{t.profile.dataPrivacy.title}</p>
          <p className="text-gray-500 text-xs font-medium">
            {t.profile.dataPrivacy.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;