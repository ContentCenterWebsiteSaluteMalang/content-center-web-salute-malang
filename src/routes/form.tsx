import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  ChevronLeft,
  Loader2,
  ImageIcon,
} from "lucide-react";

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

    // Old/mock URLs such as /form?id=item-1 should open a fresh form
    // instead of causing a database lookup/error page.
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

      if (type === "mobile") setForm({ ...form, screenshot_mobile: signed.signedUrl });
      else if (type === "desktop") setForm({ ...form, screenshot_desktop: signed.signedUrl });
      else setForm({ ...form, media_url: signed.signedUrl });

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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {editing ? "Edit Konten" : "Tambah Konten"}
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Halaman *</label>
              <Input
                value={form.page}
                onChange={(e) => setForm({ ...form, page: e.target.value })}
                placeholder="Beranda"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub Halaman</label>
              <Input
                value={form.subpage}
                onChange={(e) => setForm({ ...form, subpage: e.target.value })}
                placeholder="—"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Section / Fitur *</label>
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="1. Hero Banner"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Konten Text</label>
              <Textarea
                value={form.konten_text}
                onChange={(e) => setForm({ ...form, konten_text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Media (URL)</label>
              <Input
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Referensi Web (URL)</label>
              <Input
                value={form.referensi}
                onChange={(e) => setForm({ ...form, referensi: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Button & Link CTA Text</label>
              <Input
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Beli Sekarang"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Button & Link CTA URL</label>
              <Input
                value={form.cta_link}
                onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                placeholder="/checkout"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Screenshot Mobile (URL)</label>
              <div className="flex gap-2">
                <Input
                  value={form.screenshot_mobile}
                  onChange={(e) => setForm({ ...form, screenshot_mobile: e.target.value })}
                  placeholder="Atau pilih file..."
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadImage(e.target.files[0], "mobile");
                        e.target.value = "";
                      }
                    }}
                    disabled={uploadingMobile}
                  />
                  <Button variant="outline" type="button" disabled={uploadingMobile}>
                    {uploadingMobile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Screenshot Desktop (URL)</label>
              <div className="flex gap-2">
                <Input
                  value={form.screenshot_desktop}
                  onChange={(e) => setForm({ ...form, screenshot_desktop: e.target.value })}
                  placeholder="Atau pilih file..."
                />
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-10 w-full cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadImage(e.target.files[0], "desktop");
                        e.target.value = "";
                      }
                    }}
                    disabled={uploadingDesktop}
                  />
                  <Button variant="outline" type="button" disabled={uploadingDesktop}>
                    {uploadingDesktop ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => navigate({ to: "/" })}>
              Batal
            </Button>
            <Button className="font-semibold" onClick={saveItem} disabled={savingItem}>
              {savingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Konten
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
