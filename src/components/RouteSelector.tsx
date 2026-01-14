'use client';

import { useState, useEffect, useCallback } from 'react';
import { Agency, Route, Stop } from '@/types';
import Select from './ui/Select';

interface RouteSelectorProps {
  onSelectionChange: (selection: {
    agency: Agency | null;
    route: Route | null;
    direction: number;
    stop: Stop | null;
  }) => void;
}

export default function RouteSelector({ onSelectionChange }: RouteSelectorProps) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);

  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<number>(0);
  const [selectedStopId, setSelectedStopId] = useState<string>('');

  const [loading, setLoading] = useState(true);

  // Fetch transit data
  const fetchTransitData = useCallback(async (routeId?: string, directionId?: number) => {
    try {
      const params = new URLSearchParams();
      if (selectedAgencyId) params.set('agency_id', selectedAgencyId);
      if (routeId) params.set('route_id', routeId);
      if (directionId !== undefined) params.set('direction_id', String(directionId));

      const response = await fetch(`/api/transit?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transit data');

      const data = await response.json();

      if (!selectedAgencyId && data.agencies?.length > 0) {
        setAgencies(data.agencies);
        setSelectedAgencyId(data.agencies[0].id);
      }

      if (data.routes) setRoutes(data.routes);
      if (data.stops) setStops(data.stops);
    } catch (err) {
      console.error('Fetch transit data error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAgencyId]);

  // Initial load
  useEffect(() => {
    fetchTransitData();
  }, [fetchTransitData]);

  // Fetch stops when route/direction changes
  useEffect(() => {
    if (selectedRouteId) {
      fetchTransitData(selectedRouteId, selectedDirection);
    }
  }, [selectedRouteId, selectedDirection, fetchTransitData]);

  // Notify parent of selection changes
  useEffect(() => {
    const agency = agencies.find((a) => a.id === selectedAgencyId) || null;
    const route = routes.find((r) => r.id === selectedRouteId) || null;
    const stop = stops.find((s) => s.id === selectedStopId) || null;

    onSelectionChange({
      agency,
      route,
      direction: selectedDirection,
      stop,
    });
  }, [selectedAgencyId, selectedRouteId, selectedDirection, selectedStopId, agencies, routes, stops, onSelectionChange]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const agencyOptions = [
    { value: '', label: 'Select agency...' },
    ...agencies.map((a) => ({ value: a.id, label: a.name })),
  ];

  const routeOptions = [
    { value: '', label: 'Select route...' },
    ...routes
      .filter((r) => !selectedAgencyId || r.agency_id === selectedAgencyId)
      .map((r) => ({
        value: r.id,
        label: `${r.route_short_name}${r.route_long_name ? ` - ${r.route_long_name}` : ''}`,
      })),
  ];

  const directionOptions = [
    { value: '0', label: 'Northbound / Outbound' },
    { value: '1', label: 'Southbound / Inbound' },
  ];

  const stopOptions = [
    { value: '', label: 'Select stop...' },
    ...stops.map((s) => ({ value: s.id, label: s.stop_name })),
  ];

  return (
    <div className="space-y-3">
      {agencies.length > 1 && (
        <Select
          label="Agency"
          value={selectedAgencyId}
          onChange={(e) => {
            setSelectedAgencyId(e.target.value);
            setSelectedRouteId('');
            setSelectedStopId('');
          }}
          options={agencyOptions}
        />
      )}

      <Select
        label="Line / Route"
        value={selectedRouteId}
        onChange={(e) => {
          setSelectedRouteId(e.target.value);
          setSelectedStopId('');
        }}
        options={routeOptions}
      />

      {selectedRouteId && (
        <>
          <Select
            label="Direction"
            value={String(selectedDirection)}
            onChange={(e) => {
              setSelectedDirection(Number(e.target.value));
              setSelectedStopId('');
            }}
            options={directionOptions}
          />

          <Select
            label="Station / Stop"
            value={selectedStopId}
            onChange={(e) => setSelectedStopId(e.target.value)}
            options={stopOptions}
          />
        </>
      )}
    </div>
  );
}
