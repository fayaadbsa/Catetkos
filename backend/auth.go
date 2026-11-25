package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/scrypt"
)

// scrypt + salt per user, parameter bawaan Node (N=16384 r=8 p=1), jadi hash lama dari versi Next.js tetap valid.
func hashPw(pw, salt string) (string, string) {
	if salt == "" {
		b := make([]byte, 16)
		must1(rand.Read(b))
		salt = hex.EncodeToString(b)
	}
	return salt, hex.EncodeToString(must1(scrypt.Key([]byte(pw), []byte(salt), 16384, 8, 1, 64)))
}

func createUser(username, password string) int64 {
	salt, hash := hashPw(password, "")
	return one(db, "INSERT INTO users(username, hash, salt) VALUES($1,$2,$3) RETURNING id", username, hash, salt)["id"].(int64)
}

// verify: baris user kalau password benar, selain itu nil. Jalankan scrypt walau user nggak ada (anti timing user-enumeration).
func verify(username, password string) Rec {
	u := one(db, "SELECT id, username, hash, salt FROM users WHERE username=$1", username)
	if u == nil {
		hashPw(password, "0000000000000000")
		return nil
	}
	_, h := hashPw(password, u["salt"].(string))
	if subtle.ConstantTimeCompare([]byte(h), []byte(u["hash"].(string))) == 1 {
		return u
	}
	return nil
}

// Ganti hash = fingerprint berubah = semua sesi lama otomatis mati.
func setPassword(userID int64, password string) {
	salt, hash := hashPw(password, "")
	exec(db, "UPDATE users SET hash=$1, salt=$2 WHERE id=$3", hash, salt, userID)
}

func changePassword(userID int64, oldPw, newPw string) bool {
	u := one(db, "SELECT username FROM users WHERE id=$1", userID)
	if u == nil || verify(u["username"].(string), oldPw) == nil {
		return false
	}
	setPassword(userID, newPw)
	return true
}

// ---- sesi JWT (HS256, payload {uid, fp}, kompatibel dengan token versi Next.js/jose) ----

const sessionTTL = 7 * 24 * time.Hour

var jwtKey []byte

// fp = sidik jari hash password: ganti password otomatis mencabut semua sesi lama.
func fingerprint(hash string) string {
	h := sha256.Sum256([]byte(hash))
	return hex.EncodeToString(h[:])[:16]
}

func signSession(uid int64, fp string) string {
	now := time.Now()
	return must1(jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"uid": uid, "fp": fp, "iat": now.Unix(), "exp": now.Add(sessionTTL).Unix(),
	}).SignedString(jwtKey))
}

func readSession(token string) (uid int64, fp string, ok bool) {
	if token == "" {
		return
	}
	t, err := jwt.Parse(token, func(*jwt.Token) (any, error) { return jwtKey, nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
	if err != nil || !t.Valid {
		return
	}
	c := t.Claims.(jwt.MapClaims)
	u, ok1 := c["uid"].(float64)
	f, ok2 := c["fp"].(string)
	if !ok1 || !ok2 {
		return
	}
	return int64(u), f, true
}

// Pengguna dari cookie sesi, dicek ke DB tiap request (akun dihapus / password diganti = sesi mati).
func currentUser(token string) Rec {
	uid, fp, ok := readSession(token)
	if !ok {
		return nil
	}
	u := one(db, "SELECT id, username, hash FROM users WHERE id=$1", uid)
	if u == nil || fingerprint(u["hash"].(string)) != fp {
		return nil
	}
	return Rec{"id": u["id"], "username": u["username"]}
}

// ---- kos + membership ----

var defaultCats = [][2]string{
	{"income", "Sewa kamar"}, {"income", "Lainnya"},
	{"expense", "Listrik"}, {"expense", "Air"}, {"expense", "Internet"}, {"expense", "Kebersihan"},
	{"expense", "Perawatan"}, {"expense", "Gaji"}, {"expense", "Lainnya"},
	{"capital", "Bangunan"}, {"capital", "Furnitur"}, {"capital", "Elektronik"}, {"capital", "Lainnya"},
}

// Kos baru + kategori bawaan + pembuatnya langsung jadi anggota (userID 0 = buat skrip/seed).
func createKos(name string, userID int64) int64 {
	tx := must1(db.Begin(bg))
	defer tx.Rollback(bg)
	id := one(tx, "INSERT INTO kos(name) VALUES($1) RETURNING id", name)["id"].(int64)
	for _, c := range defaultCats {
		exec(tx, "INSERT INTO categories(kos_id, kind, name) VALUES($1,$2,$3)", id, c[0], c[1])
	}
	if userID != 0 {
		exec(tx, "INSERT INTO memberships(user_id, kos_id) VALUES($1,$2)", userID, id)
	}
	must(tx.Commit(bg))
	return id
}

func myKos(userID int64) []Rec {
	return all(db, "SELECT k.id, k.name FROM kos k JOIN memberships m ON m.kos_id=k.id WHERE m.user_id=$1 ORDER BY k.name", userID)
}

func isMember(userID, kosID int64) bool {
	return one(db, "SELECT 1 AS x FROM memberships WHERE user_id=$1 AND kos_id=$2", userID, kosID) != nil
}

func addMember(kosID int64, username string) bool {
	u := one(db, "SELECT id FROM users WHERE username=$1", username)
	if u == nil {
		return false
	}
	exec(db, "INSERT INTO memberships(user_id, kos_id) VALUES($1,$2) ON CONFLICT DO NOTHING", u["id"], kosID)
	return true
}

func members(kosID int64) []Rec {
	return all(db, "SELECT u.id, u.username FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.kos_id=$1 ORDER BY u.username", kosID)
}

func removeMember(kosID, userID int64) bool {
	if len(members(kosID)) <= 1 {
		return false // kos tanpa anggota = data yatim
	}
	exec(db, "DELETE FROM memberships WHERE kos_id=$1 AND user_id=$2", kosID, userID)
	return true
}

// Kos aktif = pilihan dari cookie kalau user anggotanya, kalau tidak kos pertama. Selalu dicek ke DB.
func resolveKos(userID, preferred int64) (list []Rec, active Rec) {
	list = myKos(userID)
	for _, k := range list {
		if k["id"] == preferred {
			return list, k
		}
	}
	if len(list) > 0 {
		active = list[0]
	}
	return list, active
}
