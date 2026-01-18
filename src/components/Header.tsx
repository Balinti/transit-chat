'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Button from './ui/Button';
import Badge from './ui/Badge';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, role, entitlements, loading, signOut } = useAuth();

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
                    <Link href="/account" className="hidden sm:block">
                      <Button variant="ghost" size="sm">
                        {user.email?.split('@')[0]}
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={signOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/account">
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </Link>
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
