import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Return demo data if Supabase is not configured
    return NextResponse.json({
      agencies: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Metro Transit Authority',
          short_name: 'MTA',
        },
      ],
      routes: [
        {
          id: '00000000-0000-0000-0001-000000000001',
          agency_id: '00000000-0000-0000-0000-000000000001',
          route_short_name: 'Red',
          route_long_name: 'Red Line',
          route_color: '#FF0000',
        },
        {
          id: '00000000-0000-0000-0001-000000000002',
          agency_id: '00000000-0000-0000-0000-000000000001',
          route_short_name: 'Blue',
          route_long_name: 'Blue Line',
          route_color: '#0000FF',
        },
        {
          id: '00000000-0000-0000-0001-000000000003',
          agency_id: '00000000-0000-0000-0000-000000000001',
          route_short_name: 'Green',
          route_long_name: 'Green Line',
          route_color: '#00AA00',
        },
      ],
      stops: [
        {
          id: '00000000-0000-0000-0002-000000000001',
          agency_id: '00000000-0000-0000-0000-000000000001',
          stop_name: 'Central Station',
        },
        {
          id: '00000000-0000-0000-0002-000000000002',
          agency_id: '00000000-0000-0000-0000-000000000001',
          stop_name: 'Union Square',
        },
        {
          id: '00000000-0000-0000-0002-000000000003',
          agency_id: '00000000-0000-0000-0000-000000000001',
          stop_name: 'City Hall',
        },
        {
          id: '00000000-0000-0000-0002-000000000004',
          agency_id: '00000000-0000-0000-0000-000000000001',
          stop_name: 'Park Street',
        },
        {
          id: '00000000-0000-0000-0002-000000000005',
          agency_id: '00000000-0000-0000-0000-000000000001',
          stop_name: 'Downtown Crossing',
        },
      ],
    });
  }

  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const agency_id = searchParams.get('agency_id');
    const route_id = searchParams.get('route_id');
    const direction_id = searchParams.get('direction_id');

    // Fetch agencies
    const { data: agencies } = await supabase
      .from('agencies')
      .select('id, name, short_name')
      .order('name');

    // Fetch routes (optionally filtered by agency)
    let routesQuery = supabase
      .from('routes')
      .select('id, agency_id, route_short_name, route_long_name, route_color')
      .order('route_short_name');

    if (agency_id) {
      routesQuery = routesQuery.eq('agency_id', agency_id);
    }

    const { data: routes } = await routesQuery;

    // Fetch stops (optionally filtered by route and direction)
    let stopsQuery = supabase
      .from('stops')
      .select('id, agency_id, stop_name, stop_code')
      .order('stop_name');

    if (route_id && direction_id !== null) {
      // Get stops for specific route and direction via route_stops
      const { data: routeStops } = await supabase
        .from('route_stops')
        .select('stop_id, stop_sequence')
        .eq('route_id', route_id)
        .eq('direction_id', Number(direction_id))
        .order('stop_sequence');

      if (routeStops && routeStops.length > 0) {
        const stopIds = routeStops.map((rs) => rs.stop_id);
        stopsQuery = stopsQuery.in('id', stopIds);
      }
    } else if (agency_id) {
      stopsQuery = stopsQuery.eq('agency_id', agency_id);
    }

    const { data: stops } = await stopsQuery;

    return NextResponse.json({
      agencies: agencies || [],
      routes: routes || [],
      stops: stops || [],
    });
  } catch (error) {
    console.error('Error in GET /api/transit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
