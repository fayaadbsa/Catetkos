// Kalkulator promo: promo worth kalau kamar kosong lama dan harga promo masih nutup biaya variabel.
// normal, promo: harga per malam. varPerNight: biaya variabel per malam (listrik, bersih, dll).
// emptyNights: ekspektasi malam kosong kalau harga normal (dari riwayat).
export function promoCheck({ normal, promo, varPerNight = 0, emptyNights = 0 }) {
  const margin = promo - varPerNight;
  const discount = normal ? Math.round((1 - promo / normal) * 100) : 0;
  // break-even: berapa malam promo harus terjual biar sama dengan omzet normal dari malam kosong
  const lostPerNight = normal - promo;
  const breakEvenNights = lostPerNight > 0 ? Math.ceil((emptyNights * normal) / promo) : 0;
  return {
    discount,
    margin,
    worth: margin > 0 && emptyNights >= 3 && promo < normal,
    breakEvenNights,
    verdict: margin <= 0 ? 'Rugi. Harga promo nggak nutup biaya variabel.'
      : emptyNights < 3 ? 'Jangan promo dulu. Kosong belum lama.'
      : 'Promo masuk akal. Cek lagi tiap minggu.',
  };
}
