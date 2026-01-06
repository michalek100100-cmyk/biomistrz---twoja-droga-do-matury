import React from 'react';
import { 
  Home, 
  // BookOpen, // Usunięte stąd
  // Trophy,   // Usunięte stąd
  User, 
  FileText, 
  PenTool, 
  MessageSquare, 
  Coffee, 
  Settings 
} from 'lucide-react';

// --- KONFIGURACJA ---
const SHOW_CREATOR_SECTION = false; 

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // reviewCount nie jest tu już potrzebne do wyświetlania, ale zostawiam w propsach dla zgodności,
  // chyba że wyczyścisz to też w App.tsx. Tutaj po prostu nie używam.
  reviewCount: number; 
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  hidden?: boolean;
  action?: () => void;
  special?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {

  const handleBuyCoffee = () => {
    window.open('https://buycoffee.to/biomistrz', '_blank');
  };

  const allMenuItems: MenuItem[] = [
    { id: 'learn', label: 'Nauka', icon: Home },
    // { id: 'practice' ... } -> PRZENIESIONE DO TOPBAR
    { id: 'exams', label: 'Arkusze', icon: FileText },
    { id: 'creator', label: 'Kreator', icon: PenTool, hidden: !SHOW_CREATOR_SECTION },
    // { id: 'leaderboard' ... } -> PRZENIESIONE DO TOPBAR
    { id: 'survey', label: 'Ankieta', icon: MessageSquare },
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'settings', label: 'Ustawienia', icon: Settings },
    { id: 'coffee', label: 'Wesprzyj mnie', icon: Coffee, action: handleBuyCoffee, special: true } 
  ];

  const menuItems = allMenuItems.filter(item => !item.hidden);

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:relative md:w-64 md:h-screen md:border-t-0 md:border-r md:flex md:flex-col p-4 pb-8 md:pb-4 transition-colors duration-300">
      
      <div className="hidden md:block mb-8 px-4">
        <h1 className="text-3xl font-black text-blue-600 dark:text-blue-500 tracking-tighter">BioMistrz</h1>
        <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest mt-1">Edukacja 2025</p>
      </div>
      
      <nav className="flex justify-around md:flex-col md:gap-2 overflow-x-auto md:overflow-visible no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          const handleClick = () => {
            if (item.action) {
              item.action();
            } else {
              setActiveTab(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`relative flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group shrink-0 ${
                isActive 
                ? 'bg-blue-100 text-blue-600 border-2 border-blue-500 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500' 
                : 'hover:bg-gray-100 text-gray-500 border-2 border-transparent dark:hover:bg-gray-800 dark:text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-gray-700 dark:group-hover:text-gray-200'}`} />
              
              <span className="hidden md:inline font-black uppercase text-xs tracking-wider">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;