'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/session';

interface MagicLink {
  id: number;
  email: string;
  token: string;
  expiresAt: string;
  used: number;
  createdAt: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<MagicLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/admin/tokens');
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cleanup-tokens' }),
      });

      if (response.ok) {
        // Refresh the tokens list
        await fetchTokens();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      setCleanupLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isUsed = (used: number) => {
    return used === 1;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Magic Link Tokens</h1>
        <Button 
          onClick={handleCleanup} 
          disabled={cleanupLoading}
          variant="outline"
        >
          {cleanupLoading ? 'Cleaning...' : 'Cleanup Expired Tokens'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Management</CardTitle>
          <CardDescription>
            View and manage magic link tokens. Expired tokens are automatically cleaned up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokens.length === 0 ? (
              <p className="text-gray-500">No tokens found.</p>
            ) : (
              <div className="grid gap-4">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className={`p-4 border rounded-lg ${
                      isExpired(token.expiresAt)
                        ? 'bg-gray-50 border-gray-200'
                        : isUsed(token.used)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="font-medium">{token.email}</p>
                        <p className="text-sm text-gray-600">
                          Token: {token.token.substring(0, 16)}...
                        </p>
                        <p className="text-sm text-gray-600">
                          Created: {formatDate(token.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expires: {formatDate(token.expiresAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        {isExpired(token.expiresAt) && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Expired
                          </span>
                        )}
                        {isUsed(token.used) && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Used
                          </span>
                        )}
                        {!isExpired(token.expiresAt) && !isUsed(token.used) && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 