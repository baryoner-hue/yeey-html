export default async function run(page, ui) {
  const r = {};

  // Capture page errors so a thrown exception becomes visible
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));

  await page.reload();
  await page.waitForTimeout(500);

  // Does the element exist and is the form wired up?
  r.formExists = await page.locator('#login-form').count();
  r.submitBtnExists = await page.locator('#login-form button[type=submit]').count();

  // Fill and submit, then read state directly from the DOM
  await page.fill('#login-username', 'liaa');
  await page.fill('#login-password', '071008');
  await page.click('#login-form button[type=submit]');
  await page.waitForTimeout(800);

  r.gateClasses = await page.locator('#login-gate').getAttribute('class');
  r.mainClasses = await page.locator('#main-content').getAttribute('class');
  r.errorClasses = await page.locator('#login-error').getAttribute('class');
  r.errorText = await page.locator('#login-error').innerText();
  r.pageErrors = errs;

  return r;
}
