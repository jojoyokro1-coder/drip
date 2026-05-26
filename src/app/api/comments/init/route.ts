import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/integrations/supabase/server";

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "";
  const key = process.env.DATABASE_SERVICE_ROLE_KEY || "";

  if (!url || url.includes("example.supabase.co") || !key || key.includes("demo-service-role-key")) {
    return NextResponse.json({
      error: "Supabase service role key not configured",
      hint: "Configure DATABASE_URL and DATABASE_SERVICE_ROLE_KEY in your .env.local",
    }, { status: 500 });
  }

  try {
    const { error: checkError } = await supabaseAdmin
      .from("comments")
      .select("id", { count: "exact", head: true });

    if (!checkError) {
      return NextResponse.json({ message: "La table comments existe deja" });
    }

    const msg = checkError.message || "";
    if (!msg.includes("does not exist") && !msg.includes("relation") && !msg.includes("not found")) {
      return NextResponse.json({
        error: "Erreur inconnue",
        detail: msg,
      }, { status: 500 });
    }

    const projectId = url.match(/https:\/\/([^.]+)/)?.[1];
    if (!projectId) {
      return NextResponse.json({ error: "Invalid Supabase URL" }, { status: 500 });
    }

    const response = await fetch(`https://${projectId}.supabase.co/sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`,
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS comments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            look_id UUID NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );

          ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

          CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
          CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
          CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        error: "Impossible de creer la table",
        detail: text,
      }, { status: 500 });
    }

    return NextResponse.json({ message: "Table comments creee avec succes" });
  } catch (err) {
    return NextResponse.json({
      error: "Erreur serveur",
      detail: String(err),
    }, { status: 500 });
  }
}
