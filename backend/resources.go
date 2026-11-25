package main

import (
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Layer data: definisi entity, validasi, aturan bisnis. Tanpa HTTP, jadi gampang dites.
// Port 1:1 dari src/lib/resources.ts versi Next.js; SQL tetap mentah (placeholder $n).

type F struct {
	K, T, L string
	Req     bool
	Min     *int64
	Max     *int64
	Def     any // nil = tanpa default
	Of      []string
	Table   string
}

type Def struct {
	Table, Scope, InUse string
	Fields              []F
	List                string
	Pre                 func(tx Q, b Rec, kos int64)
	Check               func(tx Q, v Rec, id int64, cur Rec) // id 0 = baru
	Post                func([]Rec) []Rec
	Filter              func(q map[string]string) (string, []any)
	Order               string
}

func ptr(n int64) *int64 { return &n }

func fText(k, l string, req bool) F { return F{K: k, T: "text", L: l, Req: req} }
func fInt(k, l string, req bool, min *int64, def any) F {
	return F{K: k, T: "int", L: l, Req: req, Min: min, Def: def}
}
func fDate(k, l string, req bool) F { return F{K: k, T: "date", L: l, Req: req} }
func fRef(k, l, table string, req bool) F {
	return F{K: k, T: "ref", L: l, Req: req, Table: table}
}
func fBool(k, l string) F { return F{K: k, T: "bool", L: l, Def: int64(0)} }

// Harga per BULAN: promo aktif pada tanggal masuk (per tipe atau semua tipe) else harga kamar.
type Quote struct {
	Rate       int64 `json:"rate"`
	NormalRate int64 `json:"normal_rate"`
	PromoID    any   `json:"promo_id"`
	PromoName  any   `json:"promo_name"`
	Total      int64 `json:"total"`
}

func quote(q Q, kos, roomID int64, checkIn string) Quote {
	if !validDate(checkIn) {
		bad("Tanggal tidak valid")
	}
	room := one(q, `SELECT r.id, r.room_type_id, COALESCE(r.price_override, t.base_price)::bigint AS price
		FROM rooms r JOIN room_types t ON t.id=r.room_type_id WHERE r.id=$1 AND r.kos_id=$2`, roomID, kos)
	if room == nil {
		bad("Kamar tidak ditemukan")
	}
	promo := one(q, `SELECT id, name, price FROM promos
		WHERE kos_id=$1 AND (room_type_id IS NULL OR room_type_id=$2) AND $3 BETWEEN start_date AND end_date
		ORDER BY price LIMIT 1`, kos, room["room_type_id"], checkIn)
	rate := room["price"].(int64)
	out := Quote{NormalRate: rate}
	if promo != nil {
		rate = promo["price"].(int64)
		out.PromoID, out.PromoName = promo["id"], promo["name"]
	}
	out.Rate, out.Total = rate, rate
	return out
}

func monthCount(m any) int {
	n := int64(1)
	if m != nil {
		v, ok := toInt(m)
		if !ok {
			bad("Durasi harus 1-12 bulan")
		}
		n = v
	}
	if n < 1 || n > 12 {
		bad("Durasi harus 1-12 bulan")
	}
	return int(n)
}

type QuoteItem struct {
	CheckIn  string `json:"check_in"`
	CheckOut string `json:"check_out"`
	Quote
}

// Rincian N bulan berurutan dari tgl masuk. Tiap bulan dinilai promonya sendiri.
func quoteMonths(kos, roomID int64, checkIn string, months any) Rec {
	n := monthCount(months)
	if !validDate(checkIn) {
		bad("Tanggal tidak valid")
	}
	items := []QuoteItem{}
	var total int64
	for i := 0; i < n; i++ {
		qt := quote(db, kos, roomID, addMonths(checkIn, i))
		items = append(items, QuoteItem{addMonths(checkIn, i), addMonths(checkIn, i+1), qt})
		total += qt.Total
	}
	return Rec{"items": items, "total": total}
}

func paidOf(q Q, bookingID int64, exceptTx int64) int64 {
	var ex any
	if exceptTx != 0 {
		ex = exceptTx
	}
	return sum(q, "SELECT COALESCE(SUM(amount),0)::bigint AS s FROM transactions WHERE booking_id=$1 AND id IS DISTINCT FROM $2", bookingID, ex)
}

var R = map[string]*Def{
	"room-types": {
		Table: "room_types", Scope: "t.kos_id", InUse: "Tipe masih dipakai kamar. Arsipkan saja.",
		Fields: []F{
			fText("name", "Nama tipe", true),
			fInt("base_price", "Harga dasar", true, ptr(0), nil),
			{K: "capacity", T: "int", L: "Kapasitas", Min: ptr(1), Max: ptr(1000), Def: int64(1)},
			fBool("archived", "Arsip"),
		},
		List: "SELECT t.*, (SELECT COUNT(*) FROM rooms r WHERE r.room_type_id=t.id AND r.archived=0) AS room_count FROM room_types t ORDER BY t.name",
	},
	"rooms": {
		Table: "rooms", Scope: "r.kos_id", InUse: "Kamar punya booking. Arsipkan saja.",
		Fields: []F{
			fText("number", "No kamar", true),
			fRef("room_type_id", "Tipe", "room_types", true),
			fInt("price_override", "Harga khusus", false, ptr(0), nil),
			fBool("archived", "Arsip"),
		},
		List: "SELECT r.*, t.name AS type_name, COALESCE(r.price_override, t.base_price)::bigint AS price FROM rooms r JOIN room_types t ON t.id=r.room_type_id ORDER BY r.number",
	},
	"promos": {
		Table: "promos", Scope: "p.kos_id",
		Fields: []F{
			fText("name", "Nama promo", true),
			fRef("room_type_id", "Tipe", "room_types", false),
			fInt("price", "Harga promo", true, ptr(0), nil),
			fDate("start_date", "Mulai", true),
			fDate("end_date", "Sampai", true),
		},
		Check: func(_ Q, v Rec, _ int64, _ Rec) {
			if v["end_date"].(string) < v["start_date"].(string) {
				bad("Tanggal akhir sebelum tanggal mulai")
			}
		},
		List: "SELECT p.*, t.name AS type_name FROM promos p LEFT JOIN room_types t ON t.id=p.room_type_id ORDER BY p.start_date DESC",
	},
	"guests": {
		Table: "guests", Scope: "g.kos_id", InUse: "Tamu punya booking.",
		Fields: []F{fText("name", "Nama", true), fText("phone", "HP", false), fText("note", "Catatan", false)},
		List:   "SELECT g.*, (SELECT COUNT(*) FROM bookings b WHERE b.guest_id=g.id) AS booking_count FROM guests g ORDER BY g.name",
	},
	"categories": {
		Table: "categories", Scope: "c.kos_id", InUse: "Kategori sudah dipakai transaksi.",
		Fields: []F{
			{K: "kind", T: "enum", L: "Jenis", Req: true, Of: []string{"income", "expense", "capital"}},
			fText("name", "Nama", true),
		},
		List: "SELECT c.*, (SELECT COUNT(*) FROM transactions t WHERE t.category_id=c.id) AS uses FROM categories c ORDER BY c.kind, c.name",
	},
	"bookings": {
		Table: "bookings", Scope: "b.kos_id", InUse: "Booking punya pembayaran. Hapus pembayarannya dulu.",
		Fields: []F{
			fRef("room_id", "Kamar", "rooms", true),
			fRef("guest_id", "Tamu", "guests", true),
			fRef("promo_id", "Promo", "promos", false),
			fDate("check_in", "Check-in", true),
			fDate("check_out", "Check-out", true),
			fInt("price_total", "Total harga", false, ptr(0), nil),
			{K: "status", T: "enum", L: "Status", Of: []string{"booked", "checked_in", "checked_out", "cancelled"}, Def: "booked"},
			fText("note", "Catatan", false),
			fInt("deposit", "Deposit", false, ptr(0), int64(0)),
			fDate("deposit_paid_date", "Deposit diterima", false),
			fDate("deposit_returned_date", "Deposit dikembalikan", false),
		},
		// Tamu baru bisa diketik langsung (guest_name) tanpa buka halaman Tamu.
		Pre: func(tx Q, b Rec, kos int64) {
			if !truthy(b["check_out"]) && validDate(toStr(b["check_in"])) {
				b["check_out"] = addMonths(toStr(b["check_in"]), 1) // default sebulan
			}
			if name := strings.TrimSpace(toStr(b["guest_name"])); !truthy(b["guest_id"]) && name != "" {
				b["guest_id"] = one(tx, "INSERT INTO guests(name, kos_id) VALUES($1,$2) RETURNING id", name, kos)["id"]
			}
		},
		Check: func(tx Q, v Rec, id int64, cur Rec) {
			if v["check_out"].(string) <= v["check_in"].(string) {
				bad("Check-out harus setelah check-in")
			}
			room := one(tx, "SELECT archived FROM rooms WHERE id=$1", v["room_id"])
			if room["archived"].(int64) != 0 && id == 0 {
				bad("Kamar sudah diarsipkan")
			}
			if v["status"] != "cancelled" {
				var self any
				if id != 0 {
					self = id
				}
				if one(tx, "SELECT 1 AS x FROM bookings WHERE room_id=$1 AND status!='cancelled' AND id IS DISTINCT FROM $2 AND check_in<$3 AND check_out>$4",
					v["room_id"], self, v["check_out"], v["check_in"]) != nil {
					conflict("Kamar bentrok dengan booking lain di tanggal itu")
				}
			}
			if v["deposit_returned_date"] != nil && v["deposit_paid_date"] == nil {
				bad("Deposit belum diterima, nggak bisa dikembalikan")
			}
			qt := quote(tx, v["kos_id"].(int64), v["room_id"].(int64), v["check_in"].(string))
			if v["price_total"] == nil {
				v["price_total"] = qt.Total
				v["promo_id"] = qt.PromoID
			} else if cur == nil || v["price_total"] != cur["price_total"] || v["check_in"] != cur["check_in"] || v["room_id"] != cur["room_id"] {
				if v["price_total"] == any(qt.Total) {
					v["promo_id"] = qt.PromoID
				} else {
					v["promo_id"] = nil // harga manual = bukan promo
				}
			}
			if id != 0 && v["price_total"].(int64) < paidOf(tx, id, 0) {
				bad("Total harga lebih kecil dari yang sudah dibayar")
			}
		},
		// Status dihitung dari tanggal. Cuma 'cancelled' yang disimpan manual.
		Post: func(rows []Rec) []Rec {
			t := time.Now().UTC().Format(dateFmt)
			for _, b := range rows {
				if b["status"] == "cancelled" {
					continue
				}
				switch {
				case t < b["check_in"].(string):
					b["status"] = "booked"
				case t >= b["check_out"].(string):
					b["status"] = "checked_out"
				default:
					b["status"] = "checked_in"
				}
			}
			return rows
		},
		List: `SELECT b.*, r.number AS room_number, g.name AS guest_name, g.phone AS guest_phone,
			COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.booking_id=b.id),0)::bigint AS paid,
			(SELECT MAX(date) FROM transactions t WHERE t.booking_id=b.id) AS paid_date
			FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN guests g ON g.id=b.guest_id ORDER BY b.check_in DESC, b.id DESC`,
	},
	"transactions": {
		Table: "transactions", Scope: "t.kos_id",
		Fields: []F{
			fRef("category_id", "Kategori", "categories", true),
			fRef("booking_id", "Booking", "bookings", false),
			fRef("room_id", "Kamar", "rooms", false),
			fDate("date", "Tanggal", true),
			fInt("amount", "Nominal", true, ptr(1), nil),
			fText("method", "Metode", false),
			fText("note", "Catatan", false),
		},
		// Bayar booking tanpa kategori = otomatis "Sewa kamar".
		Pre: func(tx Q, b Rec, kos int64) {
			if truthy(b["booking_id"]) && !truthy(b["category_id"]) {
				if c := one(tx, "SELECT id FROM categories WHERE kos_id=$1 AND kind='income' AND name='Sewa kamar'", kos); c != nil {
					b["category_id"] = c["id"]
				}
			}
		},
		Check: func(tx Q, v Rec, id int64, _ Rec) {
			cat := one(tx, "SELECT kind FROM categories WHERE id=$1", v["category_id"])
			if v["booking_id"] == nil {
				return
			}
			if cat["kind"] != "income" {
				bad("Pembayaran booking harus kategori pemasukan")
			}
			b := one(tx, "SELECT price_total FROM bookings WHERE id=$1", v["booking_id"])
			left := b["price_total"].(int64) - paidOf(tx, v["booking_id"].(int64), id)
			if v["amount"].(int64) > left {
				bad("Melebihi tagihan booking. Sisa " + rp(left))
			}
		},
		List: `SELECT t.*, c.kind, c.name AS category, r.number AS room_number, g.name AS guest_name
			FROM transactions t JOIN categories c ON c.id=t.category_id LEFT JOIN rooms r ON r.id=t.room_id
			LEFT JOIN bookings b ON b.id=t.booking_id LEFT JOIN guests g ON g.id=b.guest_id`,
		Filter: func(q map[string]string) (string, []any) {
			switch q["kind"] {
			case "income", "expense", "capital":
				return " AND c.kind=$2", []any{q["kind"]}
			}
			return "", nil
		},
		Order: " ORDER BY t.date DESC, t.id DESC",
	},
}

func isResource(n string) bool { _, ok := R[n]; return ok }

func clean(tx Q, d *Def, kos int64, body, cur Rec) Rec {
	out := Rec{"kos_id": kos}
	for _, f := range d.Fields {
		v, has := body[f.K]
		if !has {
			if cv, ok := cur[f.K]; ok {
				v, has = cv, true
			} else {
				v = f.Def
			}
		}
		if s, ok := v.(string); ok && s == "" {
			v = nil
		}
		if v == nil && f.Def != nil {
			v = f.Def // field kosong/nggak dikirim = default (bool Arsip, kapasitas)
		}
		if v == nil {
			if f.Req {
				bad(f.L + " wajib diisi")
			}
			out[f.K] = nil
			continue
		}
		switch f.T {
		case "text":
			s := strings.TrimSpace(toStr(v))
			if s == "" && f.Req {
				bad(f.L + " wajib diisi")
			}
			if s == "" {
				out[f.K] = nil
			} else {
				out[f.K] = s
			}
		case "int":
			n, ok := toInt(v)
			min := int64(-1 << 62)
			if f.Min != nil {
				min = *f.Min
			}
			max := int64(1 << 53)
			if f.Max != nil {
				max = *f.Max
			}
			if !ok || n < min || n > max {
				msg := f.L + " harus angka bulat"
				if f.Min != nil {
					msg += " >= " + toStr(*f.Min)
				}
				bad(msg)
			}
			out[f.K] = n
		case "bool":
			if truthy(v) {
				out[f.K] = int64(1)
			} else {
				out[f.K] = int64(0)
			}
		case "date":
			if s := toStr(v); !validDate(s) {
				bad(f.L + " harus tanggal YYYY-MM-DD")
			} else {
				out[f.K] = s
			}
		case "enum":
			s, ok := v.(string)
			if !ok || !contains(f.Of, s) {
				bad(f.L + " harus salah satu: " + strings.Join(f.Of, ", "))
			}
			out[f.K] = s
		case "ref":
			n, ok := toInt(v)
			if !ok || one(tx, "SELECT 1 AS x FROM "+f.Table+" WHERE id=$1 AND kos_id=$2", n, kos) == nil {
				bad(f.L + " tidak ditemukan")
			}
			out[f.K] = n
		}
	}
	return out
}

func contains(a []string, s string) bool {
	for _, x := range a {
		if x == s {
			return true
		}
	}
	return false
}

// Satu transaksi DB per operasi tulis + terjemah error constraint Postgres ke pesan manusiawi.
// Tulis diserialkan per kos lewat advisory lock: cek bentrok/lunas aman dari race antar request.
func guard[T any](d *Def, kos int64, fn func(tx pgx.Tx) T) (out T) {
	tx := must1(db.Begin(bg))
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback(bg)
			panic(translate(r, d))
		}
	}()
	must1(tx.Exec(bg, "SELECT pg_advisory_xact_lock($1)", kos))
	out = fn(tx)
	must(tx.Commit(bg))
	return out
}

