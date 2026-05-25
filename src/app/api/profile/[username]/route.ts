import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase server is not configured" }, { status: 500 });
    }

    const { username: rawUsername } = await context.params;
    const username = decodeURIComponent(rawUsername || "").trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "Pseudo requis." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Impossible de charger le profil." }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ profile: null, looks: [] }, { status: 404 });
    }

    const [
      { count: looksCount },
      { count: followersCount },
      { count: followingCount },
      { data: userLikesData },
      { data: looks, error: looksError },
    ] = await Promise.all([
      supabaseAdmin.from("looks").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
      supabaseAdmin.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabaseAdmin.from("looks").select("likes_count").eq("user_id", profile.id),
      supabaseAdmin.from("looks").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    ]);

    if (looksError) {
      return NextResponse.json({ error: "Impossible de charger les looks." }, { status: 500 });
    }

    const totalLikes = userLikesData?.reduce((sum, look) => sum + (look.likes_count || 0), 0) || 0;

    return NextResponse.json({
      profile: {
        ...profile,
        looks_count: looksCount || 0,
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        total_likes: totalLikes,
      },
      looks: looks || [],
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Erreur serveur pendant le chargement du profil." }, { status: 500 });
  }
}
