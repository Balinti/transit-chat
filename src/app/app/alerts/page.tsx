'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Alert } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function AlertsPage() {
  const { user, session, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchAlerts();
    }
  }, [session, authLoading]);

  const markAsRead = async (alertIds: string[]) => {
    if (!session?.access_token) return;

    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ alert_ids: alertIds, mark_read: true }),
      });

      setAlerts((prev) =>
        prev.map((alert) =>
          alertIds.includes(alert.id)
            ? { ...alert, read_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Failed to mark alerts as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card variant="bordered" className="p-8 text-center">
          <div className="text-4xl mb-4">🔔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Alerts Inbox</h1>
          <p className="text-gray-600 mb-6">
            Sign in to view your personalized transit alerts.
          </p>
          <Link href="/account">
            <Button variant="primary">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const unreadAlerts = alerts.filter((a) => !a.read_at);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts Inbox</h1>
          <p className="text-gray-600">
            {unreadAlerts.length} unread alert{unreadAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAsRead(unreadAlerts.map((a) => a.id))}
          >
            Mark all read
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card variant="bordered" className="p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No alerts yet</h2>
          <p className="text-gray-600 mb-4">
            Save a commute to start receiving personalized alerts about issues on your route.
          </p>
          <Link href="/app">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              variant="bordered"
              className={`p-4 ${!alert.read_at ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {!alert.read_at && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                  </div>
                  {alert.body && (
                    <p className="text-gray-600 text-sm mb-2">{alert.body}</p>
                  )}
                  <p className="text-gray-400 text-xs">
                    {formatDate(alert.created_at)}
                  </p>
                </div>
                {!alert.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead([alert.id])}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
