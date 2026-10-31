import React, { useState } from 'react';
import { Menu, Calendar, Printer, Share2, Check, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n/config';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleLanguageChange = (lang: 'en' | 'ta' | 'hi') => {
    setAppLanguage(lang);
  };

  const currentLang = (i18n.language?.startsWith('ta') ? 'ta' : i18n.language?.startsWith('hi') ? 'hi' : 'en') as 'en' | 'ta' | 'hi';

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-8 py-3.5 bg-white border-b border-[#E1E7E0] shadow-2xs">
      {/* Zone 1: Mobile menu toggle + Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 -ml-1 text-[#4A554E] hover:text-[#202923] hover:bg-[#F2F6F3] rounded-lg md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base md:text-lg font-bold text-[#202923] tracking-tight whitespace-nowrap">
          {pageTitle}
        </h1>
      </div>

      {/* Zone 2: Contextual shortcuts (Desktop) */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-[#68746B] font-medium">
        <span>{t('common.appName')}</span>
        <span aria-hidden="true">·</span>
        <span>{t('common.deterministicEngine')}</span>
        <span aria-hidden="true">·</span>
        <span className="text-[#245B4A]">{t('common.teacherInControl')}</span>
      </div>

      {/* Zone 3: Language Switcher + Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative inline-flex items-center rounded-lg border border-[#E1E7E0] bg-[#FAFBF9] p-0.5 text-xs font-medium text-[#4A554E]">
          <Globe className="w-3.5 h-3.5 ml-1.5 text-[#245B4A] shrink-0" />
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentLang === 'en'
                ? 'bg-white text-[#245B4A] font-bold shadow-2xs'
                : 'hover:text-[#202923]'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('ta')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentLang === 'ta'
                ? 'bg-white text-[#245B4A] font-bold shadow-2xs'
                : 'hover:text-[#202923]'
            }`}
          >
            தமிழ்
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('hi')}
            className={`px-2 py-1 rounded-md transition-all ${
              currentLang === 'hi'
                ? 'bg-white text-[#245B4A] font-bold shadow-2xs'
                : 'hover:text-[#202923]'
            }`}
          >
            हिन्दी
          </button>
        </div>

        <button
          onClick={() => {
            const shareUrl = window.location.origin;
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#245B4A] bg-[#E6EFE8] hover:bg-[#D5E5D8] rounded-lg border border-[#C6DDD0] transition-colors whitespace-nowrap shadow-2xs"
          title={t('nav.sharePrototype')}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#245B4A]" />
              <span>{t('nav.linkCopied')}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('nav.sharePrototype')}</span>
            </>
          )}
        </button>

        {location.pathname === '/weekly-planner' ? (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#245B4A] bg-[#E6EFE8] hover:bg-[#D5E5D8] rounded-lg border border-[#C6DDD0] transition-colors whitespace-nowrap shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('nav.printWeeklyPlan')}</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/weekly-planner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('nav.weeklyPlanner')}</span>
          </button>
        )}
      </div>
    </header>
  );
};
