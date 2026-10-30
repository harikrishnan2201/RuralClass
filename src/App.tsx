import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ClassroomSetupPage } from './pages/ClassroomSetupPage';
import { LearningGapsPage } from './pages/LearningGapsPage';
import { ConceptBridgeMapPage } from './pages/ConceptBridgeMapPage';
import { WeeklyPlannerPage } from './pages/WeeklyPlannerPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { SavedPlansPage } from './pages/SavedPlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { StudentRecordsPage } from './pages/StudentRecordsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentRecordsPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="classroom-setup" element={<ClassroomSetupPage />} />
          <Route path="learning-gaps" element={<LearningGapsPage />} />
          <Route path="concept-bridge-map" element={<ConceptBridgeMapPage />} />
          <Route path="weekly-planner" element={<WeeklyPlannerPage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="saved-plans" element={<SavedPlansPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
