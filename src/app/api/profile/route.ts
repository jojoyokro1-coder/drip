import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/server";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const BIO_MAX = 150;

export async function PATCH(request: NextRequest) {
  try {
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
    const username = String(body?.username || "")
      .trim()
      .toLowerCase();
    const bio = String(body?.bio || "").trim();
    const avatarUrl = body?.avatar_url ? String(body.avatar_url).trim() : "";

    if (!username) {
      return NextResponse.json({ error: "Le pseudo est requis." }, { status: 400 });
    }

    if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
      return NextResponse.json(
        { error: `Le pseudo doit contenir entre ${USERNAME_MIN} et ${USERNAME_MAX} caracteres.` },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: "Le pseudo ne peut contenir que des lettres, chiffres et underscores." },
        { status: 400 }
      );
    }

    if (bio.length > BIO_MAX) {
      return NextResponse.json(
        { error: `La bio ne peut pas depasser ${BIO_MAX} caracteres.` },
        { status: 400 }
      );
    }

    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (profileLookupError) {
      return NextResponse.json({ error: "Erreur lors de la verification du pseudo." }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json({ error: "Ce pseudo est deja pris." }, { status: 409 });
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        username,
        bio,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);

    if (updateProfileError) {
      return NextResponse.json({ error: "Impossible de mettre a jour le profil." }, { status: 500 });
    }

    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        username,
      },
    });

    if (updateAuthError) {
      return NextResponse.json(
        {
          error:
            "Profil mis a jour, mais impossible de synchroniser les metadonnees utilisateur. Reessaie.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, username, bio, avatar_url: avatarUrl || "" });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant la mise a jour du profil." }, { status: 500 });
  }
}
