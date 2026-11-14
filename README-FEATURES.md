# PerDex — fitur tambahan

## Fitur baru

1. **Genre & filter jenis komik** — daftar genre diambil dari endpoint `/genre-all`. Setiap genre memiliki hasil dari `/genre/:slug` dan dapat disaring menjadi Semua, Manga, Manhwa, atau Manhua. Pagination genre mengambil halaman API berikutnya saat diperlukan.
2. **History Baca & Resume** — menyimpan komik terakhir, chapter, halaman aktif, dan persentase progres di `localStorage`. Membuka ulang chapter yang sama akan mencoba kembali ke halaman tersimpan. History tersedia di `/history`.
3. **Lanjutkan Membaca** — bagian di beranda yang menampilkan hingga empat bacaan terakhir.
4. **Acak Komik** — tombol beranda memilih satu komik acak dari daftar update terbaru.
5. **Mode Fokus Reader** — menyembunyikan navigasi situs dan elemen tambahan reader.
6. **Infinite Chapter Scroll (Fokus Mode)** — chapter berikutnya dimuat otomatis ketika pembaca mendekati akhir chapter. Konten chapter disambungkan di bawahnya tanpa pindah halaman, dengan penanda Awal Chapter dan Akhir Chapter.
7. **Auto-scroll Reader** — menggulir halaman secara otomatis dengan pilihan kecepatan Lambat, Normal, atau Cepat; dapat dihentikan kapan saja.

## Fitur akun dan sinkronisasi

- Login dan register menggunakan email + password dengan alur verifikasi email Supabase.
- Login Google melalui Supabase OAuth (perlu mengisi kredensial Google di Dashboard Supabase).
- Pemulihan password melalui email.
- Mode tamu tetap tersedia tanpa harus login.
- Bookmark dan history tamu tersimpan di LocalStorage.
- Saat login, data bookmark dan history lokal dicoba digabungkan ke tabel khusus `perdex_*` di Supabase.
- Setelah login, bookmark dan history baru menggunakan Supabase; progres reader disimpan per akun.

## Fitur tambahan

- Rating komik dan review pembaca.
- Notifikasi chapter baru berbasis polling ketika tab PerDex terbuka/fokus.
- Statistik aktivitas membaca.
- Simpan chapter offline ke IndexedDB.
- Laporan masalah chapter langsung dari reader.
- Koleksi pribadi, lokal untuk tamu dan cloud untuk akun.
- Trending Komik dari feed populer REST API.
- Admin Page privat untuk akun Google `brooscraft9@gmail.com`: moderasi review, penanganan laporan, dan pemeriksaan status REST API.
- Pencarian judul dengan filter tipe dan genre.
- Rekomendasi komik berdasarkan genre.
- Tema reader Dark, AMOLED Black, dan Light.
- Halaman Donasi menggunakan SociaBuzz TRIBE.

## Catatan operasional

Google OAuth, email confirmation, SMTP, dan CAPTCHA perlu diaktifkan/dikonfigurasi di Supabase Dashboard. Admin Page membutuhkan migrasi SQL `SUPABASE-ADMIN-PERDEX.sql` agar kebijakan RLS diterapkan. Notifikasi pada versi ini tidak berjalan di background ketika tab tertutup. Download offline bergantung pada izin CORS host gambar. Lihat `SETUP-SUPABASE-PERDEX.md` sebelum deploy.

## API yang digunakan

- `GET /genre-all`
- `GET /genre/:slug`
- `GET /genre/:slug/page/:page`
- `GET /terbaru`

Base URL tetap mengikuti `NEXT_PERDEX_APIURL` (default: `https://komiku-rest-api.onrender.com`).
