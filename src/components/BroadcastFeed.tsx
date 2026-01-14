'use client';

import { useState, useEffect, useCallback } from 'react';
import { OperatorBroadcast, BROADCAST_CATEGORY_INFO } from '@/types';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface BroadcastFeedProps {
  agencyId?: string;
}

export default function BroadcastFeed({ agencyId }: BroadcastFeedProps) {
  const [broadcasts, setBroadcasts] = useState<OperatorBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agency_id', agencyId);

      const response = await fetch(`/api/operator/broadcasts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch broadcasts');

      const data = await response.json();
      setBroadcasts(data.broadcasts || []);
      setError(null);
    } catch (err) {
      setError('Failed to load official updates');
      console.error('Fetch broadcasts error:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchBroadcasts();
    // Poll every 60 seconds
    const interval = setInterval(fetchBroadcasts, 60000);
    return () => clearInterval(interval);
  }, [fetchBroadcasts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card variant="bordered" className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="p-4">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">📢</span>
        <h3 className="font-semibold text-gray-900">Official Updates</h3>
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-sm rounded mb-3">
          {error}
        </div>
      )}

      {broadcasts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No active service advisories.
        </p>
      ) : (
        <div className="space-y-3">
          {broadcasts.map((broadcast) => {
            const categoryInfo = BROADCAST_CATEGORY_INFO[broadcast.category];
            return (
              <div
                key={broadcast.id}
                className="p-3 bg-blue-50 rounded-lg border border-blue-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{broadcast.title}</h4>
                  <Badge
                    variant="info"
                    size="sm"
                    className={categoryInfo.color.replace('bg-', '')}
                  >
                    {categoryInfo.label}
                  </Badge>
                </div>

                <p className="text-sm text-gray-700 mb-2">{broadcast.message}</p>

                <div className="flex items-center text-xs text-gray-500 space-x-2">
                  {broadcast.route && (
                    <span
                      className="px-2 py-0.5 rounded text-white font-medium"
                      style={{
                        backgroundColor: broadcast.route.route_color || '#666',
                      }}
                    >
                      {broadcast.route.route_short_name}
                    </span>
                  )}
                  <span>{formatDate(broadcast.starts_at)}</span>
                  {broadcast.ends_at && (
                    <>
                      <span>-</span>
                      <span>{formatDate(broadcast.ends_at)}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
