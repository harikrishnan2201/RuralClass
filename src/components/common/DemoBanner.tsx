import React, { useState } from 'react';
import { Info, RotateCcw, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Storage } from '../../lib/storage';

export const DemoBanner: React.FC = () => {
  const { t } = useTranslation();
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    await Storage.resetToDefaults();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2500);
  };

  return (
    <div className="no-print bg-[#F2F7F4] border-b border-[#D8E6DC] px-4 py-2 text-xs text-[#2A4B3C] flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#245B4A] shrink-0" />
        <span>
          <strong className="font-semibold text-[#1A382C]">{t('common.appName')}:</strong> {t('common.motto')} · {t('common.teacherInControl')}
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
            <Check className="w-3.5 h-3.5" /> {t('settings.resetSuccess')}
          </span>
        ) : (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#245B4A] bg-white border border-[#C6DDD0] rounded hover:bg-[#E6EFE8] transition-colors cursor-pointer"
            title={t('settings.resetAll')}
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('settings.resetAll')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
