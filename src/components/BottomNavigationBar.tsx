import React from 'react';
import { Home, BookOpen, LayoutGrid, Store, FileText } from 'lucide-react';

export type BottomNavTabId = 'home' | 'my-course' | 'all-courses' | 'store' | 'tests';

interface BottomNavigationBarProps {
  activeTab: BottomNavTabId;
  onTabChange: (tab: BottomNavTabId) => void;
  myCourseCount?: number;
}

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabChange,
  myCourseCount = 0
}) => {
  const navItems = [
    {
      id: 'home' as BottomNavTabId,
      label: 'Home',
      icon: Home,
      badge: null
    },
    {
      id: 'my-course' as BottomNavTabId,
      label: 'My Course',
      icon: BookOpen,
      badge: myCourseCount > 0 ? (myCourseCount > 99 ? '99+' : `${myCourseCount}`) : null
    },
    {
      id: 'all-courses' as BottomNavTabId,
      label: 'All Courses',
      icon: LayoutGrid,
      badge: null
    },
    {
      id: 'store' as BottomNavTabId,
      label: 'Store',
      icon: Store,
      badge: 'Hot'
    },
    {
      id: 'tests' as BottomNavTabId,
      label: 'Tests',
      icon: FileText,
      badge: 'Live'
    }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0614]/95 backdrop-blur-2xl border-t border-pink-500/25 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] transition-all duration-200"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-center justify-items-center gap-1 sm:gap-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`group relative w-full flex flex-col items-center justify-center py-1 px-1 rounded-2xl min-h-[52px] transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-b from-pink-500/20 to-pink-500/5 text-pink-300 font-bold border border-pink-500/35 shadow-[0_0_15px_rgba(236,72,153,0.22)]'
                  : 'text-pink-200/55 hover:text-pink-100 hover:bg-pink-500/5'
              }`}
              aria-label={item.label}
            >
              {/* Active Top Accent Line */}
              {isActive && (
                <span className="absolute -top-[7px] w-8 sm:w-10 h-[3px] rounded-full bg-gradient-to-r from-pink-500 to-rose-400 shadow-[0_0_10px_#ec4899] animate-in fade-in zoom-in duration-200" />
              )}

              {/* Icon & Badge Container */}
              <div className="relative flex items-center justify-center">
                <IconComponent
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all duration-200 ${
                    isActive
                      ? 'scale-110 stroke-[2.4] text-pink-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.65)]'
                      : 'group-hover:scale-105'
                  }`}
                />

                {/* Badge if present */}
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3 px-1.5 min-w-[16px] h-3.5 flex items-center justify-center text-[8.5px] font-black uppercase tracking-wider rounded-full ring-1 ring-[#0e0614] shadow-sm ${
                      item.id === 'tests'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-emerald-500/40 animate-pulse'
                        : item.id === 'store'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-amber-500/40'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-600/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-1 transition-colors duration-200 truncate max-w-full ${
                  isActive
                    ? 'text-white font-extrabold'
                    : 'font-semibold text-pink-300/65 group-hover:text-pink-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
