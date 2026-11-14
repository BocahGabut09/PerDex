# PerDex

PerDex is a Next.js manga/manhwa/manhua catalog and reader powered by the Komiku REST API.

## Requirements
- Node.js 18.17+ (Node 20 LTS recommended)
- npm

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

- `NEXT_PERDEX_APIURL` (optional): Komiku REST API base URL. Defaults to `https://komiku-rest-api.onrender.com`.
- `NEXT_PUBLIC_DOMAIN` (optional): canonical site origin used when configuring deployment metadata. Update `src/lib/seo/siteMetadata.ts` if you use a custom domain.

Do not commit `.env.local` or credentials to Git.

## Upstream Komiku API

- API base: `https://komiku-rest-api.onrender.com`
- Swagger documentation: `https://komiku-rest-api.onrender.com/api-docs`

## Main API routes

- `GET /api/perdex/projectupdated`
- `GET /api/perdex/lastupdated?page=1`
- `GET /api/perdex/advsearch?type=manga&page=1`
- `GET /api/perdex/search?q=naruto`
- `GET /api/perdex/details/:slug`
- `GET /api/perdex/read/:slug___:chapter`

## Build

```bash
npm run build
npm start
```

## Notes
- Bookmarks are stored in the current browser profile. They do not sync across devices or browsers.
- Manga images are passed through the Komiku API image proxy; if the upstream proxy/CDN is unavailable, the UI shows a local fallback cover.
- This project is a frontend client. Availability and response formats depend on the upstream API.


## Fitur PerDex terbaru

- **Jelajahi Genre**: buka `/genre`, pilih genre, lalu filter hasil hanya Manga, Manhwa, atau Manhua.
- **History Baca**: `/history` menyimpan komik, chapter, halaman aktif, dan progres baca secara lokal.
- **Lanjutkan Membaca**: beranda menampilkan bacaan terakhir yang dapat dilanjutkan.
- **Acak Komik**: tombol di beranda memilih satu komik dari update terbaru.
- **Mode Fokus dan Auto-scroll**: kontrol tambahan tersedia di halaman reader.
- **Infinite Chapter Scroll**: khusus Fokus Mode, chapter berikutnya otomatis dimuat saat pembaca mendekati akhir chapter, lalu tersambung tanpa reload halaman.

Rincian penggunaan dan endpoint tersedia di `README-FEATURES.md`.
