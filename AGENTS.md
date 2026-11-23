# AGENTS.md

Panduan untuk agent (dan manusia) yang mengerjakan repo ini.

## Baca dulu

- `PRODUCT.md`: siapa usernya, tujuan produk, apa yang sudah ada vs masih rencana.
- `DESIGN.md`: token dan aturan visual. Wajib dibaca sebelum menyentuh UI.
- `README.md`: cara menjalankan, test, deploy.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Recharts, lucide-react.
- Data: SQLite lewat Prisma 7 (adapter libsql). Query bisnis lewat `$queryRawUnsafe` di `src/lib/resources.ts` dan `dashboard.ts`.
- Auth: JWT (`jose`) di cookie httpOnly `session`. Kos aktif di cookie `kos`.
- Runtime dan package manager: Bun. Test: `node --test` lewat `tsx`, Playwright e2e (profil iPhone 13).
- Deploy: Docker standalone di VPS, `./deploy.sh` (manual, tanpa CI).

## Peta kode

| Path | Isi |
|---|---|
| `src/app/(app)/` | Halaman terautentikasi, satu `page.tsx` per rute. `layout.tsx` = auth gate + `AppShell` |
| `src/app/login/` | Halaman login |
| `src/app/api/` | Route handler: `auth`, `kos`, `dashboard`, `quote`, `bookings`, dan CRUD generik `[resource]/[id]` |
| `src/app/manifest.ts` | Manifest PWA |
| `src/proxy.ts` | Gerbang kasar: tanpa JWT valid, halaman ke `/login`, `/api` 401 |
| `src/components/ui/` | Primitif UI (Button, Card, Form, Modal, DataTable, Filter, Tabs, Toaster) |
| `src/components/shell/` | Sidebar, header mobile, tab bar, `nav-items.ts` (data) + `nav-icons.ts` (ikon) |
| `src/components/Crud.tsx` | CRUD generik yang dipakai hampir semua entity |
| `src/lib/db.ts` | Singleton PrismaClient |
| `src/lib/resources.ts` | Definisi entity, validasi, booking, quote |
| `src/lib/membership.ts` | Kos, anggota, `resolveKos` |
| `src/lib/session.ts`, `auth.ts`, `password.ts` | JWT + cookie, `getCurrentUser`/`requireUser`, scrypt |
| `src/lib/server-api.ts` | Pembungkus route handler, `withKos`, rate limit login |
| `src/lib/api.ts` | Client fetch, `rp`, `cn`, toast |
| `prisma/` | `schema.prisma` + migrasi |
| `scripts/` | Seed dan utilitas akun (jalan lewat `tsx` atau `bun`) |
| `tests/`, `e2e/` | Test node dan Playwright |

## Perintah

```bash
bun run dev          # http://localhost:3005
bun run typecheck
bun run lint
bun run test
bun run build && bun run test:e2e
```

Sebelum bilang selesai: `typecheck`, `lint`, dan `test` harus lolos. Perubahan UI atau alur: jalankan juga e2e.

## Aturan kode

- **Navigasi satu sumber.** Halaman baru: buat `src/app/(app)/<path>/page.tsx`, lalu daftarkan di `nav-items.ts` (path, label, nama ikon) dan `nav-icons.ts`. Sidebar dan halaman "Lainnya" ikut dari situ.
- **Entity baru pakai `Crud`.** Tambah model di `schema.prisma`, resource di `src/lib/resources.ts`, dan satu `page.tsx` yang memakai `Crud`. Jangan bikin halaman CRUD dari nol.
- **Migrasi hanya ditambah.** Perubahan skema = migrasi Prisma baru (`prisma migrate dev`). Jangan edit migrasi lama. CHECK constraint ditulis manual di SQL migrasi. DB produksi tidak pernah di-reset.
- **Semua data bisnis ber-`kos_id`.** Setiap query dan endpoint wajib dibatasi ke kos aktif. Handler data memakai `withKos()`: cookie `kos` hanya preferensi, membership dicek ke DB di setiap request. Jangan pernah percaya `kos_id` dari client.
- **Validasi final di server.** Client boleh membantu, server yang memutuskan. Uang disimpan sebagai integer Rupiah.
- **`/api` tidak pernah di-cache** oleh service worker. `sw.js` disajikan dengan header no-cache.
- **Komponen interaktif** pakai `'use client'`. Akses DB dan session hanya di server (`server-only`).
- **UI pakai token semantik** (`bg-surface`, `text-mut`, `border-line`), bukan hex mentah. Lihat `DESIGN.md`.
- **Mobile dulu.** Target sentuh 44px (`min-h-11`), input 16px di mobile, hormati safe-area.
- **Teks UI bahasa Indonesia santai**, singkat. Status berwarna selalu punya label teks.
- **Jangan tambah dependency** untuk hal yang bisa beberapa baris atau sudah ada di stdlib.
- **Komentar:** jangan tambah komentar baru kecuali diminta. Jangan tulis kode ticket atau marker buatan sendiri di source.
- Fitur yang masih rencana (push notif, RBAC) jangan ditulis seolah sudah ada, di kode maupun dokumen.

## Commit

Conventional Commits, satu baris judul:

```
<type>(<scope>): <deskripsi>
```

- **Type:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`.
- **Scope:** modul/area kode, misalnya `booking`, `calendar`, `dashboard`, `ledger`, `auth`, `kos`, `ui`, `shell`, `db`, `deploy`.
- **Deskripsi:** bahasa Inggris, huruf kecil, imperative, tanpa titik.
- Kode ticket (kalau ada) di akhir judul, bukan di scope atau footer.
- Tanpa trailer `Co-Authored-By` dan tanpa "Generated with ...".
- Satu commit satu perubahan logis. Jangan commit `data/`, `.env`, atau isi `research/`.

Contoh:

```
feat(calendar): merge consecutive bookings into one bar
fix(booking): prevent double payment on repeated confirm
docs(readme): add deploy steps
```

Commit lama memakai kalimat bebas bahasa Indonesia; itu tidak perlu ditulis ulang, cukup ikuti format ini ke depan.

Commit atau push hanya kalau diminta. Kerja di branch, bukan langsung di `main`.

## Research dan catatan kerja

Semua dokumen riset, brief, eksplorasi, draf, dan catatan sementara ditaruh di `research/`. Folder itu di-gitignore, jadi isinya tidak ikut ter-commit.

- Contoh: `research/ui-brief.md` (brief UI untuk generator).
- Jangan taruh hasil riset di root atau di `docs/`.
- Kalau sebuah catatan sudah jadi keputusan yang harus diikuti semua orang, pindahkan isinya ke `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, atau `README.md`.
