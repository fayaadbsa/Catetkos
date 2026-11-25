package main

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// ponytail: error = panic(*HttpError) / panic(err), ditangkap di batas handler (api) dan transaksi (guard), mirip throw di versi TS.
// Upgrade: return error eksplisit kalau logika bisnis tumbuh dan butuh kontrol alur per langkah.
type HttpError struct {
	Status int
	Msg    string
}

func (e *HttpError) Error() string { return e.Msg }

func bad(m string)      { panic(&HttpError{400, m}) }
func conflict(m string) { panic(&HttpError{409, m}) }

func must(err error) {
	if err != nil {
		panic(err)
	}
}
func must1[T any](v T, err error) T {
	must(err)
	return v
}

var dateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

const dateFmt = "2006-01-02"

func validDate(s string) bool {
	if !dateRe.MatchString(s) {
		return false
	}
	t, err := time.Parse(dateFmt, s)
	return err == nil && t.Format(dateFmt) == s
}

func parseDate(s string) time.Time { return must1(time.Parse(dateFmt, s)) }

func diffDays(a, b string) int {
	return int(math.Round(parseDate(b).Sub(parseDate(a)).Hours() / 24))
}

func addDays(s string, n int) string { return parseDate(s).AddDate(0, 0, n).Format(dateFmt) }

// 31 Jan + 1 bulan = 28 Feb (clamp akhir bulan).
func addMonths(s string, n int) string {
	t := parseDate(s)
	y, m, d := t.Date()
	first := time.Date(y, m, 1, 0, 0, 0, 0, time.UTC).AddDate(0, n, 0)
	dim := first.AddDate(0, 1, -1).Day()
	return time.Date(first.Year(), first.Month(), min(d, dim), 0, 0, 0, 0, time.UTC).Format(dateFmt)
}

// Rp 1.000.000 (pemisah titik, seperti toLocaleString('id-ID')).
func rp(n int64) string {
	s := strconv.FormatInt(abs64(n), 10)
	for i := len(s) - 3; i > 0; i -= 3 {
		s = s[:i] + "." + s[i:]
	}
	if n < 0 {
		s = "-" + s
	}
	return "Rp " + s
}

func abs64(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}

// ---- konversi longgar dari JSON (mirip perilaku Number()/String()/truthy di JS) ----

func toStr(v any) string {
	switch x := v.(type) {
	case nil:
		return ""
	case string:
		return x
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	case int64:
		return strconv.FormatInt(x, 10)
	case bool:
		return strconv.FormatBool(x)
	}
	return fmt.Sprint(v)
}

func toNum(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, !math.IsNaN(x) && !math.IsInf(x, 0)
	case int64:
		return float64(x), true
	case int32:
		return float64(x), true
	case int:
		return float64(x), true
	case string:
		f, err := strconv.ParseFloat(strings.TrimSpace(x), 64)
		return f, err == nil && !math.IsNaN(f) && !math.IsInf(f, 0)
	}
	return 0, false
}

func toInt(v any) (int64, bool) {
	f, ok := toNum(v)
	if !ok || f != math.Trunc(f) || math.Abs(f) > 1<<53 {
		return 0, false
	}
	return int64(f), true
}

func truthy(v any) bool {
	switch x := v.(type) {
	case nil:
		return false
	case bool:
		return x
	case string:
		return x != ""
	case float64:
		return x != 0
	case int64:
		return x != 0
	}
	return true
}

func i64(v any) int64 {
	n, _ := toInt(v)
	return n
}

// Math.round ala JS (setengah ke atas).
func jsRound(f float64) int64 { return int64(math.Floor(f + 0.5)) }
