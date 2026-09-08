import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "gemini-3.7-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Mode = "ideas" | "content" | "screenshot";

type RequestPayload = {
  mode: Mode;
  page?: string;
  subpage?: string;
  section?: string;
  currentContent?: string;
  currentCta?: string;
  screenshot?: { mimeType: string; data: string } | null;
};

const responseSchema = {
  type: "OBJECT",
  properties: {
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          title: { type: "STRING" },
          body: { type: "STRING" },
          html: { type: "STRING" },
          cta: { type: "STRING" },
        },
        required: ["label", "title", "body", "html", "cta"],
      },
    },
  },
  required: ["recommendations"],
};

function buildPrompt(payload: RequestPayload) {
  const context = [
    `Halaman: ${payload.page || "—"}`,
    `Sub Halaman: ${payload.subpage || "—"}`,
    `Section/Fitur: ${payload.section || "—"}`,
    `Konten saat ini: ${payload.currentContent || "(kosong)"}`,
    `CTA saat ini: ${payload.currentCta || "(kosong)"}`,
  ].join("\n");

  const base = `
Kamu adalah AI Content Assistant untuk Content Center Web Salute Malang.
Bantu developer dan client menyusun draft konten website berbahasa Indonesia.
Gunakan bahasa yang profesional, jelas, modern, natural, dan tidak berlebihan.
Jangan mengarang fakta spesifik tentang bisnis jika tidak diberikan.
Hasil harus berupa rekomendasi yang siap diedit manusia.
Konteks form:
${context}
`;

  if (payload.mode === "ideas") {
    return `${base}
Berikan 3 sampai 5 ide konten yang relevan untuk section tersebut.
Fokus pada strategi pesan, manfaat, struktur informasi, dan CTA.
Setiap item harus memiliki label seperti "Ide 1", judul singkat, penjelasan, html sederhana yang bisa dimasukkan ke rich text editor, dan CTA jika relevan.
`;
  }

  if (payload.mode === "screenshot") {
    return `${base}
Analisis screenshot website referensi yang diberikan.
Identifikasi pola struktur dan hierarki visual tanpa menyalin teks bermerek atau identitas khas secara mentah.
Buat 3 sampai 5 rekomendasi konten orisinal yang terinspirasi dari struktur tersebut dan disesuaikan dengan konteks form.
Gunakan label seperti "Headline", "Description", "CTA", atau nama section yang relevan.
Setiap item wajib memiliki title sebagai draft utama, body sebagai alasan/rekomendasi singkat, html yang siap dimasukkan ke rich text editor, dan cta jika ada.
`;
  }

  return `${base}
Buat 3 sampai 5 alternatif draft konten untuk section tersebut.
Jika konten saat ini sudah ada, pertahankan informasi penting dan perbaiki kejelasan, struktur, dan daya persuasinya.
Hasilkan kombinasi headline, description, supporting copy, dan CTA bila relevan.
Setiap item wajib memiliki title sebagai draft utama, body sebagai penjelasan singkat, html yang siap dimasukkan ke rich text editor, dan cta jika ada.
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: "Supabase environment belum lengkap" }, 500);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) return json({ error: "GEMINI_API_KEY belum dikonfigurasi di Supabase Secrets" }, 503);

    const payload = (await req.json()) as RequestPayload;
    if (!["ideas", "content", "screenshot"].includes(payload.mode)) {
      return json({ error: "Mode AI tidak valid" }, 400);
    }

    if (payload.mode === "screenshot") {
      if (!payload.screenshot?.data || !payload.screenshot?.mimeType?.startsWith("image/")) {
        return json({ error: "Screenshot diperlukan untuk analisis gambar" }, 400);
      }
      if (payload.screenshot.data.length > 18_000_000) {
        return json({ error: "Ukuran screenshot terlalu besar. Gunakan gambar di bawah sekitar 13 MB." }, 413);
      }
    }

    const parts: Record<string, unknown>[] = [{ text: buildPrompt(payload) }];
    if (payload.mode === "screenshot" && payload.screenshot) {
      parts.push({
        inlineData: {
          mimeType: payload.screenshot.mimeType,
          data: payload.screenshot.data,
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            maxOutputTokens: 1800,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      },
    );

    const raw = await response.text();
    if (!response.ok) {
      let message = raw;
      try { message = JSON.parse(raw)?.error?.message ?? raw; } catch { /* keep raw */ }
      return json({ error: `Gemini API: ${message.slice(0, 400)}` }, response.status >= 500 ? 502 : response.status);
    }

    let parsed: { recommendations?: unknown[] };
    try {
      const data = JSON.parse(raw);
      const text = data?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
      parsed = JSON.parse(text || "{}");
    } catch {
      return json({ error: "Gemini mengembalikan format yang tidak dapat dibaca" }, 502);
    }

    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 5).map((item) => {
          const value = item as Record<string, unknown>;
          return {
            label: String(value.label || "Rekomendasi"),
            title: String(value.title || ""),
            body: String(value.body || ""),
            html: String(value.html || `<p>${String(value.title || "")}</p>`),
            cta: String(value.cta || ""),
          };
        })
      : [];

    return json({ recommendations, model: MODEL });
  } catch (error) {
    return json({ error: String(error).slice(0, 400) }, 500);
  }
});
