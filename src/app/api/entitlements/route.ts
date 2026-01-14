import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getEntitlements } from '@/lib/entitlements';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Default free tier entitlements
  const defaultEntitlements = getEntitlements(null);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ entitlements: defaultEntitlements, user: null });
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ entitlements: defaultEntitlements, user: null });
    }

    const token = authHeader.substring(7);
    const supabase = getServiceSupabase();
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ entitlements: defaultEntitlements, user: null });
    }

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const entitlements = getEntitlements(subscription);

    return NextResponse.json({
      entitlements,
      user: { id: user.id, email: user.email },
      subscription: subscription || null,
    });
  } catch (error) {
    console.error('Error in GET /api/entitlements:', error);
    return NextResponse.json({ entitlements: defaultEntitlements, user: null });
  }
}
