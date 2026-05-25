import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adminAuth")?.value === "true";
  if (!isAdmin) return NextResponse.json({ error: "Not admin" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const [looksRes, countRes] = await Promise.all([
    supabaseAdmin
      .from("looks")
      .select("*, profile:profiles(username)")
      .order("created_at", { ascending: false })
      .range(from, to),
    supabaseAdmin.from("looks").select("*", { count: "exact", head: true }),
  ]);

  if (looksRes.error) return NextResponse.json({ error: looksRes.error.message }, { status: 500 });

  return NextResponse.json({ looks: looksRes.data, total: countRes.count ?? 0, page, perPage });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adminAuth")?.value === "true";
  if (!isAdmin) return NextResponse.json({ error: "Not admin" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const lookId = body?.lookId;
  if (!lookId) return NextResponse.json({ error: "lookId required" }, { status: 400 });

  try {
    await Promise.all([
      supabaseAdmin.from("notifications").delete().eq("look_id", lookId),
      supabaseAdmin.from("comments").delete().eq("look_id", lookId),
      supabaseAdmin.from("likes").delete().eq("look_id", lookId),
    ]);

    const { error } = await supabaseAdmin.from("looks").delete().eq("id", lookId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
