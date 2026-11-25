package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
)

// Server API saja (JSON di bawah /api). Frontend Vite dilayani terpisah dan memanggil /api lewat reverse proxy.

const (
	sessionCookie = "session"
	kosCookie     = "kos"
)

var secureCookie = os.Getenv("COOKIE_SECURE") == "1"

type ctx struct {
	w http.ResponseWriter
	r *http.Request
}

func (c ctx) cookie(name string) string {
	if k, err := c.r.Cookie(name); err == nil {
		return k.Value
	}
	return ""
}

func (c ctx) setCookie(name, val string, ttl time.Duration) {
	http.SetCookie(c.w, &http.Cookie{Name: name, Value: val, Path: "/", HttpOnly: true, Secure: secureCookie, SameSite: http.SameSiteLaxMode, MaxAge: int(ttl.Seconds())})
}
func (c ctx) clearCookie(name string) {
	http.SetCookie(c.w, &http.Cookie{Name: name, Value: "", Path: "/", HttpOnly: true, Secure: secureCookie, SameSite: http.SameSiteLaxMode, MaxAge: -1})
}

func (c ctx) body() Rec {
	b := must1(io.ReadAll(io.LimitReader(c.r.Body, 1<<20)))
	out := Rec{}
	if len(strings.TrimSpace(string(b))) == 0 {
		return out
	}
	if err := json.Unmarshal(b, &out); err != nil {
		panic(&HttpError{400, "JSON tidak valid"})
	}
	return out
}

func (c ctx) user() Rec {
	u := currentUser(c.cookie(sessionCookie))
	if u == nil {
		panic(&HttpError{401, "Belum login"})
	}
	return u
}

// Kos aktif = preferensi dari cookie, tapi cuma dipakai kalau user anggotanya (dicek ke DB di SETIAP request).
func (c ctx) withKos() (user Rec, kos int64) {
	user = c.user()
	pref, _ := strconv.ParseInt(c.cookie(kosCookie), 10, 64)
	_, active := resolveKos(user["id"].(int64), pref)
	if active == nil {
		panic(&HttpError{403, "Pilih kos dulu"})
	}
	return user, active["id"].(int64)
}

func (c ctx) pathID(name string) int64 {
	n, err := strconv.ParseInt(c.r.PathValue(name), 10, 64)
	if err != nil || n < 1 {
		panic(&HttpError{404, "Not found"})
	}
	return n
}

func (c ctx) query() map[string]string {
	q := map[string]string{}
	for k, v := range c.r.URL.Query() {
		q[k] = v[0]
	}
	return q
}

func (c ctx) json(status int, v any) {
	c.w.Header().Set("Content-Type", "application/json; charset=utf-8")
	c.w.Header().Set("Cache-Control", "no-store")
	c.w.WriteHeader(status)
	json.NewEncoder(c.w).Encode(v)
}

// Bungkus handler: HttpError jadi JSON {error}, panic lain 500. out nil = nggak ada body (handler sudah nulis sendiri).
func api(status int, fn func(c ctx) any) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c := ctx{w, r}
		defer func() {
			if rec := recover(); rec != nil {
				if he, ok := rec.(*HttpError); ok {
					c.json(he.Status, Rec{"error": he.Msg})
					return
				}
				log.Printf("ERROR %s %s: %v", r.Method, r.URL.Path, rec)
				c.json(500, Rec{"error": "Server error"})
			}
		}()
		c.json(status, fn(c))
	}
}

// ponytail: rate limit login in-memory per IP (reset saat restart). IP = entri terakhir X-Forwarded-For (ditambah proxy terdekat). Upgrade: store persisten kalau jalan >1 instance.
var (
	failsMu sync.Mutex
	fails   = map[string]struct {
		n     int
		until time.Time
	}{}
)

