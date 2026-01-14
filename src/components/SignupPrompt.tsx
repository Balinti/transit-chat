'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { hasMeaningfulAction } from '@/lib/localStorage';
import Button from './ui/Button';
import Card from './ui/Card';

export default function SignupPrompt() {
  const { user, loading } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!loading && !user && hasMeaningfulAction() && !dismissed) {
      // Show prompt after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, user, dismissed]);

  if (!showPrompt || loading || user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card variant="elevated" className="p-4 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">Save your progress</h3>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Create a free account to save your commutes and get personalized alerts.
        </p>
        <div className="flex space-x-2">
          <Link href="/account">
            <Button variant="primary" size="sm">
              Create Account
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Maybe later
          </Button>
        </div>
      </Card>
    </div>
  );
}
