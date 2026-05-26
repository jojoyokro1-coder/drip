import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface LookWithProfile {
  id: string;
  image_url: string;
  description: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profile?: { username: string; avatar_url: string } | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") || "all";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") || "30", 10)));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return Response.json({ looks: [], error: "Supabase server is not configured" }, { status: 500 });
  }

  try {
    let query = supabaseAdmin
      .from("looks")
      .select("id, image_url, description, likes_count, created_at, user_id, profile:profiles!inner(username, avatar_url)", { count: "exact" });

    if (q) {
      if (type === "hashtag") {
        const tag = q.startsWith("#") ? q.slice(1) : q;
        query = query.ilike("description", `%#${tag}%`);
      } else if (type === "username") {
        const { data: matchedProfiles } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .ilike("username", `%${q}%`);
        if (matchedProfiles && matchedProfiles.length > 0) {
          const ids = matchedProfiles.map((p) => p.id);
          query = query.in("user_id", ids);
        } else {
          return Response.json({ looks: [], total: 0, page, perPage });
        }
      } else {
        query = query.ilike("description", `%${q}%`);
      }
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return Response.json({ looks: [], error: error.message }, { status: 500 });
    }

    const looks: LookWithProfile[] = ((data as Array<Record<string, unknown>>) || []).map((item) => ({
      id: item.id as string,
      image_url: item.image_url as string,
      description: item.description as string,
      likes_count: item.likes_count as number,
      created_at: item.created_at as string,
      user_id: item.user_id as string,
      profile: (item.profile as LookWithProfile["profile"]) ?? undefined,
    }));

    return Response.json({
      looks,
      total: count ?? 0,
      page,
      perPage,
    });
  } catch (err) {
    return Response.json({ looks: [], error: "Internal server error" }, { status: 500 });
  }
}
