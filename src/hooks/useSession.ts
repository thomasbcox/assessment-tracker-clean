import { useState, useEffect } from 'react';
import { sessionManager, Session } from '@/lib/session';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentSession = sessionManager.getSession();
    setSession(currentSession);
    setLoading(false);
  }, []);

  return { session, loading };
} 