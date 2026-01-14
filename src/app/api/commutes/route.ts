import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getEntitlements } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const supabase = getServiceSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ commutes: [] });
  }

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ commutes: [] });
    }

    const supabase = getServiceSupabase();
    const { data: commutes, error } = await supabase
      .from('commutes')
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commutes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch commutes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ commutes: commutes || [] });
  } catch (error) {
    console.error('Error in GET /api/commutes:', error);
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
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    // Get user's subscription to check entitlements
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const entitlements = getEntitlements(subscription);

    // Check existing commute count
    const { count } = await supabase
      .from('commutes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= entitlements.commutes_limit) {
      return NextResponse.json(
        {
          error: `Commute limit reached. Upgrade to save more commutes.`,
          limit: entitlements.commutes_limit,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      agency_id,
      route_id,
      direction_id,
      stop_id,
      days_of_week = [1, 2, 3, 4, 5],
      start_time,
      end_time,
      categories = ['DELAY', 'SUSPENSION'],
    } = body;

    if (!name || !agency_id || !route_id || direction_id === undefined || !stop_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: commute, error } = await supabase
      .from('commutes')
      .insert({
        user_id: user.id,
        name,
        agency_id,
        route_id,
        direction_id: Number(direction_id),
        stop_id,
        days_of_week,
        start_time,
        end_time,
        categories,
      })
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .single();

    if (error) {
      console.error('Error creating commute:', error);
      return NextResponse.json(
        { error: 'Failed to create commute' },
        { status: 500 }
      );
    }

    return NextResponse.json({ commute });
  } catch (error) {
    console.error('Error in POST /api/commutes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Commute ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('commutes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting commute:', error);
      return NextResponse.json(
        { error: 'Failed to delete commute' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/commutes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
