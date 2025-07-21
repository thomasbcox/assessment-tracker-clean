'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { sessionManager } from '@/lib/session';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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

interface NewUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { showConfirm } = useConfirmDialog();
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
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState<NewUserData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user'
  });

  useEffect(() => {
    const currentUser = sessionManager.getUser();
    if (currentUser) {
      // Check if user has admin privileges
      if (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      
      setUser(currentUser);
      loadAdminData();
    }
    setIsLoading(false);
  }, [router]);

  const loadAdminData = async () => {
    try {
      // Load users
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
        
        // Calculate stats from real data
        const totalUsers = usersData.length;
        const activeUsers = usersData.filter((u: User) => u.status !== 'suspended').length;
        
        // Load assessment data for stats
        const [assessmentsRes, instancesRes] = await Promise.all([
          fetch('/api/assessment-templates'),
          fetch('/api/assessment-instances')
        ]);
        
        let totalAssessments = 0;
        let completedAssessments = 0;
        
        if (assessmentsRes.ok) {
          const assessmentsData = await assessmentsRes.json();
          totalAssessments = assessmentsData.length;
        }
        
        if (instancesRes.ok) {
          const instancesData = await instancesRes.json();
          completedAssessments = instancesData.filter((i: any) => i.completedAt).length;
        }
        
        setStats({
          totalUsers,
          activeUsers,
          totalAssessments,
          completedAssessments,
          systemUptime: '15 days', // This could be calculated from server start time
          lastBackup: '2024-01-25 02:00:00', // This would come from actual backup system
        });
      } else {
        addToast({ message: 'Failed to load users', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      addToast({ message: 'Failed to load admin data', type: 'error' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.email || !newUserData.role) {
      addToast({ message: 'Email and role are required', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });

      if (response.ok) {
        addToast({ message: 'User created successfully', type: 'success' });
        setShowAddUserModal(false);
        setNewUserData({ email: '', firstName: '', lastName: '', role: 'user' });
        loadAdminData(); // Refresh the data
      } else {
        const error = await response.json();
        addToast({ message: error.error || 'Failed to create user', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to create user', type: 'error' });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          email: editingUser.email,
          role: editingUser.role
        })
      });

      if (response.ok) {
        addToast({ message: 'User updated successfully', type: 'success' });
        setShowEditUserModal(false);
        setEditingUser(null);
        loadAdminData(); // Refresh the data
      } else {
        const error = await response.json();
        addToast({ message: error.error || 'Failed to update user', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to update user', type: 'error' });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    const confirmed = await showConfirm({
      title: 'Suspend User',
      message: 'Are you sure you want to suspend this user? They will not be able to access the system.',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: 0 })
        });

        if (response.ok) {
          addToast({ message: 'User suspended successfully', type: 'success' });
          loadAdminData(); // Refresh the data
        } else {
          const error = await response.json();
          addToast({ message: error.error || 'Failed to suspend user', type: 'error' });
        }
      } catch (error) {
        addToast({ message: 'Failed to suspend user', type: 'error' });
      }
    }
  };

  const handleExportData = async () => {
    try {
      // This would typically generate a CSV or JSON export
      const exportData = {
        users: users,
        stats: stats,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addToast({ message: 'Data exported successfully', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to export data', type: 'error' });
    }
  };

  const handleSystemBackup = async () => {
    try {
      // This would typically call a backup API
      addToast({ message: 'Backup initiated successfully (placeholder - no actual backup created)', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to create backup', type: 'error' });
    }
  };

  const handleClearCache = async () => {
    try {
      // This would typically call a cache clearing API
      addToast({ message: 'Cache cleared successfully (placeholder - no actual cache cleared)', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to clear cache', type: 'error' });
    }
  };

  const handleViewLogs = async () => {
    try {
      // This would typically open a logs viewer or download logs
      addToast({ message: 'View Logs (placeholder - no actual logs displayed)', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to view logs', type: 'error' });
    }
  };

  const handleGenerateToken = async () => {
    try {
      // This would typically generate a new API token
      addToast({ message: 'Token generated successfully (placeholder - no actual token created)', type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to generate token', type: 'error' });
    }
  };

  const handleRegenerateToken = async (tokenName: string) => {
    try {
      // This would typically regenerate an existing API token
      addToast({ message: `${tokenName} token regenerated successfully (placeholder - no actual token regenerated)`, type: 'success' });
    } catch (error) {
      addToast({ message: 'Failed to regenerate token', type: 'error' });
    }
  };

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
              case 'super_admin': return 'bg-purple-600 text-white';
      case 'admin': return 'bg-brand-dark-blue text-white';
      case 'manager': return 'bg-brand-dark-teal text-white';
      case 'user': return 'bg-brand-medium-blue text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDisplayName = (user: User) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
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

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
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
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Active Users</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Total Assessments</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.totalAssessments}</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-dark-blue/70">Completed</p>
                    <p className="text-2xl font-bold text-brand-dark-blue">{stats.completedAssessments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-brand-dark-blue mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.role === 'super_admin' && (
                  <button
                    onClick={() => router.push('/builder')}
                    className="glass-card p-4 text-left hover:bg-white/20 transition-all duration-200"
                  >
                    <h4 className="font-medium text-brand-dark-blue">Template Builder</h4>
                    <p className="text-sm text-brand-dark-blue/70">Create and manage assessment templates</p>
                  </button>
                )}
                <button 
                  onClick={() => setShowAddUserModal(true)}
                  className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                >
                  Add New User
                </button>
                <button 
                  onClick={handleExportData}
                  className="btn-modern bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90"
                >
                  Export Data
                </button>
                <button 
                  onClick={() => setActiveTab('system')}
                  className="btn-modern bg-brand-vibrant-teal text-white hover:bg-brand-vibrant-teal/90"
                >
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
              <button 
                onClick={() => setShowAddUserModal(true)}
                className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
              >
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
                        Created
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
                                {getDisplayName(user)}
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-dark-blue/70">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditUserModal(true);
                            }}
                            className="text-brand-dark-blue hover:text-brand-dark-blue/70 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleSuspendUser(user.id)}
                            className="text-red-600 hover:text-red-800"
                          >
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
                  <button 
                    onClick={handleSystemBackup}
                    className="w-full btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                  >
                    Create Backup
                  </button>
                  <button 
                    onClick={handleClearCache}
                    className="w-full btn-modern bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90"
                  >
                    Clear Cache
                  </button>
                  <button 
                    onClick={handleViewLogs}
                    className="w-full btn-modern bg-brand-vibrant-teal text-white hover:bg-brand-vibrant-teal/90"
                  >
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
              <button 
                onClick={handleGenerateToken}
                className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
              >
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
                    <button 
                      onClick={() => handleRegenerateToken('Assessment API')}
                      className="text-brand-dark-blue hover:text-brand-dark-blue/70 text-sm"
                    >
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
                    <button 
                      onClick={() => handleRegenerateToken('User Management')}
                      className="text-brand-dark-blue hover:text-brand-dark-blue/70 text-sm"
                    >
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <Card className="w-full max-w-md mx-4 relative z-[200]">
              <CardHeader>
                <CardTitle>Add New User</CardTitle>
                <CardDescription>Create a new user account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                                          <Select 
                        value={newUserData.role} 
                        onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {user?.role === 'super_admin' && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddUserModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                    >
                      Create User
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
            <Card className="w-full max-w-md mx-4 relative z-[200]">
              <CardHeader>
                <CardTitle>Edit User</CardTitle>
                <CardDescription>Update user information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input
                      id="edit-firstName"
                      value={editingUser.firstName || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input
                      id="edit-lastName"
                      value={editingUser.lastName || ''}
                      onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-role">Role</Label>
                                          <Select 
                        value={editingUser.role} 
                        onValueChange={(value) => setEditingUser(prev => prev ? { ...prev, role: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {user?.role === 'super_admin' && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditUserModal(false);
                        setEditingUser(null);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                    >
                      Update User
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 