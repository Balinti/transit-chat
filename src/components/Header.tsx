'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, role, entitlements, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2" aria-label="TransitPulse Home">
              <span className="text-2xl" aria-hidden="true">🚇</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">TransitPulse</span>
            </Link>
            <nav className="hidden md:flex space-x-4" aria-label="Main navigation">
              <Link
                href="/app"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                Pricing
              </Link>
              {(role === 'operator' || role === 'admin') && (
                <Link
                  href="/operator"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Operator Console
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <>
                    {entitlements && entitlements.plan !== 'free' && (
                      <Badge
                        variant={entitlements.plan === 'pro' ? 'success' : 'info'}
                        size="sm"
                      >
                        {entitlements.plan.toUpperCase()}
                      </Badge>
                    )}
                    <Link href="/app/alerts" aria-label="View alerts">
                      <Button variant="ghost" size="sm" aria-label="Notifications">
                        <span aria-hidden="true">🔔</span>
                        <span className="sr-only">Notifications</span>
                      </Button>
                    </Link>
                    <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signInWithGoogle}
                      className="flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                    <Link href="/app" className="hidden sm:block">
                      <Button variant="primary" size="sm">
                        Try it now
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