func translate(r any, d *Def) any {
	err, ok := r.(error)
	if !ok {
		return r
	}
	var pe *pgconn.PgError
	if errors.As(err, &pe) {
		switch pe.Code {
		case "23505":
			return &HttpError{409, "Data dengan nama/nomor itu sudah ada"}
		case "23503":
			m := d.InUse
			if m == "" {
				m = "Masih dipakai data lain"
			}
			return &HttpError{409, m}
		case "23514":
			return &HttpError{400, "Data tidak lolos validasi"}
		case "22003":
			return &HttpError{400, "Angka terlalu besar"}
		}
	}
	return err
}

func list(kos int64, name string, q map[string]string) []Rec {
	d := R[name]
	where, params := "", []any(nil)
	if d.Filter != nil {
		where, params = d.Filter(q)
	}
	base, ord, hasOrd := strings.Cut(d.List, " ORDER BY ")
	order := d.Order
	if hasOrd {
		order = " ORDER BY " + ord
	}
	rows := all(db, base+" WHERE "+d.Scope+"=$1"+where+order, append([]any{kos}, params...)...)
	if d.Post != nil {
		rows = d.Post(rows)
	}
	return rows
}

func insert(tx Q, d *Def, kos int64, body Rec) int64 {
	if d.Pre != nil {
		d.Pre(tx, body, kos)
	}
	v := clean(tx, d, kos, body, nil)
	if d.Check != nil {
		d.Check(tx, v, 0, nil)
	}
	cols, ph, args := []string{"kos_id"}, []string{"$1"}, []any{v["kos_id"]}
	for i, f := range d.Fields {
		cols = append(cols, f.K)
		ph = append(ph, "$"+toStr(int64(i+2)))
		args = append(args, v[f.K])
	}
	return one(tx, "INSERT INTO "+d.Table+"("+strings.Join(cols, ",")+") VALUES("+strings.Join(ph, ",")+") RETURNING id", args...)["id"].(int64)
}

