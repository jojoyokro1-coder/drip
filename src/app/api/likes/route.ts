import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createNotification } from '@/lib/server-notifications';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase server is not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lookId } = await request.json();

    if (!lookId) {
      return NextResponse.json({ error: 'lookId required' }, { status: 400 });
    }

    const { data: look } = await supabaseAdmin
      .from('looks')
      .select('user_id')
      .eq('id', lookId)
      .maybeSingle();

    // Check if already liked
    const { data: existingLike } = await supabaseAdmin
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('look_id', lookId)
      .maybeSingle();

    let liked: boolean;

    if (existingLike) {
      // Unlike
      await supabaseAdmin.from('likes').delete().eq('id', existingLike.id);
      liked = false;
    } else {
      // Like
      await supabaseAdmin.from('likes').insert({ user_id: user.id, look_id: lookId });
      await createNotification(supabaseAdmin, {
        userId: look?.user_id,
        actorId: user.id,
        type: 'like',
        lookId,
      });
      liked = true;
    }

    const { count } = await supabaseAdmin
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('look_id', lookId);

    const safeCount = Math.max(0, count || 0);

    await supabaseAdmin
      .from('looks')
      .update({ likes_count: safeCount })
      .eq('id', lookId);

    return NextResponse.json({
      liked,
      count: safeCount,
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
