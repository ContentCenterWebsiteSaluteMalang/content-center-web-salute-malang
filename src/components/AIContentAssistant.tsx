import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Lightbulb, Loader2, RefreshCw, Sparkles, Upload, WandSparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssistantMode = "idle" | "ideas" | "content" | "screenshot";

type Recommendation = {
  label: string;
  title: string;
  body: string;
};

interface AIContentAssistantProps {
  page: string;
  subpage: string;
  section: string;
  currentContent: string;
  currentCta: string;
  onInsertContent: (html: string) => void;
  onSetCta: (value: string) => void;
}

function buildRecommendations(mode: Exclude<AssistantMode, "idle">, section: string): Recommendation[] {
  const sectionName = section.trim() || "section ini";

  if (mode === "ideas") {
    return [
      {
        label: "Ide 1",
        title: "Tonjolkan manfaat utama",
        body: `Buat ${sectionName} langsung menjawab kebutuhan pengunjung dengan satu manfaat paling kuat.`,
      },
      {
        label: "Ide 2",
        title: "Gunakan bukti yang meyakinkan",
        body: "Tambahkan angka, hasil, testimonial, atau keunggulan yang membuat pesan lebih dipercaya.",
      },
      {
        label: "Ide 3",
        title: "Perjelas ajakan bertindak",
        body: "Arahkan pengunjung ke satu tindakan utama dengan CTA yang spesifik dan mudah dipahami.",
      },
    ];
  }

  if (mode === "screenshot") {
    return [
      {
        label: "Headline",
        title: "Bangun Website Profesional untuk Bisnis Anda",
        body: "Struktur visual referensi dapat diterjemahkan menjadi headline singkat yang fokus pada manfaat utama.",
      },
      {
        label: "Description",
        title: "Tampilkan nilai utama dengan bahasa yang ringkas",
        body: "Gunakan dua sampai tiga kalimat untuk menjelaskan manfaat, pembeda, dan alasan pengunjung perlu melanjutkan.",
      },
      {
        label: "CTA",
        title: "Konsultasikan Sekarang",
        body: "CTA dibuat singkat, berorientasi tindakan, dan menjadi fokus utama section.",
      },
    ];
  }

  return [
    {
      label: "Headline",
      title: "Solusi Digital untuk Bisnis yang Lebih Berkembang",
      body: `Draft headline untuk ${sectionName}, fokus pada manfaat dan mudah dipahami dalam sekali baca.`,
    },
    {
      label: "Description",
      title: "Bangun pengalaman digital yang profesional dan relevan untuk kebutuhan bisnis Anda.",
      body: "Deskripsi singkat yang menjelaskan nilai layanan tanpa terlalu banyak jargon.",
    },
    {
      label: "CTA",
      title: "Mulai Konsultasi",
      body: "CTA yang jelas dan berorientasi pada tindakan.",
    },
  ];
}

