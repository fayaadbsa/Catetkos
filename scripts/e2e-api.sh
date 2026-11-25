#!/usr/bin/env bash
# Backend untuk e2e: DB Postgres sementara + seed akun uji + api di :8199. DB dibuang saat keluar.
set -euo pipefail
export PATH="$HOME/.local/go/bin:$PATH"
ADMIN="${TEST_ADMIN_URL:-postgres:///postgres?host=/var/run/postgresql}"
NAME="catetkos_e2e_$$"
psql "$ADMIN" -qc "CREATE DATABASE $NAME"
trap 'kill $PID 2>/dev/null; psql "$ADMIN" -qc "DROP DATABASE IF EXISTS $NAME WITH (FORCE)"' EXIT
cd "$(dirname "$0")/../backend"
export DATABASE_URL="postgres:///$NAME?host=/var/run/postgresql" SESSION_SECRET=e2e-secret-e2e-secret-e2e-secret-00 PORT=8199 TEST_PASSWORD=e2e-pass-123
go build -o /tmp/catetkos-e2e .
/tmp/catetkos-e2e seed-test
/tmp/catetkos-e2e serve & PID=$!
wait $PID
