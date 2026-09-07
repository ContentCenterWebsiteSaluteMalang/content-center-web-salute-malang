import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronDown,
  Smartphone,
  Monitor,
  MousePointerClick,
  Pencil,
  Trash2,
  Menu,
  User,
  LogOut,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
  { label: "Dashboard", icon: LayoutGrid, active: false },
  { label: "Halaman Web", icon: FileText, active: true },
  { label: "Media Library", icon: ImageIcon, active: false },
  { label: "Pengaturan", icon: Settings, active: false },
];

function SidebarNav({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 py-6">
        <span className="text-lg font-bold tracking-tight">Content Matrix CMS</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={
              item.active
                ? "flex items-center gap-3 rounded-lg bg-sidebar-primary px-3 py-2.5 text-sm font-semibold text-sidebar-primary-foreground"
                : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </button>
        ))}
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

function FilterSelect({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center justify-between gap-6 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
      {label}
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [open, setOpen] = useState(false);
  const [emailOn, setEmailOn] = useState(true);
  const [waOn, setWaOn] = useState(true);
  const [checks, setChecks] = useState([true, true, true]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const toggleCheck = (i: number) =>
    setChecks((prev) => prev.map((c, idx) => (idx === i ? !c : c)));

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
        <SidebarNav onLogout={handleLogout} />
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
              <SidebarNav onLogout={handleLogout} />
            </SheetContent>
          </Sheet>

          <nav className="truncate text-sm text-muted-foreground">
            Dashboard <span className="px-1">/</span>
            <span className="font-semibold text-foreground">Halaman Web</span>
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
              <Button className="font-semibold shadow-sm">
                <Plus className="h-4 w-4" />
                Tambah Konten
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap gap-3">
              <FilterSelect label="Pilih Halaman" />
              <FilterSelect label="Status" />
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
                  <tr className="border-b border-border/70 transition-colors hover:bg-secondary/60">
                    <td className="px-4 py-4 font-medium text-foreground">Beranda</td>
                    <td className="whitespace-nowrap px-4 py-4 text-foreground">1. Hero Banner</td>
                    <td className="max-w-[220px] px-4 py-4 text-muted-foreground">
                      SENTRA LAYANAN...
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex items-center gap-2 text-foreground">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        Daftar
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">—</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-3 text-muted-foreground">
                        <Smartphone className="h-5 w-5" />
                        <Monitor className="h-5 w-5" />
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-success px-3 py-1 text-xs font-semibold text-success-foreground">
                        Final
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground"></td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" aria-label="Edit konten">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Hapus konten">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Pengaturan Notifikasi Real-time
            </DialogTitle>
            <DialogDescription>
              Atur bagaimana dan kapan Anda ingin menerima pemberitahuan perubahan konten.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={emailOn} onCheckedChange={setEmailOn} id="notif-email" />
                <label htmlFor="notif-email" className="text-sm font-semibold text-foreground">
                  Notifikasi Email
                </label>
              </div>
              <Input placeholder="Masukkan Alamat Email" type="email" disabled={!emailOn} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={waOn} onCheckedChange={setWaOn} id="notif-wa" />
                <label htmlFor="notif-wa" className="text-sm font-semibold text-foreground">
                  Notifikasi WhatsApp
                </label>
              </div>
              <Input placeholder="Masukkan Nomor WhatsApp" type="tel" disabled={!waOn} />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Kirim notifikasi saat:</p>
              {[
                "Konten baru ditambahkan",
                "Status konten diubah (Draft ke Final)",
                "Ada catatan/notes baru",
              ].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <Checkbox
                    id={`check-${i}`}
                    checked={checks[i] ?? false}
                    onCheckedChange={() => toggleCheck(i)}
                  />
                  <label htmlFor={`check-${i}`} className="text-sm text-foreground">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button className="font-semibold" onClick={() => setOpen(false)}>
              Simpan Pengaturan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
