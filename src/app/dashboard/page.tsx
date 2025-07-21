'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { sessionManager } from '@/lib/session';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AssessmentStats {
  pending: number;
  completed: number;
  total: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<AssessmentStats>({
    pending: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      setUser(user);
      // Fetch user's assessment stats
      fetchUserStats(user.id);
    }
  }, []);



  const fetchUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">

          <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Authentication Required</h2>
          <p className="text-brand-dark-blue/70 mb-4">Please log in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-modern gradient-primary text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center animate-fade-in-up">
          <div className="mb-6">

            <h1 className="text-4xl font-bold text-brand-dark-blue mb-2 drop-shadow-lg">
              Welcome back, {user.firstName || user.email}!
            </h1>
            <p className="text-brand-dark-blue/90 text-lg">
              Here's your assessment overview
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card p-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-1">Total Assessments</h3>
                <p className="text-brand-dark-blue/60 text-sm">All periods</p>
              </div>

            </div>
            <div className="text-3xl font-bold text-brand-dark-blue mb-2">{stats.total}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue h-2 rounded-full" style={{width: '100%'}}></div>
            </div>
          </div>

          <div className="stat-card p-6 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-1">Completed</h3>
                <p className="text-brand-dark-blue/60 text-sm">Successfully done</p>
              </div>

            </div>
            <div className="text-3xl font-bold text-brand-dark-teal mb-2">{stats.completed}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-brand-vibrant-teal to-brand-dark-teal h-2 rounded-full" style={{width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%'}}></div>
            </div>
          </div>

          <div className="stat-card p-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-1">Pending</h3>
                <p className="text-brand-dark-blue/60 text-sm">Awaiting completion</p>
              </div>

            </div>
            <div className="text-3xl font-bold text-brand-medium-blue mb-2">{stats.pending}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-brand-medium-blue to-brand-dark-blue h-2 rounded-full" style={{width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%'}}></div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="dashboard-card p-6 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-brand-dark-blue">Quick Actions</h3>

            </div>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/dashboard/assessments'}
                className="btn-modern w-full gradient-primary text-white"
              >
                View My Assessments
              </button>
              {user.role === 'manager' && (
                <button 
                  onClick={() => window.location.href = '/dashboard/team'}
                  className="btn-modern w-full bg-brand-dark-blue bg-opacity-10 text-brand-dark-blue hover:bg-brand-dark-blue hover:bg-opacity-20 backdrop-blur-sm"
                >
                  View Team Assessments
                </button>
              )}
              {user.role === 'admin' || user.role === 'super_admin' ? (
                <button 
                  onClick={() => window.location.href = '/dashboard/admin'}
                  className="btn-modern w-full bg-brand-dark-blue bg-opacity-10 text-brand-dark-blue hover:bg-brand-dark-blue hover:bg-opacity-20 backdrop-blur-sm"
                >
                  Admin Panel
                </button>
              ) : null}
            </div>
          </div>

          <div className="dashboard-card p-6 animate-fade-in-up" style={{animationDelay: '1s'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-brand-dark-blue">Recent Activity</h3>

            </div>
            <div className="space-y-4">
              {stats.completed > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-brand-dark-teal/5 rounded-lg">
                    <div className="w-2 h-2 bg-brand-dark-teal rounded-full animate-pulse-slow"></div>
                    <div>
                      <p className="font-medium text-brand-dark-blue">You completed {stats.completed} assessment(s) recently.</p>
                      <p className="text-sm text-brand-dark-blue/60">Great job staying on top of your evaluations!</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-brand-dark-blue/60">
                    <span>Completion rate</span>
                    <span className="font-semibold text-brand-dark-teal">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-brand-dark-blue/5 rounded-lg">
                    <div className="w-2 h-2 bg-brand-dark-blue rounded-full animate-pulse-slow"></div>
                    <div>
                      <p className="font-medium text-brand-dark-blue">No recent activity.</p>
                      <p className="text-sm text-brand-dark-blue/60">Start your first assessment to track your progress!</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <button 
                      onClick={() => window.location.href = '/dashboard/assessments'}
                      className="btn-modern gradient-primary text-white"
                    >
                      Start Your First Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 