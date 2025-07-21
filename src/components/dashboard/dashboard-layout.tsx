'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { sessionManager } from '@/lib/session';
import { UserMenu } from '@/components/ui/user-menu';

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
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      setUser(user);
    }
    setIsLoading(false);
  }, []);



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
            <div className="flex bg-white/90 backdrop-blur-sm border-2 border-[#2A527A]/20 rounded-xl p-1.5 shadow-lg space-x-1">
              <button
                onClick={() => router.push('/dashboard')}
                className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                  pathname === '/dashboard' 
                    ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                    : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/dashboard/assessments')}
                className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                  pathname === '/dashboard/assessments' 
                    ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                    : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                }`}
              >
                Assessments
              </button>
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <button
                  onClick={() => router.push('/dashboard/assessment-instances')}
                  className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/dashboard/assessment-instances' 
                      ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                      : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                  }`}
                >
                  Instances
                </button>
              )}
              {(user.role === 'admin' || user.role === 'super_admin' || user.role === 'manager') && (
                <button
                  onClick={() => router.push('/dashboard/team')}
                  className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/dashboard/team' 
                      ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                      : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                  }`}
                >
                  Team
                </button>
              )}
              {user.role === 'admin' || user.role === 'super_admin' ? (
                <button
                  onClick={() => router.push('/dashboard/admin')}
                  className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/dashboard/admin' 
                      ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                      : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                  }`}
                >
                  Admin
                </button>
              ) : null}
              {user.role === 'super_admin' ? (
                <button
                  onClick={() => router.push('/builder')}
                  className={`px-5 py-3 rounded-lg font-medium transition-all duration-200 ${
                    pathname === '/builder' 
                      ? 'bg-[#2A527A] text-white font-bold shadow-md -translate-y-0.5' 
                      : 'text-[#2A527A] hover:bg-[#2A527A]/5'
                  }`}
                >
                  Builder
                </button>
              ) : null}
            </div>

            {/* Right side: User menu */}
            <div className="flex items-center">
              <UserMenu user={user} />
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