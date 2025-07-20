'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
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

  // Loading state
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (session && session.user.role !== 'super-admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load data
  useEffect(() => {
    if (session?.user.role === 'super-admin') {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const [typesRes, categoriesRes, templatesRes, periodsRes, questionsRes] = await Promise.all([
        fetch('/api/assessment-types'),
        fetch('/api/assessment-categories'),
        fetch('/api/assessment-templates'),
        fetch('/api/assessment-periods'),
        fetch('/api/assessment-questions')
      ]);

      if (typesRes.ok) setAssessmentTypes(await typesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (periodsRes.ok) setPeriods(await periodsRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
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

  if (session.user.role !== 'super-admin') {
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
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-brand-dark-blue to-brand-medium-blue rounded-full"></div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">Template Builder</h1>
          </div>
          <p className="text-muted-foreground ml-5">
            Create and manage assessment categories, templates, and periods
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm border-2 border-[#2A527A]/20 rounded-xl p-1.5 shadow-lg">
            <TabsTrigger 
              value="types"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-5 py-3 text-[#2A527A] font-medium hover:bg-[#2A527A]/5"
            >
              Assessment Types
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-5 py-3 text-[#2A527A] font-medium hover:bg-[#2A527A]/5"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-5 py-3 text-[#2A527A] font-medium hover:bg-[#2A527A]/5"
            >
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="periods"
              className="data-[state=active]:bg-[#2A527A] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-md data-[state=active]:-translate-y-0.5 transition-all duration-200 rounded-lg px-5 py-3 text-[#2A527A] font-medium hover:bg-[#2A527A]/5"
            >
              Periods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="types" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Assessment Type</CardTitle>
                <CardDescription>
                  Create a new assessment type (e.g., Manager Self-Assessment, Team Member Assessment)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateType} className="space-y-4">
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
                  <div>
                    <label htmlFor="typeDescription" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Description</label>
                    <textarea
                      id="typeDescription"
                      value={newType.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this assessment type..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="typePurpose" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Purpose</label>
                    <textarea
                      id="typePurpose"
                      value={newType.purpose}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewType(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="What is the purpose of this assessment type?"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assessment Type
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Assessment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentTypes.map(type => {
                    const typeCategories = categories.filter(cat => cat.assessmentTypeId === type.id);
                    const typeTemplates = templates.filter(template => template.assessmentTypeId === type.id);
                    
                    return (
                      <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{type.name}</div>
                          {type.description && (
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          )}
                          {type.purpose && (
                            <div className="text-sm text-muted-foreground">{type.purpose}</div>
                          )}
                          <div className="flex gap-2 mt-1">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                              {typeCategories.length} Categories
                            </span>
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              {typeTemplates.length} Templates
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
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
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Category</CardTitle>
                <CardDescription>
                  Add a new category to an assessment type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentTypes
                    .filter(type => categories.some(cat => cat.assessmentTypeId === type.id))
                    .map(type => (
                    <div key={type.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{type.name}</h3>
                      <div className="space-y-2">
                        {categories
                          .filter(cat => cat.assessmentTypeId === type.id)
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map(category => {
                            const categoryQuestions = questions.filter(q => q.categoryId === category.id);
                            return (
                              <div key={category.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                  <div className="text-sm text-muted-foreground">{category.description}</div>
                                  <div className="flex gap-2 mt-1">
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800">
                                      {categoryQuestions.length} Questions
                                    </span>
                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                                      Order: {category.displayOrder}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost">
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

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
                <CardDescription>
                  Create a new assessment template with versioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
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
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map(template => (
                    <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-semibold">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                                             <div className="flex gap-2 mt-1">
                         <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{template.assessmentTypeName}</span>
                         <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">{template.version}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          console.log('Edit Questions button clicked for template:', template.id);
                          console.log('Navigating to:', `/builder/template/${template.id}`);
                          router.push(`/builder/template/${template.id}`);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Questions
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Period</CardTitle>
              <CardDescription>
                Create a new assessment period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePeriod} className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle>Existing Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {periods.map(period => (
                  <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
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
                      <Button size="sm" variant="ghost">
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
} 