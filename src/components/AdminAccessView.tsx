import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function AdminAccessView() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminName.trim()) {
      toast.error("Nama admin wajib diisi");
      return;
    }
    setSaving(true);

    // In a real app we'd create a user via Edge Function or Supabase Auth Admin API
    // For this mock, we just insert a profile directly.
    const { error } = await supabase.from("profiles").insert({
      display_name: newAdminName.trim(),
    });

    setSaving(false);

    if (error) {
      toast.error("Gagal menambahkan admin");
      return;
    }

    toast.success("Admin berhasil ditambahkan");
    setNewAdminName("");
    setOpen(false);
    void loadProfiles();
  };

  const handleDelete = async (id: string) => {
    if (id === "demo-admin-id") {
      toast.error("Admin default tidak dapat dihapus");
      return;
    }
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      toast.error("Gagal menghapus admin");
      return;
    }
    toast.success("Admin dihapus");
    void loadProfiles();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Akses Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola daftar akun administrator yang memiliki akses ke Content Matrix CMS
          </p>
        </div>
        <div>
          <Button onClick={() => setOpen(true)} className="font-semibold shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Admin
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">User</th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">
                  ID / Email
                </th>
                <th className="px-6 py-4 text-left font-medium text-muted-foreground">Terdaftar</th>
                <th className="px-6 py-4 text-right font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    Tidak ada admin lain yang terdaftar.
                  </td>
                </tr>
              ) : (
                profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b border-border/70 last:border-0 hover:bg-secondary/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="font-medium text-foreground">
                          {profile.display_name || "Tanpa Nama"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                      {profile.id}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {profile.id !== "demo-admin-id" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(profile.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded bg-secondary">
                          Default
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin Baru</DialogTitle>
            <DialogDescription>
              Tambahkan profil admin baru. Karena ini sistem mock, akun akan langsung didaftarkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <Input
                placeholder="Misal: John Doe"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleAddAdmin} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Daftarkan Admin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
