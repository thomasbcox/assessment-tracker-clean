'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Edit, Trash2, Search, Filter, Users, Calendar, FileText } from 'lucide-react';
import { sessionManager } from '@/lib/session';

interface AssessmentInstance {
  id: number;
  userId: string;
  periodId: number;
  templateId: number;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

interface AssessmentInstanceWithDetails extends AssessmentInstance {
  periodName: string;
  templateName: string;
  templateVersion: string;
  assessmentTypeName: string;
  userName?: string;
  userEmail?: string;
}

interface AssessmentPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface AssessmentTemplate {
  id: number;
  name: string;
  version: string;
  assessmentTypeName: string;
}

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export default function AssessmentInstancesPage() {
  const { addToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [instances, setInstances] = useState<AssessmentInstanceWithDetails[]>([]);
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  // Form state
  const [newInstance, setNewInstance] = useState({
    userId: '',
    periodId: '',
    templateId: '',
    status: 'pending' as const
  });

  const currentUser = sessionManager.getUser();

  useEffect(() => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [instancesRes, periodsRes, templatesRes, usersRes] = await Promise.all([
        fetch('/api/assessment-instances'),
        fetch('/api/assessment-periods'),
        fetch('/api/assessment-templates'),
        fetch('/api/users')
      ]);

      if (instancesRes.ok) {
        const instancesData = await instancesRes.json();
        // Fetch user details for each instance
        const instancesWithUsers = await Promise.all(
          instancesData.map(async (instance: AssessmentInstance) => {
            try {
              const userRes = await fetch(`/api/users/${instance.userId}`);
              if (userRes.ok) {
                const user = await userRes.json();
                return { ...instance, userName: `${user.firstName} ${user.lastName}`.trim() || user.email, userEmail: user.email };
              }
              return instance;
            } catch (error) {
              return instance;
            }
          })
        );
        setInstances(instancesWithUsers);
      }

      if (periodsRes.ok) setPeriods(await periodsRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
      addToast({ message: 'Failed to load data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInstance.userId || !newInstance.periodId || !newInstance.templateId) {
      addToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/assessment-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newInstance.userId,
          periodId: parseInt(newInstance.periodId),
          templateId: parseInt(newInstance.templateId),
          status: newInstance.status
        })
      });

      if (response.ok) {
        addToast({ message: 'Assessment instance created successfully', type: 'success' });
        setShowCreateModal(false);
        setNewInstance({ userId: '', periodId: '', templateId: '', status: 'pending' });
        loadData();
      } else {
        const error = await response.json();
        addToast({ message: error.error || 'Failed to create assessment instance', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to create assessment instance', type: 'error' });
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/assessment-instances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        addToast({ message: 'Status updated successfully', type: 'success' });
        loadData();
      } else {
        addToast({ message: 'Failed to update status', type: 'error' });
      }
    } catch (error) {
      addToast({ message: 'Failed to update status', type: 'error' });
    }
  };

  const handleDeleteInstance = async (id: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Assessment Instance',
      message: 'Are you sure you want to delete this assessment instance? This action cannot be undone.',
      variant: 'danger'
    });

    if (confirmed) {
      try {
        const response = await fetch(`/api/assessment-instances/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          addToast({ message: 'Assessment instance deleted successfully', type: 'success' });
          loadData();
        } else {
          addToast({ message: 'Failed to delete assessment instance', type: 'error' });
        }
      } catch (error) {
        addToast({ message: 'Failed to delete assessment instance', type: 'error' });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = !searchTerm || 
      instance.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.periodName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || instance.periodId.toString() === periodFilter;
    const matchesTemplate = templateFilter === 'all' || instance.templateId.toString() === templateFilter;

    return matchesSearch && matchesStatus && matchesPeriod && matchesTemplate;
  });

  if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-4">Access Denied</h2>
          <p className="text-brand-dark-blue/70">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue"></div>
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
            <h1 className="text-3xl font-bold text-brand-dark-blue">Assessment Instances</h1>
            <p className="text-brand-dark-blue/70 mt-2">Manage and track assessment instances</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Instance
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search instances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {periods.map(period => (
                    <SelectItem key={period.id} value={period.id.toString()}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={templateFilter} onValueChange={setTemplateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.name} v{template.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Instances Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInstances.map((instance) => (
            <Card key={instance.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-brand-dark-blue">
                      {instance.templateName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {instance.assessmentTypeName} • v{instance.templateVersion}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                    {instance.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-brand-dark-blue/70">
                    <Users className="w-4 h-4 mr-2" />
                    {instance.userName || instance.userEmail}
                  </div>
                  
                  <div className="flex items-center text-sm text-brand-dark-blue/70">
                    <Calendar className="w-4 h-4 mr-2" />
                    {instance.periodName}
                  </div>
                  
                  <div className="flex items-center text-sm text-brand-dark-blue/70">
                    <FileText className="w-4 h-4 mr-2" />
                    Created: {new Date(instance.createdAt).toLocaleDateString()}
                  </div>

                  {instance.completedAt && (
                    <div className="flex items-center text-sm text-brand-dark-blue/70">
                      <Calendar className="w-4 h-4 mr-2" />
                      Completed: {new Date(instance.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark-blue/10">
                  <Select 
                    value={instance.status} 
                    onValueChange={(value) => handleUpdateStatus(instance.id, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={() => handleDeleteInstance(instance.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInstances.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold text-brand-dark-blue mb-2">No assessment instances found</h3>
              <p className="text-brand-dark-blue/70 mb-6">
                {searchTerm || statusFilter !== 'all' || periodFilter !== 'all' || templateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first assessment instance to get started'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && periodFilter === 'all' && templateFilter === 'all' && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assessment Instance
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Instance Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-85">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Assessment Instance</CardTitle>
              <CardDescription>Assign an assessment to a user</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInstance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    User
                  </label>
                  <Select 
                    value={newInstance.userId} 
                    onValueChange={(value) => setNewInstance(prev => ({ ...prev, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {`${user.firstName} ${user.lastName}`.trim() || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    Assessment Period
                  </label>
                  <Select 
                    value={newInstance.periodId} 
                    onValueChange={(value) => setNewInstance(prev => ({ ...prev, periodId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a period" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map(period => (
                        <SelectItem key={period.id} value={period.id.toString()}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    Assessment Template
                  </label>
                  <Select 
                    value={newInstance.templateId} 
                    onValueChange={(value) => setNewInstance(prev => ({ ...prev, templateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name} v{template.version}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                    Initial Status
                  </label>
                  <Select 
                    value={newInstance.status} 
                    onValueChange={(value: any) => setNewInstance(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                  >
                    Create Instance
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
} 