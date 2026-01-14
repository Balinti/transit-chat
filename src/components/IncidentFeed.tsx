'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Incident, REPORT_TYPE_INFO } from '@/types';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface IncidentFeedProps {
  agencyId?: string;
  routeId?: string;
  refreshTrigger?: number;
}

export default function IncidentFeed({
  agencyId,
  routeId,
  refreshTrigger,
}: IncidentFeedProps) {
  const { entitlements } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (agencyId) params.set('agency_id', agencyId);
      if (routeId) params.set('route_id', routeId);

      const response = await fetch(`/api/incidents?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch incidents');

      const data = await response.json();
      setIncidents(data.incidents || []);
      setError(null);
    } catch (err) {
      setError('Failed to load incidents');
      console.error('Fetch incidents error:', err);
    } finally {
      setLoading(false);
    }
  }, [agencyId, routeId]);

  useEffect(() => {
    fetchIncidents();
    // Poll every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [fetchIncidents, refreshTrigger]);

  const getConfidenceBadge = (confidence: string, score: number) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      HIGH: 'success',
      MEDIUM: 'warning',
      LOW: 'danger',
    };

    return (
      <Badge variant={variants[confidence] || 'default'} size="sm">
        {confidence}
        {entitlements?.confidence_breakdown && (
          <span className="ml-1 opacity-75">({score.toFixed(0)})</span>
        )}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <Card variant="bordered" className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Rider Signals</h3>

      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-sm rounded mb-3">
          {error}
        </div>
      )}

      {incidents.length === 0 ? (
        <p className="text-sm text-gray-500">
          No active incidents reported. Routes are running smoothly.
        </p>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const info = REPORT_TYPE_INFO[incident.type];
            return (
              <div
                key={incident.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="font-medium text-gray-900">{info.label}</span>
                  </div>
                  {getConfidenceBadge(incident.confidence, incident.score)}
                </div>

                <div className="flex items-center text-sm text-gray-600 space-x-2">
                  {incident.route && (
                    <span
                      className="px-2 py-0.5 rounded text-white text-xs font-medium"
                      style={{
                        backgroundColor: incident.route.route_color || '#666',
                      }}
                    >
                      {incident.route.route_short_name}
                    </span>
                  )}
                  {incident.stop && <span>{incident.stop.stop_name}</span>}
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    {formatTime(incident.last_report_at)}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {incident.confirmations_count} confirmation
                  {incident.confirmations_count !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
