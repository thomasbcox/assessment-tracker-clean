'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@radix-ui/react-progress';
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface AssessmentInstance {
  id: number;
  userId: string;
  periodId: number;
  templateId: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt: string | null;
  completedAt: string | null;
  periodName: string;
  templateName: string;
  templateVersion: string;
  assessmentTypeName: string;
}

interface Question {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
  categoryName: string;
  categoryDescription: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

interface Response {
  questionId: number;
  score: number;
}

export default function AssessmentPage() {
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;
  
  const [assessment, setAssessment] = useState<AssessmentInstance | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Check authentication
  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  // Load assessment data
  useEffect(() => {
    if (session && assessmentId) {
      loadAssessmentData();
    }
  }, [session, assessmentId]);

  const loadAssessmentData = async () => {
    try {
      const [assessmentRes, questionsRes, responsesRes] = await Promise.all([
        fetch(`/api/assessment-instances/${assessmentId}`),
        fetch(`/api/assessment-templates/${assessmentId}/questions`),
        fetch(`/api/assessment-instances/${assessmentId}/responses`)
      ]);

      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        setAssessment(assessmentData);
        
        // Load categories for this template
        const categoriesRes = await fetch(`/api/assessment-templates/${assessmentData.templateId}/categories`);
        if (categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }
      }

      if (questionsRes.ok) {
        setQuestions(await questionsRes.json());
      }

      if (responsesRes.ok) {
        const responsesData = await responsesRes.json();
        setResponses(responsesData.map((r: any) => ({
          questionId: r.questionId,
          score: r.score
        })));
      }
    } catch (error) {
      console.error('Error loading assessment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId: number, score: number) => {
    setResponses(prev => {
      const existing = prev.find(r => r.questionId === questionId);
      if (existing) {
        return prev.map(r => r.questionId === questionId ? { ...r, score } : r);
      } else {
        return [...prev, { questionId, score }];
      }
    });
  };

  const saveProgress = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Save each response
      for (const response of responses) {
        await fetch('/api/assessment-responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: parseInt(assessmentId),
            questionId: response.questionId,
            score: response.score
          })
        });
      }

      // Update assessment status to in_progress if it was pending
      if (assessment?.status === 'pending') {
        await fetch(`/api/assessment-instances/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' })
        });
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving progress:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const completeAssessment = async () => {
    if (!assessment) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // Save all responses first
      await saveProgress();

      // Validate completion
      const validationRes = await fetch(`/api/assessment-responses/validate-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: parseInt(assessmentId) })
      });

      if (!validationRes.ok) {
        throw new Error('Assessment incomplete');
      }

      // Mark assessment as completed
      await fetch(`/api/assessment-instances/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      setSaveStatus('saved');
      router.push('/dashboard/assessments?completed=true');
    } catch (error) {
      console.error('Error completing assessment:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getQuestionResponse = (questionId: number) => {
    return responses.find(r => r.questionId === questionId)?.score || 0;
  };

  const getCategoryQuestions = (categoryId: number) => {
    return questions
      .filter(q => q.categoryId === categoryId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const getCompletionPercentage = () => {
    if (questions.length === 0) return 0;
    const answeredQuestions = questions.filter(q => 
      responses.some(r => r.questionId === q.id && r.score > 0)
    ).length;
    return Math.round((answeredQuestions / questions.length) * 100);
  };

  const canComplete = () => {
    return questions.every(q => 
      responses.some(r => r.questionId === q.id && r.score > 0)
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue"
            data-testid="loading-spinner"
          ></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assessment) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-dark-blue mb-2">Assessment Not Found</h2>
            <p className="text-brand-dark-blue/70 mb-4">The assessment you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/assessments')}>
              Back to Assessments
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const categoryQuestions = currentCategory ? getCategoryQuestions(currentCategory.id) : [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">{assessment.templateName}</h1>
            <p className="text-brand-dark-blue/70 mt-2">
              {assessment.assessmentTypeName} - {assessment.periodName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={assessment.status === 'completed' ? 'default' : 'secondary'}>
                {assessment.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-brand-dark-blue/60">
                Version {assessment.templateVersion}
              </span>
            </div>
          </div>
          <Button onClick={() => router.push('/dashboard/assessments')} variant="outline">
            Back to Assessments
          </Button>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-brand-dark-blue">Progress</span>
              <span className="text-sm text-brand-dark-blue/60">{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-brand-dark-blue/60">
                {responses.filter(r => r.score > 0).length} of {questions.length} questions answered
              </span>
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-xs text-brand-dark-blue/60">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-brand-dark-blue"></div>
                    Saving...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Saved
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    Error saving
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-brand-dark-blue">Categories</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))}
                  disabled={currentCategoryIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-brand-dark-blue/60">
                  {currentCategoryIndex + 1} of {categories.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentCategoryIndex(Math.min(categories.length - 1, currentCategoryIndex + 1))}
                  disabled={currentCategoryIndex === categories.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category, index) => (
                <Button
                  key={category.id}
                  variant={index === currentCategoryIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentCategoryIndex(index)}
                  className="whitespace-nowrap"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        {currentCategory && (
          <Card>
            <CardHeader>
              <CardTitle>{currentCategory.name}</CardTitle>
              <CardDescription>{currentCategory.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryQuestions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-brand-dark-blue mb-2">
                      {question.questionText}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-brand-dark-blue/60">
                      <span>Strongly Disagree</span>
                      <span>Strongly Agree</span>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                        <Button
                          key={score}
                          variant={getQuestionResponse(question.id) === score ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleResponseChange(question.id, score)}
                          className="h-12"
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-brand-dark-blue/60">
                      <span>1 - Strongly Disagree</span>
                      <span>4 - Neutral</span>
                      <span>7 - Strongly Agree</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={saveProgress}
            disabled={isSaving}
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Progress
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))}
              disabled={currentCategoryIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Category
            </Button>
            
            {currentCategoryIndex < categories.length - 1 ? (
              <Button
                onClick={() => setCurrentCategoryIndex(currentCategoryIndex + 1)}
              >
                Next Category
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={completeAssessment}
                disabled={!canComplete() || isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Assessment
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 