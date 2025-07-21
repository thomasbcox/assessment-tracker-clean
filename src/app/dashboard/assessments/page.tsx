'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { sessionManager } from '@/lib/session';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'archived' | 'pending';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  dueDate?: string;
  periodName?: string;
  templateId?: number;
}

export default function AssessmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'completed' | 'archived' | 'pending'>('all');
  const router = useRouter();

  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      setUser(user);
      fetchUserAssessments(user.id);
    }
    setIsLoading(false);
  }, []);

  const fetchUserAssessments = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/assessments`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data);
      } else {
        console.error('Failed to fetch assessments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    }
  };

  const filteredAssessments = assessments.filter(assessment => 
    filter === 'all' ? true : assessment.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-brand-vibrant-teal text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'draft': return 'bg-gray-500 text-white';
      case 'completed': return 'bg-brand-dark-teal text-white';
      case 'archived': return 'bg-gray-400 text-white';
      default: return 'bg-gray-300 text-gray-700';
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DDE5CC]">
        <div className="glass-card rounded-2xl p-8 text-center">

          <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Authentication Required</h2>
          <p className="text-brand-dark-blue/70 mb-4">Please log in to access assessments.</p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">Assessments</h1>
            <p className="text-brand-dark-blue/70 mt-2">Manage and track assessment progress</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
          >
            Create Assessment
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'draft', 'active', 'completed', 'archived'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === status
                    ? 'bg-brand-dark-blue text-white'
                    : 'bg-white/50 text-brand-dark-blue hover:bg-white/70'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <div key={assessment.id} className="glass-card p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-brand-dark-blue line-clamp-2">
                  {assessment.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                  {assessment.status}
                </span>
              </div>
              
              <p className="text-brand-dark-blue/70 text-sm mb-4 line-clamp-3">
                {assessment.description}
              </p>

              <div className="space-y-2 text-sm text-brand-dark-blue/60">
                {assessment.periodName && (
                  <div className="flex items-center">
                    Period: {assessment.periodName}
                  </div>
                )}
                
                {assessment.dueDate && (
                  <div className="flex items-center">
                    Due: {new Date(assessment.dueDate).toLocaleDateString()}
                  </div>
                )}

                <div className="flex items-center">
                  Created: {new Date(assessment.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-brand-dark-blue/10">
                <button 
                  onClick={() => router.push(`/assessment/${assessment.id}`)}
                  className="flex-1 btn-modern bg-brand-medium-blue text-white hover:bg-brand-medium-blue/90 text-sm"
                >
                  {assessment.status === 'completed' ? 'View Results' : 'Take Assessment'}
                </button>
                <button className="flex-1 btn-modern bg-brand-dark-teal text-white hover:bg-brand-dark-teal/90 text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAssessments.length === 0 && (
          <div className="glass-card p-12 text-center">

            <h3 className="text-xl font-semibold text-brand-dark-blue mb-2">No assessments found</h3>
            <p className="text-brand-dark-blue/70 mb-6">
              {filter === 'all' 
                ? 'Create your first assessment to get started'
                : `No ${filter} assessments found`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
              >
                Create Assessment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-85">
          <div className="glass-card p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-brand-dark-blue mb-6">Create Assessment</h2>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  Assessment Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-brand-dark-blue/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark-blue/50 focus:border-brand-dark-blue"
                  placeholder="Enter assessment title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-brand-dark-blue/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark-blue/50 focus:border-brand-dark-blue"
                  placeholder="Enter assessment description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-dark-blue mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-brand-dark-blue/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-dark-blue/50 focus:border-brand-dark-blue"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 btn-modern bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-modern bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
                >
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 