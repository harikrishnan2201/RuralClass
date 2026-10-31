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
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleLanguageChange = (val: string) => {
    setSettings(prev => ({ ...prev, preferredLanguage: val }));
    if (val === 'Tamil' || val === 'ta') {
      setAppLanguage('ta');
    } else if (val === 'Hindi' || val === 'hi') {
      setAppLanguage('hi');
    } else {
      setAppLanguage('en');
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
              <span className="text-[11px] text-[#68746B] mt-0.5 block">Generic fictional demo name</span>
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

        {/* Localization & Display */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-[#245B4A]" />
            <span>{t('settings.language')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">{t('settings.language')}</label>
              <select
                value={settings.preferredLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg bg-white"
              >
                <option value="English">English (English)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
              </select>
            </div>

            <div>
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
        description="This will restore all topics, sample understanding levels, classroom inventory, and approved plans back to the default demo state. Any custom topics or edits will be reset."
        confirmLabel={t('settings.resetAll')}
        isDestructive
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
