import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DemoBanner } from '../common/DemoBanner';
import { OfflineBanner } from '../common/OfflineBanner';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const getPageTitle = (path: string): string => {
    switch (path) {
      case '/': return t('dashboard.title');
      case '/students': return t('students.title');
      case '/ai-assistant': return t('ai.title');
      case '/classroom-setup': return t('nav.classroomSetup');
      case '/learning-gaps': return t('gaps.title');
      case '/concept-bridge-map': return t('bridge.title');
      case '/weekly-planner': return t('planner.title');
      case '/activities': return t('activities.title');
      case '/saved-plans': return t('nav.savedPlans');
      case '/settings': return t('settings.title');
      default: return t('common.appName');
    }
  };

  const title = getPageTitle(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#202923]">
      <DemoBanner />
      <OfflineBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} pageTitle={title} />

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="no-print mt-auto py-5 px-6 border-t border-[#E1E7E0] bg-white text-xs text-[#68746B] flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>{t('common.appName')}</strong> — {t('common.tagline')}
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>{t('common.motto')}</span>
              <span>·</span>
              <span>{t('common.teacherInControl')}</span>
              <span>·</span>
              <span>{t('common.deterministicEngine')}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
