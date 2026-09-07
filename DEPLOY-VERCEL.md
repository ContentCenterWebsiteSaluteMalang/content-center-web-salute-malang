# Deploy ke Vercel lewat GitHub

## 1. Hubungkan ke GitHub

Di editor Lovable: menu Plus (+) di kotak chat → GitHub → Connect project → izinkan → Create Repository.
Sinkronisasi berjalan dua arah, jadi setiap perubahan di Lovable otomatis terkirim ke GitHub.

## 2. Impor ke Vercel

1. Masuk ke vercel.com dengan akun GitHub.
2. Add New → Project → pilih repositori → Import.
3. Framework Preset: **Other**
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: kosongkan (biarkan default)

## 3. Variabel lingkungan

Settings → Environment Variables, tambahkan semua nama dari `.env.example`
(centang Production, Preview, dan Development):

| Nama                            | Keterangan                                |
| ------------------------------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`             | alamat backend                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | kunci publik                              |
| `VITE_SUPABASE_PROJECT_ID`      | id proyek backend                         |
| `SUPABASE_URL`                  | sama dengan VITE_SUPABASE_URL             |
| `SUPABASE_PUBLISHABLE_KEY`      | sama dengan VITE_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_PROJECT_ID`           | sama dengan VITE_SUPABASE_PROJECT_ID      |
| `NITRO_PRESET`                  | isi `vercel`                              |

Nilainya bisa disalin dari file `.env` di proyek ini (buka lewat Code Editor / repositori GitHub).
Catatan: `SUPABASE_SERVICE_ROLE_KEY` tidak tersedia di Lovable Cloud dan tidak dipakai aplikasi ini.

`NITRO_PRESET=vercel` membuat hasil build menghasilkan fungsi server format Vercel
(Build Output API di `.vercel/output`). Tanpa itu, build memakai target bawaan
hosting Lovable dan halaman tidak akan jalan di Vercel.

## 4. Deploy & daftarkan alamat baru

Klik Deploy. Setelah dapat alamat (misalnya `namaapp.vercel.app`), beritahu saya
alamatnya supaya saya daftarkan sebagai URL yang diizinkan untuk login, agar
proses masuk dan tautan email berfungsi di domain tersebut.

## 5. Verifikasi

- Buka alamat Vercel → harus muncul halaman Login Admin.
- Masuk dengan akun admin → dashboard tampil, tombol Logout bekerja.
