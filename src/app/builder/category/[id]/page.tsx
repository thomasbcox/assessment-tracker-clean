'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';

interface Question {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
  isActive: number;
  templateName?: string;
  categoryName?: string;
}

interface Category {
  id: number;
  assessmentTypeId: number;
  name: string;
  description: string;
  displayOrder: number;
  assessmentTypeName?: string;
}

export default function CategoryQuestionsPage() {
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is super admin
  useEffect(() => {
    if (session && session.user.role !== 'super-admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load data
  useEffect(() => {
    if (session?.user.role === 'super-admin' && categoryId) {
      loadData();
    }
  }, [session, categoryId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoryRes, questionsRes] = await Promise.all([
        fetch(`/api/assessment-categories/${categoryId}`),
        fetch(`/api/assessment-categories/${categoryId}/questions`)
      ]);

      if (categoryRes.ok) setCategory(await categoryRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">

          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            Please log in to access this page.
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

          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!category) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">

            <h3 className="text-xl font-semibold mb-2">Category Not Found</h3>
            <p className="text-gray-600 mb-6">
              The category you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/builder')}>
              Return to Builder
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/builder')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Builder
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-8 bg-gradient-to-b from-brand-dark-blue to-brand-medium-blue rounded-full"></div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">{category.name}</h1>
          </div>
          
          {category.description && (
            <p className="text-muted-foreground ml-5 mb-4">
              {category.description}
            </p>
          )}
          
          <div className="flex gap-4 ml-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {questions.length} Questions
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Display Order: {category.displayOrder}
            </div>
            {category.assessmentTypeName && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {category.assessmentTypeName}
              </div>
            )}
          </div>
        </div>

        {/* Questions List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Questions in this Category</CardTitle>
            <CardDescription>
              These questions appear in the following templates. Questions should be edited within their template context.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Questions Found</p>
                <p>This category doesn't have any questions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-dark-blue text-white text-xs font-semibold">
                              {question.displayOrder}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">
                              Question #{index + 1}
                            </span>
                          </div>
                          <p className="text-base mb-3">{question.questionText}</p>
                          {question.templateName && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span>Template: {question.templateName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/builder/template/${question.templateId}`)}
                          >
                            Edit in Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 