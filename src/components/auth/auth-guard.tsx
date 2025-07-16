'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionManager } from '@/lib/session';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'manager' | 'admin' | 'super-admin';
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = sessionManager.getUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue mx-auto mb-4"></div>
          <p className="text-brand-dark-blue font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Authentication Required</h2>
          <p className="text-brand-dark-blue/70 mb-4">Please log in to access this page.</p>
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

  if (requiredRole) {
    const roleHierarchy = {
      'user': 1,
      'manager': 2,
      'admin': 3,
      'super-admin': 4
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Access Denied</h2>
            <p className="text-brand-dark-blue/70 mb-4">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
} 