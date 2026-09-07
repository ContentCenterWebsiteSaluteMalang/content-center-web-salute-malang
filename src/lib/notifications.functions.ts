import { supabase } from "@/integrations/supabase/client";

export type NotifyEvent = "new" | "status" | "notes" | "test";

type Payload = { event: NotifyEvent; title: string; body: string };

/**
 * Sends a notification through the channels the signed-in admin enabled.
 */
export async function sendNotification({ data }: { data: Payload }) {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id || "demo-admin-id";

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const results: { channel: "email"; sent: boolean; reason?: string }[] = [];

  if (!settings) {
    return { results, skipped: "no_settings" as const };
  }

  const eventAllowed =
    data.event === "test" ||
    (data.event === "new" && settings.notify_new) ||
    (data.event === "status" && settings.notify_status) ||
    (data.event === "notes" && settings.notify_notes);

  if (!eventAllowed) return { results, skipped: "event_disabled" as const };

  // Email
  if (settings.email_enabled && settings.email_address) {
    results.push({ channel: "email", sent: false, reason: "email_domain_pending" });
  }

  return { results, skipped: null };
}
