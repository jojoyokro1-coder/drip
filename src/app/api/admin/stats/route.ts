import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adminAuth")?.value === "true";
  if (!isAdmin) return NextResponse.json({ error: "Not admin" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const [usersRes, looksRes, likesRes, commentsRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("looks").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("likes").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("comments").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    total_users: usersRes.count ?? 0,
    total_looks: looksRes.count ?? 0,
    total_likes: likesRes.count ?? 0,
    total_comments: commentsRes.count ?? 0,
  });
}
