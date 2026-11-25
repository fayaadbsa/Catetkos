package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Test jalan di database sementara di Postgres lokal (bukan DB produksi).
// Admin URL: TEST_ADMIN_URL, default socket lokal user saat ini.

func adminURL() string {
	if u := os.Getenv("TEST_ADMIN_URL"); u != "" {
		return u
	}
	return "postgres:///postgres?host=/var/run/postgresql"
}

func withURLDB(base, name string) string {
	u := must1(url.Parse(base))
	u.Path = "/" + name
	return u.String()
}

func TestMain(m *testing.M) {
	jwtKey = []byte("test-secret-test-secret-test-secret-123")
	admin := must1(pgxpool.New(bg, adminURL()))
	name := fmt.Sprintf("catetkos_test_%d", time.Now().UnixNano())
	must1(admin.Exec(bg, "CREATE DATABASE "+name))
	db = openDB(withURLDB(adminURL(), name))
	migrate(db)
	code := m.Run()
	db.Close()
	admin.Exec(context.Background(), "DROP DATABASE "+name+" WITH (FORCE)")
	admin.Close()
	os.Exit(code)
}

func wantErr(t *testing.T, status int, fn func()) {
	t.Helper()
	defer func() {
		t.Helper()
		r := recover()
		he, ok := r.(*HttpError)
		if !ok {
			t.Fatalf("mau HttpError %d, dapat %v", status, r)
		}
		if he.Status != status {
			t.Fatalf("mau status %d, dapat %d (%s)", status, he.Status, he.Msg)
		}
	}()
	fn()
	t.Fatalf("mau error %d, tapi sukses", status)
}

