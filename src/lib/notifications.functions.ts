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

  const results: { channel: "webhook"; sent: boolean; reason?: string }[] = [];

  if (!settings) {
    return { results, skipped: "no_settings" as const };
  }

  const eventAllowed =
    data.event === "test" ||
    (data.event === "new" && settings.notify_new) ||
    (data.event === "status" && settings.notify_status) ||
    (data.event === "notes" && settings.notify_notes);

  if (!eventAllowed) return { results, skipped: "event_disabled" as const };

  // Webhook
  if (settings.webhook_enabled && settings.webhook_url) {
    try {
      const res = await fetch(settings.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: data.event,
          title: data.title,
          body: data.body,
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        results.push({ channel: "webhook", sent: true });
      } else {
        results.push({ channel: "webhook", sent: false, reason: `HTTP ${res.status}` });
      }
    } catch (err) {
      results.push({ channel: "webhook", sent: false, reason: String(err) });
    }
  }

  return { results, skipped: null };
}
