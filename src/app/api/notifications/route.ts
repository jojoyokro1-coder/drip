import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function getUserFromRequest(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return { supabaseAdmin: null, user: null, error: "Supabase server is not configured" };

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { supabaseAdmin, user: null, error: "Unauthorized" };
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  return { supabaseAdmin, user: error ? null : user, error: error ? "Unauthorized" : null };
}

export async function GET(request: NextRequest) {
  try {
    const { supabaseAdmin, user, error } = await getUserFromRequest(request);
    if (!supabaseAdmin) return NextResponse.json({ error }, { status: 500 });
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const { data, error: loadError } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (loadError) {
      return NextResponse.json({ notifications: [], unread: 0 });
    }

    const actorIds = Array.from(new Set((data || []).map((n) => n.actor_id).filter(Boolean)));
    const { data: profiles } = actorIds.length
      ? await supabaseAdmin.from("profiles").select("id, username, avatar_url").in("id", actorIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const notifications = (data || []).map((notification) => ({
      ...notification,
      actor: profileMap.get(notification.actor_id) || null,
    }));

    return NextResponse.json({
      notifications,
      unread: notifications.filter((notification) => !notification.read).length,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant le chargement des notifications." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabaseAdmin, user, error } = await getUserFromRequest(request);
    if (!supabaseAdmin) return NextResponse.json({ error }, { status: 500 });
    if (!user) return NextResponse.json({ error }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const notificationId = body?.id ? String(body.id) : "";

    let query = supabaseAdmin.from("notifications").update({ read: true }).eq("user_id", user.id);
    if (notificationId) {
      query = query.eq("id", notificationId);
    }

    const { error: updateError } = await query;
    if (updateError) {
      return NextResponse.json({ error: "Impossible de mettre a jour les notifications." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant la mise a jour des notifications." }, { status: 500 });
  }
}
