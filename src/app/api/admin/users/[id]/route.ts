import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("adminAuth")?.value === "true";
  if (!isAdmin) return NextResponse.json({ error: "Not admin" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    await Promise.all([
      supabaseAdmin.from("notifications").delete().eq("user_id", id),
      supabaseAdmin.from("notifications").delete().eq("actor_id", id),
      supabaseAdmin.from("comments").delete().eq("user_id", id),
      supabaseAdmin.from("likes").delete().eq("user_id", id),
      supabaseAdmin.from("follows").delete().eq("follower_id", id),
      supabaseAdmin.from("follows").delete().eq("following_id", id),
    ]);

    const { data: userLooks } = await supabaseAdmin
      .from("looks")
      .select("id")
      .eq("user_id", id);

    if (userLooks && userLooks.length > 0) {
      const lookIds = userLooks.map((l) => l.id);

      await Promise.all([
        supabaseAdmin.from("notifications").delete().in("look_id", lookIds),
        supabaseAdmin.from("comments").delete().in("look_id", lookIds),
        supabaseAdmin.from("likes").delete().in("look_id", lookIds),
      ]);

      await supabaseAdmin.from("looks").delete().eq("user_id", id);
    }

    await supabaseAdmin.from("profiles").delete().eq("id", id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
