import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const agency_id = searchParams.get('agency_id');
    const route_id = searchParams.get('route_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

    // Build query
    let query = supabase
      .from('incidents')
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .order('last_report_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (agency_id) {
      query = query.eq('agency_id', agency_id);
    }
    if (route_id) {
      query = query.eq('route_id', route_id);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    } else {
      // By default, exclude dismissed/handled incidents that are old
      query = query.in('status', ['UNVERIFIED', 'VERIFIED']);
    }

    // Only show recent incidents (last 2 hours by default)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    query = query.gte('last_report_at', twoHoursAgo);

    const { data: incidents, error } = await query;

    if (error) {
      console.error('Error fetching incidents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch incidents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ incidents: incidents || [] });
  } catch (error) {
    console.error('Error in GET /api/incidents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
