'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Incident, OperatorBroadcast, REPORT_TYPE_INFO, BROADCAST_CATEGORY_INFO, BroadcastCategory, IncidentStatus } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function OperatorPage() {
  const { user, session, role, loading: authLoading } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [broadcasts, setBroadcasts] = useState<OperatorBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incidents' | 'broadcasts'>('incidents');

  // Broadcast form state
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    category: 'SERVICE_ALERT' as BroadcastCategory,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const [incidentsRes, broadcastsRes] = await Promise.all([
        fetch('/api/incidents?status=all', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch('/api/operator/broadcasts?status=all', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (incidentsRes.ok) {
        const data = await incidentsRes.json();
        setIncidents(data.incidents || []);
      }

      if (broadcastsRes.ok) {
        const data = await broadcastsRes.json();
        setBroadcasts(data.broadcasts || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && session) {
      fetchData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, session, fetchData]);

  const updateIncidentStatus = async (incidentId: string, status: IncidentStatus) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`/api/operator/incidents/${incidentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.id === incidentId ? { ...inc, status } : inc
          )
        );
      }
    } catch (error) {
      console.error('Failed to update incident status:', error);
    }
  };

  const createBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/operator/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...broadcastForm,
          agency_id: '00000000-0000-0000-0000-000000000001', // Demo agency
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBroadcasts((prev) => [data.broadcast, ...prev]);
        setShowBroadcastForm(false);
        setBroadcastForm({ title: '', message: '', category: 'SERVICE_ALERT' });
      }
    } catch (error) {
      console.error('Failed to create broadcast:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    const variants: Record<IncidentStatus, 'default' | 'warning' | 'success' | 'danger'> = {
      UNVERIFIED: 'warning',
      VERIFIED: 'success',
      HANDLED: 'default',
      DISMISSED: 'danger',
    };
    return <Badge variant={variants[status]} size="sm">{status}</Badge>;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card variant="bordered" className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Operator Console</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access the operator console.
          </p>
          <Link href="/account?redirect=/operator">
            <Button variant="primary">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (role !== 'operator' && role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <Card variant="bordered" className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have operator permissions. Contact an administrator
            if you believe this is an error.
          </p>
          <Link href="/app">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Operator Console</h1>
        <Badge variant="info">Operator</Badge>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-1 ${
            activeTab === 'incidents'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('incidents')}
        >
          Incidents ({incidents.length})
        </button>
        <button
          className={`pb-2 px-1 ${
            activeTab === 'broadcasts'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('broadcasts')}
        >
          Broadcasts ({broadcasts.length})
        </button>
      </div>

      {activeTab === 'incidents' && (
        <div className="space-y-4">
          {incidents.length === 0 ? (
            <Card variant="bordered" className="p-8 text-center">
              <p className="text-gray-500">No incidents to review.</p>
            </Card>
          ) : (
            incidents.map((incident) => {
              const info = REPORT_TYPE_INFO[incident.type];
              return (
                <Card key={incident.id} variant="bordered" className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{info.label}</h3>
                        <p className="text-sm text-gray-500">
                          {incident.route?.route_short_name} at {incident.stop?.stop_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(incident.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        Score: {incident.score.toFixed(1)} ({incident.confidence})
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-500">
                      {incident.confirmations_count} confirmation(s) |
                      Last report: {formatTime(incident.last_report_at)}
                    </div>
                    <div className="flex space-x-2">
                      {incident.status === 'UNVERIFIED' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateIncidentStatus(incident.id, 'VERIFIED')}
                          >
                            Verify
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateIncidentStatus(incident.id, 'DISMISSED')}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                      {incident.status === 'VERIFIED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateIncidentStatus(incident.id, 'HANDLED')}
                        >
                          Mark Handled
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowBroadcastForm(!showBroadcastForm)}
            >
              {showBroadcastForm ? 'Cancel' : 'New Broadcast'}
            </Button>
          </div>

          {showBroadcastForm && (
            <Card variant="bordered" className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Create Broadcast</h3>
              <form onSubmit={createBroadcast} className="space-y-4">
                <Input
                  label="Title"
                  value={broadcastForm.title}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={broadcastForm.message}
                    onChange={(e) =>
                      setBroadcastForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    required
                  />
                </div>
                <Select
                  label="Category"
                  value={broadcastForm.category}
                  onChange={(e) =>
                    setBroadcastForm((prev) => ({
                      ...prev,
                      category: e.target.value as BroadcastCategory,
                    }))
                  }
                  options={Object.entries(BROADCAST_CATEGORY_INFO).map(([key, value]) => ({
                    value: key,
                    label: value.label,
                  }))}
                />
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Broadcast'}
                </Button>
              </form>
            </Card>
          )}

          {broadcasts.length === 0 ? (
            <Card variant="bordered" className="p-8 text-center">
              <p className="text-gray-500">No broadcasts yet.</p>
            </Card>
          ) : (
            broadcasts.map((broadcast) => {
              const categoryInfo = BROADCAST_CATEGORY_INFO[broadcast.category];
              return (
                <Card key={broadcast.id} variant="bordered" className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{broadcast.title}</h3>
                    <Badge variant={broadcast.status === 'ACTIVE' ? 'success' : 'default'}>
                      {broadcast.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{broadcast.message}</p>
                  <div className="flex items-center text-xs text-gray-400 space-x-2">
                    <Badge variant="info" size="sm">
                      {categoryInfo.label}
                    </Badge>
                    <span>Created: {formatTime(broadcast.created_at)}</span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