func create(kos int64, name string, body Rec) Rec {
	d := R[name]
	return guard(d, kos, func(tx pgx.Tx) Rec { return Rec{"id": insert(tx, d, kos, body)} })
}

// Booking N bulan sekaligus = N baris (1 per bulan), atomik: satu bulan bentrok, semua batal.
// Deposit + status bayar cuma nempel di bulan pertama.
func createBatch(kos int64, body Rec) Rec {
	d := R["bookings"]
	return guard(d, kos, func(tx pgx.Tx) Rec {
		n := monthCount(body["months"])
		ci := toStr(body["check_in"])
		if !validDate(ci) {
			bad("Tgl masuk tidak valid")
		}
		d.Pre(tx, body, kos)
		ids := []int64{}
		for i := 0; i < n; i++ {
			first := i == 0
			row := Rec{
				"room_id": body["room_id"], "guest_id": body["guest_id"], "note": body["note"],
				"check_in": addMonths(ci, i), "check_out": addMonths(ci, i+1),
				"deposit": int64(0), "deposit_paid_date": nil,
			}
			if first {
				row["deposit"], row["deposit_paid_date"] = body["deposit"], body["deposit_paid_date"]
			}
			id := insert(tx, d, kos, row)
			if first && truthy(body["paid_date"]) {
				insert(tx, R["transactions"], kos, Rec{
					"booking_id": id, "date": body["paid_date"],
					"amount": one(tx, "SELECT price_total AS p FROM bookings WHERE id=$1", id)["p"],
				})
			}
			ids = append(ids, id)
		}
		return Rec{"ids": ids}
	})
}

