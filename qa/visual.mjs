/**
 * Prueba visual y funcional del formulario (Playwright).
 * Uso:  node qa/visual.mjs   (con `npm run preview` corriendo en :4173)
 * Genera qa/screenshots/*.png y qa/report.json
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const OUT = path.join('qa', 'screenshots');
const REPORT = path.join('qa', 'report.json');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const consoleErrors = [];
let step = '';

function record(name, ok, detail = '') {
  results.push({ name, ok, detail, step });
  console.log(`${ok ? 'OK  ' : 'FAIL'} · ${name}${detail ? ` · ${detail}` : ''}`);
}

function shot(page, name, fullPage = true) {
  return page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage });
}

function visibleButton(page, name) {
  return page.locator('button:visible').filter({ hasText: name }).first();
}

async function fill(page, label, value) {
  const field = page.getByLabel(label, { exact: false }).first();
  await field.waitFor({ state: 'visible' });
  await field.fill(value);
}

const browser = await chromium.launch();

try {
  /* ===================== ESCRITORIO ===================== */
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

  step = 'welcome';
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const localBanner = await page.getByText('Modo local sin Supabase').count();
  record('Conexión Supabase configurada', localBanner === 0, `${localBanner} aviso(s)`);
  await page.getByRole('heading', { level: 1 }).first().waitFor();
  record('Portada visible', await page.getByText('Tu experiencia,').first().isVisible());
  await shot(page, '01-welcome-light');

  await page.getByLabel('Tema oscuro').click();
  await page.waitForTimeout(450);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  record('Tema oscuro activo', isDark);
  await shot(page, '02-welcome-dark');
  await page.getByLabel('Tema claro').click();
  await page.waitForTimeout(250);

  await visibleButton(page, 'Empezar mi CV').click();
  await page.waitForTimeout(500);
  await shot(page, '03-contact');

  step = 'contact';
  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(500);
  const invalidCount = await page.locator('[aria-invalid="true"]').count();
  record('Validación bloquea campos vacíos', invalidCount >= 3, `${invalidCount} campos marcados`);
  await shot(page, '04-contact-errors');

  await fill(page, /^Nombre completo/, 'Ana María Gómez Ríos');
  await fill(page, /^Correo electrónico/, 'ana.gomez@correo.com');
  await fill(page, /^Teléfono de contacto/, '+57 300 123 4567');
  await fill(page, /^Ciudad/, 'Medellín');
  await fill(page, /^Departamento o estado/, 'Antioquia');
  await fill(page, /^Perfil de LinkedIn/, 'linkedin.com/in/ana-gomez');
  await page.getByLabel(/^País de residencia/).selectOption('Colombia');
  await page.locator('input[name="linkedin"]').blur();
  await page.waitForTimeout(300);
  const linkedinValue = await page.locator('input[name="linkedin"]').inputValue();
  record('Normaliza URL sin protocolo', linkedinValue === 'https://linkedin.com/in/ana-gomez', linkedinValue);

  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(600);

  step = 'profile';
  record('Paso de perfil visible', await page.getByRole('heading', { name: '¿Qué buscas?' }).isVisible());
  await fill(page, /^Titular profesional/, 'Analista de datos con enfoque en salud');
  await page.getByText('Junior · 1 a 3 años', { exact: true }).click();
  await fill(page, /^Años de experiencia relevante/, '3');
  await page
    .getByLabel(/^Tu resumen/)
    .fill(
      'Analista de datos con 3 años de experiencia en el sector salud. Reduje el tiempo de reporte mensual de 5 días a 6 horas automatizando procesos en SQL y Power BI. Lideré la migración de tres tableros críticos sin interrupciones. Me caracterizo por el pensamiento analítico y la comunicación clara. Busco un rol donde pueda convertir datos en decisiones clínicas.',
    );
  await page.getByLabel(/^Disponibilidad/).selectOption('inmediata');
  await page.getByRole('checkbox', { name: 'Híbrido', exact: true }).check();
  await page.getByLabel(/^Tipo de jornada/).selectOption('completo');
  await shot(page, '05-profile');

  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(600);

  step = 'experience';
  record('Paso de experiencia visible', await page.getByRole('heading', { name: 'Tu experiencia' }).isVisible());
  await visibleButton(page, 'Agregar mi primera experiencia').click();
  await page.waitForTimeout(300);
  await fill(page, /^Empresa u organización/, 'Clínica del Norte');
  await fill(page, /^Cargo/, 'Analista de datos');
  await page.getByLabel(/^Tipo de contrato/).selectOption('completo');
  await page.getByLabel(/^Modalidad/).selectOption('hibrido');
  await fill(page, /^Ubicación del empleo/, 'Medellín, Colombia');
  await page.getByLabel(/^Fecha de inicio/).fill('2022-03');
  await page.getByRole('checkbox', { name: 'Actualmente trabajo aquí', exact: true }).check();
  await fill(page, /^Contexto del rol/, 'Clínica privada con 180 empleados; equipo de datos de 5 personas.');
  await page
    .getByLabel(/^Logros del cargo/)
    .fill(
      'Reduje el tiempo de reporte mensual de 5 días a 6 horas automatizando consultas SQL y tableros en Power BI.\nLideré la migración de 3 tableros críticos sin interrupciones para 12 áreas usuarias.',
    );
  await fill(page, /^Herramientas o metodologías/, 'SQL, Power BI, Excel avanzado, Scrum');
  await shot(page, '06-experience');

  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(600);

  step = 'education';
  await visibleButton(page, 'Agregar mi primer estudio').click();
  await page.waitForTimeout(300);
  await page.getByLabel(/^Nivel educativo/).selectOption('pregrado');
  await fill(page, /^Institución/, 'Universidad de Antioquia');
  await fill(page, /^Programa o título/, 'Ingeniería de Sistemas');
  await fill(page, /^Campo de estudio/, 'Ciencia de datos');
  await page.getByLabel(/^Fecha de inicio/).fill('2016-01');
  await page.getByLabel(/^Fecha de fin/).fill('2021-11');
  await shot(page, '07-education');

  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(600);

  step = 'skills';
  record('Paso de habilidades visible', await page.getByRole('heading', { name: 'Habilidades e idiomas' }).isVisible());
  for (const skill of ['Excel', 'SQL', 'Power BI']) {
    await page.getByRole('button', { name: skill, exact: true }).click();
    await page.waitForTimeout(120);
  }
  for (const soft of ['Comunicación', 'Trabajo en equipo', 'Organización']) {
    await page.getByRole('checkbox', { name: soft, exact: true }).check();
  }
  await shot(page, '08-skills');

  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(500);
  step = 'projects';
  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(500);
  step = 'references';
  await visibleButton(page, 'Continuar').click();
  await page.waitForTimeout(700);

  step = 'review';
  await page.waitForTimeout(500);
  record('Paso de revisión visible', await page.getByRole('heading', { name: 'Revisa y envía' }).isVisible());
  const preConsent = await page.locator('#consent-error').count();
  const preToast = await page.getByText('Faltan datos obligatorios').count();
  record('Sin error de consentimiento antes de enviar', preConsent === 0, `${preConsent}`);
  record('Sin aviso de envío antes de tiempo', preToast === 0, `${preToast}`);
  await shot(page, '09-review');

  let rpcCalls = 0;
  await page.route('**/rest/v1/rpc/submit_cv', async (route) => {
    rpcCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, publicId: 'CV-2601-TEST01' }),
    });
  });

  await visibleButton(page, 'Enviar mi información').click();
  await page.waitForTimeout(700);
  const consentErrorVisible = await page.locator('#consent-error').isVisible();
  record('Exige autorización antes de enviar', consentErrorVisible && rpcCalls === 0, `rpc=${rpcCalls}`);
  await shot(page, '09b-review-validation');

  await page.getByRole('checkbox', { name: /Autorizo el tratamiento de mis datos/ }).check();
  await page.getByRole('checkbox', { name: /Confirmo que la información es veraz/ }).check();
  await visibleButton(page, 'Enviar mi información').click();
  await page.getByRole('heading', { name: /Recibimos tu información/ }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(900);
  record('Envío y pantalla de éxito', await page.getByText('CV-2601-TEST01').isVisible());
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await shot(page, '10-success', false);

  await context.close();

  /* ===================== MÓVIL ===================== */
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const mp = await mobile.newPage();
  mp.on('pageerror', (error) => consoleErrors.push(`mobile pageerror: ${error.message}`));
  await mp.goto(BASE, { waitUntil: 'networkidle' });
  await mp.getByRole('heading', { level: 1 }).first().waitFor();
  record('Portada móvil visible', await mp.getByText('Tu experiencia,').first().isVisible());
  await shot(mp, '11-mobile-welcome', false);

  await mp.getByLabel('Tema oscuro').click();
  await mp.waitForTimeout(400);
  await shot(mp, '12-mobile-welcome-dark', false);
  await mp.getByLabel('Tema claro').click();

  await visibleButton(mp, 'Empezar mi CV').click();
  await mp.waitForTimeout(500);
  await shot(mp, '13-mobile-contact', false);

  await mp.getByLabel('Tema oscuro').click();
  await mp.waitForTimeout(450);
  await shot(mp, '13b-mobile-contact-dark', false);
  await mp.getByLabel('Tema claro').click();
  await mp.waitForTimeout(250);

  await fill(mp, /^Nombre completo/, 'Carlos Ruiz');
  await fill(mp, /^Correo electrónico/, 'carlos@correo.com');
  await fill(mp, /^Teléfono de contacto/, '+57 310 555 4444');
  await fill(mp, /^Ciudad/, 'Bogotá');
  await mp.waitForTimeout(1600);
  await mp.screenshot({ path: path.join(OUT, '14-mobile-filled.png') });

  await mp.reload({ waitUntil: 'networkidle' });
  await mp.waitForTimeout(800);
  const hasDraft = await mp.getByText(/Tienes un borrador/).isVisible();
  record('Borrador recuperado tras recargar', hasDraft);
  await shot(mp, '15-mobile-draft', false);

  if (hasDraft) {
    await visibleButton(mp, 'Continuar').click();
    await mp.waitForTimeout(600);
    const name = await mp.locator('input[name="fullName"]').inputValue();
    record('Datos del borrador restaurados', name === 'Carlos Ruiz', name);
    await shot(mp, '16-mobile-resumed', false);
  }

  await mobile.close();
} catch (error) {
  record('Ejecución sin excepciones', false, error.message);
  console.error(error);
} finally {
  await browser.close();
  const failed = results.filter((item) => !item.ok);
  fs.writeFileSync(
    REPORT,
    JSON.stringify({ base: BASE, executedAt: new Date().toISOString(), results, consoleErrors }, null, 2),
  );
  console.log(`\n${results.length - failed.length}/${results.length} pruebas OK`);
  console.log(`Errores de consola: ${consoleErrors.length}`);
  console.log(`Reporte: ${REPORT}`);
  if (failed.length) process.exitCode = 1;
}
