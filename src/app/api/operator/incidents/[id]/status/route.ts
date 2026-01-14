import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { IncidentStatus } from '@/types';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOperator = profile?.role === 'operator' || profile?.role === 'admin';
  return { user, isOperator };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses: IncidentStatus[] = [
      'UNVERIFIED',
      'VERIFIED',
      'HANDLED',
      'DISMISSED',
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: incident, error } = await supabase
      .from('incidents')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        route:routes(id, route_short_name, route_long_name, route_color),
        stop:stops(id, stop_name, stop_code)
      `)
      .single();

    if (error) {
      console.error('Error updating incident status:', error);
      return NextResponse.json(
        { error: 'Failed to update incident' },
        { status: 500 }
      );
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error('Error in POST /api/operator/incidents/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
