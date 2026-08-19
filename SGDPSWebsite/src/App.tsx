import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { AddEntryPage } from './features/collections/pages/AddEntryPage';
import { BlockGridPage } from './features/flats/pages/BlockGridPage';
import { FlatMasterPage } from './features/flats/pages/FlatMasterPage';
import { CollectionsPage } from './features/collections/pages/CollectionsPage';
import { ExpensesPage } from './features/expenses/pages/ExpensesPage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { UserManagementPage } from './features/users/pages/UserManagementPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/forgot-password" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected App Shell */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="add" element={<AddEntryPage />} />
          <Route path="grid" element={<BlockGridPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="flats" element={<Navigate to="/grid" replace />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