func clientIP(r *http.Request) string {
	if x := r.Header.Get("X-Forwarded-For"); x != "" {
		p := strings.Split(x, ",")
		return strings.TrimSpace(p[len(p)-1])
	}
	if x := r.Header.Get("X-Real-IP"); x != "" {
		return x
	}
	return "local"
}

func router() *http.ServeMux {
	m := http.NewServeMux()
	h := func(pattern string, status int, fn func(c ctx) any) { m.HandleFunc(pattern, api(status, fn)) }
	known := func(c ctx) string {
		n := c.r.PathValue("resource")
		if !isResource(n) {
			panic(&HttpError{404, "Not found"})
		}
		return n
	}

	h("GET /api/status", 200, func(ctx) any { return Rec{"ok": true} })

	h("POST /api/auth/login", 200, func(c ctx) any {
		ip := clientIP(c.r)
		failsMu.Lock()
		f, seen := fails[ip]
		failsMu.Unlock()
		if seen && f.n >= 5 && time.Now().Before(f.until) {
			panic(&HttpError{429, "Kebanyakan percobaan. Coba lagi sebentar."})
		}
		b := c.body()
		u := verify(toStr(b["username"]), toStr(b["password"]))
		failsMu.Lock()
		defer failsMu.Unlock()
		if u == nil {
			n := 1
			if seen && time.Now().Before(f.until) {
				n = f.n + 1
			}
			fails[ip] = struct {
				n     int
				until time.Time
			}{n, time.Now().Add(time.Minute)}
			panic(&HttpError{401, "Login gagal"})
		}
		delete(fails, ip)
		c.setCookie(sessionCookie, signSession(u["id"].(int64), fingerprint(u["hash"].(string))), sessionTTL)
		return Rec{"username": u["username"]}
	})
	h("POST /api/auth/logout", 200, func(c ctx) any {
		c.clearCookie(sessionCookie)
		c.clearCookie(kosCookie)
		return Rec{"ok": true}
	})
	h("POST /api/auth/password", 200, func(c ctx) any {
		u := c.user()
		b := c.body()
		if !truthy(b["oldPassword"]) || !truthy(b["newPassword"]) {
			bad("Isi password lama dan baru")
		}
		if !changePassword(u["id"].(int64), toStr(b["oldPassword"]), toStr(b["newPassword"])) {
			bad("Password lama salah")
		}
		c.clearCookie(sessionCookie)
		c.clearCookie(kosCookie)
		return Rec{"ok": true}
	})
	// Profil user login (dulu dioper dari server component). Frontend SPA memanggil ini saat start.
	h("GET /api/me", 200, func(c ctx) any {
		u := c.user()
		pref, _ := strconv.ParseInt(c.cookie(kosCookie), 10, 64)
		list, active := resolveKos(u["id"].(int64), pref)
		return Rec{"me": u, "kos": list, "active": active}
	})

	h("GET /api/kos", 200, func(c ctx) any { return myKos(c.user()["id"].(int64)) })
	h("POST /api/kos", 201, func(c ctx) any {
		u := c.user()
		name := strings.TrimSpace(toStr(c.body()["name"]))
		if name == "" {
			bad("Nama kos wajib diisi")
		}
		id := createKos(name, u["id"].(int64))
		c.setCookie(kosCookie, strconv.FormatInt(id, 10), 365*24*time.Hour)
		return Rec{"id": id}
	})
	h("POST /api/kos/active", 200, func(c ctx) any {
		u := c.user()
		id, _ := toInt(c.body()["id"])
		if id == 0 || !isMember(u["id"].(int64), id) {
			panic(&HttpError{404, "Kos tidak ditemukan"})
		}
		c.setCookie(kosCookie, strconv.FormatInt(id, 10), 365*24*time.Hour)
		return Rec{"id": id}
	})
	memberGuard := func(c ctx) int64 {
		u := c.user()
		kid := c.pathID("id")
		if !isMember(u["id"].(int64), kid) {
			panic(&HttpError{404, "Kos tidak ditemukan"})
		}
		return kid
	}
	h("GET /api/kos/{id}/members", 200, func(c ctx) any { return members(memberGuard(c)) })
	h("POST /api/kos/{id}/members", 200, func(c ctx) any {
		kid := memberGuard(c)
		if !addMember(kid, strings.TrimSpace(toStr(c.body()["username"]))) {
			panic(&HttpError{404, "Username tidak ditemukan"})
		}
		return members(kid)
	})
	h("DELETE /api/kos/{id}/members/{userId}", 200, func(c ctx) any {
		kid := memberGuard(c)
		if !removeMember(kid, c.pathID("userId")) {
			bad("Kos harus punya minimal satu anggota")
		}
		return members(kid)
	})

	h("GET /api/dashboard", 200, func(c ctx) any {
		_, kos := c.withKos()
		q := c.query()
		var days int64
		if f, err := strconv.ParseFloat(q["days"], 64); err == nil {
			days = jsRound(f)
		}
		typeID, _ := strconv.ParseInt(q["type"], 10, 64)
		return dashboard(kos, "", days, typeID)
	})
	h("GET /api/quote", 200, func(c ctx) any {
		_, kos := c.withKos()
		q := c.r.URL.Query()
		room, _ := strconv.ParseInt(q.Get("room_id"), 10, 64)
		var months any
		if q.Has("months") {
			months = q.Get("months")
		}
		return quoteMonths(kos, room, q.Get("check_in"), months)
	})
	h("POST /api/bookings/batch", 201, func(c ctx) any {
		_, kos := c.withKos()
		return createBatch(kos, c.body())
	})
	h("POST /api/bookings/{id}/pay", 200, func(c ctx) any {
		_, kos := c.withKos()
		return payBooking(kos, c.pathID("id"), c.body())
	})

	h("GET /api/{resource}", 200, func(c ctx) any {
		_, kos := c.withKos()
		return list(kos, known(c), c.query())
	})
	h("POST /api/{resource}", 201, func(c ctx) any {
		_, kos := c.withKos()
		return create(kos, known(c), c.body())
	})
	h("PUT /api/{resource}/{id}", 200, func(c ctx) any {
		_, kos := c.withKos()
		return update(kos, known(c), c.pathID("id"), c.body())
	})
	h("DELETE /api/{resource}/{id}", 200, func(c ctx) any {
		_, kos := c.withKos()
		return remove(kos, known(c), c.pathID("id"))
	})
	h("/api/", 404, func(ctx) any { return Rec{"error": "Not found"} })
	return m
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func setup() {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		log.Fatal("DATABASE_URL wajib diisi (postgres://user:pass@host:5432/db)")
	}
	secret := os.Getenv("SESSION_SECRET")
	if len(secret) < 32 {
		log.Fatal("SESSION_SECRET wajib diisi, minimal 32 karakter (openssl rand -hex 32)")
	}
	jwtKey = []byte(secret)
	db = openDB(url)
	migrate(db)
}

func serve() {
	setup()
	srv := &http.Server{Addr: ":" + env("PORT", "8080"), Handler: router(), ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 30 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 120 * time.Second}
	go func() {
		s := make(chan os.Signal, 1)
		signal.Notify(s, syscall.SIGINT, syscall.SIGTERM)
		<-s
		srv.Close()
	}()
	log.Printf("catetkos api di %s", srv.Addr)
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

func main() {
	cmd := "serve"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}
	switch cmd {
	case "serve":
		serve()
	case "migrate":
		setup()
	case "seed-admin", "set-password", "seed-test", "seed":
		setup()
		runCLI(cmd, os.Args[2:])
	default:
		fmt.Fprintln(os.Stderr, "usage: catetkos [serve|migrate|seed-admin|set-password <user>|seed-test|seed [file]]")
		os.Exit(2)
	}
}
