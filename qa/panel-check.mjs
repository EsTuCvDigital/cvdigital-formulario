/**
 * Verifica que el panel admin siga funcionando con el header x-panel-key.
 * No imprime la contraseña ni el secreto.
 *
 * Uso: node qa/panel-check.mjs
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const panel =
  process.env.PANEL_PATH || 'C:\\Users\\JACOB\\OneDrive\\Desktop\\administrador.html';

const html = readFileSync(panel, 'latin1');
const passwordMatch = html.match(/const ADMIN_PASSWORD\s*=\s*["']([^"']+)["']/);
if (!passwordMatch) {
  console.error('No encontré ADMIN_PASSWORD en el panel.');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const responses = [];
page.on('response', (response) => {
  if (response.url().includes('/rest/v1/clientes')) {
    responses.push({ status: response.status(), method: response.request().method() });
  }
});

await page.goto(`file:///${panel.replace(/\\/g, '/')}`);
await page.fill('#pass-input', passwordMatch[1]);
await page.click('.login-btn');
await page.waitForTimeout(3000);

const loginHidden = await page.evaluate(
  () => getComputedStyle(document.getElementById('login-screen')).display === 'none',
);
const connectionError = await page.getByText('Error conectando a Supabase').count();
const tableText = await page.locator('body').innerText();

console.log('login oculto:', loginHidden);
console.log('error de conexión:', connectionError);
console.log('respuestas /clientes:', JSON.stringify(responses));
console.log('panel menciona clientes:', /cliente/i.test(tableText));

await browser.close();

if (!loginHidden || connectionError > 0 || !responses.some((item) => item.status === 200)) {
  console.error('FALLO: el panel no pudo leer clientes con el header.');
  process.exit(1);
}
console.log('OK · panel funcionando con x-panel-key.');
