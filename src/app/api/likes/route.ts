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

    const { lookId } = await request.json();

    if (!lookId) {
      return NextResponse.json({ error: 'lookId required' }, { status: 400 });
    }

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
      liked = true;
    }

    // Get updated count
    const { data: look } = await supabaseAdmin
      .from('looks')
      .select('likes_count')
      .eq('id', lookId)
      .maybeSingle();

    return NextResponse.json({
      liked,
      count: look?.likes_count || 0,
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
