#!/usr/bin/env python3
"""Satu kali jalan: salin data SQLite lama ke Postgres (id dipertahankan, sequence disetel ulang).
Usage: sqlite-to-pg.py <file.db> | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
Sesi lama (tabel sessions) sengaja tidak dibawa: token lama bukan JWT, user login ulang."""
import sqlite3, sys
c = sqlite3.connect(sys.argv[1])
T = ["users", "kos", "memberships", "room_types", "rooms", "promos", "guests", "bookings", "categories", "transactions"]
def lit(v):
    if v is None: return "NULL"
    if isinstance(v, int): return str(v)
    return "'" + str(v).replace("'", "''") + "'"
print("BEGIN;")
for t in T:
    cols = [r[1] for r in c.execute(f"pragma table_info({t})")]
    for row in c.execute(f"select {','.join(cols)} from {t} order by 1"):
        print(f"INSERT INTO {t}({','.join(cols)}) OVERRIDING SYSTEM VALUE VALUES({','.join(map(lit,row))});")
    if "id" in cols:
        print(f"SELECT setval(pg_get_serial_sequence('{t}','id'), COALESCE((SELECT MAX(id) FROM {t}),0)+1, false);")
print("COMMIT;")
