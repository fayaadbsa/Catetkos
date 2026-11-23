---
name: catetkos
description: Catatan kos yang tenang dan rapi; angka jadi pahlawan, terakota jadi tanda tangan.
colors:
  ink: "#09090b"
  graphite: "#18181b"
  paper: "#fafafa"
  sheet: "#ffffff"
  wash: "#f0f0f3"
  ruling: "#dcdce1"
  pencil: "#71717a"
  terracotta: "#c2563a"
  ok: "#15803d"
  warn: "#a16207"
  danger: "#b91c1c"
  paper-dark: "#09090b"
  sheet-dark: "#18181b"
  wash-dark: "#27272a"
  ruling-dark: "#45454d"
  pencil-dark: "#a1a1aa"
  terracotta-dark: "#e8785c"
  ok-dark: "#4ade80"
  warn-dark: "#facc15"
  danger-dark: "#f87171"
typography:
  page-title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  app-bar-title:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  figure:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  overline:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.025em"
  tab-label:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "6px"
  md: "8px"
  sheet: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.graphite}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "36px"
  chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.pencil}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "36px"
  bottom-sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.sheet}"
    padding: "20px"
---

# Design System: catetkos

## Overview

**Creative North Star: "Buku Kas Rapi"**

catetkos terasa seperti buku kas yang dijaga baik: kertas bersih, garis tipis, tulisan tinta hitam, dan angka yang bisa dibaca sekilas. Sistemnya monokrom zinc ala shadcn. Hierarki dibangun dari bobot huruf, abu-abu, dan garis, bukan dari warna. Satu-satunya warna brand adalah terakota, dipakai seperti cap stempel: di logo, wordmark "kos", dan seri utama chart.

Density sedang menuju padat: ini alat kerja harian, bukan halaman pemasaran. Mobile adalah tampilan utama (PWA, portrait), dengan header lengket ber-blur dan tab bawah melayang; desktop memakai sidebar dengan grup menu yang sama. Light dan dark adalah warga setara, dikendalikan oleh satu set CSS variable.

**Key Characteristics:**
- Monokrom tinta-di-kertas; terakota hanya sebagai tanda tangan.
- Angka (Rupiah, tanggal, jumlah malam) adalah konten utama, selalu tegas dan tidak terpotong.
- Garis 1px dan bayangan nyaris tak terlihat; kedalaman dari layering tonal.
- Pola native mobile: bottom sheet, segmented control, target sentuh 44px, safe-area.
- Warna semantik (ok / warn / danger) hanya untuk status, selalu didampingi label teks.

## Colors

Palet tinta, kertas, dan pensil, dengan satu cap terakota. Nilai normatif ada di `src/index.css` sebagai triplet `R G B` (`--bg`, `--surface`, `--soft`, `--line`, `--tx`, `--mut`, `--primary`, `--brand`, `--danger`, `--warn`, `--ok`), dipetakan ke Tailwind lewat `tailwind.config.ts`. Token `-dark` di frontmatter adalah nilai yang sama di bawah `.dark`.

### Primary
- **Graphite** (`--primary`): tombol utama, chip terpilih, avatar, badge jumlah filter. Di dark mode berbalik jadi Paper dengan teks Graphite.

### Secondary
- **Terracotta** (`--brand`): logo, wordmark "kos", seri utama chart dan kamar pertama di palet chart (`src/lib/theme.ts`). Versi dark lebih terang (Terracotta Dark) supaya tetap hangat di latar gelap.

### Neutral
- **Ink** (`--tx`): teks utama, border filter aktif.
- **Pencil** (`--mut`): teks sekunder, label stat, header tabel, ikon tab tidak aktif, outline fokus.
- **Paper** (`--bg`): latar halaman.
- **Sheet** (`--surface`): kartu, input, sheet, header dan tab bar (dengan alpha + blur).
- **Wash** (`--soft`): hover, item nav aktif, track segmented control.
- **Ruling** (`--line`): semua border dan pembatas baris.

### Semantic
- **Ok** (`--ok`): lunas, nilai positif.
- **Warn** (`--warn`): belum lunas, perlu perhatian.
- **Danger** (`--danger`): hapus, error, nilai negatif.

### Named Rules
**The One Stamp Rule.** Terakota adalah satu-satunya warna brand. Pakai di logo, wordmark, dan seri data utama. Jangan untuk tombol, link, atau latar.

