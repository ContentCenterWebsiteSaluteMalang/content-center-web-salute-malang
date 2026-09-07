import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendNotification, type NotifyEvent } from "@/lib/notifications.functions";
import { toast } from "sonner";
import {
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  Settings,
  Bell,
  Search,
  Plus,
  Smartphone,
  Monitor,
  MousePointerClick,
  Pencil,
  Trash2,
  Menu,
  User,
  LogOut,
  Loader2,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AdminAccessView } from "@/components/AdminAccessView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Content Matrix CMS — Guideline Konten Website" },
      {
        name: "description",
        content:
          "Dashboard admin Content Matrix CMS untuk mengelola guideline konten website antara developer dan client.",
      },
      { property: "og:title", content: "Content Matrix CMS — Guideline Konten Website" },
      {
        property: "og:description",
        content: "Kelola kebutuhan konten antara Developer dan Client dalam satu dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  { label: "Dashboard", icon: LayoutGrid },
  { label: "Halaman Web", icon: FileText },
  { label: "Media Library", icon: ImageIcon },
  { label: "Akses Admin", icon: User },
  { label: "Pengaturan", icon: Settings },
];

const STATUSES = ["Draft", "Review", "Final"] as const;

type ContentItem = {
  id: string;
  page: string;
  subpage: string | null;
  section: string;
  konten_text: string | null;
  media_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  referensi: string | null;
  screenshot_mobile: string | null;
  screenshot_desktop: string | null;
  status: string;
  notes: string | null;
};

type Settings = {
  email_enabled: boolean;
  email_address: string;
  wa_enabled: boolean;
  wa_number: string;
  wa_api_key: string;
  notify_new: boolean;
  notify_status: boolean;
  notify_notes: boolean;
};

const emptySettings: Settings = {
  email_enabled: false,
  email_address: "",
  wa_enabled: false,
  wa_number: "",
  wa_api_key: "",
  notify_new: true,
  notify_status: true,
  notify_notes: true,
};

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

