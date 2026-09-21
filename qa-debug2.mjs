export default async function run(page, ui) {
  const r = {};
  await page.reload();
  await page.waitForTimeout(500);

  // Is the script variable actually defined on the page?
  r.validUserDefined = await page.evaluate(() => typeof VALID_USERNAME !== 'undefined');
  r.unlockDefined = await page.evaluate(() => typeof unlockPage !== 'undefined');
  r.listenerFired = false;

  // Attach our own probe to see if submit bubbles at all
  await page.evaluate(() => {
    window.__probe = { submit: 0, click: 0 };
    document.getElementById('login-form').addEventListener('submit', () => { window.__probe.submit++; });
    document.querySelector('#login-form button[type=submit]').addEventListener('click', () => { window.__probe.click++; });
  });

  await page.fill('#login-username', 'liaa');
  await page.fill('#login-password', '071008');

  // Click via the DOM directly instead of a mouse click
  await page.evaluate(() => document.querySelector('#login-form button[type=submit]').click());
  await page.waitForTimeout(500);

  r.probe = await page.evaluate(() => window.__probe);
  r.gateClass = await page.evaluate(() => document.getElementById('login-gate').className);
  r.mainClass = await page.evaluate(() => document.getElementById('main-content').className);
  r.mainDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('main-content')).display);
  r.gateDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('login-gate')).display);

  return r;
}
