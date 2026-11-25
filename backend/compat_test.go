package main

import "testing"

// Hash lama dari versi Node (scryptSync default) harus tetap valid di Go.
func TestScryptCompat(t *testing.T) {
	_, h := hashPw("pw-123", "abc")
	eq(t, h, "3812737d3ba9a556af8ccd15dd3b7136f466b8720df730dc80ca88e516754a52d0e997992685cc7d1f89d07676cb86abc7b3ae682540d35f73d2f16a0f27033e")
}
