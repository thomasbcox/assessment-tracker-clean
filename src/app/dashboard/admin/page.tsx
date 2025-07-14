'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { sessionManager } from '@/lib/session';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  completedAssessments: number;
  systemUptime: string;
  lastBackup: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    systemUptime: '0 days',
    lastBackup: 'Never',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'tokens'>('overview');

  useEffect(() => {
    const currentUser = sessionManager.getUser();
    if (currentUser) {
      // Check if user has admin privileges
      if (currentUser.role !== 'admin' && currentUser.role !== 'super-admin') {
        router.push('/dashboard');
        return;
      }
      
      setUser(currentUser);
      
      // Mock data for demonstration
      setUsers([
        {
          id: '1',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'manager',
          createdAt: '2024-01-15T10:00:00Z',
          lastLogin: '2024-01-25T14:30:00Z',
          status: 'active',
        },
        {
          id: '2',
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'assessor',
          createdAt: '2024-01-10T09:00:00Z',
          lastLogin: '2024-01-24T16:45:00Z',
          status: 'active',
        },
        {
          id: '3',
          email: 'bob.wilson@example.com',
          firstName: 'Bob',
          lastName: 'Wilson',
          role: 'manager',
          createdAt: '2024-01-05T11:00:00Z',
          lastLogin: '2024-01-20T12:15:00Z',
          status: 'inactive',
        },
      ]);

      setStats({
        totalUsers: 15,
        activeUsers: 12,
        totalAssessments: 47,
        completedAssessments: 23,
        systemUptime: '15 days',
        lastBackup: '2024-01-25 02:00:00',
      });
    }
    setIsLoading(false);
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-brand-vibrant-teal text-white';
      case 'inactive': return 'bg-gray-400 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'bg-purple-600 text-white';
      case 'admin': return 'bg-brand-dark-blue text-white';
      case 'manager': return 'bg-brand-dark-teal text-white';
      case 'assessor': return 'bg-brand-medium-blue text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return (
      <DashboardLayout>
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-brand-dark-blue mb-2">Access Denied</h3>
          <p className="text-brand-dark-blue/70 mb-6">
            You don't have permission to access the admin dashboard.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
          >
            Return to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">Admin Dashboard</h1>
            <p className="text-brand-dark-blue/70 mt-2">System administration and user management</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-brand-dark-blue/70">Logged in as:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="glass-card p-4">
          <div className="flex space-x-1">
            {(['overview', 'users', 'system', 'tokens'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-brand-dark-blue text-white'
                    : 'bg-white/50 text-brand-dark-blue hover:bg-white/70'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Total Users</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.totalUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-dark-blue/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Active Users</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.activeUsers}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-vibrant-teal/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-vibrant-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Total Assessments</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.totalAssessments}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-dark-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Completed</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.completedAssessments}</p>
                  </div>
                  <div className="w-12 h-12 bg-brand-medium-blue/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New User
                </button>
                <button className="btn-modern bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Export Data
                </button>
                <button className="btn-modern bg-brand-vibrant-teal text-white hover:bg-brand-vibrant-teal/90">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  System Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-brand-dark-blue">User Management</h3>
              <button className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-brand-dark-blue/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark-blue uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark-blue uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark-blue uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark-blue uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-brand-dark-blue uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-dark-blue/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-brand-dark-blue/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-brand-dark-blue/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-brand-dark-blue">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-brand-dark-blue">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-brand-dark-blue/70">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'inactive')}`}>
                            {user.status || 'inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark-blue/70">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-brand-dark-blue hover:text-brand-dark-blue/70 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-brand-dark-blue/70">System Uptime:</span>
                    <span className="font-medium text-brand-dark-blue">{stats.systemUptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-blue/70">Last Backup:</span>
                    <span className="font-medium text-brand-dark-blue">{stats.lastBackup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-blue/70">Database Size:</span>
                    <span className="font-medium text-brand-dark-blue">2.4 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-dark-blue/70">Version:</span>
                    <span className="font-medium text-brand-dark-blue">1.0.0</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">System Actions</h3>
                <div className="space-y-3">
                  <button className="w-full btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Create Backup
                  </button>
                  <button className="w-full btn-modern bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Clear Cache
                  </button>
                  <button className="w-full btn-modern bg-brand-vibrant-teal text-white hover:bg-brand-vibrant-teal/90">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-brand-dark-blue">Token Management</h3>
              <button className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Generate New Token
              </button>
            </div>

            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-brand-dark-blue mb-4">API Tokens</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-brand-dark-blue/5 rounded-lg">
                  <div>
                    <h5 className="font-medium text-brand-dark-blue">Assessment API Token</h5>
                    <p className="text-sm text-brand-dark-blue/70">Used for assessment data integration</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-brand-vibrant-teal text-white px-2 py-1 rounded">Active</span>
                    <button className="text-brand-dark-blue hover:text-brand-dark-blue/70 text-sm">
                      Regenerate
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-brand-dark-blue/5 rounded-lg">
                  <div>
                    <h5 className="font-medium text-brand-dark-blue">User Management Token</h5>
                    <p className="text-sm text-brand-dark-blue/70">Used for user synchronization</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">Expired</span>
                    <button className="text-brand-dark-blue hover:text-brand-dark-blue/70 text-sm">
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h4 className="text-lg font-semibold text-brand-dark-blue mb-4">Token Usage</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-dark-blue">1,247</div>
                  <div className="text-sm text-brand-dark-blue/70">API Calls Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-dark-blue">89%</div>
                  <div className="text-sm text-brand-dark-blue/70">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-dark-blue">2</div>
                  <div className="text-sm text-brand-dark-blue/70">Active Tokens</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 