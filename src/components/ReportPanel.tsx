'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAnonId, addAnonReport, setMeaningfulAction } from '@/lib/localStorage';
import { REPORT_TYPE_INFO, ReportType, Route, Stop } from '@/types';
import Button from './ui/Button';
import Card from './ui/Card';

interface ReportPanelProps {
  selectedRoute: Route | null;
  selectedStop: Stop | null;
  directionId: number;
  agencyId: string;
  onReportCreated?: () => void;
}

export default function ReportPanel({
  selectedRoute,
  selectedStop,
  directionId,
  agencyId,
  onReportCreated,
}: ReportPanelProps) {
  const { user, session } = useAuth();
  const [submitting, setSubmitting] = useState<ReportType | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async (type: ReportType) => {
    if (!selectedRoute || !selectedStop) {
      setError('Please select a route and stop first');
      return;
    }

    setSubmitting(type);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({
          agency_id: agencyId,
          route_id: selectedRoute.id,
          direction_id: directionId,
          stop_id: selectedStop.id,
          type,
          anon_id: user ? null : getAnonId(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      // Track anonymous report locally
      if (!user) {
        addAnonReport({
          id: `local_${Date.now()}`,
          created_at: new Date().toISOString(),
          type,
          route_id: selectedRoute.id,
          stop_id: selectedStop.id,
        });
        setMeaningfulAction();
      }

      setSuccess(`${REPORT_TYPE_INFO[type].label} reported successfully!`);
      onReportCreated?.();

      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Report error:', err);
    } finally {
      setSubmitting(null);
    }
  };

  const reportTypes: ReportType[] = [
    'DELAY',
    'CROWDING_LOW',
    'CROWDING_MED',
    'CROWDING_HIGH',
    'ELEVATOR_OUT',
    'POLICE_ACTIVITY',
    'PLATFORM_CHANGE',
    'VEHICLE_ISSUE',
    'SUSPENSION',
  ];

  return (
    <Card variant="bordered" className="p-4 dark:bg-slate-800 dark:border-slate-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Report Now</h3>

      {!selectedRoute || !selectedStop ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a route and stop above to report an issue
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Reporting for{' '}
            <span className="font-medium">{selectedRoute.route_short_name}</span> at{' '}
            <span className="font-medium">{selectedStop.stop_name}</span>
          </p>

          {error && (
            <div
              className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="mb-3 p-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded"
              role="status"
              aria-live="polite"
            >
              {success}
            </div>
          )}

          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            role="group"
            aria-label="Report type options"
          >
            {reportTypes.map((type) => {
              const info = REPORT_TYPE_INFO[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="flex flex-col items-center py-3 h-auto min-h-[60px] touch-manipulation dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
                  onClick={() => handleReport(type)}
                  disabled={submitting !== null}
                  aria-label={`Report ${info.label}`}
                  aria-busy={submitting === type}
                >
                  <span className="text-lg mb-1" aria-hidden="true">{info.icon}</span>
                  <span className="text-xs text-center leading-tight">
                    {submitting === type ? 'Submitting...' : info.label}
                  </span>
                </Button>
              );
            })}
          </div>

          {!user && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Reporting anonymously
            </p>
          )}
        </>
      )}
    </Card>
  );
}
