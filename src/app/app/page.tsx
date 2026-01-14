'use client';

import { useState, useCallback } from 'react';
import { Agency, Route, Stop } from '@/types';
import RouteSelector from '@/components/RouteSelector';
import ReportPanel from '@/components/ReportPanel';
import IncidentFeed from '@/components/IncidentFeed';
import BroadcastFeed from '@/components/BroadcastFeed';

export default function AppPage() {
  const [selection, setSelection] = useState<{
    agency: Agency | null;
    route: Route | null;
    direction: number;
    stop: Stop | null;
  }>({
    agency: null,
    route: null,
    direction: 0,
    stop: null,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectionChange = useCallback(
    (newSelection: {
      agency: Agency | null;
      route: Route | null;
      direction: number;
      stop: Stop | null;
    }) => {
      setSelection(newSelection);
    },
    []
  );

  const handleReportCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Default agency ID for demo
  const defaultAgencyId = selection.agency?.id || '00000000-0000-0000-0000-000000000001';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Transit Dashboard</h1>
        <p className="text-gray-600">
          See real-time updates and report issues on your route
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: Route selection and reporting */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Select Route</h2>
            <RouteSelector onSelectionChange={handleSelectionChange} />
          </div>

          <ReportPanel
            selectedRoute={selection.route}
            selectedStop={selection.stop}
            directionId={selection.direction}
            agencyId={defaultAgencyId}
            onReportCreated={handleReportCreated}
          />
        </div>

        {/* Middle column: Rider signals (incidents) */}
        <div>
          <IncidentFeed
            agencyId={defaultAgencyId}
            routeId={selection.route?.id}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Right column: Official updates (broadcasts) */}
        <div>
          <BroadcastFeed agencyId={defaultAgencyId} />
        </div>
      </div>
    </div>
  );
}
