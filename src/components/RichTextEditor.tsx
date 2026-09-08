import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ImagePlus,
  Italic,
  Lightbulb,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  RefreshCw,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type AssistantMode = "idle" | "ideas" | "content" | "screenshot";

function ToolbarButton({
  active = false,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function buildRecommendations(mode: AssistantMode) {
  if (mode === "ideas") {
    return [
      {
        label: "Ide 1",
        title: "Tonjolkan manfaat utama",
        body: "Gunakan headline singkat yang langsung menjawab kebutuhan pengunjung dan lanjutkan dengan satu manfaat paling kuat.",
      },
      {
        label: "Ide 2",
        title: "Gunakan social proof",
        body: "Tambahkan angka, hasil, atau bukti kepercayaan untuk membuat section terasa lebih meyakinkan.",
      },
      {
        label: "Ide 3",
        title: "Perjelas CTA",
        body: "Arahkan pengunjung ke satu tindakan utama dengan CTA yang spesifik dan mudah dipahami.",
      },
    ];
  }

  if (mode === "screenshot") {
    return [
      {
        label: "Headline",
        title: "Bangun Website Profesional untuk Bisnis Anda",
        body: "Struktur hero pada screenshot terlihat menempatkan headline kuat diikuti penjelasan singkat dan CTA utama.",
      },
      {
        label: "Description",
        title: "Tampilkan nilai utama dengan bahasa yang ringkas",
        body: "Kami membantu bisnis meningkatkan kehadiran digital dengan pengalaman website yang profesional, responsif, dan mudah digunakan.",
      },
      {
        label: "CTA",
        title: "Konsultasikan Sekarang",
        body: "CTA dibuat singkat, berorientasi tindakan, dan ditempatkan sebagai fokus utama section.",
      },
    ];
  }

  return [
    {
      label: "Headline",
      title: "Solusi Digital untuk Bisnis yang Lebih Berkembang",
      body: "Headline yang fokus pada manfaat dan mudah dipahami dalam sekali baca.",
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

export function RichTextEditor({ value, onChange, placeholder = "Tulis konten di sini..." }: RichTextEditorProps) {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("idle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [usedLabels, setUsedLabels] = useState<string[]>([]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-36 w-full px-4 py-3 text-sm leading-6 text-foreground outline-none [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-4",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const recommendations = useMemo(() => buildRecommendations(assistantMode), [assistantMode]);

  if (!editor) {
    return <div className="min-h-36 animate-pulse rounded-md border border-input bg-muted/20" />;
  }

  const setHeading = (level: 1 | 2 | 3 | 0) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  const setLink = () => {
    const existing = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL", existing ?? "https://");

    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const runAssistant = (mode: Exclude<AssistantMode, "idle">) => {
    setAssistantMode(mode);
    setIsGenerating(true);
    setUsedLabels([]);
    window.setTimeout(() => setIsGenerating(false), 650);
  };

  const useRecommendation = (item: (typeof recommendations)[number]) => {
    if (item.label === "CTA") {
      editor.chain().focus().insertContent(`<p><strong>CTA:</strong> ${item.title}</p>`).run();
    } else if (item.label.startsWith("Ide")) {
      editor.chain().focus().insertContent(`<p><strong>${item.title}</strong> — ${item.body}</p>`).run();
    } else if (item.label === "Headline") {
      editor.chain().focus().insertContent(`<h2>${item.title}</h2>`).run();
    } else {
      editor.chain().focus().insertContent(`<p>${item.title}</p>`).run();
    }

    setUsedLabels((current) => (current.includes(item.label) ? current : [...current, item.label]));
  };

  const useAll = () => {
    recommendations.forEach((item) => useRecommendation(item));
  };

  const handleScreenshot = (file: File) => {
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    runAssistant("screenshot");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-1 focus-within:ring-ring">
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
          <select
            aria-label="Gaya teks"
            value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
            onChange={(event) => setHeading(event.target.value === "h1" ? 1 : event.target.value === "h2" ? 2 : event.target.value === "h3" ? 3 : 0)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolbarButton>
          <ToolbarButton label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline /></ToolbarButton>
          <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton label="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft /></ToolbarButton>
          <ToolbarButton label="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter /></ToolbarButton>
          <ToolbarButton label="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight /></ToolbarButton>
          <ToolbarButton label="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify /></ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolbarButton>
          <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolbarButton>
          <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolbarButton>
          <ToolbarButton label="Horizontal line" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></ToolbarButton>
          <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon /></ToolbarButton>

          <div className="mx-1 h-6 w-px bg-border" />

          <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 /></ToolbarButton>
          <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 /></ToolbarButton>
        </div>

        <EditorContent editor={editor} />
      </div>

      <aside className="overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-24 lg:self-start">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4" />
            AI Content Assistant
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Prototype UI — belum terhubung ke model AI.</p>
        </div>

        <div className="space-y-2 p-3">
          <Button type="button" variant={assistantMode === "ideas" ? "secondary" : "outline"} className="w-full justify-start" onClick={() => runAssistant("ideas")}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Generate Ide
          </Button>
          <Button type="button" variant={assistantMode === "content" ? "secondary" : "outline"} className="w-full justify-start" onClick={() => runAssistant("content")}>
            <WandSparkles className="mr-2 h-4 w-4" />
            Generate Content
          </Button>
          <Button type="button" variant={assistantMode === "screenshot" ? "secondary" : "outline"} className="w-full justify-start" onClick={() => runAssistant("screenshot")}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Analyze Screenshot
          </Button>
        </div>

        {(assistantMode === "screenshot" || screenshot) && (
          <div className="px-3 pb-3">
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4 text-center hover:bg-muted/40">
              <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">Tarik & lepas Screenshot</span>
              <span className="text-[11px] text-muted-foreground">atau klik untuk mengunggah</span>
              {screenshotName ? <span className="mt-2 max-w-full truncate text-[11px] text-foreground">{screenshotName}</span> : null}
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
            {screenshot ? <img src={screenshot} alt="Preview screenshot referensi" className="mt-2 max-h-40 w-full rounded-md border object-cover" /> : null}
          </div>
        )}

        {assistantMode !== "idle" && (
          <div className="border-t border-border p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-3.5 w-3.5" /> AI Recommendations</div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Pilih hasil yang ingin dimasukkan ke editor.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Generate ulang" onClick={() => runAssistant(assistantMode === "idle" ? "content" : assistantMode)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {isGenerating ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyiapkan rekomendasi...
              </div>
            ) : (
              <div className="space-y-2">
                {recommendations.map((item) => {
                  const used = usedLabels.includes(item.label);
                  return (
                    <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-foreground">{item.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                      <Button type="button" size="sm" variant={used ? "secondary" : "outline"} className="mt-3 h-8" onClick={() => useRecommendation(item)}>
                        {used ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <WandSparkles className="mr-1.5 h-3.5 w-3.5" />}
                        {used ? "Sudah digunakan" : "Gunakan"}
                      </Button>
                    </div>
                  );
                })}
                <Button type="button" className="w-full" onClick={useAll}>
                  <Check className="mr-2 h-4 w-4" /> Gunakan Semua
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border px-3 py-3 text-[11px] leading-4 text-muted-foreground">
          <span className="font-medium text-foreground">Catatan:</span> hasil AI hanya draft/rekomendasi. Tidak ada perubahan otomatis tanpa tindakan <span className="font-medium">Gunakan</span>.
        </div>
      </aside>
    </div>
  );
}
