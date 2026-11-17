#!/usr/bin/env bash
# Deploy manual di VPS: pull main, build image lokal, recreate container. Tanpa GHA/GHCR.
set -euo pipefail
cd "$(dirname "$0")"
git pull --ff-only
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
docker compose ps
