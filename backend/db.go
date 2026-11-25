package main

import (
	"context"
	"embed"
	"fmt"
	"sort"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// ponytail: context.Background() di mana-mana. Upgrade: oper request ctx kalau perlu batalkan query saat client putus.
var bg = context.Background()

// db = satu pool global (Postgres saja). Test mengganti isinya ke DB sementara.
var db *pgxpool.Pool

// Q = pool atau transaksi, jadi fungsi data bisa dipakai di keduanya.
type Q interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
}

type Rec = map[string]any

func norm(v any) any {
	switch x := v.(type) {
	case int16:
		return int64(x)
	case int32:
		return int64(x)
	case pgtype.Numeric:
		i, _ := x.Int64Value()
		return i.Int64
	}
	return v
}

func all(q Q, sql string, args ...any) []Rec {
	rows := must1(q.Query(bg, sql, args...))
	defer rows.Close()
	cols := rows.FieldDescriptions()
	out := []Rec{}
	for rows.Next() {
		vals := must1(rows.Values())
		r := Rec{}
		for i, c := range cols {
			r[c.Name] = norm(vals[i])
		}
		out = append(out, r)
	}
	must(rows.Err())
	return out
}

func one(q Q, sql string, args ...any) Rec {
	if r := all(q, sql, args...); len(r) > 0 {
		return r[0]
	}
	return nil
}

func exec(q Q, sql string, args ...any) int64 {
	return must1(q.Exec(bg, sql, args...)).RowsAffected()
}

// scalar int64 dari kolom `s` (SUM/COUNT sudah di-cast bigint di SQL).
func sum(q Q, sql string, args ...any) int64 { return one(q, sql, args...)["s"].(int64) }

func openDB(url string) *pgxpool.Pool {
	cfg := must1(pgxpool.ParseConfig(url))
	cfg.MaxConns = 10
	return must1(pgxpool.NewWithConfig(bg, cfg))
}

// Migrasi hanya ditambah: prefix nomor file urut, tiap file jalan sekali dalam satu transaksi.
func migrate(p *pgxpool.Pool) {
	conn := must1(p.Acquire(bg))
	defer conn.Release()
	must1(conn.Exec(bg, "SELECT pg_advisory_lock(727001)")) // cegah dua instance migrasi bareng
	defer conn.Exec(bg, "SELECT pg_advisory_unlock(727001)")
	must1(conn.Exec(bg, "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"))
	files := must1(migrationsFS.ReadDir("migrations"))
	names := []string{}
	for _, f := range files {
		names = append(names, f.Name())
	}
	sort.Strings(names)
	for _, n := range names {
		var done bool
		must(conn.QueryRow(bg, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version=$1)", n).Scan(&done))
		if done {
			continue
		}
		sqlText := must1(migrationsFS.ReadFile("migrations/" + n))
		tx := must1(conn.Begin(bg))
		if _, err := tx.Exec(bg, string(sqlText)); err != nil {
			tx.Rollback(bg)
			panic(fmt.Errorf("migrasi %s gagal: %w", n, err))
		}
		must1(tx.Exec(bg, "INSERT INTO schema_migrations(version) VALUES($1)", n))
		must(tx.Commit(bg))
		fmt.Println("migrasi diterapkan:", n)
	}
}
