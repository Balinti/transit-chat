'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function Header() {
  const { user, role, entitlements, loading, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚇</span>
              <span className="font-bold text-xl text-gray-900">TransitPulse</span>
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/app"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Pricing
              </Link>
              {(role === 'operator' || role === 'admin') && (
                <Link
                  href="/operator"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Operator Console
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
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
                    <Link href="/app/alerts">
                      <Button variant="ghost" size="sm">
                        🔔
                      </Button>
                    </Link>
                    <Link href="/account">
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
                    <Link href="/app">
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
