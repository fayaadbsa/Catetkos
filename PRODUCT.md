# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA (`public/manifest.webmanifest`, `public/sw.js`), portrait, start URL `/dashboard`. Mobile web first; desktop gets a sidebar layout of the same app.

## Users

Pemilik kos kecil (sewa bulanan) yang mencatat sendiri operasional kosnya, mayoritas dari HP di sela kegiatan lain. Job utama: tahu siapa menempati kamar mana dari tanggal berapa sampai berapa, sudah bayar atau belum, dan apakah kos ini untung.

Saat ini: satu orang, satu kos. Arah ke depan: beberapa anggota per kos dengan peran berbeda (RBAC), dan satu akun bisa mengelola lebih dari satu kos.

## Product Purpose

catetkos ("catatan kos") menggantikan buku tulis / Excel untuk mengelola kos: booking per kamar, kalender okupansi, kas (pemasukan, biaya, modal), dan dashboard analitik untung-rugi. Sukses = pemilik bisa mencatat booking baru dalam hitungan detik dari HP dan menjawab "bulan ini untung berapa?" tanpa menghitung manual.

## Positioning

Booking per kamar, kalender, kas, dan laporan untung-rugi dalam satu alat yang dibuat untuk skala kos kecil: tanpa kerumitan PMS hotel, tanpa rumus Excel. Inti nilainya adalah pencatatan "siapa masuk tanggal berapa", lalu semua angka keuangan mengalir dari situ.

## Operating Context

- Dipakai dari HP sebagai PWA terpasang; tab bawah: Dashboard, Kalender, Booking, Pemasukan, Lainnya.
- Input terjadi saat tamu datang / bayar / ada pengeluaran, sering satu tangan dan terburu-buru.
- Review dilakukan berkala lewat dashboard (filter rentang tanggal + tipe kamar).
- Bahasa antarmuka: Indonesia (`lang="id"`), mata uang Rupiah.

## Capabilities and Constraints

Ada sekarang:
- Booking bulanan per kamar (satu booking = satu bulan; sewa panjang = booking berurutan yang digabung jadi satu penginapan), tamu, promo/harga, deposit, status lunas / belum lunas.
- Kalender kamar x tanggal, booking berurutan digabung jadi satu bar, warna per tamu.
- Pemasukan, Biaya, Modal sebagai tabel dengan filter sheet; kategori transaksi.
- Data master: tipe kamar (harga dasar, kapasitas), kamar (override harga), arsip.
- Dashboard analitik (Recharts) dengan filter rentang + tipe kamar.
- Multi-kos di skema: `kos` + `memberships` (many-to-many user-kos), kos switcher, anggota kos.
- Light/dark theme; auth username + password, sesi server.

Direncanakan (belum ada, jangan diklaim sudah jalan):
- Reminder via push notification (mis. jatuh tempo bayar, check-out).
- RBAC: peran per membership (owner, penjaga, dsb).
- Pemakaian multi-kos penuh. Untuk sekarang alur default 1 user 1 kos, tapi model data dan UI harus tetap bisa diperluas.

Stack: Next.js 16 + React 19 + Tailwind 4, Prisma + SQLite, Bun, Playwright e2e, deploy via Docker.

Istilah: kos, kamar, tipe kamar, tamu, booking, promo, pemasukan, biaya, modal, kategori, anggota, lunas / belum lunas.

## Brand Commitments

- Nama ditulis huruf kecil: `catetkos`, wordmark "catet" + "kos" dengan "kos" berwarna brand.
- Logo: ikon rumah di kotak membulat terakota (`public/logo.svg`).
- Voice: Indonesia santai tapi jelas ("Lagi muat...", "Belum ada data."), singkat, tanpa jargon akuntansi.

## Evidence on Hand

Belum ada testimoni, pengguna publik, metrik, atau harga. Data contoh hanya dari `seed/` dan `scripts/seed*.js`; jangan dianggap data nyata.

## Product Principles

1. **Catat dulu, analisa belakangan.** Mencatat booking dan kas harus paling cepat; analitik membaca dari data yang sudah ada, tidak menambah langkah input.
2. **HP adalah meja kerja utama.** Setiap alur harus nyaman satu tangan di layar kecil; desktop adalah bonus.
3. **Angka harus bisa dipercaya.** Uang dan tanggal tidak boleh ambigu; validasi di batas server, tampilan Rupiah konsisten.
4. **Kecil sekarang, siap tumbuh.** 1 user 1 kos sebagai default, tapi jangan mengunci model ke situ (membership, peran, multi-kos).

## Accessibility & Inclusion

Target sentuh minimal 44px di mobile, input 16px di mobile (cegah zoom iOS), hormati safe-area. Status lunas / belum lunas tidak boleh hanya dibedakan lewat warna; selalu ada label teks.
