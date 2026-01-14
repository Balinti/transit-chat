import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { aggregateReport } from '@/lib/aggregation';
import { ReportType } from '@/types';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const {
      agency_id,
      route_id,
      direction_id,
      stop_id,
      type,
      severity = 1,
      anon_id,
      details,
    } = body;

    // Validate required fields
    if (!agency_id || !route_id || direction_id === undefined || !stop_id || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: ReportType[] = [
      'DELAY', 'CROWDING_LOW', 'CROWDING_MED', 'CROWDING_HIGH',
      'ELEVATOR_OUT', 'POLICE_ACTIVITY', 'PLATFORM_CHANGE',
      'VEHICLE_ISSUE', 'SUSPENSION'
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check for authenticated user via auth header
    let user_id: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        user_id = user.id;
      }
    }

    // Either user_id or anon_id must be present
    if (!user_id && !anon_id) {
      return NextResponse.json(
        { error: 'Either authentication or anon_id required' },
        { status: 400 }
      );
    }

    // Create the report
    const reportData = {
      agency_id,
      route_id,
      direction_id: Number(direction_id),
      stop_id,
      type,
      severity: Number(severity),
      user_id,
      anon_id: user_id ? null : anon_id,
      source: 'web',
      details: details || null,
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    };

    const { data: report, error: reportError } = await supabase
      .from('rider_reports')
      .insert(reportData)
      .select()
      .single();

    if (reportError) {
      console.error('Error creating report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      );
    }

    // Aggregate into incident
    const incident = await aggregateReport({
      id: report.id,
      agency_id: report.agency_id,
      route_id: report.route_id,
      direction_id: report.direction_id,
      stop_id: report.stop_id,
      type: report.type,
      user_id: report.user_id,
      anon_id: report.anon_id,
      created_at: report.created_at,
    });

    return NextResponse.json({ report, incident });
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
