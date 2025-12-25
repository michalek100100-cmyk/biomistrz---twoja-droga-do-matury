
import React, { useState, useRef } from 'react';
import { Camera, Save, User as UserIcon, AlignLeft, Info, RefreshCw, Trash2 } from 'lucide-react';
import { UserStats } from '../types';

interface ProfileSectionProps {
  stats: UserStats;
  onUpdate: (updates: Partial<UserStats>) => void;
  onResetAll: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ stats, onUpdate, onResetAll }) => {
  const [name, setName] = useState(stats.name);
  const [bio, setBio] = useState(stats.bio);
  const [avatar, setAvatar] = useState(stats.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({ name, bio, avatar });
    alert("Profil zaktualizowany!");
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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-32">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Twój Profil</h2>
        <p className="text-gray-500 font-bold">Personalizacja Twojego konta BioHelp</p>
      </div>

      <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm space-y-8">
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
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Zmień zdjęcie profilowe</p>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest ml-2">
              <UserIcon className="w-3 h-3" /> Nazwa użytkownika
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Jak mamy Cię nazywać?"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-blue-400 outline-none transition-colors font-bold text-gray-700"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest ml-2">
              <AlignLeft className="w-3 h-3" /> O Tobie
            </label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Kilka słów o Twojej drodze do matury..."
              className="w-full min-h-[120px] bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 focus:border-blue-400 outline-none transition-colors font-bold text-gray-700 resize-none"
            />
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
            <span className="text-2xl font-black text-blue-600">{stats.xp}</span>
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-tighter">Suma XP</span>
          </div>
          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col items-center">
            <span className="text-2xl font-black text-orange-600">{stats.streak}</span>
            <span className="text-[10px] font-black uppercase text-orange-400 tracking-tighter">Dni z rzędu</span>
          </div>
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col items-center">
            <span className="text-2xl font-black text-purple-600">{stats.totalQuestionsAnswered}</span>
            <span className="text-[10px] font-black uppercase text-purple-400 tracking-tighter">Zrobione pytania</span>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all duo-button-shadow flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Zapisz zmiany
        </button>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-white rounded-3xl border-2 border-red-100 p-8 shadow-sm space-y-4">
        <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
           <Trash2 className="w-4 h-4" /> Strefa niebezpieczna
        </h3>
        <p className="text-gray-500 text-sm font-bold">Możesz wyzerować całą swoją historię nauki. Tej operacji nie da się cofnąć.</p>
        <button 
          onClick={() => {
            if(confirm("CZY NA PEWNO chcesz wyzerować całą swoją naukę? Stracisz XP, streak i postępy lekcji.")) {
              onResetAll();
            }
          }}
          className="w-full py-4 border-2 border-red-200 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Resetuj całą naukę
        </button>
      </div>

      <div className="mt-8 bg-gray-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-gray-200 rounded-lg">
          <Info className="w-5 h-5 text-gray-500" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-gray-700 text-sm">Prywatność danych</p>
          <p className="text-gray-500 text-xs font-medium">Twój profil jest zapisywany lokalnie w Twojej przeglądarce. Inni użytkownicy zobaczą Cię w Rankingu, jeśli Twoje XP znajdzie się w pierwszej piątce.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
