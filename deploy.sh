#!/usr/bin/env bash
# Usage: ./deploy.sh [main]  — pull image dari GHCR lalu recreate container.
set -euo pipefail
cd "$(dirname "$0")"
export IMAGE_TAG="${IMAGE_TAG:-ghcr.io/fayaadbsa/catetkos:main-latest}"
docker compose pull
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
docker compose ps
