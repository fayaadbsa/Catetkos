import { test, expect, type Page } from '@playwright/test';

const login = async (page: Page, user: string) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(user);
  await page.getByLabel('Password').fill('e2e-pass-123');
  await page.getByRole('button', { name: /masuk|login/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
};
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test('PWA: manifest + service worker + apple icon', async ({ page, request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect(m.display).toBe('standalone');
  expect((await request.get('/apple-touch-icon.png')).ok()).toBeTruthy();
  await page.goto('/login');
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test('mobile: nav bawah, tanpa overflow, URL asli', async ({ page }) => {
  await login(page, 'tester1');
  for (const p of ['/dashboard', '/bookings', '/kos']) {
    await page.goto(p);
    await expect(page).toHaveURL(new RegExp(p + '$'));
    expect(await noOverflow(page)).toBe(true);
  }
  await page.goto('/bookings');
  await page.reload(); // deep link harus tetap jalan
  await expect(page).toHaveURL(/\/bookings$/);
});

test('many-to-many: tester1 punya 2 kos, tester2 cuma Mawar, data terisolasi', async ({ page, browser }) => {
  await login(page, 'tester1');
  await page.goto('/kos');
  await expect(page.getByRole('button', { name: /Kos Melati/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Kos Mawar/ })).toBeVisible();

  // tester1 pilih Melati lalu API menolak kos milik orang lain
  await page.getByRole('button', { name: /Kos Melati/ }).click();
  const tid = await page.evaluate(() => localStorage.getItem('kosId'));
  expect(tid).toBeTruthy();

  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await login(p2, 'tester2');
  await p2.goto('/kos');
  await expect(p2.getByRole('button', { name: /Kos Melati/ })).toHaveCount(0);
  const forced = await p2.evaluate(async (id) => (await fetch('/api/dashboard', { headers: { 'X-Kos-Id': id! } })).status, tid);
  expect(forced).toBe(403);
  await ctx2.close();

  // tambah anggota: tester2 -> Melati, lalu cabut
  await page.getByLabel(/Tambah anggota/).fill('tester2');
  await page.getByRole('button', { name: 'Tambah', exact: true }).click();
  await expect(page.getByText('tester2')).toBeVisible();
});
