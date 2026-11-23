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

React 18, Vite, TypeScript, Tailwind di depan. Node 22 (`node:http`, `node:sqlite`) di belakang, tanpa framework dan tanpa server database terpisah.

## Menjalankan lokal

Butuh Node 22.5 atau lebih baru.

```bash
npm install
ADMIN_USERNAME=admin ADMIN_PASSWORD='ganti-ini' npm run seed:admin
npm run seed        # opsional: data contoh dari seed/example/seed.json
npm start           # API di http://localhost:3005
npm run dev         # di terminal lain: Vite, proxy /api ke :3005
```

Database tersimpan di `data/catetkos.db` (dibuat otomatis, tidak ikut git).

### Environment

| Variabel | Default | Guna |
|---|---|---|
| `PORT` | `3005` | Port server |
| `HOST` | `127.0.0.1` | Alamat bind |
| `DB_PATH` | `data/catetkos.db` | Lokasi file SQLite |
| `HOST_PORT` | `3005` | Port host di docker compose |
| `COMPOSE_PROJECT` | `catetkos-prod` | Nama project dan volume compose |

### Script

| Perintah | Guna |
|---|---|
| `npm run dev` | Vite dev server |
| `npm start` | Server API + static `dist` |
| `npm run build` | Typecheck lalu build ke `dist` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Test node (`test/*.test.js`) |
| `npm run test:e2e` | Playwright, pakai DB sementara di `/tmp` |
| `npm run seed` | Isi data contoh (menghapus data bisnis kos target, akun tetap) |
| `npm run seed:admin` | Bikin akun admin, aman diulang |
| `npm run seed:test` | Akun uji multi-kos |
| `npm run set:password` | Ganti password lewat prompt tersembunyi |

## Test

```bash
npm test
npm run build && npm run test:e2e
```

## Deploy

Docker di VPS, build lokal di server:

```bash
cp .env.example .env   # opsional
./deploy.sh            # git pull, build image, recreate container
```

Container bind ke `127.0.0.1:3005`; taruh reverse proxy dengan HTTPS di depannya. Data ada di volume `catetkos-prod_data`, backup volume itu secara berkala.

Bikin akun atau ganti password di server:

```bash
docker exec -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD='ganti-ini' catetkos-prod node scripts/seed-admin.js
docker exec -it catetkos-prod node scripts/set-password.js <username>
```

## Dokumen

- [`PRODUCT.md`](PRODUCT.md): konteks produk.
- [`DESIGN.md`](DESIGN.md): sistem desain.
- [`AGENTS.md`](AGENTS.md): konvensi kode dan commit.

## Lisensi

MIT