**The Token-Only Rule.** Komponen hanya memakai token semantik (`bg-surface`, `text-mut`, `border-line`). Ganti tema = ganti variabel, bukan komponen. Hex mentah hanya boleh di palet chart/kalender di `src/lib/theme.ts` dan `src/pages/Calendar.tsx`.

**The Status Has Words Rule.** Warna status selalu didampingi teks ("Lunas", "Belum lunas"). Warna saja tidak pernah membawa makna.

## Typography

**Display Font:** Plus Jakarta Sans (dengan ui-sans-serif, system-ui)
**Body Font:** Plus Jakarta Sans
**Currency & Numerics:** JetBrains Mono (dengan tabular-nums untuk angka keuangan dan metrik)

**Character:** Tipografi presisi dan terbaca jelas. Plus Jakarta Sans untuk antarmuka yang ramah dan terstruktur, serta JetBrains Mono untuk angka Rupiah dan tanggal agar kolom vertikal sejajar rapi. Hierarki dari bobot (400, 500, 600, 700) dan warna Ink vs Pencil.

### Hierarchy
- **Page title** (600, 1.5rem, tracking tight): judul halaman di desktop (`PageHeader`).
- **App bar title** (600, 17px, tracking tight): judul di header mobile, ukuran ala iOS.
- **Figure** (600, 1.25rem, `whitespace-nowrap`): nilai stat Rupiah di dashboard. Tidak pernah dipotong atau di-wrap.
- **Body** (400, 0.875rem): isi tabel, deskripsi, sel data. Input naik ke 16px di mobile.
- **Label** (600, 0.875rem, Pencil): label stat, label field (500).
- **Overline** (600, 0.75rem, uppercase, tracking wide, Pencil): header kolom tabel, legend grup filter (11px).
- **Tab label** (600 aktif / 500 tidak aktif, 10px): label tab bawah.

### Named Rules
**The Weight Not Size Rule.** Naikkan bobot atau ganti Pencil ke Ink sebelum menaikkan ukuran. Skala ukuran sengaja sempit.

**The Loaded Weights Rule.** Google Fonts saat ini memuat bobot 400, 600, 800. Kelas `font-medium` (500) yang dipakai di tombol, label, dan nav dirender browser dari bobot terdekat. Kalau butuh 500 yang asli, tambahkan ke URL font di `index.html`; jangan pakai bobot lain tanpa memuatnya.

## Layout

Mobile-first. Di bawah `md` (768px): header lengket setinggi 48px + safe-area atas, konten satu kolom dengan gutter 16px, tab bar melayang di bawah (maks 26rem, offset 12px + safe-area bawah). Di `md` ke atas: sidebar kiri dengan menu bergrup (Ringkasan, Operasional, Keuangan, Data master) dan footer user; header mobile dan tab bar disembunyikan.

Ritme spasi kelipatan 4px: 4 / 8 / 12 / 16 / 20. Kartu 16px, kartu daftar mobile 14px, sel tabel 12px, sheet 20px. `DataTable` berganti tampilan: tabel di desktop, daftar kartu di mobile (kolom pertama jadi judul kartu); opsi `table` memaksa tabel dengan geser horizontal untuk data keuangan.

Kalender adalah grid kamar x tanggal, mengalir 7 hari per baris, booking berurutan digabung jadi satu bar berwarna per tamu.

## Elevation & Depth

Hampir datar. Kedalaman dari layering tonal (Paper di bawah, Sheet di atas, Wash untuk hover/aktif) dan garis Ruling 1px. Bayangan hanya dua: sangat tipis di kartu, dan satu bayangan lembut + blur untuk elemen yang benar-benar melayang di atas konten.

### Shadow Vocabulary
- **Card hairline** (`box-shadow: 0 1px 2px 0 rgb(var(--shadow) / .06)`): kartu, tab terpilih, sheet.
- **Floating island** (`box-shadow: 0 12px 32px -4px rgba(0,0,0,0.18)` + `backdrop-filter: blur(24px) saturate(180%)`): hanya tab bar mobile.
- **Glass bar** (`bg-surface/80` + `backdrop-blur-xl`, tanpa bayangan, border bawah Ruling): header mobile.

### Named Rules
**The Only Islands Float Rule.** Hanya navigasi melayang (tab bar) dan overlay (sheet) yang terangkat. Kartu dan tabel tetap di permukaan kertas.

## Shapes

