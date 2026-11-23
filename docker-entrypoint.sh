#!/bin/sh
# Terapkan migrasi Prisma sebelum app jalan. DB produksi lama (skema v3 tanpa riwayat Prisma)
# ditandai baseline sudah applied, bukan dijalankan ulang, jadi data tetap utuh.
set -e
BASELINE=20261123000000_baseline
OUT=$(bunx prisma migrate deploy 2>&1) || {
  if echo "$OUT" | grep -q P3005; then
    echo "DB lama terdeteksi: tandai $BASELINE sebagai applied"
    bunx prisma migrate resolve --applied "$BASELINE"
    bunx prisma migrate deploy
  else
    echo "$OUT"; exit 1
  fi
}
exec "$@"
