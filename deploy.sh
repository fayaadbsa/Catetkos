#!/usr/bin/env bash
# Deploy manual di VPS: pull main, build image lokal (api Go + web Vite/nginx), recreate container.
# Migrasi SQL jalan otomatis saat api start. DB = Postgres (DATABASE_URL di .env).
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose ps
