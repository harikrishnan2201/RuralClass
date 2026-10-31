import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Globe,
  Clock,
  School,
  User,
  Bell,
  FileSpreadsheet
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { UserSettings } from '../types';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { setAppLanguage } from '../i18n/config';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentLang = (i18n.language?.startsWith('ta') ? 'ta' : i18n.language?.startsWith('hi') ? 'hi' : 'en') as 'en' | 'ta' | 'hi';

  const handleLanguageSelect = (lang: 'en' | 'ta' | 'hi') => {
    const langLabel = lang === 'ta' ? 'Tamil' : lang === 'hi' ? 'Hindi' : 'English';
    const updatedSettings = { ...settings, preferredLanguage: langLabel };
    setSettings(updatedSettings);
    setAppLanguage(lang);
    setSuccessToast(
      lang === 'ta'
        ? 'மொழி வெற்றிகரமாக மாற்றப்பட்டது (தமிழ்).'
        : lang === 'hi'
          ? 'भाषा सफलतापूर्वक बदल दी गई (हिन्दी)।'
          : 'Language changed successfully to English.'
    );
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleLanguageChange = (val: string) => {
    if (val === 'Tamil' || val === 'ta') {
      handleLanguageSelect('ta');
    } else if (val === 'Hindi' || val === 'hi') {
      handleLanguageSelect('hi');
    } else {
      handleLanguageSelect('en');
    }
  };

  const handleSaveSettings = () => {
    Storage.saveSettings(settings);
    setSuccessToast(t('settings.saveSuccess'));
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleConfirmReset = () => {
    Storage.resetToDefaults();
    setSettings(Storage.getSettings());
    setIsResetModalOpen(false);
    setSuccessToast(t('settings.resetSuccess'));
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast */}
      {successToast && (
        <div className="p-3.5 rounded-lg bg-[#F0F7F2] border border-[#C3DEC9] text-[#1E563E] text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#245B4A]" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="font-bold text-xs">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E1E7E0]">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">{t('nav.settings')}</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            {t('settings.title')}
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C65C48] bg-white border border-[#F5C9C0] hover:bg-[#FDF2F0] rounded-lg transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('settings.resetAll')}</span>
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
        {/* Profile Section */}
        <div>
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#245B4A]" />
            <span>{t('settings.profile')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">{t('settings.teacherName')}</label>
              <input
                type="text"
                value={settings.teacherName}
                onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg"
              />
              <span className="text-[11px] text-[#68746B] mt-0.5 block">{t('settings.demoNameHint', 'Generic fictional demo name')}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">{t('settings.schoolName')}</label>
              <input
                type="text"
                value={settings.classroomName}
                onChange={(e) => setSettings({ ...settings, classroomName: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Language Selection Section (Requirement 1 & 2) */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#245B4A]" />
              <span>{t('settings.languageSectionTitle', 'Language / மொழி / भाषा')}</span>
            </h3>
            <span className="text-[11px] font-semibold text-[#245B4A] bg-[#E6EFE8] px-2 py-0.5 rounded border border-[#C6DDD0]">
              {currentLang === 'ta' ? 'தமிழ்' : currentLang === 'hi' ? 'हिन्दी' : 'English'}
            </span>
          </div>
          <p className="text-xs text-[#4A554E] mb-3">
            {t('settings.languageSubtitle', 'Choose your primary classroom language. The entire interface, multi-grade curriculum, and diagnostic plans update instantly without reloading.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option 1: English */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('en')}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                currentLang === 'en'
                  ? 'border-[#245B4A] bg-[#F0F7F2] ring-2 ring-[#245B4A]/20 shadow-xs'
                  : 'border-[#E1E7E0] bg-white hover:border-[#C6DDD0] hover:bg-[#FAFBF9]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-[#202923]">English</div>
                  <div className="text-xs text-[#68746B]">English</div>
                </div>
                {currentLang === 'en' && (
                  <CheckCircle2 className="w-5 h-5 text-[#245B4A] shrink-0" />
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-[#E1E7E0]/60 flex items-center justify-between text-[11px]">
                <span className="text-[#68746B]">{t('settings.langEnglishTag', 'Standard English')}</span>
                <span className="font-mono text-[10px] text-[#245B4A] font-bold">EN</span>
              </div>
            </button>

            {/* Option 2: Tamil */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('ta')}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                currentLang === 'ta'
                  ? 'border-[#245B4A] bg-[#F0F7F2] ring-2 ring-[#245B4A]/20 shadow-xs'
                  : 'border-[#E1E7E0] bg-white hover:border-[#C6DDD0] hover:bg-[#FAFBF9]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-[#202923]">தமிழ்</div>
                  <div className="text-xs text-[#68746B]">Tamil</div>
                </div>
                {currentLang === 'ta' && (
                  <CheckCircle2 className="w-5 h-5 text-[#245B4A] shrink-0" />
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-[#E1E7E0]/60 flex items-center justify-between text-[11px]">
                <span className="text-[#68746B]">{t('settings.langTamilTag', 'தமிழ்நாடு பாடத்திட்டம்')}</span>
                <span className="font-mono text-[10px] text-[#245B4A] font-bold">TA</span>
              </div>
            </button>

            {/* Option 3: Hindi */}
            <button
              type="button"
              onClick={() => handleLanguageSelect('hi')}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                currentLang === 'hi'
                  ? 'border-[#245B4A] bg-[#F0F7F2] ring-2 ring-[#245B4A]/20 shadow-xs'
                  : 'border-[#E1E7E0] bg-white hover:border-[#C6DDD0] hover:bg-[#FAFBF9]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-bold text-[#202923]">हिन्दी</div>
                  <div className="text-xs text-[#68746B]">Hindi</div>
                </div>
                {currentLang === 'hi' && (
                  <CheckCircle2 className="w-5 h-5 text-[#245B4A] shrink-0" />
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-[#E1E7E0]/60 flex items-center justify-between text-[11px]">
                <span className="text-[#68746B]">{t('settings.langHindiTag', 'एनसीईआरटी पाठ्यक्रम')}</span>
                <span className="font-mono text-[10px] text-[#245B4A] font-bold">HI</span>
              </div>
            </button>
          </div>

          {/* Time Format */}
          <div className="mt-4 max-w-xs">
            <label className="block text-xs font-semibold text-[#202923] mb-1">{t('settings.timeFormat')}</label>
            <select
              value={settings.timeFormat}
              onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value as any })}
              className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg bg-white"
            >
              <option value="12-hour">12-Hour (e.g. 09:00 AM)</option>
              <option value="24-hour">24-Hour (e.g. 09:00)</option>
            </select>
          </div>
        </div>

        {/* Schedule Defaults */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#245B4A]" />
            <span>{t('settings.teachingHours')}</span>
          </h3>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-[#202923] mb-1">
              {t('settings.teachingHours')}: {settings.defaultHoursPerDay} hrs
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={settings.defaultHoursPerDay}
              onChange={(e) => setSettings({ ...settings, defaultHoursPerDay: parseInt(e.target.value) || 3 })}
              className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg font-mono"
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-[#245B4A]" />
            <span>{t('settings.tips')}</span>
          </h3>

          <label className="flex items-center gap-2.5 text-xs text-[#202923] cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableTips}
              onChange={(e) => setSettings({ ...settings, enableTips: e.target.checked })}
              className="w-4 h-4 accent-[#245B4A]"
            />
            <span>{t('settings.tips')}</span>
          </label>
        </div>

        {/* AI Privacy Settings (Hard Rule 4) */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#245B4A]" />
            <span>{t('settings.privacyTitle')}</span>
          </h3>

          <div className="p-3 bg-[#FAFBF9] rounded-lg border border-[#E1E7E0] flex items-start justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-[#202923] block">{t('settings.shareNames')}</label>
              <span className="text-[11px] text-[#68746B] leading-relaxed block mt-0.5">
                {t('settings.shareNamesDesc')}
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.shareStudentNamesWithAI || false}
              onChange={(e) => setSettings({ ...settings, shareStudentNamesWithAI: e.target.checked })}
              className="w-4 h-4 mt-0.5 accent-[#245B4A] cursor-pointer"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[#E1E7E0] flex items-center justify-between">
          <button
            onClick={() => navigate('/import')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A554E] bg-white border border-[#E1E7E0] hover:bg-[#FAFBF9] rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('import.importData')}</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{t('settings.savePreferences')}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title={t('settings.resetAll')}
        description={t('settings.resetModalDesc', 'This will restore all topics, sample understanding levels, classroom inventory, and approved plans back to the default demo state. Any custom topics or edits will be reset.')}
        confirmLabel={t('settings.resetAll')}
        isDestructive
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
