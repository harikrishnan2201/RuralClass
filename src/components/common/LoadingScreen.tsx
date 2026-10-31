import React from 'react';
import { BookOpen } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-[#245B4A] text-white flex items-center justify-center mx-auto shadow-md animate-pulse">
          <BookOpen className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#202923] tracking-tight">RuralClass</h2>
          <p className="text-xs text-[#68746B] mt-1">Synchronizing curriculum & classroom records...</p>
        </div>
        <div className="w-48 h-1.5 bg-[#E1E7E0] rounded-full mx-auto overflow-hidden">
          <div className="w-full h-full bg-[#245B4A] rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  );
};

