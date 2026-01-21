'use client';

import { Suspense, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';

function AccountContent() {
  const { user, entitlements, loading, signInWithGoogle, signOut } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect = searchParams.get('redirect');
  const checkoutSuccess = searchParams.get('checkout') === 'success';

  useEffect(() => {
    if (user && redirect) {
      router.push(redirect);
    }
  }, [user, redirect, router]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        {checkoutSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
            Your subscription has been activated! Thank you for upgrading.
          </div>
        )}

        <Card variant="bordered" className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
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
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Entitlements
              </label>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
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

            <div className="pt-4 border-t dark:border-slate-600">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Sign in to access your saved commutes and alerts
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full flex items-center justify-center space-x-2"
          onClick={signInWithGoogle}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google</span>
        </Button>

        <div className="mt-6 pt-6 border-t dark:border-slate-600 text-center">
          <Link href="/app" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
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
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
