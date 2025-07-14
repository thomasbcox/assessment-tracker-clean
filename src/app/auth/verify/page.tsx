'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sessionManager } from '@/lib/session';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No token provided');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          
          // Store user data in session
          sessionManager.createSession(result.user, token);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setMessage(result.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-fade-in-up">
        <div className="text-center">
          <div className="mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {status === 'loading' && 'Verifying Login'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          
          <p className="text-gray-600 mb-6 text-sm">
            {status === 'loading' && 'Please wait while we verify your login...'}
            {status === 'success' && 'You will be redirected to your dashboard shortly.'}
            {status === 'error' && 'There was a problem with your login link.'}
          </p>

          {status === 'loading' && (
            <div className="space-y-3">
              <p className="text-gray-500 text-sm">Verifying your credentials...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <p className="text-red-600 font-medium text-sm">{message}</p>
              <button 
                onClick={() => router.push('/')}
                className="btn-modern w-full gradient-primary text-white"
              >
                Back to Login
              </button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-green-600 font-medium text-sm">{message}</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-500 text-sm">Redirecting...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 