Sudut lembut dan konsisten. Kontrol (tombol, input, filter icon) 6px; kartu dan tab segmented 8px; bottom sheet dan dialog 24px di atas (semua sisi di desktop); tab bar, chip, badge, avatar penuh membulat. Border selalu 1px Ruling; border Ink 1px hanya untuk menandai filter aktif.

## Components

### Buttons
Tegas dan pendiam.
- **Shape:** sudut lembut (6px), tinggi 44px di mobile, 36px di desktop.
- **Primary:** Graphite dengan teks Paper, 14px medium, padding 8px 12px. Hover 90% opasitas.
- **Outline:** Sheet dengan border Ruling, teks Ink, hover Wash.
- **Ghost:** transparan, hover Wash.
- **Danger:** latar Danger, teks putih, hover sedikit pudar.
- **Press:** semua tombol mengecil `scale(0.97)` saat ditekan; disabled 50% opasitas.

### Chips
- **Filter chip:** pill 36px, 12px semibold. Terpilih Graphite/Paper; tidak terpilih Sheet + border Ruling + teks Pencil.
- **Active filter chip:** pill 32px, border Ink, latar Wash, ikon X; tap untuk mencopot filter.
- **Badge status:** pill kecil dengan titik warna, latar warna 15% alpha dan ring 40% alpha, teks tetap Ink.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** Sheet di atas Paper.
- **Shadow Strategy:** Card hairline.
- **Border:** 1px Ruling.
- **Internal Padding:** 16px (stat, konten), 14px (kartu daftar mobile), 0 untuk kartu pembungkus tabel.

### Inputs / Fields
- **Style:** Sheet, border 1px Ruling, 6px, tinggi 44px / 16px teks di mobile, 36px / 14px di desktop.
- **Focus:** border jadi Pencil + ring Pencil 20%.
- **Label:** 14px medium di atas field, jarak 4px.

### Navigation
- **Tab bar mobile:** pulau pill melayang, Sheet 90% + blur. 4 tab utama (Dashboard, Kalender, Booking, Pemasukan) + Lainnya. Aktif: latar Wash, teks Ink, ikon stroke 2.4; tidak aktif: Pencil, stroke 1.8. Tekan `scale(0.9)`.
- **Header mobile:** logo kecil + judul 17px + subjudul Pencil; kanan avatar ke profil.
- **Sidebar desktop:** grup berlabel Pencil 12px, item 14px medium dengan ikon 16px, aktif latar Wash.

### Bottom Sheet / Modal
Bottom sheet di mobile (sudut atas 24px, hormati safe-area, maks 90dvh), dialog tengah di desktop. Overlay hitam 50%. Esc atau tap latar menutup. Filter sheet memakai pola draft: pilihan baru berlaku setelah "Terapkan", dengan "Reset" ghost di sebelahnya.

### Segmented Control
Track Wash 6px, tab 8px, tab terpilih Sheet + Card hairline + teks Ink, lainnya Pencil. Untuk pilihan sedikit (rentang tanggal, mode tampilan).

### Calendar Bar (signature)
Bar booking di grid kamar x tanggal, warna dari palet 10 warna per tamu (`PAL` di `src/pages/Calendar.tsx`), booking berurutan digabung. Satu-satunya tempat warna banyak diizinkan, karena warna di sini membedakan identitas tamu, bukan dekorasi.

## Do's and Don'ts

### Do:
- **Do** pakai token semantik (`bg-surface`, `text-mut`, `border-line`, `bg-soft`) untuk setiap permukaan baru, supaya light/dark ikut otomatis.
- **Do** jaga target sentuh 44px di mobile (`min-h-11`) dan turunkan ke 36px di desktop (`md:min-h-9`).
- **Do** pakai bottom sheet untuk filter dan form di mobile, bukan halaman baru atau dropdown.
- **Do** tampilkan Rupiah dengan `whitespace-nowrap` dan bobot 600 di stat.
- **Do** beri label teks pada setiap status berwarna.

### Don't:
- **Don't** pakai terakota untuk tombol, link, atau latar besar (The One Stamp Rule).
- **Don't** tambah hex mentah di komponen; satu-satunya pengecualian adalah palet chart dan kalender.
- **Don't** angkat kartu dengan bayangan besar; yang melayang hanya tab bar dan sheet.
- **Don't** pakai input dengan teks di bawah 16px di mobile (memicu zoom iOS).
- **Don't** pakai bobot font yang tidak dimuat di `index.html`.
