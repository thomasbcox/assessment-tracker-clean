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
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center animate-fade-in-up">
          <div className="mb-6">
            <div className="w-12 h-12 bg-brand-dark-blue bg-opacity-10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
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
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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
              <div className="w-8 h-8 gradient-success rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
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
              <div className="w-8 h-8 gradient-warning rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              <div className="w-8 h-8 bg-brand-dark-blue/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => window.location.href = '/dashboard/assessments'}
                className="btn-modern w-full gradient-primary text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View My Assessments
              </button>
              {user.role === 'manager' && (
                <button 
                  onClick={() => window.location.href = '/dashboard/team'}
                  className="btn-modern w-full bg-brand-dark-blue bg-opacity-10 text-brand-dark-blue hover:bg-brand-dark-blue hover:bg-opacity-20 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  View Team Assessments
                </button>
              )}
              {user.role === 'admin' || user.role === 'super-admin' ? (
                <button 
                  onClick={() => window.location.href = '/dashboard/admin'}
                  className="btn-modern w-full bg-brand-dark-blue bg-opacity-10 text-brand-dark-blue hover:bg-brand-dark-blue hover:bg-opacity-20 backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </button>
              ) : null}
            </div>
          </div>

          <div className="dashboard-card p-6 animate-fade-in-up" style={{animationDelay: '1s'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-brand-dark-blue">Recent Activity</h3>
              <div className="w-8 h-8 bg-brand-dark-teal/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-dark-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              {stats.completed > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-brand-dark-teal/5 rounded-lg">
                    <div className="w-2 h-2 bg-brand-dark-teal rounded-full animate-pulse-slow"></div>
                    <div>
                      <p className="font-medium text-brand-dark-blue">You completed {stats.completed} assessment(s) recently.</p>
                      <p className="text-sm text-brand-dark-blue/60">Great job staying on top of your evaluations! 🎉</p>
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