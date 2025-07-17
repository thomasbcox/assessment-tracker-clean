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

export default function BuilderPage() {
  const { session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('categories');
  
  // Data states
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [periods, setPeriods] = useState<AssessmentPeriod[]>([]);
  
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
      const [typesRes, categoriesRes, templatesRes, periodsRes] = await Promise.all([
        fetch('/api/assessment-types'),
        fetch('/api/assessment-categories'),
        fetch('/api/assessment-templates'),
        fetch('/api/assessment-periods')
      ]);

      if (typesRes.ok) setAssessmentTypes(await typesRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (templatesRes.ok) setTemplates(await templatesRes.json());
      if (periodsRes.ok) setPeriods(await periodsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            Please log in to access the template builder.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Template Builder</h1>
          <p className="text-muted-foreground">
            Create and manage assessment categories, templates, and periods
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="periods">Periods</TabsTrigger>
          </TabsList>

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
                  {assessmentTypes.map(type => (
                    <div key={type.id} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">{type.name}</h3>
                      <div className="space-y-2">
                        {categories
                          .filter(cat => cat.assessmentTypeId === type.id)
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map(category => (
                            <div key={category.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <div className="font-medium">{category.name}</div>
                                <div className="text-sm text-muted-foreground">{category.description}</div>
                              </div>
                                                         <div className="flex items-center gap-2">
                               <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">Order: {category.displayOrder}</span>
                               <Button size="sm" variant="ghost">
                                 <Edit className="w-4 h-4" />
                               </Button>
                               <Button size="sm" variant="ghost">
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
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
                        onClick={() => router.push(`/builder/template/${template.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Questions
                      </Button>
                      <Button size="sm" variant="ghost">
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
                      <Button size="sm" variant="ghost">
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