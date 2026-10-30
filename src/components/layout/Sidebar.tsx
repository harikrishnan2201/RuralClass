import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  School,
  TrendingDown,
  GitMerge,
  CalendarDays,
  Sparkles,
  FolderArchive,
  Settings,
  X,
  BookOpen,
  Users,
  Bot
} from 'lucide-react';
import { Storage } from '../../lib/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const classroom = Storage.getClassroom();
  const settings = Storage.getSettings();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/students', label: 'Student Records', icon: Users, badge: 'Marks' },
    { to: '/ai-assistant', label: 'AI Planning Coach', icon: Bot, badge: 'AI' },
    { to: '/classroom-setup', label: 'Classroom Setup', icon: School },
    { to: '/learning-gaps', label: 'Learning Gaps', icon: TrendingDown },
    { to: '/concept-bridge-map', label: 'Concept Bridge Map', icon: GitMerge, badge: 'Key' },
    { to: '/weekly-planner', label: 'Weekly Planner', icon: CalendarDays },
    { to: '/activities', label: 'Activities & Resources', icon: Sparkles },
    { to: '/saved-plans', label: 'Saved Plans', icon: FolderArchive },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-[#E1E7E0] transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E1E7E0]">
          <div className="flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5 text-[#245B4A]">
              <div className="w-9 h-9 rounded-lg bg-[#245B4A] text-white flex items-center justify-center shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-[#202923] tracking-tight block leading-tight">
                  RuralClass
                </span>
                <span className="text-[11px] text-[#68746B] font-medium block leading-tight">
                  Multi-Grade Planning
                </span>
              </div>
            </NavLink>

            <button
              onClick={onClose}
              className="p-1.5 text-[#68746B] hover:text-[#202923] rounded-md md:hidden"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-2.5 text-[11px] text-[#68746B] leading-relaxed italic border-t border-[#F0F4F1] pt-2">
            "Teach together. Help everyone learn."
          </p>
        </div>

        {/* Classroom Context Indicator */}
        <div className="px-4 py-3 bg-[#F7F9F7] border-b border-[#E1E7E0] text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[#68746B] font-semibold">Active Classroom</div>
          <div className="font-semibold text-[#202923] truncate mt-0.5">{classroom?.name || 'Rural Learning Centre'}</div>
          <div className="text-[11px] text-[#245B4A] mt-0.5 font-medium">
            {(classroom?.grades || ['Class 3', 'Class 4', 'Class 5']).join(', ')} · {classroom?.hoursPerDay || 3}h/day
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#245B4A] text-white shadow-xs'
                      : 'text-[#4A554E] hover:bg-[#F2F6F3] hover:text-[#202923]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#68746B]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E6EFE8] text-[#245B4A]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Teacher Profile Footer */}
        <div className="p-4 border-t border-[#E1E7E0] bg-[#FAFBF9]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E6EFE8] text-[#245B4A] flex items-center justify-center font-bold text-xs border border-[#C6DDD0]">
              {settings.teacherName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#202923] truncate">
                {settings.teacherName}
              </p>
              <p className="text-[11px] text-[#68746B] truncate">
                Rural Teacher Mentor
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
