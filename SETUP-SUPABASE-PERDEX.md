# PerDex — konfigurasi Supabase dan fitur

PerDex menggunakan proyek Supabase `pernime` dengan tabel khusus berawalan `perdex_`. Jangan menghapus atau mengganti tabel PerNime yang sudah ada.

## Environment variables

Atur di Vercel Project → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL=https://xqpvzlazjgmjdziwyfkl.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Df7ceGSSrkmywySqQuGiRw_1hIXSgE_`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (opsional; isi site key dari Cloudflare Turnstile)

Kunci publishable/anon memang boleh berada di browser. Jangan pernah memasukkan `service_role`, secret key, password SMTP, atau Google Client Secret ke variabel `NEXT_PUBLIC_`.

## Wajib disiapkan di Supabase Dashboard

1. Buka Authentication → Sign In / Providers → Email, aktifkan **Confirm email**.
2. Authentication → URL Configuration: Site URL `https://perdex.bchgabut.my.id`; tambahkan redirect URL `https://perdex.bchgabut.my.id/auth` dan `http://localhost:3000/auth`.
3. Authentication → Sign In / Providers → Google: aktifkan Google dan isi Google OAuth Client ID/Secret. Tambahkan callback Supabase `https://xqpvzlazjgmjdziwyfkl.supabase.co/auth/v1/callback` ke Authorized redirect URIs di Google Cloud Console.
4. Authentication → Security and Protection → CAPTCHA: aktifkan Turnstile dan masukkan **secret key** dari Cloudflare. Site key pasang pada `NEXT_PUBLIC_TURNSTILE_SITE_KEY` di Vercel.
5. Untuk email konfirmasi yang lebih andal, atur SMTP sendiri pada Authentication → Emails → SMTP Settings.

Google OAuth, CAPTCHA, konfirmasi email, dan SMTP tidak dapat dinyalakan hanya dari kode frontend; pengaturan dashboard di atas tetap harus dilakukan pemilik project.

## Cara kerja data

- Pengunjung: bookmark, history, koleksi, dan preferensi reader lokal di browser.
- Pengguna login: bookmark, history, koleksi, rating, review, preferensi dan subscription notifikasi tersimpan pada tabel `perdex_*` di Supabase.
- Saat login, bookmark/history guest dicoba digabungkan ke akun; salinan lokal tetap dipertahankan.
- Katalog dan gambar komik tetap diambil dari REST API PerDex/Render, bukan dipindah seluruhnya ke Supabase.

## Batasan / data yang perlu diisi

- `perdex_editor_picks` perlu diisi admin agar bagian Editor's Choice tampil.
- `perdex_release_schedule` perlu diisi dengan data jadwal rilis yang valid agar kalender tidak kosong.
- Notifikasi chapter pada versi ini memeriksa update selama PerDex terbuka/fokus (polling berkala), bukan push notification background.
- Download offline menyimpan gambar chapter ke IndexedDB; dapat gagal pada sumber gambar yang memblokir CORS atau menghalangi pengunduhan.
- Rekomendasi serupa mengambil komik dari genre yang sama jika data genre tersedia.
- CAPTCHA baru aktif setelah site key dan secret key diatur.