// Tandai lunas = 1 transaksi senilai sisa tagihan (kategori Sewa kamar). paid:false = batalkan semua pembayaran booking itu.
func payBooking(kos, id int64, body Rec) Rec {
	return guard(R["bookings"], kos, func(tx pgx.Tx) Rec {
		b := one(tx, "SELECT price_total, status FROM bookings WHERE id=$1 AND kos_id=$2", id, kos)
		if b == nil {
			panic(&HttpError{404, "Data tidak ada"})
		}
		if body["paid"] == false {
			exec(tx, "DELETE FROM transactions WHERE booking_id=$1", id)
			return Rec{"ok": true}
		}
		if b["status"] == "cancelled" {
			bad("Booking sudah dibatalkan")
		}
		if due := b["price_total"].(int64) - paidOf(tx, id, 0); due > 0 {
			insert(tx, R["transactions"], kos, Rec{"booking_id": id, "date": body["date"], "amount": due})
		}
		return Rec{"ok": true}
	})
}

// Update = merge dengan baris lama, jadi field yang nggak dikirim nggak ketimpa NULL.
func update(kos int64, name string, id int64, body Rec) Rec {
	d := R[name]
	return guard(d, kos, func(tx pgx.Tx) Rec {
		cur := one(tx, "SELECT * FROM "+d.Table+" WHERE id=$1 AND kos_id=$2", id, kos)
		if cur == nil {
			panic(&HttpError{404, "Data tidak ada"})
		}
		if d.Pre != nil {
			d.Pre(tx, body, kos)
		}
		v := clean(tx, d, kos, body, cur)
		if d.Check != nil {
			d.Check(tx, v, id, cur)
		}
		sets, args := []string{"kos_id=$1"}, []any{v["kos_id"]}
		for i, f := range d.Fields {
			sets = append(sets, f.K+"=$"+toStr(int64(i+2)))
			args = append(args, v[f.K])
		}
		args = append(args, id)
		exec(tx, "UPDATE "+d.Table+" SET "+strings.Join(sets, ",")+" WHERE id=$"+toStr(int64(len(args))), args...)
		return Rec{"ok": true}
	})
}

func remove(kos int64, name string, id int64) Rec {
	d := R[name]
	return guard(d, kos, func(tx pgx.Tx) Rec {
		if exec(tx, "DELETE FROM "+d.Table+" WHERE id=$1 AND kos_id=$2", id, kos) == 0 {
			panic(&HttpError{404, "Data tidak ada"})
		}
		return Rec{"ok": true}
	})
}
