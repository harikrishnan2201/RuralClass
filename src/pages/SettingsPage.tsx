import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  CheckCircle2,
  Globe,
  Clock,
  School,
  User,
  Bell
} from 'lucide-react';
import { Storage } from '../lib/storage';
import { UserSettings } from '../types';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSaveSettings = () => {
    Storage.saveSettings(settings);
    setSuccessToast('Settings saved successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleConfirmReset = () => {
    Storage.resetToDefaults();
    setSettings(Storage.getSettings());
    setIsResetModalOpen(false);
    setSuccessToast('All application data and settings reset to initial demo state.');
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
          <span className="text-xs uppercase tracking-wider text-[#68746B] font-semibold">Teacher Preferences</span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#202923] tracking-tight mt-1">
            Settings
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Configure teacher profile, classroom defaults, and demonstration preferences.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C65C48] bg-white border border-[#F5C9C0] hover:bg-[#FDF2F0] rounded-lg transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-xl border border-[#E1E7E0] p-6 space-y-6 shadow-2xs">
        {/* Profile Section */}
        <div>
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-[#245B4A]" />
            <span>Teacher Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">Teacher Display Name</label>
              <input
                type="text"
                value={settings.teacherName}
                onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg"
              />
              <span className="text-[11px] text-[#68746B] mt-0.5 block">Generic fictional demo name</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">Classroom / Learning Centre Name</label>
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
            <span>Language & Localization</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">Preferred Language</label>
              <select
                value={settings.preferredLanguage}
                onChange={(e) => setSettings({ ...settings, preferredLanguage: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg bg-white"
              >
                <option value="English">English (Default)</option>
                <option value="Hindi">Hindi (Demonstration label)</option>
                <option value="Tamil">Tamil (Demonstration label)</option>
                <option value="Bengali">Bengali (Demonstration label)</option>
              </select>
              <span className="text-[11px] text-[#68746B] mt-1 block">
                Note: Core UI operates in English for evaluation; vernacular terminology tags are supported in topic notes.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202923] mb-1">Time Format</label>
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
            <span>Teaching Hours Default</span>
          </h3>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-[#202923] mb-1">
              Standard Teaching Hours Per Day: {settings.defaultHoursPerDay} hrs
            </label>
            <input
              type="number"
              min={1}
              max={8}
              value={settings.defaultHoursPerDay}
              onChange={(e) => setSettings({ ...settings, defaultHoursPerDay: parseInt(e.target.value) || 3 })}
              className="w-full text-xs p-2.5 border border-[#E1E7E0] rounded-lg font-mono"
            />
            <span className="text-[11px] text-[#68746B] mt-1 block">
              Used when creating fresh weekly plans.
            </span>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="pt-4 border-t border-[#E1E7E0]">
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-[#245B4A]" />
            <span>Demonstration Helper Tips</span>
          </h3>

          <label className="flex items-center gap-2.5 text-xs text-[#202923] cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableTips}
              onChange={(e) => setSettings({ ...settings, enableTips: e.target.checked })}
              className="w-4 h-4 accent-[#245B4A]"
            />
            <span>Show helpful pedagogical tips and multi-grade recommendations</span>
          </label>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-[#E1E7E0] flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset All Demo Data"
        description="This will restore all topics, sample understanding levels, classroom inventory, and approved plans back to the default demo state. Any custom topics or edits will be reset."
        confirmLabel="Reset Everything"
        isDestructive
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
