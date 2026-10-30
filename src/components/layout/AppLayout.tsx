import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DemoBanner } from '../common/DemoBanner';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/students': 'Student Records & Progress Tracker',
  '/ai-assistant': 'RuralClass AI Planning Assistant',
  '/classroom-setup': 'Classroom Setup',
  '/learning-gaps': 'Learning Gap Analysis',
  '/concept-bridge-map': 'Concept Bridge Map',
  '/weekly-planner': 'Your Weekly Teaching Plan',
  '/activities': 'Low-Cost Activities & Resources',
  '/saved-plans': 'Saved Teaching Plans',
  '/settings': 'Settings & Preferences',
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'RuralClass';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F5] text-[#202923]">
      <DemoBanner />

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
              <strong>RuralClass</strong> — Multi-grade educational planning tool designed for rural schools in India.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Fictional Demonstration Data</span>
              <span>·</span>
              <span>100% Teacher-Governed</span>
              <span>·</span>
              <span>Low-Resource Tested</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
