package main

import (
	"fmt"
	"math"
	"time"
)

// Port dari src/lib/dashboard.ts. Semua angka dari DB. Window 30 hari konsisten untuk okupansi,
// omzet tipe, promo, dan biaya per kategori. days = lebar window (7-365), typeID = filter tipe kamar.
func dashboard(kos int64, today string, days, typeID int64) Rec {
	if today == "" {
		today = time.Now().UTC().Format(dateFmt)
	}
	win := int64(30)
	if days != 0 {
		win = min(365, max(7, days))
	}
	wStart := addDays(today, int(-win+1))
	wEnd := addDays(today, 1) // exclusive

	roomSQL := "SELECT r.id, r.number, t.name AS type FROM rooms r JOIN room_types t ON t.id=r.room_type_id WHERE r.archived=0 AND r.kos_id=$1"
	roomArgs := []any{kos}
	if typeID != 0 {
		roomSQL += " AND r.room_type_id=$2"
		roomArgs = append(roomArgs, typeID)
	}
	rooms := all(db, roomSQL+" ORDER BY r.number", roomArgs...)
	activeIDs := map[int64]bool{}
	for _, r := range rooms {
		activeIDs[r["id"].(int64)] = true
	}
	bookings := []Rec{}
	for _, b := range all(db, "SELECT b.*, t.name AS type FROM bookings b JOIN rooms r ON r.id=b.room_id JOIN room_types t ON t.id=r.room_type_id WHERE b.status!='cancelled' AND b.kos_id=$1", kos) {
		if activeIDs[b["room_id"].(int64)] || typeID == 0 {
			bookings = append(bookings, b)
		}
	}

	// okupansi: malam terisi di window / (kamar aktif * hari). check_out eksklusif.
	occNights := 0
	for _, b := range bookings {
		if !activeIDs[b["room_id"].(int64)] {
			continue
		}
		s, e := b["check_in"].(string), b["check_out"].(string)
		if s < wStart {
			s = wStart
		}
		if e > wEnd {
			e = wEnd
		}
		if e > s {
			occNights += diffDays(s, e)
		}
	}
	occupancy := int64(0)
	if len(rooms) > 0 {
		occupancy = jsRound(float64(occNights) / float64(int64(len(rooms))*win) * 100)
	}

	byType := map[string]Rec{}
	promoSplit := Rec{"promo": int64(0), "normal": int64(0)}
	for _, b := range bookings {
		ci, co := b["check_in"].(string), b["check_out"].(string)
		if !(ci >= wStart && ci < wEnd) {
			continue
		}
		ty := b["type"].(string)
		if byType[ty] == nil {
			byType[ty] = Rec{"revenue": int64(0), "nights": int64(0)}
		}
		byType[ty]["revenue"] = byType[ty]["revenue"].(int64) + b["price_total"].(int64)
		byType[ty]["nights"] = byType[ty]["nights"].(int64) + int64(diffDays(ci, co))
		k := "normal"
		if b["promo_id"] != nil {
			k = "promo"
		}
		promoSplit[k] = promoSplit[k].(int64) + b["price_total"].(int64)
	}

	emptyRooms := []Rec{}
	for _, r := range rooms {
		occupied := false
		var last string
		var next string
		for _, b := range bookings {
			if b["room_id"] != r["id"] {
				continue
			}
			ci, co := b["check_in"].(string), b["check_out"].(string)
			if ci <= today && co > today {
				occupied = true
			}
			if co <= today && co > last {
				last = co
			}
			if ci > today && (next == "" || ci < next) {
				next = ci
			}
		}
		var upcoming, emptyDays any
		if next != "" {
			upcoming = next
		}
		if occupied {
			emptyDays = int64(0)
		} else if last != "" {
			emptyDays = int64(diffDays(last, today))
		}
		emptyRooms = append(emptyRooms, Rec{"id": r["id"], "number": r["number"], "type": r["type"], "occupied": occupied, "upcoming": upcoming, "emptyDays": emptyDays})
	}

	// arus kas NM bulan: income, expense (operasional), capital (investasi). net = income - expense.
	nm := int(min(12, max(6, int64(math.Ceil(float64(win)/30)))))
	first := parseDate(today[:7] + "-01")
	months := []string{}
	for i := nm - 1; i >= 0; i-- {
		months = append(months, first.AddDate(0, -i, 0).Format(dateFmt)[:7])
	}
	cf := all(db, "SELECT substr(t.date,1,7) AS m, c.kind AS k, SUM(t.amount)::bigint AS s FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=$1 AND t.date>=$2 GROUP BY 1, 2", kos, months[0]+"-01")
	get := func(m, k string) int64 {
		for _, r := range cf {
			if r["m"] == m && r["k"] == k {
				return r["s"].(int64)
			}
		}
		return 0
	}
	cashflow := []Rec{}
	for _, m := range months {
		cashflow = append(cashflow, Rec{"month": m, "income": get(m, "income"), "expense": get(m, "expense"), "capital": get(m, "capital"), "net": get(m, "income") - get(m, "expense")})
	}

	total := func(k string) int64 {
		return sum(db, "SELECT COALESCE(SUM(t.amount),0)::bigint AS s FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=$1 AND c.kind=$2", kos, k)
	}
	capitalTotal := total("capital")
	cumNet := total("income") - total("expense")
	recent := 0.0
	for _, m := range cashflow[len(cashflow)-3:] {
		recent += float64(m["net"].(int64))
	}
	recent /= 3
	var pct, monthsLeft any
	if capitalTotal != 0 {
		pct = max(0, jsRound(float64(cumNet)/float64(capitalTotal)*100))
	}
	if capitalTotal > cumNet && recent > 0 {
		monthsLeft = int64(math.Ceil(float64(capitalTotal-cumNet) / recent))
	}
	payback := Rec{"capitalTotal": capitalTotal, "cumNet": cumNet, "pct": pct, "monthsLeft": monthsLeft, "done": capitalTotal > 0 && cumNet >= capitalTotal}

	// piutang: booking aktif yang belum lunas
	var recvTotal, recvCount, overdue int64
	for _, b := range all(db, `SELECT b.id, b.check_in, b.price_total - COALESCE((SELECT SUM(amount) FROM transactions t WHERE t.booking_id=b.id),0)::bigint AS due
		FROM bookings b WHERE b.status!='cancelled' AND b.kos_id=$1`, kos) {
		if due := b["due"].(int64); due > 0 {
			recvTotal += due
			recvCount++
			if b["check_in"].(string) <= today {
				overdue++
			}
		}
	}
	receivable := Rec{"total": recvTotal, "count": recvCount, "overdue": overdue}

	depositHeld := sum(db, "SELECT COALESCE(SUM(deposit),0)::bigint AS s FROM bookings WHERE kos_id=$1 AND deposit_paid_date IS NOT NULL AND deposit_returned_date IS NULL", kos)

	expenseByCat := all(db, "SELECT c.name, SUM(t.amount)::bigint AS value FROM transactions t JOIN categories c ON c.id=t.category_id WHERE t.kos_id=$1 AND c.kind='expense' AND t.date>=$2 AND t.date<$3 GROUP BY c.id, c.name ORDER BY value DESC", kos, wStart, wEnd)

	insights := []Rec{}
	for _, r := range emptyRooms {
		if r["occupied"] == true {
			continue
		}
		if u, ok := r["upcoming"].(string); ok && diffDays(today, u) <= 3 {
			continue
		}
		switch ed := r["emptyDays"].(type) {
		case nil:
			insights = append(insights, Rec{"level": "info", "text": fmt.Sprintf("Kamar %v (%v) belum pernah disewa.", r["number"], r["type"])})
		case int64:
			if ed >= 3 {
				insights = append(insights, Rec{"level": "warn", "text": fmt.Sprintf("Kamar %v (%v) kosong %d hari. Pertimbangkan promo.", r["number"], r["type"], ed)})
			}
		}
	}
	if len(rooms) > 0 && occupancy < 50 {
		insights = append(insights, Rec{"level": "warn", "text": fmt.Sprintf("Okupansi %d hari cuma %d%%. Cek harga dan promo.", win, occupancy)})
	}
	if overdue > 0 {
		insights = append([]Rec{{"level": "urgent", "text": fmt.Sprintf("%d booking belum lunas padahal sudah masuk. Tagih.", overdue)}}, insights...)
	}
	if promoSplit["promo"].(int64) > 0 && promoSplit["promo"].(int64) > promoSplit["normal"].(int64) {
		insights = append(insights, Rec{"level": "warn", "text": fmt.Sprintf("Mayoritas omzet %d hari datang dari promo. Pastikan margin masih aman.", win)})
	}
	if len(insights) == 0 {
		insights = append(insights, Rec{"level": "ok", "text": "Aman. Belum ada sinyal bahaya."})
	}

	return Rec{
		"today": today, "occupancy": occupancy, "windowDays": win, "months": int64(nm), "roomCount": int64(len(rooms)),
		"byType": byType, "promoSplit": promoSplit, "emptyRooms": emptyRooms, "cashflow": cashflow,
		"expenseByCat": expenseByCat, "payback": payback, "receivable": receivable, "depositHeld": depositHeld, "insights": insights,
	}
}
