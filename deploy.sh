#!/usr/bin/env bash
# Deploy manual di VPS: pull main, build image lokal (bun + Next standalone), recreate container.
# Migrasi Prisma jalan otomatis di entrypoint. Tanpa GHA/GHCR. Data ada di volume catetkos-prod_data.
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose ps
