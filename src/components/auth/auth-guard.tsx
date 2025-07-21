'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionManager } from '@/lib/session';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'manager' | 'admin' | 'super_admin';
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
      'super_admin': 4
    };

    const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
          <div className="glass-card rounded-2xl p-8 text-center">

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