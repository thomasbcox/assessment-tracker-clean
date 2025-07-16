'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionManager } from '@/lib/session';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      setUser(user);
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    sessionManager.clearSession();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue mx-auto mb-4"></div>
          <p className="text-brand-dark-blue font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Authentication Required</h2>
          <p className="text-brand-dark-blue/70 mb-4">Please log in to access the dashboard.</p>
          <button 
            onClick={() => router.push('/')}
            className="btn-modern gradient-primary text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#DDE5CC]">
      {/* Header with inline navigation */}
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Left side: Logo and title */}
            <div className="flex items-center space-x-6">
              {/* Logo - 50% larger */}
              <img 
                src="/TransformativeLeadershipLab-PrimaryLogo-LightBackgrounds.png" 
                alt="TRANSFORMATIVE Leadership Lab" 
                className="h-16 w-auto"
              />
              <h1 className="text-2xl font-bold text-brand-dark-blue">
                Assessment Tracker
              </h1>
            </div>

            {/* Center: Navigation */}
            <div className="flex space-x-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="nav-item text-brand-dark-blue/80 hover:text-brand-dark-blue hover:border-brand-dark-blue/50 transition-all duration-200"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/dashboard/assessments')}
                className="nav-item text-brand-dark-blue/80 hover:text-brand-dark-blue hover:border-brand-dark-blue/50 transition-all duration-200"
              >
                Assessments
              </button>
              {user.role === 'admin' || user.role === 'super-admin' ? (
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className="nav-item text-brand-dark-blue/80 hover:text-brand-dark-blue hover:border-brand-dark-blue/50 transition-all duration-200"
                >
                  Admin
                </button>
              ) : null}
              {user.role === 'super-admin' ? (
                <button
                  onClick={() => router.push('/builder')}
                  className="nav-item text-brand-dark-blue/80 hover:text-brand-dark-blue hover:border-brand-dark-blue/50 transition-all duration-200"
                >
                  Builder
                </button>
              ) : null}
            </div>

            {/* Right side: User info and logout */}
            <div className="flex items-center space-x-6">
              <div className="text-brand-dark-blue/90">
                Welcome, <span className="font-semibold">{user.firstName || user.email}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-modern bg-brand-dark-blue bg-opacity-10 text-brand-dark-blue hover:bg-brand-dark-blue hover:bg-opacity-20 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-fade-in-up">
          {children}
        </div>
      </main>
    </div>
  );
} 