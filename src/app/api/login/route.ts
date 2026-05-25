import { NextResponse } from "next/server";
import { getSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          error: "Configuration Supabase incomplete.",
          code: "SUPABASE_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = (error.message || "").toLowerCase();

      // Auto-confirm email if not confirmed
      if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const { data: users } = await admin.auth.admin.listUsers();
          const user = users?.users.find((u) => u.email?.toLowerCase() === email);

          if (user) {
            await admin.auth.admin.updateUserById(user.id, { email_confirm: true });

            // Retry login
            const retry = await supabase.auth.signInWithPassword({ email, password });
            if (retry.data?.session && retry.data?.user) {
              return NextResponse.json({
                session: retry.data.session,
                user: retry.data.user,
              });
            }
          }
        }
      }

      return NextResponse.json(
        { error: error?.message || "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      return NextResponse.json(
        { error: "Email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur pendant la connexion." }, { status: 500 });
  }
}
