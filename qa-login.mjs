export default async function run(page, ui) {
  const r = {};

  r.gateVisibleOnLoad = await page.locator('#login-gate').isVisible();
  r.mainHiddenOnLoad = !(await page.locator('#main-content').isVisible());

  // Wrong credentials must be rejected
  await page.fill('#login-username', 'salah');
  await page.fill('#login-password', '000');
  await page.click('#login-form button[type=submit]');
  await page.waitForTimeout(300);
  r.errorShownOnWrong = await page.locator('#login-error').isVisible();
  r.gateStillVisibleAfterWrong = await page.locator('#login-gate').isVisible();

  // Correct credentials must unlock
  await page.fill('#login-username', 'liaa');
  await page.fill('#login-password', '071008');
  await page.click('#login-form button[type=submit]');
  await page.waitForTimeout(600);
  r.gateHiddenAfterCorrect = !(await page.locator('#login-gate').isVisible());
  r.mainVisibleAfterCorrect = await page.locator('#main-content').isVisible();
  r.page1Active = await page.locator('#page-1').evaluate((el) => el.classList.contains('is-active'));
  r.h1 = (await page.locator('h1').innerText()).trim();

  return r;
}
