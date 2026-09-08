import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { ChevronLeft, Loader2, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/RichTextEditor";
import { AIContentAssistant } from "@/components/AIContentAssistant";
import { sendNotification } from "@/lib/notifications.functions";

type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];

export const Route = createFileRoute("/form")({
  component: FormComponent,
  validateSearch: (search: Record<string, unknown>): { id?: string } => {
    return typeof search["id"] === "string" ? { id: search["id"] } : {};
  },
});

const STATUSES = ["Draft", "Revisi", "Final"];

const emptyForm = {
  page: "",
  subpage: "",
  section: "",
  konten_text: "",
  media_url: "",
  cta_text: "",
  cta_link: "",
  referensi: "",
  screenshot_mobile: "",
  screenshot_desktop: "",
  status: "Draft",
  notes: "",
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function FormComponent() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth", replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    if (!id) {
      setEditing(null);
      setForm({ ...emptyForm });
      return;
    }

    if (!isUuid(id)) {
      toast.info("ID konten lama tidak valid. Form baru dibuka.");
      setEditing(null);
      setForm({ ...emptyForm });
      navigate({ to: "/form", replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);
    supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setLoading(false);

        if (error || !data) {
          toast.error("Konten tidak ditemukan. Form baru dibuka.");
          setEditing(null);
          setForm({ ...emptyForm });
          navigate({ to: "/form", replace: true });
          return;
        }

        setEditing(data);
        setForm({
          page: data.page,
          subpage: data.subpage || "",
          section: data.section,
          konten_text: data.konten_text || "",
          media_url: data.media_url || "",
          cta_text: data.cta_text || "",
          cta_link: data.cta_link || "",
          referensi: data.referensi || "",
          screenshot_mobile: data.screenshot_mobile || "",
          screenshot_desktop: data.screenshot_desktop || "",
          status: data.status,
          notes: data.notes || "",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const updateForm = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUploadImage = async (file: File, type: "mobile" | "desktop" | "media") => {
    if (!file) return;

    const setBusy = (v: boolean) => {
      if (type === "mobile") setUploadingMobile(v);
      else if (type === "desktop") setUploadingDesktop(v);
      else setUploadingMedia(v);
    };

    setBusy(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast.error("Sesi login tidak ditemukan, silakan masuk kembali");
        return;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${auth.user.id}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from("content-media")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (error) {
        toast.error(`Gagal mengunggah gambar: ${error.message}`);
        return;
      }

      const { data: signed, error: signErr } = await supabase.storage
        .from("content-media")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      if (signErr || !signed?.signedUrl) {
        toast.error("Gambar terunggah, tetapi alamatnya gagal dibuat");
        return;
      }

      if (type === "mobile") updateForm("screenshot_mobile", signed.signedUrl);
      else if (type === "desktop") updateForm("screenshot_desktop", signed.signedUrl);
      else updateForm("media_url", signed.signedUrl);

      toast.success("Gambar berhasil diunggah");
    } catch (e) {
      toast.error(`Terjadi kesalahan saat mengunggah: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const saveItem = async () => {
    if (!form.page.trim() || !form.section.trim()) {
      toast.error("Halaman dan Section wajib diisi");
      return;
    }
    setSavingItem(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSavingItem(false);
      toast.error("Sesi login tidak ditemukan");
      return;
    }

    const payload = {
      page: form.page.trim(),
      subpage: form.subpage || null,
      section: form.section.trim(),
      konten_text: form.konten_text || null,
      media_url: form.media_url || null,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      referensi: form.referensi || null,
      screenshot_mobile: form.screenshot_mobile || null,
      screenshot_desktop: form.screenshot_desktop || null,
      status: form.status,
      notes: form.notes || null,
    };

    if (editing) {
      const { error } = await supabase.from("content_items").update(payload).eq("id", editing.id);
      setSavingItem(false);
      if (error) {
        toast.error("Gagal menyimpan konten");
        return;
      }
      toast.success("Konten diperbarui");

      if (editing.status !== form.status) {
        await sendNotification({
          data: {
            event: "status",
            title: "Status konten diubah",
            body: `${payload.page} — ${payload.section}: ${editing.status} → ${form.status}`,
          },
        });
      }
      if ((editing.notes ?? "") !== (payload.notes ?? "") && payload.notes) {
        await sendNotification({
          data: {
            event: "notes",
            title: "Catatan baru pada konten",
            body: `${payload.page} — ${payload.section}: ${payload.notes}`,
          },
        });
      }
      navigate({ to: "/" });
    } else {
      const { error } = await supabase
        .from("content_items")
        .insert({ ...payload, user_id: auth.user.id });
      setSavingItem(false);
      if (error) {
        toast.error("Gagal menambahkan konten");
        return;
      }
      toast.success("Konten ditambahkan");

      await sendNotification({
        data: {
          event: "new",
          title: "Konten baru ditambahkan",
          body: `${payload.page} — ${payload.section} (status: ${payload.status})`,
        },
      });
      navigate({ to: "/" });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })} aria-label="Kembali">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {editing ? "Edit Konten" : "Tambah Konten"}
            </h1>
            <p className="text-xs text-muted-foreground">Kelola konten, media, dan rekomendasi AI dalam satu alur.</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="text-base font-semibold">Informasi Konten</h2>
              <p className="mt-1 text-xs text-muted-foreground">Tentukan halaman dan section yang akan dikerjakan.</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Halaman *</label>
                <Input value={form.page} onChange={(e) => updateForm("page", e.target.value)} placeholder="Beranda" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sub Halaman</label>
                <Input value={form.subpage} onChange={(e) => updateForm("subpage", e.target.value)} placeholder="—" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Section / Fitur *</label>
                <Input value={form.section} onChange={(e) => updateForm("section", e.target.value)} placeholder="1. Hero Banner" />
              </div>
            </div>

            <div className="my-7 border-t border-border" />

            <div>
              <div className="mb-3">
                <h2 className="text-base font-semibold">Konten</h2>
                <p className="mt-1 text-xs text-muted-foreground">Tulis atau format konten yang akan digunakan pada website.</p>
              </div>
              <RichTextEditor value={form.konten_text} onChange={(value) => updateForm("konten_text", value)} />
            </div>

            <div className="my-7 border-t border-border" />

            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold">Media & Referensi</h2>
                <p className="mt-1 text-xs text-muted-foreground">Tambahkan media utama, referensi website, dan screenshot.</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Media (Upload / URL)</label>
                  <div className="flex gap-2">
                    <Input value={form.media_url} onChange={(e) => updateForm("media_url", e.target.value)} placeholder="https://... atau unggah gambar" />
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          if (e.target.files?.[0]) void handleUploadImage(e.target.files[0], "media");
                          e.target.value = "";
                        }}
                        disabled={uploadingMedia}
                      />
                      <Button variant="outline" type="button" disabled={uploadingMedia} aria-label="Unggah media">
                        {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {form.media_url ? <img src={form.media_url} alt="Pratinjau media konten" loading="lazy" className="h-28 w-full rounded-md border object-cover" /> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Referensi Web (URL)</label>
                  <Input value={form.referensi} onChange={(e) => updateForm("referensi", e.target.value)} placeholder="https://..." />
                  <p className="text-[11px] text-muted-foreground">Gunakan URL halaman referensi jika tersedia.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Screenshot Mobile (URL)</label>
                  <div className="flex gap-2">
                    <Input value={form.screenshot_mobile} onChange={(e) => updateForm("screenshot_mobile", e.target.value)} placeholder="Atau pilih file..." />
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          if (e.target.files?.[0]) void handleUploadImage(e.target.files[0], "mobile");
                          e.target.value = "";
                        }}
                        disabled={uploadingMobile}
                      />
                      <Button variant="outline" type="button" disabled={uploadingMobile} aria-label="Unggah screenshot mobile">
                        {uploadingMobile ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {form.screenshot_mobile ? <img src={form.screenshot_mobile} alt="Pratinjau tampilan ponsel" loading="lazy" className="h-28 w-full rounded-md border object-cover" /> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Screenshot Desktop (URL)</label>
                  <div className="flex gap-2">
                    <Input value={form.screenshot_desktop} onChange={(e) => updateForm("screenshot_desktop", e.target.value)} placeholder="Atau pilih file..." />
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          if (e.target.files?.[0]) void handleUploadImage(e.target.files[0], "desktop");
                          e.target.value = "";
                        }}
                        disabled={uploadingDesktop}
                      />
                      <Button variant="outline" type="button" disabled={uploadingDesktop} aria-label="Unggah screenshot desktop">
                        {uploadingDesktop ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {form.screenshot_desktop ? <img src={form.screenshot_desktop} alt="Pratinjau tampilan desktop" loading="lazy" className="h-28 w-full rounded-md border object-cover" /> : null}
                </div>
              </div>
            </div>

            <div className="my-7 border-t border-border" />

            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold">Call to Action</h2>
                <p className="mt-1 text-xs text-muted-foreground">Atur teks tombol dan tujuan link CTA.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Button & Link CTA Text</label>
                  <Input value={form.cta_text} onChange={(e) => updateForm("cta_text", e.target.value)} placeholder="Beli Sekarang" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Button & Link CTA URL</label>
                  <Input value={form.cta_link} onChange={(e) => updateForm("cta_link", e.target.value)} placeholder="/checkout" />
                </div>
              </div>
            </div>

            <div className="my-7 border-t border-border" />

            <div>
              <div className="mb-4">
                <h2 className="text-base font-semibold">Publishing</h2>
                <p className="mt-1 text-xs text-muted-foreground">Tentukan status dan catatan internal untuk konten ini.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={3} placeholder="Catatan internal untuk developer/client..." />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => navigate({ to: "/" })}>Batal</Button>
              <Button className="font-semibold" onClick={saveItem} disabled={savingItem}>
                {savingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Konten
              </Button>
            </div>
          </section>

          <AIContentAssistant
            page={form.page}
            subpage={form.subpage}
            section={form.section}
            currentContent={form.konten_text}
            currentCta={form.cta_text}
            onInsertContent={(html) => updateForm("konten_text", form.konten_text ? `${form.konten_text}${html}` : html)}
            onSetCta={(value) => updateForm("cta_text", value)}
          />
        </div>
      </main>
    </div>
  );
}
