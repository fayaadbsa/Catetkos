# AGENTS.md

Panduan untuk agent (dan manusia) yang mengerjakan repo ini.

## Baca dulu

- `PRODUCT.md`: siapa usernya, tujuan produk, apa yang sudah ada vs masih rencana.
- `DESIGN.md`: token dan aturan visual. Wajib dibaca sebelum menyentuh UI.
- `README.md`: cara menjalankan, test, deploy.

## Stack

- Backend `backend/`: Go (net/http, pgx), Postgres saja. Migrasi SQL tertanam di `backend/migrations`, jalan otomatis saat start. Tanpa ORM, SQL mentah.
- Frontend `frontend/`: Vite, React 19, TypeScript, Tailwind 4, react-router, Recharts, lucide-react.
- Auth: JWT HS256 di cookie httpOnly `session`. Kos aktif di cookie `kos`. Password scrypt.
- Test: `go test` (DB Postgres sementara), Playwright e2e (iPhone 13) lawan api Go + build Vite.
- Deploy: docker compose (`api` + `web` nginx) di VPS, `./deploy.sh` (manual, tanpa CI). Postgres di host.

## Peta kode

| Path | Isi |
|---|---|
| `backend/main.go` | Router `/api`, cookie, rate limit login, entry CLI |
| `backend/resources.go` | Definisi entity, validasi, booking, quote, CRUD generik |
| `backend/dashboard.go`, `auth.go`, `cli.go` | Dashboard, JWT+scrypt+membership, skrip admin/seed |
| `backend/db.go`, `util.go`, `migrations/` | Pool pgx + migrator, helper, skema |
| `backend/app_test.go` | Suite test (logika + HTTP) |
| `frontend/src/pages/` | Satu file per halaman, rute di `App.tsx` |
| `frontend/src/components/ui/`, `shell/` | Primitif UI, sidebar, header, tab bar, `nav-items.ts` |
| `frontend/src/components/Crud.tsx` | CRUD generik |
| `frontend/src/lib/` | `api.ts` (fetch), `me.tsx` (sesi), `kos.tsx`, tema |
| `frontend/e2e/`, `scripts/e2e-api.sh` | Playwright + backend e2e |

## Perintah

```bash
cd backend && go vet ./... && go test ./...
cd frontend && npm run lint && npm run build && npm run test:e2e
```

Sebelum bilang selesai: vet, test, lint, dan build harus lolos. Perubahan UI atau alur: jalankan juga e2e.

## Aturan kode

- **Navigasi satu sumber.** Halaman baru: buat `frontend/src/pages/<path>.tsx`, daftarkan di `App.tsx`, `nav-items.ts` (path, label, nama ikon) dan `nav-icons.ts`. Sidebar dan halaman "Lainnya" ikut dari situ.
- **Entity baru pakai `Crud`.** Tambah tabel di migrasi baru, resource di `backend/resources.go`, dan satu halaman yang memakai `Crud`. Jangan bikin halaman CRUD dari nol.
- **Migrasi hanya ditambah.** Perubahan skema = file baru `backend/migrations/NNN_nama.sql`. Jangan edit migrasi lama. DB produksi tidak pernah di-reset.
- **Semua data bisnis ber-`kos_id`.** Setiap query dan endpoint wajib dibatasi ke kos aktif. Handler data memakai `withKos`: cookie `kos` hanya preferensi, membership dicek ke DB di setiap request. Jangan pernah percaya `kos_id` dari client.
- **Validasi final di server.** Client boleh membantu, server yang memutuskan. Uang disimpan sebagai integer Rupiah.
- **`/api` tidak pernah di-cache** oleh service worker. `sw.js` disajikan dengan header no-cache.
- **Frontend tidak menyentuh DB.** Semua lewat `/api`.
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

Commit dan push ke `main` setelah user bilang gas.

## Research dan catatan kerja

Semua dokumen riset, brief, eksplorasi, draf, dan catatan sementara ditaruh di `research/`. Folder itu di-gitignore, jadi isinya tidak ikut ter-commit.

- Contoh: `research/ui-brief.md` (brief UI untuk generator).
- Jangan taruh hasil riset di root atau di `docs/`.
- Kalau sebuah catatan sudah jadi keputusan yang harus diikuti semua orang, pindahkan isinya ke `PRODUCT.md`, `DESIGN.md`, `AGENTS.md`, atau `README.md`.
