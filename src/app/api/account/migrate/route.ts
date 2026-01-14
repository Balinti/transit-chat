import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { anon_id, commutes } = body;

    const migrated = {
      commutes: 0,
      reports: 0,
    };

    // Migrate anonymous commutes (limit to 1 for free tier)
    if (commutes && Array.isArray(commutes) && commutes.length > 0) {
      // Only migrate the first commute for free tier users
      const commuteToMigrate = commutes[0];

      const { error: commuteError } = await supabase
        .from('commutes')
        .insert({
          user_id: user.id,
          name: commuteToMigrate.name,
          agency_id: commuteToMigrate.agency_id,
          route_id: commuteToMigrate.route_id,
          direction_id: commuteToMigrate.direction_id,
          stop_id: commuteToMigrate.stop_id,
          categories: commuteToMigrate.categories || ['DELAY', 'SUSPENSION'],
        });

      if (!commuteError) {
        migrated.commutes = 1;
      }
    }

    // Link anonymous reports to user (reports created in last 24 hours)
    if (anon_id) {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: linkedReports, error: linkError } = await supabase
        .from('rider_reports')
        .update({ user_id: user.id, anon_id: null })
        .eq('anon_id', anon_id)
        .gte('created_at', twentyFourHoursAgo)
        .select('id');

      if (!linkError && linkedReports) {
        migrated.reports = linkedReports.length;
      }
    }

    return NextResponse.json({
      success: true,
      migrated,
    });
  } catch (error) {
    console.error('Error in POST /api/account/migrate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
