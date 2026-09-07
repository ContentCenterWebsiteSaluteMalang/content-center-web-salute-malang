import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: Payload) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
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

    const provider = (settings as { wa_provider?: string }).wa_provider ?? "callmebot";
    const baseUrl = ((settings as { wa_base_url?: string | null }).wa_base_url ?? "").replace(
      /\/+$/,
      "",
    );
    const waToken = (settings as { wa_token?: string | null }).wa_token ?? "";

    // WhatsApp via Apify actor "leadsbrary/automate-whatsapp-in-one-api"
    if (provider === "apify" && settings.wa_enabled) {
      if (!baseUrl || !waToken || !settings.wa_number) {
        results.push({
          channel: "whatsapp",
          sent: false,
          reason: "Alamat layanan, token, atau nomor WhatsApp belum diisi.",
        });
      } else {
        try {
          const res = await fetch(`${baseUrl}/send`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              waitForResult: true,
              confirmRecipientConsent: true,
              sendMessages: [
                {
                  to: `${normalizeNumber(settings.wa_number)}@c.us`,
                  message: `*${data.title}*\n${data.body}`,
                },
              ],
            }),
          });
          const text = await res.text();
          let ok = res.ok;
          let reason = text.slice(0, 300);
          try {
            const json = JSON.parse(text) as {
              ok?: boolean;
              success?: boolean;
              error?: string;
              message?: string;
              results?: { status?: string; error?: string }[];
            };
            if (json.ok === false || json.success === false) ok = false;
            const failed = json.results?.find(
              (r) => r.status && r.status.toLowerCase() !== "sent" && r.status !== "ok",
            );
            if (failed) ok = false;
            reason = failed?.error ?? json.error ?? json.message ?? reason;
          } catch {
            /* keep raw text as reason */
          }
          if (res.status === 401 || res.status === 403)
            reason = "Token akses ditolak. Salin ulang token dari Control Center.";
          if (res.status === 404)
            reason = "Alamat layanan tidak ditemukan. Pastikan URL actor masih berjalan.";
          results.push({ channel: "whatsapp", sent: ok, ...(ok ? {} : { reason }) });
        } catch (err) {
          results.push({ channel: "whatsapp", sent: false, reason: String(err).slice(0, 200) });
        }
      }
    } else if (settings.wa_enabled && settings.wa_number && settings.wa_api_key) {
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
            : text.replace(/<[^>]*>/g, " ").trim().slice(0, 200);
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
  });