export function AIContentAssistant({
  page,
  subpage,
  section,
  currentContent,
  currentCta,
  onInsertContent,
  onSetCta,
}: AIContentAssistantProps) {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [usedLabels, setUsedLabels] = useState<string[]>([]);
  const [showContext, setShowContext] = useState(false);

  const recommendations = useMemo(
    () => (assistantMode === "idle" ? [] : buildRecommendations(assistantMode, section)),
    [assistantMode, section],
  );

  useEffect(() => {
    setUsedLabels([]);
  }, [assistantMode]);

  const runAssistant = (mode: Exclude<AssistantMode, "idle">) => {
    setAssistantMode(mode);
    setIsGenerating(true);
    window.setTimeout(() => setIsGenerating(false), 650);
  };

  const useRecommendation = (item: Recommendation) => {
    if (item.label === "CTA") {
      onSetCta(item.title);
    } else if (item.label === "Headline") {
      onInsertContent(`<h2>${item.title}</h2>`);
    } else if (item.label.startsWith("Ide")) {
      onInsertContent(`<p><strong>${item.title}</strong> — ${item.body}</p>`);
    } else {
      onInsertContent(`<p>${item.title}</p>`);
    }

    setUsedLabels((current) => (current.includes(item.label) ? current : [...current, item.label]));
  };

  const useAll = () => {
    recommendations.forEach(useRecommendation);
  };

  const handleScreenshot = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    runAssistant("screenshot");
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    setScreenshotName("");
    if (assistantMode === "screenshot") setAssistantMode("idle");
  };

  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-24 lg:self-start">
      <div className="border-b border-border bg-muted/30 px-4 py-4">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4" />
          AI Content Assistant
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Bantu mencari ide dan menyusun draft konten dari konteks form.
        </p>
      </div>

      <div className="space-y-2 p-3">
        <Button
          type="button"
          variant={assistantMode === "ideas" ? "secondary" : "outline"}
          className="h-10 w-full justify-start"
          onClick={() => runAssistant("ideas")}
        >
          <Lightbulb className="mr-2 h-4 w-4" />
          Generate Ide
        </Button>
        <Button
          type="button"
          variant={assistantMode === "content" ? "secondary" : "outline"}
          className="h-10 w-full justify-start"
          onClick={() => runAssistant("content")}
        >
          <WandSparkles className="mr-2 h-4 w-4" />
          Generate Content
        </Button>
        <Button
          type="button"
          variant={assistantMode === "screenshot" ? "secondary" : "outline"}
          className="h-10 w-full justify-start"
          onClick={() => runAssistant("screenshot")}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Analyze Screenshot
        </Button>
      </div>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowContext((value) => !value)}
        >
          <span className="font-medium">Konteks yang digunakan AI</span>
          <span>{showContext ? "Sembunyikan" : "Lihat"}</span>
        </button>
        {showContext ? (
          <div className="mt-2 space-y-1.5 rounded-lg bg-muted/40 p-2.5 text-[11px] leading-4">
            <div><span className="font-medium">Halaman:</span> {page || "—"}</div>
            <div><span className="font-medium">Sub Halaman:</span> {subpage || "—"}</div>
            <div><span className="font-medium">Section:</span> {section || "—"}</div>
            <div><span className="font-medium">Konten saat ini:</span> {currentContent ? "Ada isi" : "Masih kosong"}</div>
            <div><span className="font-medium">CTA:</span> {currentCta || "Belum diisi"}</div>
          </div>
        ) : null}
      </div>

      {(assistantMode === "screenshot" || screenshot) ? (
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 text-sm font-semibold">Referensi Screenshot</div>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-center transition hover:bg-muted/40">
            <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-medium">Tarik & lepas screenshot</span>
            <span className="text-[11px] text-muted-foreground">atau klik untuk mengunggah</span>
            {screenshotName ? <span className="mt-2 max-w-full truncate text-[11px]">{screenshotName}</span> : null}
            <Input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleScreenshot(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          {screenshot ? (
            <div className="relative mt-2">
              <img src={screenshot} alt="Preview screenshot referensi" className="max-h-48 w-full rounded-lg border object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7"
                title="Hapus screenshot"
                onClick={clearScreenshot}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {assistantMode !== "idle" ? (
        <div className="border-t border-border p-3">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                AI Recommendations
              </div>
              <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                {isGenerating ? "Menyiapkan rekomendasi..." : "Pilih hasil yang ingin digunakan."}
              </p>
            </div>
            {!isGenerating ? (
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" title="Regenerate" onClick={() => runAssistant(assistantMode as Exclude<AssistantMode, "idle">)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>

          {isGenerating ? (
            <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating preview...
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((item) => {
                const used = usedLabels.includes(item.label);
                return (
                  <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-semibold leading-5">{item.title}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                    <Button
                      type="button"
                      variant={used ? "secondary" : "outline"}
                      size="sm"
                      className="mt-2 h-8 w-full"
                      onClick={() => useRecommendation(item)}
                    >
                      {used ? "✓ Digunakan" : "Gunakan"}
                    </Button>
                  </div>
                );
              })}
              <Button type="button" className="w-full" onClick={useAll} disabled={recommendations.length === 0}>
                Gunakan Semua
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="border-t border-border bg-muted/20 px-4 py-3">
        <p className="text-[11px] leading-4 text-muted-foreground">
          <span className="font-semibold text-foreground">Catatan:</span> hasil AI hanya draft/rekomendasi. Tidak ada perubahan otomatis tanpa tindakan <span className="font-medium">Gunakan</span>.
        </p>
      </div>
    </aside>
  );
}
