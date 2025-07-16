"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/forms/login-form';
import { sessionManager } from '@/lib/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = sessionManager.getUser();
    if (user) {
      router.replace('/dashboard');
    }
  }, [router]);

  return <LoginForm />;
}
