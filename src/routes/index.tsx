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
  webhook_enabled: boolean;
  webhook_url: string;
  notify_new: boolean;
  notify_status: boolean;
  notify_notes: boolean;
};

const emptySettings: Settings = {
  webhook_enabled: false,
  webhook_url: "",
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
        webhook_enabled: data.webhook_enabled,
        webhook_url: data.webhook_url ?? "",
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
      const webhook = res.results.find((r) => r.channel === "webhook");
      
      if (event === "test") {
        if (webhook?.sent) {
          toast.success("Notifikasi Webhook berhasil dikirim!");
        } else if (webhook) {
          toast.error("Webhook gagal dikirim", {
            description: webhook.reason,
          });
        }
      }
      
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
      webhook_enabled: settings.webhook_enabled,
      webhook_url: settings.webhook_url || null,
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
      webhook_enabled: settings.webhook_enabled,
      webhook_url: settings.webhook_url || null,
      notify_new: settings.notify_new,
      notify_status: settings.notify_status,
      notify_notes: settings.notify_notes,
    });
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
                  <Button onClick={() => navigate({ to: "/form" })} className="font-semibold shadow-sm">
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
                            {item.media_url ? (
                              <a href={item.media_url} target="_blank" rel="noreferrer">
                                <img
                                  src={item.media_url}
                                  alt={`Media untuk ${item.section}`}
                                  loading="lazy"
                                  className="h-10 w-16 rounded border object-cover"
                                />
                              </a>
                            ) : (
                              <ImageIcon className="h-5 w-5 opacity-40" />
                            )}
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
                                onClick={() => navigate({ to: "/form", search: { id: item.id } })}
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
          ) : activeTab === "Pengaturan" ? (
            <div className="max-w-2xl">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Pengaturan Notifikasi Real-time
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Atur bagaimana dan kapan Anda ingin menerima pemberitahuan perubahan konten.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={settings.webhook_enabled}
                        onCheckedChange={(v) => setSettings({ ...settings, webhook_enabled: v })}
                        id="notif-webhook"
                      />
                      <label htmlFor="notif-webhook" className="text-sm font-semibold text-foreground">
                        Notifikasi Webhook (Make.com)
                      </label>
                    </div>
                    <Input
                      placeholder="Masukkan Webhook URL dari Make.com"
                      type="url"
                      value={settings.webhook_url}
                      onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                      disabled={!settings.webhook_enabled}
                    />
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

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                    <Button variant="outline" onClick={sendTest} disabled={testing}>
                      {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Kirim Uji Coba
                    </Button>
                    <Button className="font-semibold" onClick={saveSettings} disabled={savingSettings}>
                      {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Simpan Pengaturan
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {activeTab}
              </h2>
              <p className="mt-2 max-w-[500px] text-sm text-muted-foreground">
                Fitur {activeTab} sedang dalam pengembang.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Pengaturan notifikasi dihilangkan dari modal, sekarang ada di tab Pengaturan */}
    </div>
  );
}
