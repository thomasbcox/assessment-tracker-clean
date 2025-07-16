'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, GripVertical, Save, X } from 'lucide-react';

interface Question {
  id: number;
  templateId: number;
  categoryId: number;
  questionText: string;
  displayOrder: number;
  categoryName: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

interface Template {
  id: number;
  name: string;
  version: string;
  description: string;
  assessmentTypeName: string;
}

export default function TemplateEditorPage() {
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<Template | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState({
    categoryId: '',
    questionText: '',
    displayOrder: ''
  });
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (session && session.user.role !== 'super-admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Load data
  useEffect(() => {
    if (session?.user.role === 'super-admin' && templateId) {
      loadData();
    }
  }, [session, templateId]);

  const loadData = async () => {
    try {
      const [templateRes, categoriesRes, questionsRes] = await Promise.all([
        fetch(`/api/assessment-templates/${templateId}`),
        fetch(`/api/assessment-templates/${templateId}/categories`),
        fetch(`/api/assessment-templates/${templateId}/questions`)
      ]);

      if (templateRes.ok) setTemplate(await templateRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (questionsRes.ok) setQuestions(await questionsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/assessment-templates/${templateId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion)
      });
      
      if (response.ok) {
        setNewQuestion({ categoryId: '', questionText: '', displayOrder: '' });
        setShowNewQuestionForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    try {
      const response = await fetch(`/api/assessment-questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editingQuestion.categoryId,
          questionText: editingQuestion.questionText,
          displayOrder: editingQuestion.displayOrder
        })
      });
      
      if (response.ok) {
        setEditingQuestion(null);
        loadData();
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      const response = await fetch(`/api/assessment-questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            Please log in to access the template editor.
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
            You don't have permission to access the template editor.
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

  if (!template) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">
              {template.description} - {template.assessmentTypeName} v{template.version}
            </p>
          </div>
          <Button onClick={() => router.push('/builder')} variant="outline">
            Back to Builder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories and Questions */}
        <div className="lg:col-span-2 space-y-6">
          {categories
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(category => {
              const categoryQuestions = questions
                .filter(q => q.categoryId === category.id)
                .sort((a, b) => a.displayOrder - b.displayOrder);
              
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setNewQuestion(prev => ({ ...prev, categoryId: category.id.toString() }));
                          setShowNewQuestionForm(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryQuestions.map(question => (
                        <div key={question.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <div className="flex-1">
                            {editingQuestion?.id === question.id ? (
                              <form onSubmit={handleUpdateQuestion} className="space-y-2">
                                <Input
                                  value={editingQuestion.questionText}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setEditingQuestion(prev => prev ? { ...prev, questionText: e.target.value } : null)
                                  }
                                  placeholder="Question text..."
                                />
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={editingQuestion.displayOrder}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      setEditingQuestion(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) } : prev)
                                    }
                                    placeholder="Order"
                                    className="w-20"
                                  />
                                  <Button type="submit" size="sm">
                                    <Save className="w-4 h-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setEditingQuestion(null)}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <div>
                                <p className="font-medium">{question.questionText}</p>
                                <p className="text-sm text-muted-foreground">Order: {question.displayOrder}</p>
                              </div>
                            )}
                          </div>
                          {editingQuestion?.id !== question.id && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingQuestion(question)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {categoryQuestions.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          No questions in this category yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* New Question Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Question</CardTitle>
              <CardDescription>
                Create a new question for this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showNewQuestionForm ? (
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={newQuestion.categoryId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                        setNewQuestion(prev => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="w-full mt-1 p-2 border rounded-md"
                      required
                    >
                      <option value="">Select category</option>
                      {categories
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Question Text</label>
                    <textarea
                      value={newQuestion.questionText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))
                      }
                      className="w-full mt-1 p-2 border rounded-md min-h-[80px]"
                      placeholder="Enter the question text..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Display Order</label>
                    <Input
                      type="number"
                      value={newQuestion.displayOrder}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewQuestion(prev => ({ ...prev, displayOrder: e.target.value }))
                      }
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowNewQuestionForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button 
                  onClick={() => setShowNewQuestionForm(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Question
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 