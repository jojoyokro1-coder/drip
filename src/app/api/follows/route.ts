import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createNotification } from '@/lib/server-notifications';

async function getUserFromRequest(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return { supabaseAdmin: null, user: null, error: "Supabase server is not configured" };
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { supabaseAdmin, user: null, error: "Unauthorized" };
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return { supabaseAdmin, user: error ? null : user, error: error ? "Unauthorized" : null };
}

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase server is not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const type = searchParams.get('type'); // 'followers' or 'following'
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    if (!profileId || !type) {
      return NextResponse.json({ error: 'profileId and type required' }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    if (type === 'followers') {
      const { data: follows, error } = await supabaseAdmin
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const followerIds = follows.map(f => f.follower_id);
      const { data: profiles } = followerIds.length
        ? await supabaseAdmin.from('profiles').select('id, username, avatar_url').in('id', followerIds)
        : { data: [] };

      const { count: total } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileId);

      return NextResponse.json({
        users: profiles || [],
        follows: follows,
        total: total || 0,
        page,
        hasMore: offset + limit < (total || 0),
      });
    }

    if (type === 'following') {
      const { data: follows, error } = await supabaseAdmin
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', profileId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const followingIds = follows.map(f => f.following_id);
      const { data: profiles } = followingIds.length
        ? await supabaseAdmin.from('profiles').select('id, username, avatar_url').in('id', followingIds)
        : { data: [] };

      const { count: total } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileId);

      return NextResponse.json({
        users: profiles || [],
        follows: follows,
        total: total || 0,
        page,
        hasMore: offset + limit < (total || 0),
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Follow list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      const { error: deleteError } = await supabaseAdmin.from('follows').delete().eq('id', existingFollow.id);
      if (deleteError) {
        console.error('Delete follow error:', deleteError);
        return NextResponse.json({ error: `Impossible de se désabonner: ${deleteError.message}` }, { status: 500 });
      }
      following = false;
    } else {
      // Follow
      const { error: insertError } = await supabaseAdmin.from('follows').insert({ follower_id: user.id, following_id: userId });
      if (insertError) {
        console.error('Insert follow error:', insertError);
        return NextResponse.json({ error: `Impossible de s'abonner: ${insertError.message}` }, { status: 500 });
      }
      await createNotification(supabaseAdmin, {
        userId,
        actorId: user.id,
        type: 'follow',
      });
      following = true;
    }

    // Get updated count
    const { count: followersCount, error: countError } = await supabaseAdmin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (countError) {
      console.error('Count follow error:', countError);
    }

    return NextResponse.json({
      following,
      count: followersCount || 0,
    });
  } catch (error) {
    console.error('Follow error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur lors de l'abonnement: ${message}` }, { status: 500 });
  }
}
