package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"golang.org/x/term"
)

// Skrip admin: docker exec -it catetkos-prod /app/catetkos set-password <user>.

func ask(q string, hidden bool) string {
	fmt.Print(q)
	if hidden && term.IsTerminal(int(os.Stdin.Fd())) {
		b := must1(term.ReadPassword(int(os.Stdin.Fd())))
		fmt.Println()
		return strings.TrimSpace(string(b))
	}
	s, _ := bufio.NewReader(os.Stdin).ReadString('\n')
	return strings.TrimSpace(s)
}

func die(m string) { fmt.Fprintln(os.Stderr, m); os.Exit(1) }

func runCLI(cmd string, args []string) {
	switch cmd {
	case "seed-admin":
		u := strings.TrimSpace(env("ADMIN_USERNAME", ""))
		if u == "" && len(args) > 0 {
			u = args[0]
		}
		p := os.Getenv("ADMIN_PASSWORD")
		tty := term.IsTerminal(int(os.Stdin.Fd()))
		if u == "" {
			u = "admin"
			if tty {
				if a := ask("Username admin [admin]: ", false); a != "" {
					u = a
				}
			}
		}
		if p == "" {
			if p = ask("Password admin: ", tty); p == "" {
				die("Password tidak boleh kosong.")
			}
			if len(p) < 8 {
				die("Password minimal 8 karakter.")
			}
			if tty && p != ask("Ulangi password: ", true) {
				die("Password tidak sama.")
			}
		}
		ex := one(db, "SELECT id FROM users WHERE username=$1", u)
		var id int64
		if ex != nil {
			fmt.Printf("User %s sudah ada, skip.\n", u)
			id = ex["id"].(int64)
		} else {
			id = createUser(u, p)
			fmt.Printf("Admin %s dibuat.\n", u)
		}
		if len(myKos(id)) == 0 { // akun tanpa kos = nggak bisa ngapa-ngapain; kasih satu
			first := one(db, "SELECT k.id, (SELECT COUNT(*) FROM memberships m WHERE m.kos_id=k.id) AS n FROM kos k ORDER BY k.id LIMIT 1")
			if first != nil && first["n"].(int64) == 0 {
				addMember(first["id"].(int64), u) // kos #1 yatim (instalasi baru)
			} else {
				createKos(env("KOS_NAME", "Kos saya"), id)
			}
		}
	case "set-password":
		if len(args) == 0 || !term.IsTerminal(int(os.Stdin.Fd())) {
			die("Usage (interaktif): catetkos set-password <username>")
		}
		pw := ask("Password baru: ", true)
		if len(pw) < 8 {
			die("Minimal 8 karakter.")
		}
		if ask("Ulangi password: ", true) != pw {
			die("Tidak sama.")
		}
		if u := one(db, "SELECT id FROM users WHERE username=$1", args[0]); u != nil {
			setPassword(u["id"].(int64), pw)
			fmt.Printf("Password %s diganti. Semua sesi dicabut.\n", args[0])
		} else {
			createUser(args[0], pw)
			fmt.Printf("User %s dibuat.\n", args[0])
		}
	case "seed-test":
		// Akun uji many-to-many: tester1 -> Kos Melati + Kos Mawar, tester2 -> Kos Mawar saja. Idempotent.
		pw := os.Getenv("TEST_PASSWORD")
		if pw == "" {
			die("TEST_PASSWORD wajib diisi")
		}
		kosID := func(name string) int64 {
			if k := one(db, "SELECT id FROM kos WHERE name=$1 ORDER BY id LIMIT 1", name); k != nil {
				return k["id"].(int64)
			}
			return createKos(name, 0)
		}
		user := func(n string) {
			if one(db, "SELECT 1 AS x FROM users WHERE username=$1", n) == nil {
				createUser(n, pw)
			}
		}
		join := func(kos int64, n string) {
			u := one(db, "SELECT id FROM users WHERE username=$1", n)
			if !isMember(u["id"].(int64), kos) {
				addMember(kos, n)
			}
		}
		user("tester1")
		user("tester2")
		melati, mawar := kosID("Kos Melati"), kosID("Kos Mawar")
		join(melati, "tester1")
		join(mawar, "tester1")
		join(mawar, "tester2")
		fmt.Println("Akun uji siap: tester1 (Melati+Mawar), tester2 (Mawar)")
	case "seed":
		// Data contoh dari seed/example/seed.json (hapus data bisnis lama kos target, akun dipertahankan).
		file := "seed/example/seed.json"
		if len(args) > 0 {
			file = args[0]
		}
		var s struct {
			RoomTypes    []Rec `json:"room_types"`
			Rooms        []Rec `json:"rooms"`
			Promos       []Rec `json:"promos"`
			Bookings     []Rec `json:"bookings"`
			Transactions []Rec `json:"transactions"`
		}
		must(json.Unmarshal(must1(os.ReadFile(file)), &s))
		k := i64(os.Getenv("KOS_ID"))
		if k == 0 {
			if f := one(db, "SELECT id FROM kos ORDER BY id LIMIT 1"); f != nil {
				k = f["id"].(int64)
			}
		}
		if k == 0 {
			die("Belum ada kos. Jalankan seed-admin dulu.")
		}
		for _, t := range []string{"transactions", "bookings", "guests", "promos", "rooms", "room_types"} {
			exec(db, "DELETE FROM "+t+" WHERE kos_id=$1", k)
		}
		typeID := func(n any) any {
			if n == nil {
				return nil
			}
			return one(db, "SELECT id FROM room_types WHERE kos_id=$1 AND name=$2", k, n)["id"]
		}
		for _, t := range s.RoomTypes {
			create(k, "room-types", t)
		}
		for _, r := range s.Rooms {
			create(k, "rooms", Rec{"number": r["number"], "room_type_id": typeID(r["type"]), "price_override": r["price_override"]})
		}
		for _, p := range s.Promos {
			p["room_type_id"] = typeID(p["type"])
			create(k, "promos", p)
		}
		for _, b := range s.Bookings {
			room := one(db, "SELECT id FROM rooms WHERE kos_id=$1 AND number=$2", k, b["room"])["id"]
			bid := create(k, "bookings", Rec{"room_id": room, "guest_name": b["guest"], "check_in": b["check_in"], "check_out": b["check_out"], "status": b["status"]})["id"].(int64)
			if p := b["paid"]; p != nil && p != false {
				amount := p
				if p == true {
					amount = one(db, "SELECT price_total FROM bookings WHERE id=$1", bid)["price_total"]
				}
				date := b["paid_at"]
				if date == nil {
					date = b["check_in"]
				}
				create(k, "transactions", Rec{"booking_id": bid, "date": date, "amount": amount})
			}
		}
		for _, t := range s.Transactions {
			cat := one(db, "SELECT id FROM categories WHERE kos_id=$1 AND kind=$2 AND name=$3", k, t["kind"], t["category"])["id"]
			create(k, "transactions", Rec{"category_id": cat, "date": t["date"], "amount": t["amount"], "note": t["note"]})
		}
		fmt.Printf("Seed selesai: %d kamar, %d booking.\n", len(s.Rooms), len(s.Bookings))
	}
}
