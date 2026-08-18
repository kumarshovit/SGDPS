import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppSelector';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { clsx } from 'clsx';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const storedToken = localStorage.getItem('sgdps_token');
  const storedUser = localStorage.getItem('sgdps_user');
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const hasAdminRole = user?.roles?.includes('Admin') || parsedUser?.roles?.includes('Admin');

  // Enforce authentication: Redirect to /login if not authenticated
  if (!isAuthenticated && !storedToken && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce role: Only Admins can view the Web Portal
  if ((user || parsedUser) && !hasAdminRole) {
    localStorage.removeItem('sgdps_token');
    localStorage.removeItem('sgdps_user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen w-full bg-[#FAF6EE] dark:bg-[#120B08] bg-mandala-pattern text-charcoal-900 dark:text-cream-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Layout Area */}
      <div
        className={clsx(
          'flex flex-col min-h-screen transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        )}
      >
        {/* Sticky Top Header */}
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