function SidebarNav({
  activeTab,
  onTabChange,
  onLogout,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <span className="text-lg font-bold tracking-tight">Content Matrix CMS</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = item.label === activeTab;
          return (
            <button
              key={item.label}
              onClick={() => onTabChange(item.label)}
              className={
                isActive
                  ? "flex items-center gap-3 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-semibold text-sidebar-primary-foreground"
                  : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-6 pt-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border px-3 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>
    </div>
  );
}

const columns = [
  "Page & SubPage",
  "Section/Fitur",
  "Konten Text",
  "Media (Image/Video)",
  "Button & Link CTA",
  "Referensi Web",
  "Screenshot (Mobile & Desktop)",
  "Status",
  "Notes",
  "Action",
];

function Index() {
  const navigate = useNavigate();
  const notify = sendNotification;
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("Halaman Web");
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testing, setTesting] = useState(false);

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [pageFilter, setPageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [savingItem, setSavingItem] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);

  const handleUploadImage = async (file: File, type: "mobile" | "desktop") => {
    if (!file) return;

    if (type === "mobile") setUploadingMobile(true);
    else setUploadingDesktop(true);

    try {
      const { data, error } = await supabase.storage
        .from("content_images")
        .upload(`${Date.now()}_${file.name}`, file);

      if (error) {
        toast.error(`Gagal upload screenshot ${type}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("content_images")
        .getPublicUrl(data.path);

      if (type === "mobile") {
        setForm({ ...form, screenshot_mobile: publicUrlData.publicUrl });
      } else {
        setForm({ ...form, screenshot_desktop: publicUrlData.publicUrl });
      }
      toast.success(`Screenshot ${type} berhasil diupload`);
    } catch (e) {
      toast.error(`Terjadi kesalahan saat upload`);
    } finally {
      if (type === "mobile") setUploadingMobile(false);
      else setUploadingDesktop(false);
    }
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) navigate({ to: "/auth", replace: true });
      else setCheckingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/auth", replace: true });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setItems(data as ContentItem[]);
    setLoadingItems(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("notification_settings").select("*").maybeSingle();
    if (data) {
      setSettings({
        email_enabled: data.email_enabled,
        email_address: data.email_address ?? "",
        wa_enabled: data.wa_enabled,
        wa_number: data.wa_number ?? "",
        wa_api_key: data.wa_api_key ?? "",
        notify_new: data.notify_new,
        notify_status: data.notify_status,
        notify_notes: data.notify_notes,
      });
    }
  }, []);

  useEffect(() => {
    if (checkingAuth) return;
    void loadItems();
    void loadSettings();
  }, [checkingAuth, loadItems, loadSettings]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const runNotify = async (event: NotifyEvent, title: string, body: string) => {
    try {
      const res = await notify({ data: { event, title, body } });
      const wa = res.results.find((r) => r.channel === "whatsapp");
      const mail = res.results.find((r) => r.channel === "email");
      if (wa?.sent) toast.success("Notifikasi WhatsApp terkirim");
      else if (wa) toast.error("WhatsApp gagal: " + (wa.reason ?? "tidak diketahui"));
      if (mail && !mail.sent)
        toast.message("Email belum aktif", {
          description: "Domain pengirim email masih menunggu penyiapan.",
        });
      if (res.skipped === "no_settings")
        toast.message("Simpan Pengaturan Notifikasi dulu agar pemberitahuan terkirim.");
    } catch {
      toast.error("Gagal mengirim notifikasi");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("notification_settings").upsert({
      user_id: auth.user.id,
      email_enabled: settings.email_enabled,
      email_address: settings.email_address || null,
      wa_enabled: settings.wa_enabled,
      wa_number: settings.wa_number || null,
      wa_api_key: settings.wa_api_key || null,
      notify_new: settings.notify_new,
      notify_status: settings.notify_status,
      notify_notes: settings.notify_notes,
    });
    setSavingSettings(false);
    if (error) toast.error("Gagal menyimpan pengaturan");
    else {
      toast.success("Pengaturan notifikasi tersimpan");
      setOpen(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    await saveSettingsSilently();
    await runNotify(
      "test",
      "Uji Notifikasi Content Matrix CMS",
      "Ini pesan uji coba. Jika Anda menerima ini, notifikasi sudah aktif.",
    );
    setTesting(false);
  };

  const saveSettingsSilently = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    await supabase.from("notification_settings").upsert({
      user_id: auth.user.id,
      email_enabled: settings.email_enabled,
      email_address: settings.email_address || null,
      wa_enabled: settings.wa_enabled,
      wa_number: settings.wa_number || null,
      wa_api_key: settings.wa_api_key || null,
      notify_new: settings.notify_new,
      notify_status: settings.notify_status,
      notify_notes: settings.notify_notes,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({
      page: item.page,
      subpage: item.subpage ?? "",
      section: item.section,
      konten_text: item.konten_text ?? "",
      media_url: item.media_url ?? "",
      cta_text: item.cta_text ?? "",
      cta_link: item.cta_link ?? "",
      referensi: item.referensi ?? "",
      screenshot_mobile: item.screenshot_mobile ?? "",
      screenshot_desktop: item.screenshot_desktop ?? "",
      status: item.status,
      notes: item.notes ?? "",
    });
    setFormOpen(true);
  };

  const saveItem = async () => {
    if (!form.page.trim() || !form.section.trim()) {
      toast.error("Halaman dan Section wajib diisi");
      return;
    }
    setSavingItem(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

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
      setFormOpen(false);
      await loadItems();
      if (editing.status !== form.status) {
        await runNotify(
          "status",
          "Status konten diubah",
          `${payload.page} — ${payload.section}: ${editing.status} → ${form.status}`,
        );
      }
      if ((editing.notes ?? "") !== (payload.notes ?? "") && payload.notes) {
        await runNotify(
          "notes",
          "Catatan baru pada konten",
          `${payload.page} — ${payload.section}: ${payload.notes}`,
        );
      }
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
      setFormOpen(false);
      await loadItems();
      await runNotify(
        "new",
        "Konten baru ditambahkan",
        `${payload.page} — ${payload.section} (status: ${payload.status})`,
      );
    }
  };

  const deleteItem = async (item: ContentItem) => {
    const { error } = await supabase.from("content_items").delete().eq("id", item.id);
    if (error) {
      toast.error("Gagal menghapus konten");
      return;
    }
    toast.success("Konten dihapus");
    await loadItems();
  };

  const pages = Array.from(new Set(items.map((i) => i.page)));
  const visible = items.filter(
    (i) =>
      (pageFilter === "all" || i.page === pageFilter) &&
      (statusFilter === "all" || i.status === statusFilter),
  );

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-none bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigasi</SheetTitle>
              <SidebarNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
              />
            </SheetContent>
          </Sheet>

          <nav className="truncate text-sm text-muted-foreground">
            Dashboard <span className="px-1">/</span>
            <span className="font-semibold text-foreground">{activeTab}</span>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="w-48 pl-9 lg:w-64" />
            </div>
            <Button variant="outline" size="icon" className="relative" aria-label="Notifikasi">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground ring-1 ring-border">
              <User className="h-4.5 w-4.5" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === "Halaman Web" ? (
            <>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Guideline Konten Website
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kelola kebutuhan konten antara Developer dan Client
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setOpen(true)} className="font-semibold shadow-sm">
                    <Settings className="h-4 w-4" />
                    Pengaturan Notifikasi
                  </Button>
                  <Button onClick={openCreate} className="font-semibold shadow-sm">
                    <Plus className="h-4 w-4" />
                    Tambah Konten
                  </Button>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap gap-3">
                  <Select value={pageFilter} onValueChange={setPageFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Pilih Halaman" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Halaman</SelectItem>
                      {pages.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingItems && (
                        <tr>
                          <td colSpan={columns.length} className="px-4 py-10 text-center">
                            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                          </td>
                        </tr>
                      )}
                      {!loadingItems && visible.length === 0 && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-4 py-10 text-center text-muted-foreground"
                          >
                            Belum ada konten. Klik "Tambah Konten" untuk memulai.
                          </td>
                        </tr>
                      )}
                      {visible.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/70 transition-colors hover:bg-secondary/60"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-foreground">
                            {item.page}
                            {item.subpage ? (
                              <span className="text-muted-foreground"> / {item.subpage}</span>
                            ) : null}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-foreground">
                            {item.section}
                          </td>
                          <td className="max-w-[220px] truncate px-4 py-4 text-muted-foreground">
                            {item.konten_text ?? "—"}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {item.media_url ? <ImageIcon className="h-5 w-5" /> : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {item.cta_text ? (
                              <span className="inline-flex items-center gap-2 text-foreground">
                                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                {item.cta_text}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="max-w-[160px] truncate px-4 py-4 text-muted-foreground">
                            {item.referensi ?? "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span className="flex items-center gap-3 text-muted-foreground">
                              <Smartphone
                                className={
                                  item.screenshot_mobile ? "h-5 w-5 text-foreground" : "h-5 w-5"
                                }
                              />
                              <Monitor
                                className={
                                  item.screenshot_desktop ? "h-5 w-5 text-foreground" : "h-5 w-5"
                                }
                              />
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={
                                item.status === "Final"
                                  ? "inline-flex rounded-full bg-success px-3 py-1 text-xs font-semibold text-success-foreground"
                                  : "inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground"
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="max-w-[160px] truncate px-4 py-4 text-muted-foreground">
                            {item.notes ?? ""}
                          </td>
                          <td className="px-4 py-4">
                            <span className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit konten"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Hapus konten"
                                onClick={() => deleteItem(item)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === "Akses Admin" ? (
            <AdminAccessView />
          ) : (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {activeTab}
              </h2>
              <p className="mt-2 max-w-[500px] text-sm text-muted-foreground">
                Fitur {activeTab} sedang dalam pengembangan.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Form konten */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editing ? "Edit Konten" : "Tambah Konten"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi kebutuhan konten untuk satu section halaman.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Halaman *</label>
              <Input
                value={form.page}
                onChange={(e) => setForm({ ...form, page: e.target.value })}
                placeholder="Beranda"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Sub Halaman</label>
              <Input
                value={form.subpage}
                onChange={(e) => setForm({ ...form, subpage: e.target.value })}
                placeholder="—"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Section / Fitur *</label>
              <Input
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                placeholder="1. Hero Banner"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Konten Text</label>
              <Textarea
                value={form.konten_text}
                onChange={(e) => setForm({ ...form, konten_text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Media (URL)</label>
              <Input
                value={form.media_url}
                onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Referensi Web</label>
              <Input
                value={form.referensi}
                onChange={(e) => setForm({ ...form, referensi: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Teks Tombol CTA</label>
              <Input
                value={form.cta_text}
                onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Daftar"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link CTA</label>
              <Input
                value={form.cta_link}
                onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button className="font-semibold" onClick={saveItem} disabled={savingItem}>
              {savingItem && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Konten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pengaturan notifikasi */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Pengaturan Notifikasi Real-time</DialogTitle>
            <DialogDescription>
              Atur bagaimana dan kapan Anda ingin menerima pemberitahuan perubahan konten.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={(v) => setSettings({ ...settings, email_enabled: v })}
                  id="notif-email"
                />
                <label htmlFor="notif-email" className="text-sm font-semibold text-foreground">
                  Notifikasi Email
                </label>
              </div>
              <Input
                placeholder="Masukkan Alamat Email"
                type="email"
                value={settings.email_address}
                onChange={(e) => setSettings({ ...settings, email_address: e.target.value })}
                disabled={!settings.email_enabled}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.wa_enabled}
                  onCheckedChange={(v) => setSettings({ ...settings, wa_enabled: v })}
                  id="notif-wa"
                />
                <label htmlFor="notif-wa" className="text-sm font-semibold text-foreground">
                  Notifikasi WhatsApp
                </label>
              </div>
              <Input
                placeholder="Masukkan Nomor WhatsApp (08xx / 62xx)"
                type="tel"
                value={settings.wa_number}
                onChange={(e) => setSettings({ ...settings, wa_number: e.target.value })}
                disabled={!settings.wa_enabled}
              />
              <Input
                placeholder="Kode API WhatsApp (gratis dari CallMeBot)"
                value={settings.wa_api_key}
                onChange={(e) => setSettings({ ...settings, wa_api_key: e.target.value })}
                disabled={!settings.wa_enabled}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!settings.wa_enabled}
                  onClick={() =>
                    window.open(
                      "https://wa.me/34644519523?text=" +
                        encodeURIComponent("I allow callmebot to send me messages"),
                      "_blank",
                      "noopener",
                    )
                  }
                >
                  1. Minta kode lewat WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!settings.wa_enabled}
                  onClick={() =>
                    window.open(
                      "https://wa.me/34621331709?text=" +
                        encodeURIComponent("I allow callmebot to send me messages"),
                      "_blank",
                      "noopener",
                    )
                  }
                >
                  Nomor cadangan
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!settings.wa_enabled}
                  onClick={() => setSettings({ ...settings, wa_number: "", wa_api_key: "" })}
                >
                  Kosongkan nomor & kode
                </Button>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-semibold text-foreground">Cara isi ulang (gratis):</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>
                    Tekan tombol di atas — WhatsApp terbuka dengan pesan siap kirim ke +34 644 51 95
                    23. Kirim pesannya persis apa adanya, tanpa diubah.
                  </li>
                  <li>
                    Balasan berisi kode bisa datang sampai ±2 menit. Kalau lewat 5 menit belum
                    dibalas, coba tombol <span className="font-semibold">Nomor cadangan</span> (+34
                    621 33 17 09).
                  </li>
                  <li>
                    Salin kode dari balasan (hanya angkanya) ke kolom kode di atas, isi nomor
                    WhatsApp Anda, lalu tekan <span className="font-semibold">Kirim Uji Coba</span>.
                  </li>
                </ol>
                <p className="mt-2">
                  Catatan: nomor WhatsApp yang Anda isi harus sama persis dengan nomor yang dipakai
                  mengirim pesan permintaan kode.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Kirim notifikasi saat:</p>
              {(
                [
                  ["notify_new", "Konten baru ditambahkan"],
                  ["notify_status", "Status konten diubah (Draft ke Final)"],
                  ["notify_notes", "Ada catatan/notes baru"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={settings[key]}
                    onCheckedChange={(v) => setSettings({ ...settings, [key]: v === true })}
                  />
                  <label htmlFor={key} className="text-sm text-foreground">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={sendTest} disabled={testing}>
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Kirim Uji Coba
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button className="font-semibold" onClick={saveSettings} disabled={savingSettings}>
                {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Pengaturan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
