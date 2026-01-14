'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

function AccountContent() {
  const { user, entitlements, loading, signUp, signIn, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const redirect = searchParams.get('redirect');
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  useEffect(() => {
    if (user && redirect) {
      router.push(redirect);
    }
  }, [user, redirect, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const result = mode === 'signup'
        ? await signUp(email, password)
        : await signIn(email, password);

      if (result.error) {
        setError(result.error.message);
      } else if (mode === 'signup') {
        setSuccess('Account created! Please check your email to verify your account.');
        setMode('signin');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        {checkoutSuccess && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
            Your subscription has been activated! Thank you for upgrading.
          </div>
        )}

        <Card variant="bordered" className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Plan
              </label>
              <div className="flex items-center space-x-3">
                <Badge
                  variant={
                    entitlements?.plan === 'pro'
                      ? 'success'
                      : entitlements?.plan === 'plus'
                      ? 'info'
                      : 'default'
                  }
                >
                  {entitlements?.plan?.toUpperCase() || 'FREE'}
                </Badge>
                {entitlements?.plan === 'free' && (
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Entitlements
              </label>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Commutes: {entitlements?.commutes_limit}</li>
                <li>
                  Alert categories:{' '}
                  {entitlements?.categories_limited ? 'Major only' : 'All'}
                </li>
                <li>
                  Early warning:{' '}
                  {entitlements?.early_warning ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  Confidence breakdown:{' '}
                  {entitlements?.confidence_breakdown ? 'Enabled' : 'Disabled'}
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Card variant="bordered" className="p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-gray-600 text-sm">
            {mode === 'signin'
              ? 'Sign in to access your saved commutes and alerts'
              : 'Create a free account to save your progress'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={6}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={submitting}
          >
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                Don&#39;t have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 pt-6 border-t text-center">
          <Link href="/app" className="text-sm text-gray-500 hover:text-gray-700">
            Continue without an account
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
