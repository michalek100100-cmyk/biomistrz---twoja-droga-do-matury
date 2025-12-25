
import React from 'react';
import { Home, BookOpen, Trophy, User, FileText, Settings, PenTool } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  reviewCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, reviewCount }) => {
  const menuItems = [
    { id: 'learn', label: 'Nauka', icon: Home },
    { id: 'practice', label: 'Trening', icon: BookOpen, badge: reviewCount },
    { id: 'exams', label: 'Arkusze', icon: FileText },
    { id: 'creator', label: 'Creator', icon: PenTool },
    { id: 'leaderboard', label: 'Ranking', icon: Trophy },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:relative md:w-64 md:h-screen md:border-t-0 md:border-r md:flex md:flex-col p-4">
      <div className="hidden md:block mb-8 px-4">
        <h1 className="text-3xl font-black text-blue-600 tracking-tighter">BioMistrz</h1>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Edukacja 2025</p>
      </div>
      
      <nav className="flex justify-around md:flex-col md:gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                isActive 
                ? 'bg-blue-100 text-blue-600 border-2 border-blue-500' 
                : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'group-hover:text-gray-700'}`} />
              <span className="hidden md:inline font-black uppercase text-xs tracking-wider">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute top-2 right-2 md:right-4 bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="hidden md:mt-auto md:block">
        <button className="flex items-center gap-4 px-4 py-3 w-full text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">
          <Settings className="w-6 h-6" />
          <span className="font-black uppercase text-xs tracking-wider">Ustawienia</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
