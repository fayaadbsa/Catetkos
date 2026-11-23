# AGENTS.md

Panduan untuk agent (dan manusia) yang mengerjakan repo ini.

## Baca dulu

- `PRODUCT.md`: siapa usernya, tujuan produk, apa yang sudah ada vs masih rencana.
- `DESIGN.md`: token dan aturan visual. Wajib dibaca sebelum menyentuh UI.
- `README.md`: cara menjalankan, test, deploy.

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind 3, react-router, Recharts, lucide-react.
- Backend: Node 22 tanpa framework (`node:http`), SQLite lewat `node:sqlite`.
- Test: `node --test` (unit/integrasi), Playwright (e2e, profil iPhone 13).
- Deploy: Docker di VPS, `./deploy.sh`.

## Peta kode

| Path | Isi |
|---|---|
| `src/pages/` | Satu file per halaman. `Resources.tsx` = halaman CRUD berbasis config |
| `src/components/ui/` | Primitif UI (Button, Card, Form, Modal, DataTable, Filter, Tabs, Toaster) |
| `src/components/shell/` | Layout: sidebar, header mobile, tab bar, `nav-items.ts` |
| `src/components/Crud.tsx` | CRUD generik yang dipakai hampir semua entity |
| `src/lib/` | `api.ts` (fetch, `rp`, `cn`, toast), auth, kos aktif, tema |
| `server/index.js` | HTTP server, routing `/api`, static `dist` |
| `server/resources.js` | CRUD per resource, booking, quote, validasi |
| `server/db.js` | Skema + migrasi, kos dan membership |
| `server/dashboard.js` | Query analitik dashboard |
| `server/auth.js` | Hash password (scrypt), sesi |
| `scripts/` | Seed dan utilitas akun |
| `test/`, `e2e/` | Test node dan Playwright |

## Perintah

```bash
npm start            # API + static di :3005
npm run dev          # Vite, proxy /api ke :3005
npm run typecheck
npm test
npm run build && npm run test:e2e
```

Sebelum bilang selesai: `npm run typecheck` dan `npm test` harus lolos. Perubahan UI atau alur: jalankan juga e2e.

## Aturan kode

- **Navigasi satu sumber.** Halaman baru didaftarkan di `src/components/shell/nav-items.ts`; rute, sidebar, dan halaman "Lainnya" ikut dari situ.
- **Entity baru pakai `Crud`.** Tambah config di `src/pages/Resources.tsx` dan resource di `server/resources.js`, jangan bikin halaman CRUD dari nol.
- **Migrasi hanya ditambah.** Tambah entri baru di akhir array `MIGRATIONS` di `server/db.js`. Jangan edit migrasi lama.
- **Semua data bisnis ber-`kos_id`.** Setiap query dan endpoint wajib dibatasi ke kos aktif dan cek membership. Jangan pernah percaya `kos_id` dari client tanpa cek.
- **Validasi final di server.** Client boleh membantu, server yang memutuskan. Uang disimpan sebagai integer Rupiah.
- **`/api` tidak pernah di-cache** oleh service worker.
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
