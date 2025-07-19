import React, { createContext, useContext, useState, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
  showConfirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((dialogOptions: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolvePromise) => {
      setOptions(dialogOptions);
      setResolve(() => resolvePromise);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolve) {
      resolve(true);
      setResolve(null);
    }
  }, [resolve]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolve) {
      resolve(false);
      setResolve(null);
    }
  }, [resolve]);

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm }}>
      {children}
      {isOpen && options && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${
                options.variant === 'danger' ? 'text-red-600' : 
                options.variant === 'warning' ? 'text-yellow-600' : 
                'text-gray-900'
              }`}>
                {options.variant === 'danger' && (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {options.variant === 'warning' && (
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                {options.title}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {options.message}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                {options.cancelText || 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirm}
                className={`flex-1 sm:flex-none ${
                  options.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  options.variant === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {options.confirmText || 'Confirm'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
} 