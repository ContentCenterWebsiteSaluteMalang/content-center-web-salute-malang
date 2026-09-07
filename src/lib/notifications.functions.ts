import { supabase } from "@/integrations/supabase/client";

export type NotifyEvent = "new" | "status" | "notes" | "test";

type Payload = { event: NotifyEvent; title: string; body: string };

function normalizeNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

/**
 * Sends a notification through the channels the signed-in admin enabled.
 * WhatsApp uses CallMeBot (free personal notification service).
 */
export async function sendNotification({ data }: { data: Payload }) {
  const sessionRes = await supabase.auth.getSession();
  const userId = sessionRes.data.session?.user?.id || "demo-admin-id";

  const { data: settings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const results: { channel: "email" | "whatsapp"; sent: boolean; reason?: string }[] = [];

  if (!settings) {
    return { results, skipped: "no_settings" as const };
  }

  const eventAllowed =
    data.event === "test" ||
    (data.event === "new" && settings.notify_new) ||
    (data.event === "status" && settings.notify_status) ||
    (data.event === "notes" && settings.notify_notes);

  if (!eventAllowed) return { results, skipped: "event_disabled" as const };

  // WhatsApp via CallMeBot (free)
  if (settings.wa_enabled && settings.wa_number && settings.wa_api_key) {
    try {
      const url =
        "https://api.callmebot.com/whatsapp.php?phone=" +
        encodeURIComponent(normalizeNumber(settings.wa_number)) +
        "&text=" +
        encodeURIComponent(`*${data.title}*\n${data.body}`) +
        "&apikey=" +
        encodeURIComponent(settings.wa_api_key);
      const res = await fetch(url);
      const text = await res.text();
      const lower = text.toLowerCase();
      const invalidKey = lower.includes("apikey") && lower.includes("invalid");
      const notRegistered = lower.includes("not registered") || lower.includes("not allowed");
      const ok = res.ok && !invalidKey && !notRegistered;
      const reason = invalidKey
        ? "Kode API salah. Minta kode baru lewat WhatsApp lalu salin ulang."
        : notRegistered
          ? "Nomor belum terdaftar di CallMeBot. Kirim pesan permintaan kode dari nomor yang sama."
          : text
              .replace(/<[^>]*>/g, " ")
              .trim()
              .slice(0, 200);
      results.push({
        channel: "whatsapp",
        sent: ok,
        ...(ok ? {} : { reason }),
      });
    } catch (err) {
      results.push({ channel: "whatsapp", sent: false, reason: String(err).slice(0, 200) });
    }
  } else if (settings.wa_enabled) {
    results.push({ channel: "whatsapp", sent: false, reason: "wa_not_configured" });
  }

  // Email
  if (settings.email_enabled && settings.email_address) {
    results.push({ channel: "email", sent: false, reason: "email_domain_pending" });
  }

  return { results, skipped: null };
}
