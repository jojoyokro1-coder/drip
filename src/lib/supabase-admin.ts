import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL || "";
  const key = process.env.DATABASE_SERVICE_ROLE_KEY || "";
  const invalidUrl = !url || url.includes("example.supabase.co");
  const invalidKey = !key || key.includes("demo-service-role-key");

  if (invalidUrl || invalidKey) {
    return null;
  }

  return createClient(url, key);
}

