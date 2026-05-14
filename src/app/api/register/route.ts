import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/server";

function isConfigured() {
  const url = process.env.DATABASE_URL || "";
  const key = process.env.DATABASE_SERVICE_ROLE_KEY || "";
  const invalidUrl = !url || url.includes("example.supabase.co");
  const invalidKey = !key || key.includes("demo-service-role-key");
  return !invalidUrl && !invalidKey;
}

export async function POST(request: Request) {
  try {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "Configuration Supabase invalide. Mets tes vraies cles dans .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const username = String(body?.username || "").trim().toLowerCase();

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, mot de passe et pseudo sont requis." }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Le pseudo ne peut contenir que des lettres, chiffres et underscores." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caracteres." }, { status: 400 });
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ error: "Ce pseudo est deja pris." }, { status: 409 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message || "Impossible de creer le compte." }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      username,
    });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: "Compte cree mais profil invalide. Reessaie." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant l'inscription." }, { status: 500 });
  }
}
