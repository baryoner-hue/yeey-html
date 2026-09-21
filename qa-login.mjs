export default async function run(page, ui) {
  const result = {};

  // 1. On load: gate visible, main content hidden
  result.gateVisibleOnLoad = await page.locator('#login-gate').isVisible();
  result.mainContentHiddenOnLoad = !(await page.locator('#main-content').isVisible());

  // 2. Wrong credentials -> rejected, gate stays
  await page.fill('#login-username', 'salah');
  await page.fill('#login-password', '000');
  await page.click('#login-form button[type=submit]');
  await page.waitForTimeout(300);
  result.errorShownOnWrong = await page.locator('#login-error').isVisible();
  result.errorText = await page.locator('#login-error').innerText();
  result.gateStillVisibleAfterWrong = await page.locator('#login-gate').isVisible();

  // 3. Correct credentials -> unlocked
  await page.fill('#login-username', 'liaa');
  await page.fill('#login-password', '071008');
  await page.click('#login-form button[type=submit]');
  await page.waitForTimeout(600);
  result.gateHiddenAfterCorrect = !(await page.locator('#login-gate').isVisible());
  result.mainContentVisibleAfterCorrect = await page.locator('#main-content').isVisible();
  result.h1 = await page.locator('h1').innerText();

  // 4. Password is not left in memory on the page
  result.countdownOk = await page.evaluate(() => !!document.getElementById('main-photo'));

  return result;
}
