import { supabase } from "@/integrations/supabase/client";

export type NotifyEvent = "new" | "status" | "notes" | "test";

type Payload = { event: NotifyEvent; title: string; body: string };

/**
 * Sends notification requests through the authenticated Supabase Edge Function.
 * Twilio credentials stay server-side and are never exposed to the browser.
 */
export async function sendNotification({ data }: { data: Payload }) {
  const { data: result, error } = await supabase.functions.invoke("send-notification", {
    body: data,
  });

  if (error) {
    return {
      results: [{ channel: "whatsapp" as const, sent: false, reason: error.message }],
      skipped: null,
    };
  }

  return result ?? { results: [], skipped: null };
}
