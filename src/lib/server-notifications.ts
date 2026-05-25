import { SupabaseClient } from "@supabase/supabase-js";

type NotificationType = "like" | "follow" | "comment";

export async function createNotification(
  supabaseAdmin: SupabaseClient,
  input: {
    userId?: string | null;
    actorId: string;
    type: NotificationType;
    lookId?: string | null;
    commentId?: string | null;
  }
) {
  if (!input.userId || input.userId === input.actorId) return;

  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    look_id: input.lookId || null,
    comment_id: input.commentId || null,
    read: false,
  });

  if (error) {
    console.warn("Notification skipped:", error.message);
  }
}