func eq[T comparable](t *testing.T, got, want T) {
	t.Helper()
	if got != want {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func find(kos, id int64) Rec {
	for _, b := range list(kos, "bookings", nil) {
		if b["id"] == id {
			return b
		}
	}
	return nil
}

func cat(kos int64, kind, name string) int64 {
	return one(db, "SELECT id FROM categories WHERE kos_id=$1 AND kind=$2 AND name=$3", kos, kind, name)["id"].(int64)
}

func q(kos, room int64, d string) Quote { return quote(db, kos, room, d) }

// ---- fixture bersama (urutan test penting, sama seperti suite lama) ----
var (
	K, t1, r1, r2, b1 int64
)

func TestA_Setup(t *testing.T) {
	K = createKos("Kos Test", 0)
	t1 = create(K, "room-types", Rec{"name": "Superior", "base_price": 1000000.0})["id"].(int64)
	r1 = create(K, "rooms", Rec{"number": "01", "room_type_id": t1})["id"].(int64)
	r2 = create(K, "rooms", Rec{"number": "02", "room_type_id": t1, "price_override": 900000.0})["id"].(int64)
	create(K, "promos", Rec{"name": "P", "room_type_id": t1, "price": 800000.0, "start_date": "2026-11-01", "end_date": "2026-11-30"})
}

func TestB_Quote(t *testing.T) {
	eq(t, q(K, r1, "2026-11-02").Total, 800000)
	eq(t, q(K, r1, "2026-12-02").Total, 1000000)
	eq(t, q(K, r1, "2027-01-02").Total, 1000000)
	eq(t, q(K, r2, "2026-12-02").Total, 900000)
}

func TestC_Validasi(t *testing.T) {
	wantErr(t, 400, func() { q(K, r1, "2026-02-30") })
	wantErr(t, 400, func() { create(K, "rooms", Rec{"number": "9", "room_type_id": 999.0}) })
	wantErr(t, 400, func() { create(K, "room-types", Rec{"base_price": 1.0}) })
	wantErr(t, 400, func() {
		create(K, "promos", Rec{"name": "x", "price": 1.0, "start_date": "2026-02-30", "end_date": "2026-03-01"})
	})
}

func TestD_UniqueRestrict(t *testing.T) {
	wantErr(t, 409, func() { create(K, "rooms", Rec{"number": "01", "room_type_id": t1}) })
	wantErr(t, 409, func() { remove(K, "room-types", t1) })
	wantErr(t, 404, func() { remove(K, "rooms", 12345) })
}

func TestE_BookingHargaPromo(t *testing.T) {
	b1 = create(K, "bookings", Rec{"room_id": r1, "guest_name": "Tamu A", "check_in": "2026-11-02", "check_out": "2026-11-07"})["id"].(int64)
	b := find(K, b1)
	eq(t, b["price_total"].(int64), 800000)
	if b["promo_id"] == nil {
		t.Fatal("promo_id harus terisi")
	}
	eq(t, b["guest_name"].(string), "Tamu A")
}

func TestF_Overlap(t *testing.T) {
	wantErr(t, 409, func() {
		create(K, "bookings", Rec{"room_id": r1, "guest_name": "X", "check_in": "2026-11-06", "check_out": "2026-11-08"})
	})
	create(K, "bookings", Rec{"room_id": r1, "guest_name": "Y", "check_in": "2026-11-07", "check_out": "2026-11-08"})
	update(K, "bookings", b1, Rec{"status": "cancelled"})
	create(K, "bookings", Rec{"room_id": r1, "guest_name": "Z", "check_in": "2026-11-03", "check_out": "2026-11-05"})
	update(K, "bookings", b1, Rec{"status": "booked", "check_in": "2026-11-20", "check_out": "2026-11-22"})
}

func TestG_Pembayaran(t *testing.T) {
	create(K, "transactions", Rec{"booking_id": b1, "date": "2026-11-20", "amount": 500000.0})
	wantErr(t, 400, func() { create(K, "transactions", Rec{"booking_id": b1, "date": "2026-11-20", "amount": 999999999.0}) })
	wantErr(t, 409, func() { remove(K, "bookings", b1) })
	wantErr(t, 400, func() { update(K, "bookings", b1, Rec{"price_total": 10.0}) })
}

func TestH_UpdateParsial(t *testing.T) {
	update(K, "bookings", b1, Rec{"note": "hi"})
	eq(t, find(K, b1)["check_in"].(string), "2026-11-20")
}

func TestI_Dashboard(t *testing.T) {
	create(K, "transactions", Rec{"category_id": cat(K, "capital", "Bangunan"), "date": "2026-01-01", "amount": 10000000.0})
	create(K, "transactions", Rec{"category_id": cat(K, "expense", "Listrik"), "date": "2026-11-05", "amount": 300000.0})
	d := dashboard(K, "2026-11-21", 0, 0)
	var nov Rec
	for _, m := range d["cashflow"].([]Rec) {
		if m["month"] == "2026-11" {
			nov = m
		}
	}
	eq(t, nov["income"].(int64), 500000)
	eq(t, nov["expense"].(int64), 300000)
	pb := d["payback"].(Rec)
	eq(t, pb["capitalTotal"].(int64), 10000000)
	eq(t, pb["cumNet"].(int64), 200000)
	if d["receivable"].(Rec)["total"].(int64) <= 0 {
		t.Fatal("piutang harus > 0")
	}
}

func TestJ_NullDefault(t *testing.T) {
	id := create(K, "room-types", Rec{"name": "Null-safe", "base_price": 500000.0, "capacity": nil, "archived": nil})["id"].(int64)
	for _, r := range list(K, "room-types", nil) {
		if r["id"] == id {
			eq(t, r["archived"].(int64), 0)
			eq(t, r["capacity"].(int64), 1)
			return
		}
	}
	t.Fatal("tipe nggak ketemu")
}

func TestK_AddMonths(t *testing.T) {
	eq(t, addMonths("2026-01-31", 1), "2026-02-28")
	eq(t, addMonths("2026-11-15", 2), "2027-01-15")
	eq(t, addMonths("2028-01-31", 1), "2028-02-29")
}

var r3 int64

func TestL_Batch(t *testing.T) {
	t2 := create(K, "room-types", Rec{"name": "Batch", "base_price": 1200000.0})["id"].(int64)
	r3 = create(K, "rooms", Rec{"number": "B1", "room_type_id": t2})["id"].(int64)
	res := createBatch(K, Rec{"room_id": r3, "guest_name": "Sewa Panjang", "check_in": "2027-03-31", "months": 3.0, "deposit": 300000.0, "deposit_paid_date": "2027-03-30", "paid_date": "2027-03-30"})
	ids := res["ids"].([]int64)
	want := [][2]string{{"2027-03-31", "2027-04-30"}, {"2027-04-30", "2027-05-31"}, {"2027-05-31", "2027-06-30"}}
	dep := []int64{300000, 0, 0}
	paid := []int64{1200000, 0, 0}
	guests := map[any]bool{}
	for i, id := range ids {
		b := find(K, id)
		eq(t, [2]string{b["check_in"].(string), b["check_out"].(string)}, want[i])
		eq(t, b["price_total"].(int64), 1200000)
		eq(t, b["deposit"].(int64), dep[i])
		eq(t, b["paid"].(int64), paid[i])
		guests[b["guest_id"]] = true
	}
	eq(t, len(guests), 1)
}

func TestM_BatchRollback(t *testing.T) {
	before, g := len(list(K, "bookings", nil)), len(list(K, "guests", nil))
	wantErr(t, 409, func() {
		createBatch(K, Rec{"room_id": r3, "guest_name": "Ghost", "check_in": "2027-02-28", "months": 3.0})
	})
	eq(t, len(list(K, "bookings", nil)), before)
	eq(t, len(list(K, "guests", nil)), g)
}

func TestN_DefaultSebulanLunas(t *testing.T) {
	id := create(K, "bookings", Rec{"room_id": r3, "guest_name": "Satu Bulan", "check_in": "2027-07-10"})["id"].(int64)
	eq(t, find(K, id)["check_out"].(string), "2027-08-10")
	payBooking(K, id, Rec{"date": "2027-07-09"})
	b := find(K, id)
	eq(t, b["paid"].(int64), 1200000)
	eq(t, b["paid_date"].(string), "2027-07-09")
	payBooking(K, id, Rec{"date": "2027-07-09"}) // idempotent
	eq(t, find(K, id)["paid"].(int64), 1200000)
	payBooking(K, id, Rec{"paid": false})
	eq(t, find(K, id)["paid"].(int64), 0)
}

func TestO_Deposit(t *testing.T) {
	id := create(K, "bookings", Rec{"room_id": r3, "guest_name": "Dep", "check_in": "2030-01-01", "deposit": 300000.0})["id"].(int64)
	wantErr(t, 400, func() { update(K, "bookings", id, Rec{"deposit_returned_date": "2030-02-01"}) })
	update(K, "bookings", id, Rec{"deposit_paid_date": "2029-12-31"})
	eq(t, find(K, id)["status"].(string), "booked")
	if dashboard(K, "2026-11-21", 0, 0)["depositHeld"].(int64) < 300000 {
		t.Fatal("deposit held harus >= 300000")
	}
	update(K, "bookings", id, Rec{"status": "cancelled"})
	eq(t, find(K, id)["status"].(string), "cancelled")
}

var K2 int64

func TestP_MultiKos(t *testing.T) {
	K2 = createKos("Kos Dua", 0)
	ty := create(K2, "room-types", Rec{"name": "Superior", "base_price": 700000.0})["id"].(int64)
	rm := create(K2, "rooms", Rec{"number": "01", "room_type_id": ty})["id"].(int64)
	eq(t, len(list(K2, "rooms", nil)), 1)
	for _, r := range list(K, "rooms", nil) {
		if r["id"] == rm {
			t.Fatal("room kos 2 bocor ke kos 1")
		}
	}
	wantErr(t, 404, func() { update(K, "rooms", rm, Rec{"number": "X"}) })
	wantErr(t, 404, func() { remove(K, "rooms", rm) })
	wantErr(t, 400, func() { create(K, "rooms", Rec{"number": "Z", "room_type_id": ty}) })
	wantErr(t, 400, func() { q(K, rm, "2026-11-02") })
	eq(t, q(K2, rm, "2026-11-02").Total, 700000)
	eq(t, len(list(K2, "categories", nil)), 13)
	eq(t, dashboard(K2, "2026-11-21", 0, 0)["roomCount"].(int64), 1)
	eq(t, dashboard(K2, "2026-11-21", 0, 0)["payback"].(Rec)["capitalTotal"].(int64), 0)
}

func TestQ_Membership(t *testing.T) {
	a, b := createUser("amel", "passw0rd!"), createUser("budi", "passw0rd!")
	addMember(K, "amel")
	addMember(K2, "amel")
	addMember(K2, "budi")
	eq(t, len(myKos(a)), 2)
	eq(t, len(myKos(b)), 1)
	eq(t, isMember(b, K), false)
	eq(t, isMember(b, K2), true)
	eq(t, addMember(K, "nobody"), false)
	eq(t, len(members(K2)), 2)
	_, act := resolveKos(b, K)
	eq(t, act["id"].(int64), K2) // cookie kos orang lain nggak dipercaya
	_, act = resolveKos(a, K2)
	eq(t, act["id"].(int64), K2)
	l, _ := resolveKos(a, 0)
	eq(t, len(l), 2)
	eq(t, removeMember(K2, b), true)
	eq(t, removeMember(K, a), false) // anggota terakhir ditahan
}

func TestR_Password(t *testing.T) {
	if verify("amel", "passw0rd!") == nil {
		t.Fatal("login benar harus lolos")
	}
	if verify("amel", "salah") != nil || verify("tidak-ada", "x") != nil {
		t.Fatal("login salah harus ditolak")
	}
	id := verify("amel", "passw0rd!")["id"].(int64)
	eq(t, changePassword(id, "salah", "baru-12345"), false)
	eq(t, changePassword(id, "passw0rd!", "baru-12345"), true)
	if verify("amel", "passw0rd!") != nil || verify("amel", "baru-12345") == nil {
		t.Fatal("password lama harus mati, baru hidup")
	}
}

func TestS_DashboardFilter(t *testing.T) {
	all := dashboard(K, "2026-11-21", 90, 0)
	eq(t, all["windowDays"].(int64), 90)
	one := dashboard(K, "2026-11-21", 0, t1)
	if one["roomCount"].(int64) > all["roomCount"].(int64) {
		t.Fatal("filter tipe nggak boleh nambah kamar")
	}
	eq(t, dashboard(K, "2026-11-21", 99999, 0)["windowDays"].(int64), 365)
}

func TestT_QuoteMonths(t *testing.T) {
	r := quoteMonths(K, r1, "2026-11-15", 3.0)
	items := r["items"].([]QuoteItem)
	eq(t, items[0].Total, 800000)
	eq(t, items[1].Total, 1000000)
	eq(t, items[2].Total, 1000000)
	eq(t, r["total"].(int64), 2800000)
}

func TestU_BigMoney(t *testing.T) {
	// Rupiah > 2^31 harus muat (kolom BIGINT), bukan overflow.
	id := create(K, "transactions", Rec{"category_id": cat(K, "capital", "Bangunan"), "date": "2026-02-01", "amount": 5000000000.0})["id"].(int64)
	eq(t, one(db, "SELECT amount FROM transactions WHERE id=$1", id)["amount"].(int64), 5000000000)
	wantErr(t, 400, func() {
		create(K, "room-types", Rec{"name": "Overflow", "base_price": 1e30, "capacity": 5000000000.0})
	})
}

func TestV_Concurrent(t *testing.T) {
	// dua request booking kamar & tanggal sama bersamaan: tepat satu menang (advisory lock per kos).
	done := make(chan int, 2)
	for i := 0; i < 2; i++ {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					done <- r.(*HttpError).Status
				}
			}()
			create(K, "bookings", Rec{"room_id": r2, "guest_name": fmt.Sprint("C", i), "check_in": "2031-05-01", "check_out": "2031-05-10"})
			done <- 201
		}()
	}
	a, b := <-done, <-done
	if !((a == 201 && b == 409) || (a == 409 && b == 201)) {
		t.Fatalf("mau satu 201 satu 409, dapat %d,%d", a, b)
	}
}

