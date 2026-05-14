import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/integrations/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existingFollow } = await supabaseAdmin
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .maybeSingle();

    let following: boolean;

    if (existingFollow) {
      // Unfollow
      await supabaseAdmin.from('follows').delete().eq('id', existingFollow.id);
      following = false;
    } else {
      // Follow
      await supabaseAdmin.from('follows').insert({ follower_id: user.id, following_id: userId });
      following = true;
    }

    // Get updated count
    const { count: followersCount } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    return NextResponse.json({
      following,
      count: followersCount || 0,
    });
  } catch (error) {
    console.error('Follow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
