import React, { useState } from 'react';
import { Menu, Calendar, Printer, PlusCircle, Share2, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, pageTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

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
        <span>Rural Classroom Assistant</span>
        <span aria-hidden="true">·</span>
        <span>Deterministic Rule Engine</span>
        <span aria-hidden="true">·</span>
        <span className="text-[#245B4A]">Teacher in Full Control</span>
      </div>

      {/* Zone 3: Primary Action based on context */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const shareUrl = window.location.origin;
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#245B4A] bg-[#E6EFE8] hover:bg-[#D5E5D8] rounded-lg border border-[#C6DDD0] transition-colors whitespace-nowrap shadow-2xs"
          title="Copy Live Prototype Link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#245B4A]" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Prototype</span>
            </>
          )}
        </button>

        {location.pathname === '/weekly-planner' ? (
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#245B4A] bg-[#E6EFE8] hover:bg-[#D5E5D8] rounded-lg border border-[#C6DDD0] transition-colors whitespace-nowrap shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Weekly Plan</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/weekly-planner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Weekly Planner</span>
          </button>
        )}
      </div>
    </header>
  );
};
