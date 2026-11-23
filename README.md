# catetkos

Catatan kos: booking, kalender, kas, dan dashboard untung-rugi dalam satu PWA yang enak dipakai dari HP.

Dibuat untuk pemilik kos kecil dengan sewa bulanan yang selama ini mencatat di buku atau Excel.

## Fitur

- **Booking bulanan per kamar.** Sewa panjang tercatat per bulan dan tampil sebagai satu penginapan. Perpanjang satu tap.
- **Kalender menerus.** Kamar x tanggal, satu bar per penginapan, satu warna per tamu.
- **Pembayaran dan deposit.** Tandai lunas, terima dan kembalikan deposit (deposit dihitung titipan, bukan omzet).
- **Kas.** Pemasukan, biaya, modal, dengan kategori dan filter bulan / kategori / kamar.
- **Promo.** Harga khusus per periode yang otomatis dipakai saat booking, plus kalkulator untung-rugi promo.
- **Dashboard.** Okupansi, piutang, arus kas bulanan, omzet per tipe kamar, biaya per kategori, progres balik modal.
- **Multi-kos.** Satu akun bisa memegang beberapa kos, satu kos bisa dipegang beberapa akun.
- **PWA.** Bisa dipasang di HP, tema terang dan gelap.

Rencana berikutnya: reminder lewat push notification, peran per anggota (RBAC).

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4. Data di SQLite lewat Prisma (adapter libsql), sesi JWT (`jose`) di cookie httpOnly. Runtime dan package manager: Bun. Satu proses, tanpa server database terpisah.

## Menjalankan lokal

Butuh [Bun](https://bun.sh) 1.x dan Node 22 atau lebih baru.

```bash
bun install
bunx prisma migrate deploy   # bikin/upgrade data/catetkos.db
bun run seed:admin           # input username & password via prompt CLI
bun run seed                 # opsional: data contoh dari seed/example/seed.json
bun run dev                  # http://localhost:3005
```

Database tersimpan di `data/catetkos.db` (dibuat otomatis, tidak ikut git).

### Environment

| Variabel | Default | Guna |
|---|---|---|
| `PORT` | `3005` | Port server (docker) |
| `DB_PATH` | `data/catetkos.db` | Lokasi file SQLite |
| `SESSION_SECRET` | dibuat otomatis | Kunci tanda tangan JWT. Kosong = disimpan di `data/.session-secret` |
| `HOST_PORT` | `3005` | Port host di docker compose |
| `COMPOSE_PROJECT` | `catetkos-prod` | Nama project dan volume compose |

### Script

| Perintah | Guna |
|---|---|
| `bun run dev` | Next dev server |
| `bun run build` | Build production (standalone) |
| `bun run typecheck` | `next typegen` lalu `tsc --noEmit` |
| `bun run lint` | ESLint |
| `bun run test` | Test node (`tests/*.test.ts`), DB sementara dari migrasi asli |
| `bun run test:e2e` | Playwright, butuh `build` dulu, pakai DB sementara di `/tmp` |
| `bun run db:deploy` | `prisma migrate deploy` |
| `bun run seed` | Isi data contoh (menghapus data bisnis kos target, akun tetap) |
| `bun run seed:admin` | Bikin akun admin via prompt CLI (atau lewat env), aman diulang |
| `bun run seed:test` | Akun uji multi-kos |
| `bun run set:password` | Ganti password lewat prompt tersembunyi |

## Skema dan migrasi

Skema di `prisma/schema.prisma`, migrasi di `prisma/migrations/`. Migrasi `baseline` = skema v3 lama, lengkap dengan CHECK constraint (ditulis manual di SQL karena Prisma tidak mendukungnya). Untuk perubahan skema: edit `schema.prisma`, lalu `bunx prisma migrate dev --name <nama>` dan cek SQL-nya. Constraint CHECK baru tambahkan manual.

DB produksi lama (dibuat sebelum Prisma) tidak punya riwayat migrasi. `docker-entrypoint.sh` mendeteksinya (P3005) dan menandai baseline sebagai applied tanpa menjalankannya, jadi data tidak disentuh.

## Test

```bash
bun run typecheck && bun run lint && bun run test
bun run build && bun run test:e2e
```

Kalau Chromium bawaan Playwright tidak terpasang, arahkan lewat `CHROMIUM_PATH=/path/ke/chrome`.

## Deploy

Docker di VPS, build lokal di server (tanpa CI):

```bash
cp .env.example .env   # opsional
./deploy.sh            # git pull, build image, recreate container
```

Container bind ke `127.0.0.1:3005`; taruh reverse proxy dengan HTTPS di depannya. Data ada di volume `catetkos-prod_data` (DB + `.session-secret`), backup volume itu secara berkala. Migrasi jalan otomatis saat container start.

Bikin akun atau ganti password di server:

```bash
docker exec -it catetkos-prod bun scripts/seed-admin.ts
docker exec -it catetkos-prod bun scripts/set-password.ts <username>
```
*(Bisa juga non-interaktif dengan mengoper `-e ADMIN_USERNAME=... -e ADMIN_PASSWORD=...`)*

## Dokumen

- [`PRODUCT.md`](PRODUCT.md): konteks produk.
- [`DESIGN.md`](DESIGN.md): sistem desain.
- [`AGENTS.md`](AGENTS.md): konvensi kode dan commit.

## Lisensi

MIT
