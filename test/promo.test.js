import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promoCheck } from '../src/lib/promo.js';

test('promo rugi kalau nggak nutup biaya variabel', () => {
  assert.equal(promoCheck({ normal: 500000, promo: 300000, varPerNight: 350000, emptyNights: 10 }).worth, false);
});
test('promo worth kalau kosong >= 3 malam dan margin positif', () => {
  assert.equal(promoCheck({ normal: 500000, promo: 350000, varPerNight: 50000, emptyNights: 5 }).worth, true);
});
