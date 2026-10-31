import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Bot,
  FileSpreadsheet
} from 'lucide-react';
import { Storage } from '../../lib/storage';
import { localizeGrade } from '../../shared/contentLocalization';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const classroom = Storage.getClassroom();

  const navItems = [
    { to: '/', label: t('nav.overview'), icon: LayoutDashboard },
    { to: '/students', label: t('nav.students'), icon: Users, badge: t('nav.marksBadge') },
    { to: '/import', label: t('nav.import'), icon: FileSpreadsheet },
    { to: '/ai-assistant', label: t('nav.aiAssistant'), icon: Bot, badge: t('nav.aiBadge') },
    { to: '/classroom-setup', label: t('nav.classroomSetup'), icon: School },
    { to: '/learning-gaps', label: t('nav.learningGaps'), icon: TrendingDown },
    { to: '/concept-bridge-map', label: t('nav.conceptBridgeMap'), icon: GitMerge, badge: t('nav.keyBadge') },
    { to: '/weekly-planner', label: t('nav.weeklyPlanner'), icon: CalendarDays },
    { to: '/activities', label: t('nav.activities'), icon: Sparkles },
    { to: '/saved-plans', label: t('nav.savedPlans'), icon: FolderArchive },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const localizedGrades = (classroom?.grades || ['Class 3', 'Class 4', 'Class 5'])
    .map(g => localizeGrade(g, i18n.language))
    .join(', ');

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
                  {t('common.appName')}
                </span>
                <span className="text-[11px] text-[#68746B] font-medium block leading-tight">
                  {t('common.tagline')}
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
            "{t('common.motto')}"
          </p>
        </div>

        {/* Classroom Context Indicator */}
        <div className="px-4 py-3 bg-[#F7F9F7] border-b border-[#E1E7E0] text-xs">
          <div className="text-[10px] uppercase tracking-wider text-[#68746B] font-semibold">{t('nav.activeClassroom')}</div>
          <div className="font-semibold text-[#202923] truncate mt-0.5">{classroom?.name || 'Rural Learning Centre'}</div>
          <div className="text-[11px] text-[#245B4A] mt-0.5 font-medium">
            {localizedGrades} · {classroom?.hoursPerDay || 3}h/day
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
                onClick={() => {
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EBF3ED] text-[#245B4A] font-semibold'
                      : 'text-[#4A554E] hover:bg-[#F2F6F3] hover:text-[#202923]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      item.badge === t('nav.aiBadge')
                        ? 'bg-[#EBF3ED] text-[#245B4A]'
                        : item.badge === t('nav.keyBadge')
                        ? 'bg-[#FAF3E0] text-[#9A6208]'
                        : 'bg-[#F0F4F1] text-[#4A554E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
