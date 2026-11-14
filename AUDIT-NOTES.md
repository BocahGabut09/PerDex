# PerDex — audit dan perbaikan API

## Perbaikan integrasi Komiku REST API
- Mapper daftar kini membaca bentuk respons `/pustaka/page/:page` yang memakai properti `results`, selain bentuk `items`, array langsung, dan `data` dari endpoint pencarian.
- Data komik mendukung link `url`, `detailUrl`, `apiDetailLink`, `apiMangaLink`, dan `originalLink` untuk menemukan slug detail yang benar.
- Data chapter dari `/detail-komik/:slug` kini menggunakan `apiLink` resmi dari API sebagai sumber utama, bukan membangun ulang slug chapter sendiri.
- Nomor chapter dengan pemisah seperti `00-1` atau `1.5` dipertahankan saat membuka chapter.
- Navigasi reader membaca `navigation.prevChapter.apiLink` dan `navigation.nextChapter.apiLink` agar tombol sebelumnya/berikutnya menuju endpoint yang benar.
- Reader mengubah `images[].src` menjadi URL gambar yang siap ditampilkan.
- URL gambar proxy tetap utuh, termasuk query `?url=...`, dan gambar invalid memakai fallback lokal.
- Pagination kategori mengambil tipe yang tepat. Halaman lanjutan dari `/pustaka/page/:page` hanya menampilkan item yang secara eksplisit diberi tipe kategori tersebut, agar Manga/Manhwa/Manhua tidak tercampur.
- Pesan error upstream kini menyertakan status HTTP dan detail yang tersedia dari API.

## Endpoint yang digunakan
- `/rekomendasi`
- `/terbaru`
- `/komik-populer/{manga|manhwa|manhua}`
- `/pustaka/page/{page}`
- `/detail-komik/{slug}`
- `/baca-chapter/{slug}/{chapter}`
- `/search?q={query}`
- Gambar melalui `/image-proxy?url={encoded-image-url}`

## Validasi
- Pemeriksaan sintaks TypeScript/TSX pada seluruh 61 file: **lolos**.
- Type-check terarah untuk `src/action/fetchKomik.ts` dan `src/lib/komikuMapper.ts`: **lolos**.
- Uji mapper format `results`, `items`, dan `data`: **lolos**.
- Uji detail menggunakan `apiLink`, chapter `00-1`, gambar reader, dan navigasi chapter: **lolos**.
- `npm ci` timeout saat mencoba mengambil dependency. Karena dependency tidak tersedia, `npm run build` dan lint penuh belum dapat diverifikasi di lingkungan ini.
- API OnRender tidak dapat diuji end-to-end dari lingkungan ini; uji fungsi menggunakan respons API contoh yang mengikuti struktur controller API.

## Menjalankan dan memeriksa
1. Ekstrak ZIP.
2. Jalankan `npm ci` pada jaringan yang bisa mengakses npm registry.
3. Pastikan `NEXT_PERDEX_APIURL` di Vercel/hosting mengarah ke `https://komiku-rest-api.onrender.com`.
4. Jalankan `npm run build`.
5. Setelah berhasil, tes pencarian, detail manga/manhwa/manhua, reader, gambar, navigasi chapter, dan pagination.


## Perbaikan pada ZIP ini
- Handler `onError` gambar dipindahkan ke komponen client `FallbackImage`, sehingga Server Components tidak lagi mengirim event handler ke komponen gambar.
- Gambar cover dan halaman reader mencoba URL CDN asli terlebih dahulu. URL `/image-proxy` dipakai sebagai cadangan jika gambar utama gagal dimuat.
- Komponen fallback gambar mencobakan URL cadangan lalu ikon lokal PerDex.
- Detail komik kini membaca `info.Tipe` dan `info.Rating`, serta tambahan variasi field judul/tahun/genre.
- Reader mempertahankan `images[].src`, `images[].fallbackSrc`, dan `images[].alt`; navigasi juga menerima variasi field chapter sebelumnya/berikutnya.
- Request API menggunakan cache/revalidasi Next.js dengan durasi 30–300 detik sesuai endpoint, bukan `no-store` untuk seluruh permintaan.
- Tombol “Mulai membaca” mengarah ke chapter paling awal berdasarkan urutan data sumber (API menampilkan chapter terbaru lebih dulu).

## Verifikasi untuk ZIP ini
- Pemeriksaan sintaks TypeScript/TSX: **62 file diparsing, 0 kesalahan sintaks**.
- Tes fungsi dengan contoh respons API detail Reality Quest: **lolos** untuk `info.Tipe`, `info.Rating`, `chapters[].apiLink`, URL cover langsung, dan URL proxy cadangan.
- Tes fungsi reader: **lolos** untuk `images[].src`, `fallbackSrc`, `alt`, serta navigasi prev/next melalui `apiLink`.
- `npm ci` tidak selesai karena proses instalasi dependency melewati batas waktu. Karena itu, **build Next.js penuh dan pemeriksaan tipe dengan dependency proyek belum dapat dijalankan** di lingkungan ini.
- API Render belum diuji end-to-end dari deployment; hasil tes memakai contoh respons API yang kamu kirim.
