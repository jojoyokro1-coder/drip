import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type User = {
  id: string;
  username: string | null;
  email: string | null;
  created_at: string | null;
};

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('adminAuth')?.value === 'true';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Not admin' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '20', 10)));

  const [profilesRes, countRes, authRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, username'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.auth.admin.listUsers({ page, perPage }),
  ]);

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  }
  if (authRes.error) {
    return NextResponse.json({ error: authRes.error.message }, { status: 500 });
  }

  const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const users: User[] = authRes.data.users.map((user) => {
    const profile = profileMap.get(user.id);
    return {
      id: user.id,
      username: profile?.username ?? null,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
    };
  });

  return NextResponse.json({
    users,
    total: countRes.count ?? profilesRes.data.length,
    page,
    perPage,
  });
}
