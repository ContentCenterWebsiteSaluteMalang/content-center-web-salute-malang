# Content Center Web Salute Malang

Act as an expert UI/UX designer and frontend developer. Buatkan saya "Dashboard Admin / Content Matrix CMS" yang modern, bersih, dan responsif bergaya enterprise SaaS, mereplikasi desain dari gambar yang dilampirkan.




Gunakan React, Tailwind CSS, Lucide Icons, dan komponen shadcn/ui.




Gunakan skema warna profesional yang terlihat dalam gambar: dominasi background abu-abu terang (misal: bg-slate-100) untuk area konten utama, background putih untuk topbar dan card, teks abu-abu gelap (#1F2937 atau serupa), dan warna aksen Kuning Solid (#FFD700 atau serupa) untuk tombol utama dan status. Sidebar memiliki warna biru tua/abu-abu (#1E293B atau serupa) dengan teks putih.




Buat struktur antarmuka (UI) dengan 3 bagian utama berikut:




1. LAYOUT UTAMA (Sidebar & Topbar)- SIDEBAR: Lebar tetap di kiri. Background biru tua/abu-abu (#1E293B atau serupa) dengan border kanan tipis. Header teks tebal "Content Matrix CMS" berwarna putih. Menu (gunakan icon Lucide dan teks): Dashboard, Halaman Web (State Aktif: background biru muda, teks biru), Media Library, dan Pengaturan. Semua menu memiliki teks putih.- TOP BAR: Background putih, border bawah tipis. Di kiri ada Breadcrumb "Dashboard / Halaman Web" berwarna abu-abu gelap. Di kanan ada Search bar (icon search, teks "Search..."), Tombol Notifikasi (icon Bell dengan badge merah di atasnya), dan Avatar User (bulat, icon/inisial).




2. AREA KONTEN UTAMA (Tabel Guideline)- Padding lega (p-6 atau p-8).- Header Konten: Kiri: Judul besar "Guideline Konten Website", subtitle "Kelola kebutuhan konten antara Developer dan Client". Kanan: Tombol "Pengaturan Notifikasi" (solid kuning, icon Settings) dan Tombol "+ Tambah Konten" (solid kuning, icon Plus).- Filter Bar: Dua dropdown dengan icon caret down: "Pilih Halaman" dan "Status".- DATA TABLE: Bungkus dalam Card putih dengan shadow-sm dan overflow-x-auto (sangat penting karena kolomnya panjang). Header tabel dengan border bawah.- Kolom Tabel: Page & SubPage, Section/Fitur, Konten Text, Media (Image/Video), Button & Link CTA, Referensi Web, Screenshot (Mobile & Desktop), Status, Notes, Action.- Isi 1 baris dummy data verbatim: Page "Beranda", Section "1. Hero Banner", Konten "SENTRA LAYANAN...", Media (icon image), Button (icon pointer, teks "Daftar"), Screenshot (icon HP & Monitor), Status (Badge hijau dengan teks "Final"), Notes (kosong), Action (Icon Edit & Trash).




3. MODAL PENGATURAN NOTIFIKASI- Buat sebuah form Dialog/Modal interaktif yang akan muncul jika tombol "Pengaturan Notifikasi" di header tadi diklik. Modal harus overlaid.- Header Modal: "Pengaturan Notifikasi Real-time" beserta deskripsi singkat.- Isi Modal verbatim:- Toggle Switch 1 (aktif/kuning): "Notifikasi Email". Di bawahnya: Input field "Masukkan Alamat Email" dengan placeholder "Masukkan Alamat Email".- Toggle Switch 2 (aktif/kuning): "Notifikasi WhatsApp". Di bawahnya: Input field "Masukkan Nomor WhatsApp" dengan placeholder "Masukkan Nomor WhatsApp".- Section Checkbox verbatim "Kirim notifikasi saat:":- [x] Konten baru ditambahkan (kuning dicentang)- [x] Status konten diubah (Draft ke Final) (kuning dicentang)- [x] Ada catatan/notes baru (kuning dicentang)- Footer Modal: Tombol "Batal" (outline border abu-abu) dan Tombol "Simpan Pengaturan" (solid kuning).




Pastikan semua desain based on Image yang diupload, Responsif Mobile Friendly, rapi, garis tabel halus, teks proporsional (text-sm untuk tabel), dan modal/dialog box dapat berfungsi dibuka-tutup untuk simulasi UI.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://content-center-web-salute-malang.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c04dfa4e-8a41-401d-aafb-b6cead42de14).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
