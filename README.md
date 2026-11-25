# catetkos

Catatan kos: booking, pemasukan, biaya, dashboard.

- `backend/` Go (net/http + pgx), Postgres, migrasi SQL tertanam (`backend/migrations`), jalan otomatis saat start.
- `frontend/` Vite + React + TypeScript + Tailwind. `/api` di-proxy ke backend.
- Deploy: `./deploy.sh` (docker compose: `api` + `web` nginx di 127.0.0.1:${HOST_PORT}).

## Dev
```
cd backend && DATABASE_URL=postgres://... SESSION_SECRET=$(openssl rand -hex 32) go run . serve   # :8080
cd frontend && npm i && npm run dev                                                                # :3005
```
## Test
```
cd backend && go test ./...        # DB sementara di Postgres lokal (TEST_ADMIN_URL untuk override)
cd frontend && npm run lint && npm run build && npm run test:e2e
```
## Admin
```
docker compose exec api /app/catetkos seed-admin
docker compose exec -it api /app/catetkos set-password <user>
```
Migrasi data dari SQLite lama: `scripts/sqlite-to-pg.py file.db | psql "$DATABASE_URL"`.
