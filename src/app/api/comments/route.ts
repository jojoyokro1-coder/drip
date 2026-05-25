import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createNotification } from "@/lib/server-notifications";

const COMMENT_MAX = 500;

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase server is not configured" }, { status: 500 });
    }

    const lookId = request.nextUrl.searchParams.get("lookId");
    if (!lookId) {
      return NextResponse.json({ error: "lookId required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("comments")
      .select("*, profile:profiles(username, avatar_url)")
      .eq("look_id", lookId)
      .order("created_at", { ascending: true });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("does not exist") || msg.includes("permission denied")) {
        return NextResponse.json({ localFallback: true, comments: [] });
      }
      return NextResponse.json({ error: "Impossible de charger les commentaires." }, { status: 500 });
    }

    return NextResponse.json({ comments: data || [] });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant le chargement des commentaires." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase server is not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const lookId = String(body?.lookId || "");
    const content = String(body?.content || "").trim();

    if (!lookId) {
      return NextResponse.json({ error: "lookId required" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "Le commentaire est vide." }, { status: 400 });
    }

    if (content.length > COMMENT_MAX) {
      return NextResponse.json({ error: `Le commentaire ne peut pas depasser ${COMMENT_MAX} caracteres.` }, { status: 400 });
    }

    const { data: look } = await supabaseAdmin.from("looks").select("user_id").eq("id", lookId).maybeSingle();

    const { data: comment, error: insertError } = await supabaseAdmin
      .from("comments")
      .insert({
        look_id: lookId,
        user_id: user.id,
        content,
      })
      .select("*, profile:profiles(username, avatar_url)")
      .maybeSingle();

    if (insertError) {
      const msg = insertError.message || "";
      if (msg.includes("does not exist") || msg.includes("permission denied")) {
        return NextResponse.json({ error: "table_not_found", localFallback: true }, { status: 503 });
      }
      return NextResponse.json({ error: "Impossible d'ajouter le commentaire." }, { status: 500 });
    }

    if (!comment) {
      return NextResponse.json({ error: "Impossible d'ajouter le commentaire." }, { status: 500 });
    }

    await createNotification(supabaseAdmin, {
      userId: look?.user_id,
      actorId: user.id,
      type: "comment",
      lookId,
      commentId: comment.id,
    });

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant l'ajout du commentaire." }, { status: 500 });
  }
}
