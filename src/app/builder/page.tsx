'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Plus, Edit, Trash2, GripVertical, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

interface AssessmentType {
  id: number;
  name: string;
  description: string;
  purpose: string;
}

interface AssessmentCategory {
  id: number;
  assessmentTypeId: number;
  name: string;
  description: string;
  displayOrder: number;
}

interface AssessmentTemplate {
  id: number;
  assessmentTypeId: number;
  name: string;
  version: string;
  description: string;
  assessmentTypeName: string;
}

interface AssessmentPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: number;
}

interface AssessmentQuestion {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
  isActive: number;
}

export default function BuilderPage() {
  const { session } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState('types');
  
  // Data states
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [managerRelationships, setManagerRelationships] = useState<any[]>([]);
  
  // Form states
  const [newCategory, setNewCategory] = useState({
    assessmentTypeId: '',
    name: '',
    description: '',
    displayOrder: ''
  });
  
  const [newTemplate, setNewTemplate] = useState({
    assessmentTypeId: '',
    name: '',
    version: '',
    description: ''
  });
  
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [newType, setNewType] = useState({
    name: '',
    description: '',
    purpose: ''
  });

  // Edit states
  const [editingType, setEditingType] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<number | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<number | null>(null);

  // Edit form states
  const [editType, setEditType] = useState({
    name: '',
    description: '',
    purpose: ''
  });

  const [editCategory, setEditCategory] = useState({
    assessmentTypeId: '',
    name: '',
    description: '',
    displayOrder: ''
  });

  const [editTemplate, setEditTemplate] = useState({
    assessmentTypeId: '',
    name: '',
    version: '',
    description: ''
  });

  const [editPeriod, setEditPeriod] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  // Loading state
  const [isDeleting, setIsDeleting] = useState(false);

  // Search/filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');

  // Check if user is super admin
  useEffect(() => {
    if (session && session.user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load data
  useEffect(() => {
    if (session?.user.role === 'super_admin') {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const [typesRes, categoriesRes, templatesRes, periodsRes, questionsRes, instancesRes, invitationsRes, relationshipsRes] = await Promise.all([
        fetch('/api/assessment-types'),
        fetch('/api/assessment-categories'),
        fetch('/api/assessment-templates'),
        fetch('/api/assessment-periods'),
        fetch('/api/assessment-questions'),
        fetch('/api/assessment-instances'),
        fetch('/api/invitations'),
        fetch('/api/manager-relationships')
      ]);

      if (typesRes.ok) setAssessmentTypes(await typesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (periodsRes.ok) setPeriods(await periodsRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
      if (instancesRes.ok) setInstances(await instancesRes.json());
      if (invitationsRes.ok) setInvitations(await invitationsRes.json());
      if (relationshipsRes.ok) setManagerRelationships(await relationshipsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Helper function for optimistic updates with rollback
  const optimisticUpdate = async (
    updateFn: () => void,
    rollbackFn: () => void,
    apiCall: () => Promise<Response>,
    successMessage: string,
    errorMessage: string
  ) => {
    // Apply optimistic update immediately
    updateFn();
    
    try {
      const response = await apiCall();
      
      if (response.ok) {
        addToast({
          message: successMessage,
          type: 'success'
        });
        // No need to reload data - UI is already updated
      } else {
        // Rollback on error
        rollbackFn();
        const errorData = await response.json();
        addToast({
          message: `${errorMessage}: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      rollbackFn();
      console.error('Error in optimistic update:', error);
      addToast({
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assessment-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });
      
      if (response.ok) {
        setNewCategory({ assessmentTypeId: '', name: '', description: '', displayOrder: '' });
        loadData();
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assessment-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      
      if (response.ok) {
        setNewTemplate({ assessmentTypeId: '', name: '', version: '', description: '' });
        loadData();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assessment-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod)
      });
      
      if (response.ok) {
        setNewPeriod({ name: '', startDate: '', endDate: '', isActive: false });
        loadData();
      }
    } catch (error) {
      console.error('Error creating period:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${categoryName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    // Store original state for rollback
    const originalCategories = categories;
    
    // Optimistically remove from UI immediately
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    
    try {
      const response = await fetch(`/api/assessment-categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        addToast({
          message: 'Category deleted successfully',
          type: 'success'
        });
        // No need to reload data - UI is already updated
      } else {
        // Rollback on error
        setCategories(originalCategories);
        const errorData = await response.json();
        addToast({
          message: `Error deleting category: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setCategories(originalCategories);
      console.error('Error deleting category:', error);
      addToast({
        message: 'An error occurred while deleting the category',
        type: 'error'
      });
    }
  };

  const handleDeleteTemplate = async (templateId: number, templateName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete the template "${templateName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    // Store original state for rollback
    const originalTemplates = templates;
    
    // Optimistically remove from UI immediately
    setTemplates(prev => prev.filter(template => template.id !== templateId));
    
    try {
      const response = await fetch(`/api/assessment-templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        addToast({
          message: 'Template deleted successfully',
          type: 'success'
        });
        // No need to reload data - UI is already updated
      } else {
        // Rollback on error
        setTemplates(originalTemplates);
        const errorData = await response.json();
        addToast({
          message: `Error deleting template: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setTemplates(originalTemplates);
      console.error('Error deleting template:', error);
      addToast({
        message: 'An error occurred while deleting the template',
        type: 'error'
      });
    }
  };

  const handleDeletePeriod = async (periodId: number, periodName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Period',
      message: `Are you sure you want to delete the period "${periodName}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    // Store original state for rollback
    const originalPeriods = periods;
    
    // Optimistically remove from UI immediately
    setPeriods(prev => prev.filter(period => period.id !== periodId));
    
    try {
      const response = await fetch(`/api/assessment-periods/${periodId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        addToast({
          message: 'Period deleted successfully',
          type: 'success'
        });
        // No need to reload data - UI is already updated
      } else {
        // Rollback on error
        setPeriods(originalPeriods);
        const errorData = await response.json();
        addToast({
          message: `Error deleting period: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setPeriods(originalPeriods);
      console.error('Error deleting period:', error);
      addToast({
        message: 'An error occurred while deleting the period',
        type: 'error'
      });
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assessment-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newType)
      });
      
      if (response.ok) {
        addToast({
          message: 'Assessment type created successfully',
          type: 'success'
        });
        setNewType({ name: '', description: '', purpose: '' });
        loadData();
      } else {
        const errorData = await response.json();
        addToast({
          message: `Error creating assessment type: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating assessment type:', error);
      addToast({
        message: 'An error occurred while creating the assessment type',
        type: 'error'
      });
    }
  };

  const handleDeleteType = async (typeId: number, typeName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete Assessment Type',
      message: `Are you sure you want to delete the assessment type "${typeName}"? This will also delete all categories, templates, and questions associated with this type.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    // Store original states for rollback
    const originalTypes = assessmentTypes;
    const originalCategories = categories;
    const originalTemplates = templates;
    const originalQuestions = questions;
    
    // Optimistically remove from UI immediately
    setAssessmentTypes(prev => prev.filter(type => type.id !== typeId));
    setCategories(prev => prev.filter(cat => cat.assessmentTypeId !== typeId));
    setTemplates(prev => prev.filter(template => template.assessmentTypeId !== typeId));
    setQuestions(prev => prev.filter(question => {
      const template = templates.find(t => t.id === question.templateId);
      return template && template.assessmentTypeId !== typeId;
    }));
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assessment-types/${typeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        addToast({
          message: 'Assessment type deleted successfully',
          type: 'success'
        });
        // No need to reload data - UI is already updated
      } else {
        // Rollback on error
        setAssessmentTypes(originalTypes);
        setCategories(originalCategories);
        setTemplates(originalTemplates);
        setQuestions(originalQuestions);
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || response.statusText;
        addToast({
          message: `Error deleting assessment type: ${errorMessage}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setAssessmentTypes(originalTypes);
      setCategories(originalCategories);
      setTemplates(originalTemplates);
      setQuestions(originalQuestions);
      console.error('Error deleting assessment type:', error);
      addToast({
        message: 'An error occurred while deleting the assessment type',
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit handlers
  const handleEditType = (type: AssessmentType) => {
    setEditingType(type.id);
    setEditType({
      name: type.name,
      description: type.description || '',
      purpose: type.purpose || ''
    });
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    const originalTypes = [...assessmentTypes];
    
    // Optimistic update
    setAssessmentTypes(prev => prev.map(type => 
      type.id === editingType 
        ? { ...type, ...editType }
        : type
    ));

    try {
      const response = await fetch(`/api/assessment-types/${editingType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editType)
      });

      if (response.ok) {
        addToast({
          message: 'Assessment type updated successfully',
          type: 'success'
        });
        setEditingType(null);
      } else {
        // Rollback on error
        setAssessmentTypes(originalTypes);
        const errorData = await response.json();
        addToast({
          message: `Error updating assessment type: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setAssessmentTypes(originalTypes);
      console.error('Error updating assessment type:', error);
      addToast({
        message: 'An error occurred while updating the assessment type',
        type: 'error'
      });
    }
  };

  const handleEditCategory = (category: AssessmentCategory) => {
    setEditingCategory(category.id);
    setEditCategory({
      assessmentTypeId: category.assessmentTypeId.toString(),
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder.toString()
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    const originalCategories = [...categories];
    
    // Optimistic update
    setCategories(prev => prev.map(cat => 
      cat.id === editingCategory 
        ? { ...cat, ...editCategory, assessmentTypeId: parseInt(editCategory.assessmentTypeId), displayOrder: parseInt(editCategory.displayOrder) }
        : cat
    ));

    try {
      const response = await fetch(`/api/assessment-categories/${editingCategory}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editCategory,
          assessmentTypeId: parseInt(editCategory.assessmentTypeId),
          displayOrder: parseInt(editCategory.displayOrder)
        })
      });

      if (response.ok) {
        addToast({
          message: 'Category updated successfully',
          type: 'success'
        });
        setEditingCategory(null);
      } else {
        // Rollback on error
        setCategories(originalCategories);
        const errorData = await response.json();
        addToast({
          message: `Error updating category: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setCategories(originalCategories);
      console.error('Error updating category:', error);
      addToast({
        message: 'An error occurred while updating the category',
        type: 'error'
      });
    }
  };

  const handleEditTemplate = (template: AssessmentTemplate) => {
    setEditingTemplate(template.id);
    setEditTemplate({
      assessmentTypeId: template.assessmentTypeId.toString(),
      name: template.name,
      version: template.version,
      description: template.description || ''
    });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    const originalTemplates = [...templates];
    
    // Optimistic update
    setTemplates(prev => prev.map(template => 
      template.id === editingTemplate 
        ? { ...template, ...editTemplate, assessmentTypeId: parseInt(editTemplate.assessmentTypeId) }
        : template
    ));

    try {
      const response = await fetch(`/api/assessment-templates/${editingTemplate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editTemplate,
          assessmentTypeId: parseInt(editTemplate.assessmentTypeId)
        })
      });

      if (response.ok) {
        addToast({
          message: 'Template updated successfully',
          type: 'success'
        });
        setEditingTemplate(null);
      } else {
        // Rollback on error
        setTemplates(originalTemplates);
        const errorData = await response.json();
        addToast({
          message: `Error updating template: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setTemplates(originalTemplates);
      console.error('Error updating template:', error);
      addToast({
        message: 'An error occurred while updating the template',
        type: 'error'
      });
    }
  };

  const handleEditPeriod = (period: AssessmentPeriod) => {
    setEditingPeriod(period.id);
    setEditPeriod({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      isActive: period.isActive === 1
    });
  };

  const handleSavePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPeriod) return;

    const originalPeriods = [...periods];
    
    // Optimistic update
    setPeriods(prev => prev.map(period => 
      period.id === editingPeriod 
        ? { ...period, ...editPeriod, isActive: editPeriod.isActive ? 1 : 0 }
        : period
    ));

    try {
      const response = await fetch(`/api/assessment-periods/${editingPeriod}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editPeriod,
          isActive: editPeriod.isActive ? 1 : 0
        })
      });

      if (response.ok) {
        addToast({
          message: 'Period updated successfully',
          type: 'success'
        });
        setEditingPeriod(null);
      } else {
        // Rollback on error
        setPeriods(originalPeriods);
        const errorData = await response.json();
        addToast({
          message: `Error updating period: ${errorData.error || response.statusText}`,
          type: 'error'
        });
      }
    } catch (error) {
      // Rollback on error
      setPeriods(originalPeriods);
      console.error('Error updating period:', error);
      addToast({
        message: 'An error occurred while updating the period',
        type: 'error'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setEditingCategory(null);
    setEditingTemplate(null);
    setEditingPeriod(null);
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            Please log in to access the template builder.
          </p>
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (session.user.role !== 'super_admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the template builder.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-3">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 bg-gradient-to-b from-brand-dark-blue to-brand-medium-blue rounded-full"></div>
            <h1 className="text-2xl font-bold text-brand-dark-blue">Template Builder</h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7 bg-white/90 backdrop-blur-sm border-2 border-[#2A527A]/20 rounded-xl p-1.5 shadow-lg">
            <TabsTrigger 
              value="types"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Types
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="periods"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Periods
            </TabsTrigger>
            <TabsTrigger 
              value="instances"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Instances
            </TabsTrigger>
            <TabsTrigger 
              value="invitations"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Invitations
            </TabsTrigger>
            <TabsTrigger 
              value="relationships"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-3 py-2 text-[#2A527A] font-medium hover:bg-[#2A527A]/5 text-xs"
            >
              Relationships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Assessment Type</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleCreateType} className="space-y-3">
                  <div>
                    <label htmlFor="typeName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Type Name</label>
                    <Input
                      id="typeName"
                      value={newType.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Manager Self-Assessment"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="typeDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                      <textarea
                        id="typeDescription"
                        value={newType.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this assessment type..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label htmlFor="typePurpose" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Purpose</label>
                      <textarea
                        id="typePurpose"
                        value={newType.purpose}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewType(prev => ({ ...prev, purpose: e.target.value }))}
                        placeholder="What is the purpose of this assessment type?"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assessment Type
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Existing Assessment Types</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Search Bar */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search assessment types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {assessmentTypes
                    .filter(type => 
                      searchTerm === '' || 
                      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (type.purpose && type.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(type => {
                    const typeCategories = categories.filter(cat => cat.assessmentTypeId === type.id);
                    const typeTemplates = templates.filter(template => template.assessmentTypeId === type.id);
                    
                    return (
                      <div key={type.id} className="border rounded-lg bg-muted/30">
                        {editingType === type.id ? (
                          <div className="p-3">
                            <form onSubmit={handleSaveType} className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Type Name</label>
                                <Input
                                  value={editType.name}
                                  onChange={(e) => setEditType(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="e.g., Manager Self-Assessment"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  <textarea
                                    value={editType.description}
                                    onChange={(e) => setEditType(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe this assessment type..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Purpose</label>
                                  <textarea
                                    value={editType.purpose}
                                    onChange={(e) => setEditType(prev => ({ ...prev, purpose: e.target.value }))}
                                    placeholder="What is the purpose of this assessment type?"
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" size="sm" className="flex-1">
                                  Save Changes
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-3">
                            <div>
                              <div className="font-semibold">{type.name}</div>
                              {type.description && (
                                <div className="text-sm text-muted-foreground">{type.description}</div>
                              )}
                              {type.purpose && (
                                <div className="text-sm text-muted-foreground">{type.purpose}</div>
                              )}
                                                        <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => {
                                setActiveTab('categories');
                                setSelectedTypeFilter(type.id.toString());
                                setSearchTerm('');
                              }}
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              {typeCategories.length} Categories
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('templates');
                                setSelectedTypeFilter(type.id.toString());
                                setSearchTerm('');
                              }}
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                            >
                              {typeTemplates.length} Templates
                            </button>
                          </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditType(type)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDeleteType(type.id, type.name)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="assessmentType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assessment Type</label>
                      <select 
                        id="assessmentType"
                        value={newCategory.assessmentTypeId} 
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCategory(prev => ({ ...prev, assessmentTypeId: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select assessment type</option>
                        {assessmentTypes.map(type => (
                          <option key={type.id} value={type.id.toString()}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="displayOrder" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Display Order</label>
                      <Input
                        id="displayOrder"
                        type="number"
                        value={newCategory.displayOrder}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(prev => ({ ...prev, displayOrder: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="categoryName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Category Name</label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Communication"
                    />
                  </div>
                  <div>
                    <label htmlFor="categoryDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                    <textarea
                      id="categoryDescription"
                      value={newCategory.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this category measures..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Existing Categories</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Search and Filter Bar */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Assessment Types</option>
                      {assessmentTypes.map(type => (
                        <option key={type.id} value={type.id.toString()}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {(selectedTypeFilter || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTypeFilter('');
                          setSearchTerm('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {assessmentTypes
                    .filter(type => {
                      // Filter by selected type if specified
                      if (selectedTypeFilter && type.id.toString() !== selectedTypeFilter) {
                        return false;
                      }
                      // Only show types that have categories
                      return categories.some(cat => cat.assessmentTypeId === type.id);
                    })
                    .map(type => (
                    <div key={type.id} className="border rounded-lg p-3 bg-muted/20">
                      <h3 className="font-semibold mb-2 text-sm text-muted-foreground">{type.name}</h3>
                      <div className="space-y-1">
                        {categories
                          .filter(cat => cat.assessmentTypeId === type.id)
                          .filter(cat => 
                            searchTerm === '' || 
                            cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map(category => {
                            const categoryQuestions = questions.filter(q => q.categoryId === category.id);
                            return (
                              <div key={category.id} className="bg-white rounded border">
                                {editingCategory === category.id ? (
                                  <div className="p-2">
                                    <form onSubmit={handleSaveCategory} className="space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs font-medium">Assessment Type</label>
                                          <select 
                                            value={editCategory.assessmentTypeId} 
                                            onChange={(e) => setEditCategory(prev => ({ ...prev, assessmentTypeId: e.target.value }))}
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            {assessmentTypes.map(type => (
                                              <option key={type.id} value={type.id.toString()}>
                                                {type.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium">Display Order</label>
                                          <Input
                                            type="number"
                                            value={editCategory.displayOrder}
                                            onChange={(e) => setEditCategory(prev => ({ ...prev, displayOrder: e.target.value }))}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium">Category Name</label>
                                        <Input
                                          value={editCategory.name}
                                          onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
                                          placeholder="e.g., Communication"
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium">Description</label>
                                        <textarea
                                          value={editCategory.description}
                                          onChange={(e) => setEditCategory(prev => ({ ...prev, description: e.target.value }))}
                                          placeholder="Describe what this category measures..."
                                          className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                      </div>
                                      <div className="flex gap-1">
                                        <Button type="submit" size="sm" className="flex-1 h-7 text-xs">
                                          Save
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 text-xs">
                                          Cancel
                                        </Button>
                                      </div>
                                    </form>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between p-2">
                                    <div>
                                      <div className="font-medium">{category.name}</div>
                                      <div className="text-sm text-muted-foreground">{category.description}</div>
                                                                        <div className="flex gap-2 mt-1">
                                    <button
                                      onClick={() => router.push(`/builder/category/${category.id}`)}
                                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors cursor-pointer"
                                    >
                                      {categoryQuestions.length} Questions
                                    </button>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                      Order: {category.displayOrder}
                                    </span>
                                  </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => handleEditCategory(category)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost"
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                  {assessmentTypes.filter(type => categories.some(cat => cat.assessmentTypeId === type.id)).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No categories found. Create your first category above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleCreateTemplate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="templateAssessmentType" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assessment Type</label>
                      <select 
                        id="templateAssessmentType"
                        value={newTemplate.assessmentTypeId} 
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTemplate(prev => ({ ...prev, assessmentTypeId: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select assessment type</option>
                        {assessmentTypes.map(type => (
                          <option key={type.id} value={type.id.toString()}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="templateVersion" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Version</label>
                      <Input
                        id="templateVersion"
                        value={newTemplate.version}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="e.g., v1.0"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="templateName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Template Name</label>
                    <Input
                      id="templateName"
                      value={newTemplate.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Manager Self-Assessment"
                    />
                  </div>
                  <div>
                    <label htmlFor="templateDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                    <textarea
                      id="templateDescription"
                      value={newTemplate.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this template..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Existing Templates</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Search and Filter Bar */}
                <div className="mb-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">All Assessment Types</option>
                      {assessmentTypes.map(type => (
                        <option key={type.id} value={type.id.toString()}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {(selectedTypeFilter || searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTypeFilter('');
                          setSearchTerm('');
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {templates
                    .filter(template => {
                      // Filter by selected type if specified
                      if (selectedTypeFilter && template.assessmentTypeId.toString() !== selectedTypeFilter) {
                        return false;
                      }
                      // Filter by search term
                      if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !(template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
                          !template.assessmentTypeName.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return false;
                      }
                      return true;
                    })
                    .map(template => (
                    <div key={template.id} className="border rounded-lg bg-muted/30">
                      {editingTemplate === template.id ? (
                        <div className="p-3">
                          <form onSubmit={handleSaveTemplate} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm font-medium">Assessment Type</label>
                                <select 
                                  value={editTemplate.assessmentTypeId} 
                                  onChange={(e) => setEditTemplate(prev => ({ ...prev, assessmentTypeId: e.target.value }))}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {assessmentTypes.map(type => (
                                    <option key={type.id} value={type.id.toString()}>
                                      {type.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Version</label>
                                <Input
                                  value={editTemplate.version}
                                  onChange={(e) => setEditTemplate(prev => ({ ...prev, version: e.target.value }))}
                                  placeholder="e.g., v1.0"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Template Name</label>
                              <Input
                                value={editTemplate.name}
                                onChange={(e) => setEditTemplate(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Manager Self-Assessment"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <textarea
                                value={editTemplate.description}
                                onChange={(e) => setEditTemplate(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe this template..."
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" className="flex-1">
                                Save Changes
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3">
                          <div>
                            <div className="font-semibold">{template.name}</div>
                            <div className="text-sm text-muted-foreground">{template.description}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{template.assessmentTypeName}</span>
                              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">{template.version}</span>
                              <button
                                onClick={() => router.push(`/builder/template/${template.id}`)}
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                              >
                                {questions.filter(q => q.templateId === template.id).length} Questions
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab('instances');
                                  setSelectedTypeFilter(template.id.toString());
                                  setSearchTerm('');
                                }}
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer"
                              >
                                {instances.filter(i => i.templateId === template.id).length} Instances
                              </button>
                              <button
                                onClick={() => {
                                  setActiveTab('invitations');
                                  setSelectedTypeFilter(template.id.toString());
                                  setSearchTerm('');
                                }}
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors cursor-pointer"
                              >
                                {invitations.filter(inv => inv.templateId === template.id).length} Invitations
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                console.log('Edit Questions button clicked for template:', template.id);
                                console.log('Navigating to:', `/builder/template/${template.id}`);
                                router.push(`/builder/template/${template.id}`);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Questions
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(template.id, template.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Create New Period</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleCreatePeriod} className="space-y-3">
                <div>
                  <label htmlFor="periodName" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Period Name</label>
                  <Input
                    id="periodName"
                    value={newPeriod.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Q1 2024"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Start Date</label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">End Date</label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={newPeriod.isActive}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPeriod(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active Period</label>
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Period
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Existing Periods</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Search Bar */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search periods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {periods
                  .filter(period => 
                    searchTerm === '' || 
                    period.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    period.startDate.includes(searchTerm) ||
                    period.endDate.includes(searchTerm)
                  )
                  .map(period => (
                  <div key={period.id} className="border rounded-lg bg-muted/30">
                    {editingPeriod === period.id ? (
                      <div className="p-3">
                        <form onSubmit={handleSavePeriod} className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Period Name</label>
                            <Input
                              value={editPeriod.name}
                              onChange={(e) => setEditPeriod(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., Q1 2024"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm font-medium">Start Date</label>
                              <Input
                                type="date"
                                value={editPeriod.startDate}
                                onChange={(e) => setEditPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">End Date</label>
                              <Input
                                type="date"
                                value={editPeriod.endDate}
                                onChange={(e) => setEditPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              id={`isActive-${period.id}`}
                              type="checkbox"
                              checked={editPeriod.isActive}
                              onChange={(e) => setEditPeriod(prev => ({ ...prev, isActive: e.target.checked }))}
                            />
                            <label htmlFor={`isActive-${period.id}`} className="text-sm font-medium">Active Period</label>
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" size="sm" className="flex-1">
                              Save Changes
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3">
                        <div>
                          <div className="font-semibold">{period.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {period.startDate} - {period.endDate}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {period.isActive ? (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground">Active</span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">Inactive</span>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab('instances');
                              setSelectedTypeFilter(period.id.toString());
                              setSearchTerm('');
                            }}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors cursor-pointer"
                          >
                            {instances.filter(i => i.periodId === period.id).length} Instances
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('invitations');
                              setSelectedTypeFilter(period.id.toString());
                              setSearchTerm('');
                            }}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors cursor-pointer"
                          >
                            {invitations.filter(inv => inv.periodId === period.id).length} Invitations
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('relationships');
                              setSelectedTypeFilter(period.id.toString());
                              setSearchTerm('');
                            }}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors cursor-pointer"
                          >
                            {managerRelationships.filter(rel => rel.periodId === period.id).length} Relationships
                          </button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditPeriod(period)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeletePeriod(period.id, period.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assessment Instances</CardTitle>
              <CardDescription>
                View and manage assessment instances across all templates and periods
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Search and Filter Bar */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search instances..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Templates</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id.toString()}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Periods</option>
                    {periods.map(period => (
                      <option key={period.id} value={period.id.toString()}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                  {(selectedTypeFilter || selectedCategoryFilter || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTypeFilter('');
                        setSelectedCategoryFilter('');
                        setSearchTerm('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {instances
                  .filter(instance => {
                    // Filter by selected template if specified
                    if (selectedTypeFilter && instance.templateId.toString() !== selectedTypeFilter) {
                      return false;
                    }
                    // Filter by selected period if specified
                    if (selectedCategoryFilter && instance.periodId.toString() !== selectedCategoryFilter) {
                      return false;
                    }
                    // Filter by search term
                    if (searchTerm && !instance.status?.toLowerCase().includes(searchTerm.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map(instance => (
                    <div key={instance.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Instance #{instance.id}</div>
                          <div className="text-sm text-muted-foreground">
                            Status: {instance.status || 'Unknown'}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                              Template: {templates.find(t => t.id === instance.templateId)?.name || 'Unknown'}
                            </span>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              Period: {periods.find(p => p.id === instance.periodId)?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {instances.filter(instance => {
                  if (selectedTypeFilter && instance.templateId.toString() !== selectedTypeFilter) return false;
                  if (selectedCategoryFilter && instance.periodId.toString() !== selectedCategoryFilter) return false;
                  if (searchTerm && !instance.status?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No instances found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Invitations</CardTitle>
              <CardDescription>
                View and manage assessment invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Search and Filter Bar */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search invitations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Templates</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id.toString()}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Periods</option>
                    {periods.map(period => (
                      <option key={period.id} value={period.id.toString()}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                  {(selectedTypeFilter || selectedCategoryFilter || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTypeFilter('');
                        setSelectedCategoryFilter('');
                        setSearchTerm('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {invitations
                  .filter(invitation => {
                    // Filter by selected template if specified
                    if (selectedTypeFilter && invitation.templateId.toString() !== selectedTypeFilter) {
                      return false;
                    }
                    // Filter by selected period if specified
                    if (selectedCategoryFilter && invitation.periodId.toString() !== selectedCategoryFilter) {
                      return false;
                    }
                    // Filter by search term
                    if (searchTerm && !invitation.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !invitation.status?.toLowerCase().includes(searchTerm.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map(invitation => (
                    <div key={invitation.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{invitation.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {invitation.firstName} {invitation.lastName} - {invitation.status}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                              {templates.find(t => t.id === invitation.templateId)?.name || 'Unknown Template'}
                            </span>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              {periods.find(p => p.id === invitation.periodId)?.name || 'Unknown Period'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {invitations.filter(invitation => {
                  if (selectedTypeFilter && invitation.templateId.toString() !== selectedTypeFilter) return false;
                  if (selectedCategoryFilter && invitation.periodId.toString() !== selectedCategoryFilter) return false;
                  if (searchTerm && !invitation.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !invitation.status?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No invitations found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Manager Relationships</CardTitle>
              <CardDescription>
                View and manage manager-subordinate relationships by period
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Search and Filter Bar */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search relationships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">All Periods</option>
                    {periods.map(period => (
                      <option key={period.id} value={period.id.toString()}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                  {(selectedCategoryFilter || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryFilter('');
                        setSearchTerm('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {managerRelationships
                  .filter(relationship => {
                    // Filter by selected period if specified
                    if (selectedCategoryFilter && relationship.periodId.toString() !== selectedCategoryFilter) {
                      return false;
                    }
                    // Filter by search term
                    if (searchTerm && !relationship.managerId?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                        !relationship.subordinateId?.toLowerCase().includes(searchTerm.toLowerCase())) {
                      return false;
                    }
                    return true;
                  })
                  .map(relationship => (
                    <div key={relationship.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">Manager: {relationship.managerId}</div>
                          <div className="text-sm text-muted-foreground">
                            Subordinate: {relationship.subordinateId}
                          </div>
                          <div className="flex gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              {periods.find(p => p.id === relationship.periodId)?.name || 'Unknown Period'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {managerRelationships.filter(relationship => {
                  if (selectedCategoryFilter && relationship.periodId.toString() !== selectedCategoryFilter) return false;
                  if (searchTerm && !relationship.managerId?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      !relationship.subordinateId?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No relationships found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
} 