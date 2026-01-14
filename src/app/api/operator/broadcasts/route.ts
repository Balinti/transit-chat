import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function checkOperatorRole(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, isOperator: false };
  }

  const token = authHeader.substring(7);
  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return { user: null, isOperator: false };
  }

  // Check role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOperator = profile?.role === 'operator' || profile?.role === 'admin';
  return { user, isOperator };
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ broadcasts: [] });
  }

  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const agency_id = searchParams.get('agency_id');
    const status = searchParams.get('status') || 'ACTIVE';

    let query = supabase
      .from('operator_broadcasts')
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .order('created_at', { ascending: false });

    if (agency_id) {
      query = query.eq('agency_id', agency_id);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Only show current broadcasts
    const now = new Date().toISOString();
    query = query
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`);

    const { data: broadcasts, error } = await query;

    if (error) {
      console.error('Error fetching broadcasts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch broadcasts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ broadcasts: broadcasts || [] });
  } catch (error) {
    console.error('Error in GET /api/operator/broadcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const { user, isOperator } = await checkOperatorRole(request);

    if (!user || !isOperator) {
      return NextResponse.json(
        { error: 'Operator access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      agency_id,
      route_id,
      stop_id,
      category,
      title,
      message,
      starts_at,
      ends_at,
    } = body;

    if (!agency_id || !category || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: broadcast, error } = await supabase
      .from('operator_broadcasts')
      .insert({
        agency_id,
        route_id: route_id || null,
        stop_id: stop_id || null,
        category,
        title,
        message,
        status: 'ACTIVE',
        starts_at: starts_at || new Date().toISOString(),
        ends_at: ends_at || null,
        created_by: user.id,
      })
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .single();

    if (error) {
      console.error('Error creating broadcast:', error);
      return NextResponse.json(
        { error: 'Failed to create broadcast' },
        { status: 500 }
      );
    }

    return NextResponse.json({ broadcast });
  } catch (error) {
    console.error('Error in POST /api/operator/broadcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
