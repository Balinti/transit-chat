import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ user: null });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ user: null });
    }

    const token = authHeader.substring(7);
    const supabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role || 'rider',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/auth:', error);
    return NextResponse.json({ user: null });
  }
}
