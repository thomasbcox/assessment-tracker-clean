'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Plus, Edit, Trash2, GripVertical, Save, X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

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

interface BulkQuestion {
  categoryName: string;
  questionText: string;
  displayOrder: number;
}

export default function TemplateEditorPage() {
  const { session } = useSession();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const { addToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  
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
  
  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<BulkQuestion[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

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
        addToast({
          message: 'Question created successfully',
          type: 'success'
        });
        setNewQuestion({ categoryId: '', questionText: '', displayOrder: '' });
        setShowNewQuestionForm(false);
        loadData();
      } else {
        addToast({
          message: 'Failed to create question',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creating question:', error);
      addToast({
        message: 'An error occurred while creating the question',
        type: 'error'
      });
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
        addToast({
          message: 'Question updated successfully',
          type: 'success'
        });
        setEditingQuestion(null);
        loadData();
      } else {
        addToast({
          message: 'Failed to update question',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating question:', error);
      addToast({
        message: 'An error occurred while updating the question',
        type: 'error'
      });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    const confirmed = await showConfirm({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    try {
      const response = await fetch(`/api/assessment-questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        addToast({
          message: 'Question deleted successfully',
          type: 'success'
        });
        loadData();
      } else {
        addToast({
          message: 'Failed to delete question',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      addToast({
        message: 'An error occurred while deleting the question',
        type: 'error'
      });
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
    
    try {
      const response = await fetch(`/api/assessment-categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        addToast({
          message: result.message || 'Category deleted successfully',
          type: 'success'
        });
        loadData();
      } else {
        const errorData = await response.json();
        if (response.status === 400 && errorData.error === 'Cannot delete category with existing questions') {
          addToast({
            message: `Cannot delete category "${categoryName}": ${errorData.message}. This category has ${errorData.questionCount} question(s). Please delete or move all questions before deleting the category.`,
            type: 'error',
            duration: 8000
          });
        } else {
          addToast({
            message: `Error deleting category: ${errorData.error || response.statusText}`,
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      addToast({
        message: 'An error occurred while trying to delete the category.',
        type: 'error'
      });
    }
  };

  // Bulk import functions
  const parseBulkText = () => {
    setImportStatus('parsing');
    setImportMessage('Parsing questions...');
    
    try {
      const lines = bulkText.split('\n').filter(line => line.trim());
      const parsed: BulkQuestion[] = [];
      let currentCategory = '';
      let questionOrder = 1;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Check if line is a category (starts with # or is a known category name)
        if (trimmed.startsWith('#') || categories.some(cat => 
          cat.name.toLowerCase() === trimmed.toLowerCase()
        )) {
          currentCategory = trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed;
          questionOrder = 1; // Reset order for new category
          continue;
        }
        
        // If we have a category and this line looks like a question
        if (currentCategory && trimmed.length > 10 && !trimmed.startsWith('-')) {
          parsed.push({
            categoryName: currentCategory,
            questionText: trimmed,
            displayOrder: questionOrder++
          });
        }
      }
      
      setParsedQuestions(parsed);
      setImportStatus('idle');
      setImportMessage(`Parsed ${parsed.length} questions from ${new Set(parsed.map(q => q.categoryName)).size} categories`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Error parsing questions. Please check the format.');
    }
  };

  const importQuestions = async () => {
    if (parsedQuestions.length === 0) return;
    
    setIsImporting(true);
    setImportStatus('importing');
    setImportMessage('Importing questions...');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const question of parsedQuestions) {
        try {
          // Find the category ID
          const category = categories.find(cat => 
            cat.name.toLowerCase() === question.categoryName.toLowerCase()
          );
          
          if (!category) {
            errorCount++;
            continue;
          }
          
          const response = await fetch(`/api/assessment-templates/${templateId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: category.id.toString(),
              questionText: question.questionText,
              displayOrder: question.displayOrder.toString()
            })
          });
          
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }
      
      setImportStatus('success');
      setImportMessage(`Successfully imported ${successCount} questions${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      
      // Reload data and clear form
      await loadData();
      setBulkText('');
      setParsedQuestions([]);
      
      setTimeout(() => {
        setImportStatus('idle');
        setImportMessage('');
      }, 3000);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Error importing questions. Please try again.');
    } finally {
      setIsImporting(false);
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
    <DashboardLayout>
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

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
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
                            <div className="flex gap-2">
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
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Category
                              </Button>
                            </div>
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
          </TabsContent>

          <TabsContent value="bulk-import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Questions</CardTitle>
                <CardDescription>
                  Paste multiple questions at once. Use category names or #CategoryName to organize questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Import Status */}
                {importMessage && (
                  <div className={`p-4 rounded-lg border ${
                    importStatus === 'success' ? 'bg-green-50 border-green-200' :
                    importStatus === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {importStatus === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : importStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      )}
                      <span className={importStatus === 'success' ? 'text-green-800' : 
                                      importStatus === 'error' ? 'text-red-800' : 'text-blue-800'}>
                        {importMessage}
                      </span>
                    </div>
                  </div>
                )}

                {/* Text Input */}
                <div>
                  <label className="text-sm font-medium block mb-2">Questions Text</label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                    placeholder={`#Sage Mind
I stay calm and composed under pressure
I approach challenges with curiosity and empathy
I maintain emotional balance in difficult situations

#Relating
I build trust through active listening
I ask thoughtful questions to understand others
I include diverse perspectives in decision-making

#Requiring
I set clear expectations and standards
I follow up consistently on commitments
I address problems directly and constructively`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={parseBulkText}
                    disabled={!bulkText.trim() || importStatus === 'parsing'}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Parse Questions
                  </Button>
                  <Button
                    onClick={importQuestions}
                    disabled={parsedQuestions.length === 0 || isImporting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import {parsedQuestions.length > 0 ? `(${parsedQuestions.length})` : ''}
                  </Button>
                </div>

                {/* Preview */}
                {parsedQuestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Preview</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {Array.from(new Set(parsedQuestions.map(q => q.categoryName))).map(categoryName => (
                        <div key={categoryName} className="border rounded-lg p-4">
                          <h4 className="font-semibold text-blue-600 mb-2">{categoryName}</h4>
                          <div className="space-y-2">
                            {parsedQuestions
                              .filter(q => q.categoryName === categoryName)
                              .map((question, index) => (
                                <div key={index} className="text-sm pl-4 border-l-2 border-gray-200">
                                  <span className="text-gray-500 mr-2">#{question.displayOrder}</span>
                                  {question.questionText}
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 