// ---- lapisan HTTP ----

func TestW_HTTP(t *testing.T) {
	createUser("web", "web-pass-123")
	addMember(createKos("Kos Web", 0), "web")
	srv := httptest.NewServer(router())
	defer srv.Close()
	jar := &cookieJar{}
	do := func(method, path, body string) (int, string) {
		req, _ := http.NewRequest(method, srv.URL+path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		for _, c := range jar.cs {
			req.AddCookie(c)
		}
		res := must1(http.DefaultClient.Do(req))
		defer res.Body.Close()
		jar.set(res.Cookies())
		b := make([]byte, 1<<20)
		n, _ := res.Body.Read(b)
		return res.StatusCode, string(b[:n])
	}
	if c, _ := do("GET", "/api/status", ""); c != 200 {
		t.Fatal("status", c)
	}
	if c, _ := do("GET", "/api/rooms", ""); c != 401 {
		t.Fatal("tanpa login harus 401, dapat", c)
	}
	if c, _ := do("POST", "/api/auth/login", `{"username":"web","password":"salah"}`); c != 401 {
		t.Fatal("login salah harus 401, dapat", c)
	}
	if c, _ := do("POST", "/api/auth/login", `{"username":"web","password":"web-pass-123"}`); c != 200 {
		t.Fatal("login benar harus 200, dapat", c)
	}
	if c, b := do("GET", "/api/me", ""); c != 200 || !strings.Contains(b, `"username":"web"`) {
		t.Fatal("me", c, b)
	}
	if c, _ := do("POST", "/api/room-types", `{"name":"T","base_price":100000}`); c != 201 {
		t.Fatal("create type", c)
	}
	if c, b := do("GET", "/api/room-types", ""); c != 200 || !strings.Contains(b, `"name":"T"`) {
		t.Fatal("list type", c, b)
	}
	if c, _ := do("POST", "/api/room-types", `{bukan json`); c != 400 {
		t.Fatal("json rusak harus 400, dapat", c)
	}
	if c, _ := do("GET", "/api/nope", ""); c != 404 {
		t.Fatal("resource asing harus 404, dapat", c)
	}
	if c, _ := do("GET", "/api/kos/999999/members", ""); c != 404 {
		t.Fatal("kos orang lain harus 404, dapat", c)
	}
	// token lama mati setelah ganti password
	old := append([]*http.Cookie(nil), jar.cs...)
	if c, _ := do("POST", "/api/auth/password", `{"oldPassword":"web-pass-123","newPassword":"web-pass-456"}`); c != 200 {
		t.Fatal("ganti password", c)
	}
	jar.cs = old
	if c, _ := do("GET", "/api/me", ""); c != 401 {
		t.Fatal("sesi lama harus mati, dapat", c)
	}
}

type cookieJar struct{ cs []*http.Cookie }

func (j *cookieJar) set(cs []*http.Cookie) {
	for _, n := range cs {
		kept := j.cs[:0:0]
		for _, o := range j.cs {
			if o.Name != n.Name {
				kept = append(kept, o)
			}
		}
		j.cs = kept
		if n.MaxAge >= 0 && n.Value != "" {
			j.cs = append(j.cs, n)
		}
	}
}
