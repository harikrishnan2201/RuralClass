import React, { useState } from 'react';
import { Info, RotateCcw, Check } from 'lucide-react';
import { Storage } from '../../lib/storage';

export const DemoBanner: React.FC = () => {
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = () => {
    Storage.resetToDefaults();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="no-print bg-[#F2F7F4] border-b border-[#D8E6DC] px-4 py-2 text-xs text-[#2A4B3C] flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#245B4A] shrink-0" />
        <span>
          <strong className="font-semibold text-[#1A382C]">Demonstration Dataset:</strong> Multi-grade rural classroom (Classes 3, 4, 5). Fictional student understanding values used for local planning simulation.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#245B4A] bg-[#E6EFE8] border border-[#C6DDD0] rounded hover:bg-[#D5E5D8] transition-colors"
          title="Open Localhost Preview on port 3000"
        >
          <span>Local: http://localhost:3000</span>
        </a>

        {resetSuccess ? (
          <span className="inline-flex items-center gap-1 text-[#245B4A] font-medium">
            <Check className="w-3.5 h-3.5" /> Demo data restored
          </span>
        ) : (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#245B4A] bg-white border border-[#C6DDD0] rounded hover:bg-[#E6EFE8] transition-colors"
            title="Restore default sample topics, classroom setup, and weekly schedule"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>
    </div>
  );
};
