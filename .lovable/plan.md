# Panduan Deploy ke Vercel lewat GitHub

Tujuan: kode aplikasi tersimpan di GitHub, lalu Vercel membangun dan menayangkannya otomatis setiap kali ada perubahan.

Catatan penting: aplikasi ini punya bagian server (login, database). Secara bawaan hasil build disiapkan untuk platform hosting Lovable, jadi perlu satu penyesuaian kecil agar cocok dengan Vercel. Database, login, dan data tetap tinggal di backend Lovable Cloud — Vercel hanya menayangkan aplikasinya.

## Langkah 1 — Hubungkan proyek ke GitHub

1. Di editor Lovable, buka menu Plus (+) di kotak chat → GitHub → Connect project.
2. Izinkan aplikasi Lovable di GitHub, pilih akun/organisasi.
3. Klik Create Repository. Kode langsung tersalin dan tersinkron dua arah.

## Langkah 2 — Siapkan proyek agar bisa dibangun Vercel

Saya lakukan di sisi kode (setelah rencana ini disetujui):

- Menambahkan konfigurasi target build Vercel pada pengaturan build (preset `vercel` untuk Nitro), sehingga hasil build menghasilkan fungsi server yang dikenali Vercel.
- Menambahkan `.env.example` berisi daftar nama variabel yang dibutuhkan (tanpa nilai rahasia).

## Langkah 3 — Impor ke Vercel

1. Masuk ke vercel.com dengan akun GitHub.
2. Add New → Project → pilih repositori tadi → Import.
3. Framework Preset: Other. Build Command: `npm run build`. Install Command: `npm install`. Output: biarkan default.

## Langkah 4 — Isi variabel lingkungan di Vercel

Di Settings → Environment Variables, tambahkan (nilainya saya berikan setelah rencana disetujui, kecuali kunci rahasia yang tidak tersedia di Lovable Cloud):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Terapkan untuk Production, Preview, dan Development. Lalu Deploy.

## Langkah 5 — Daftarkan alamat baru ke pengaturan login

Alamat Vercel (misal `namaapp.vercel.app`) perlu ditambahkan sebagai URL yang diizinkan untuk autentikasi, supaya login dan tautan email bekerja di domain itu. Saya bantu setel dari sisi backend.

## Langkah 6 — Verifikasi

- Buka alamat Vercel, pastikan halaman login tampil.
- Coba masuk dengan akun admin, pastikan dashboard muncul dan tombol Logout bekerja.

## Detail teknis

- Stack: TanStack Start v1 + Vite 8, build lewat Nitro. Preset default `cloudflare`; untuk Vercel dipakai preset `vercel` melalui opsi `nitro` di `vite.config.ts` (atau variabel `NITRO_PRESET=vercel` di Vercel).
- Variabel `VITE_*` dibaca di browser; `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` dibaca di server function.
- `SUPABASE_SERVICE_ROLE_KEY` tidak tersedia di Lovable Cloud; fitur yang membutuhkannya tidak dipakai di aplikasi ini.
- Sinkronisasi dua arah GitHub tetap berjalan, jadi perubahan di Lovable otomatis memicu deploy Vercel.

## Alternatif

Kalau tidak ada kebutuhan khusus di Vercel, tombol Publish di Lovable sudah menayangkan aplikasi tanpa konfigurasi apa pun.
