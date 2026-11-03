/**
 * Auditoría de seguridad contra el Supabase real.
 *
 *   node qa/security.mjs
 *
 * Comprueba:
 *  - que anon NO pueda leer/escribir cv_* ni cv_full,
 *  - que anon NO pueda leer clientes/pedidos (riesgo heredado),
 *  - que las funciones internas no sean ejecutables por anon,
 *  - inyección SQL y XSS almacenado vía submit_cv,
 *  - límite de tamaño, consentimiento, fechas y referencias sin permiso,
 *  - que el build no contenga la llave service_role,
 *  - que no haya sinks XSS peligrosos en el código.
 *
 * Limpia todos los registros de prueba. No imprime llaves.
 * Sale con código 1 si hay fallos o hallazgos críticos.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
      }
    }
  }
}
loadEnv();

const URL_BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const results = [];
const createdIds = [];
const usedEmails = [];
let tempClientIdCl = null;

function check(name, ok, detail = '', critical = false) {
  results.push({ name, ok: Boolean(ok), detail, critical });
  const tag = ok ? 'OK  ' : critical ? 'CRIT' : 'FAIL';
  console.log(`${tag} · ${name}${detail ? ` · ${detail}` : ''}`);
}

async function rest(pathname, { method = 'GET', body, key = ANON, prefer } = {}) {
  const response = await fetch(`${URL_BASE}/rest/v1${pathname}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

function rpc(payload) {
  return rest('/rpc/submit_cv', { method: 'POST', body: { payload } });
}

function md5(value) {
  return createHash('md5').update(value).digest('hex');
}

function testEmail(label) {
  const email = `security.${label}.${Date.now()}@cvdigital.test`;
  usedEmails.push(email.toLowerCase());
  return email;
}

function basePayload(overrides = {}) {
  return {
    email: testEmail('base'),
    consent: true,
    fullName: 'Security Test',
    level: 'junior',
    headline: 'Security test',
    summary: 'Prueba de seguridad. '.repeat(10),
    availability: 'inmediata',
    modalities: ['remoto'],
    schedule: 'completo',
    noFormalExperience: true,
    noFormalEducation: true,
    experiences: [],
    projects: [],
    technicalSkills: [],
    softSkills: [],
    languages: [],
    referencePreference: 'solicitud',
    references: [],
    truthConfirmed: true,
    ...overrides,
  };
}

function expectBlocked(pathname, { method = 'GET', body } = {}) {
  return rest(pathname, { method, body }).then(({ status }) => [401, 403].includes(status));
}

if (!URL_BASE || !ANON || !SERVICE) {
  console.error('Faltan SUPABASE_URL, la llave anon o service_role en .env.local.');
  process.exit(1);
}

console.log(`\nAuditoría: ${URL_BASE}\n`);

try {
  /* 1. Acceso directo a las tablas del formulario */
  check('anon no lee cv_submissions', await expectBlocked('/cv_submissions?select=id&limit=1'));
  check('anon no lee cv_full', await expectBlocked('/cv_full?select=public_id&limit=1'));
  check(
    'anon no inserta en cv_submissions',
    await expectBlocked('/cv_submissions', {
      method: 'POST',
      body: { email: 'x@y.com', full_name: 'X', experience_level: 'junior' },
    }),
  );
  check(
    'anon no actualiza cv_submissions',
    await expectBlocked('/cv_submissions?id=eq.00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      body: { full_name: 'Hacked' },
    }),
  );
  check(
    'anon no borra cv_submissions',
    await expectBlocked('/cv_submissions?id=eq.00000000-0000-0000-0000-000000000000', {
      method: 'DELETE',
    }),
  );

  /* 2. Funciones internas no expuestas */
  const helper = await rest('/rpc/_cv_txt', {
    method: 'POST',
    body: { payload: {}, k: 'x', max_len: 10 },
  });
  check(
    'anon no ejecuta funciones internas (_cv_txt)',
    [401, 403, 404].includes(helper.status),
    `HTTP ${helper.status}`,
  );

  /* 3. Riesgo heredado: clientes / pedidos */
  const clientes = await rest('/clientes?select=id,nombre&limit=1');
  check(
    'anon no ve filas de clientes (lectura)',
    clientes.status === 200 && Array.isArray(clientes.data) && clientes.data.length === 0,
    `HTTP ${clientes.status}`,
  );

  // Prueba de escritura controlada: inserta una fila temporal y se limpia.
  tempClientIdCl = `SEC-${Date.now()}`;
  const clientesWrite = await rest('/clientes', {
    method: 'POST',
    body: { id_cl: tempClientIdCl, nombre: 'Security Test' },
    prefer: 'return=representation',
  });
  if ([200, 201].includes(clientesWrite.status)) {
    check(
      'anon NO puede escribir clientes',
      false,
      'CRÍTICO: insertó una fila sin x-panel-key. Ejecuta 0002_panel_access.sql',
      true,
    );
  } else if ([401, 403].includes(clientesWrite.status)) {
    check('anon NO puede escribir clientes', true, `HTTP ${clientesWrite.status}`);
    tempClientIdCl = null;
  } else {
    const detail = JSON.stringify(clientesWrite.data).slice(0, 120);
    const rlsBlocked = /row-level security|permission denied|42501/i.test(detail);
    check('anon NO puede escribir clientes', rlsBlocked, `HTTP ${clientesWrite.status} ${detail}`, !rlsBlocked);
    if (rlsBlocked) tempClientIdCl = null;
  }

  const pedidos = await rest('/pedidos?select=id&limit=1');
  if (pedidos.status === 200 && Array.isArray(pedidos.data) && pedidos.data.length > 0) {
    check('anon NO puede leer pedidos', false, 'CRÍTICO: devolvió filas sin header', true);
  } else {
    check(
      'anon NO puede leer pedidos',
      pedidos.status === 200 || [401, 403].includes(pedidos.status),
      `HTTP ${pedidos.status}`,
    );
  }

  const panelFn = await rest('/rpc/panel_authorized', { method: 'POST', body: {} });
  check(
    'panel_authorized responde sin filtrar el secreto',
    [200, 401, 403, 404].includes(panelFn.status) &&
      (panelFn.status !== 200 || panelFn.data === false || panelFn.data?.value === false),
    `HTTP ${panelFn.status}`,
  );

  /* 4. Inyección SQL y XSS almacenado */
  const injection =
    "<script>window.__xss=1</script> O'Brien; DROP TABLE cv_submissions;--";
  const injected = await rpc(basePayload({ fullName: injection }));
  if (injected.data?.ok === true) {
    createdIds.push(injected.data.publicId);
    const stored = await rest(
      `/cv_full?public_id=eq.${encodeURIComponent(injected.data.publicId)}&select=full_name`,
      { key: SERVICE },
    );
    const name = stored.data?.[0]?.full_name || '';
    check(
      'Inyección SQL/XSS se guarda como texto (no se ejecuta)',
      name.includes('<script>') && name.includes('DROP TABLE'),
      name.slice(0, 60),
    );
    const alive = await rest('/cv_submissions?select=id&limit=1', { key: SERVICE });
    check('La tabla sobrevive al intento de DROP TABLE', alive.status === 200);
  } else {
    check('Inyección SQL/XSS se guarda como texto (no se ejecuta)', false, JSON.stringify(injected.data));
  }

  /* 5. Tamaño máximo */
  const huge = await rpc(basePayload({ email: testEmail('huge'), summary: 'A'.repeat(200000) }));
  check(
    'Payload gigante rechazado (PAYLOAD_GRANDE)',
    huge.data?.ok === false && huge.data?.code === 'PAYLOAD_GRANDE',
    huge.data?.code || `HTTP ${huge.status}`,
  );

  /* 6. Consentimiento */
  const noConsent = await rpc(basePayload({ email: testEmail('consent'), consent: false }));
  check(
    'Consentimiento obligatorio en servidor',
    noConsent.data?.ok === false && noConsent.data?.code === 'SIN_CONSENTIMIENTO',
    noConsent.data?.code,
  );

  /* 7. Fechas inválidas y rollback */
  const badDateEmail = testEmail('date');
  const badDate = await rpc(
    basePayload({
      email: badDateEmail,
      experiences: [{ company: 'X', role: 'Y', start: '2021-13', current: true }],
    }),
  );
  check(
    'Fecha inválida rechazada con rollback',
    badDate.status === 400 || /FECHA_INVALIDA/i.test(JSON.stringify(badDate.data)),
    `HTTP ${badDate.status}`,
  );
  const orphans = await rest(
    `/cv_submissions?email=eq.${encodeURIComponent(badDateEmail)}&select=id`,
    { key: SERVICE },
  );
  check(
    'No quedan cabeceras huérfanas tras la fecha inválida',
    Array.isArray(orphans.data) && orphans.data.length === 0,
  );

  /* 8. Referencias sin consentimiento */
  const ref = await rpc(
    basePayload({
      email: testEmail('reference'),
      referencePreference: 'incluir',
      references: [
        {
          name: 'Persona Tercera',
          role: 'Jefa',
          company: 'Empresa',
          relationship: 'jefe',
          email: 'tercero@example.com',
          consent: false,
        },
      ],
    }),
  );
  if (ref.data?.ok === true) {
    createdIds.push(ref.data.publicId);
    const full = await rest(
      `/cv_full?public_id=eq.${encodeURIComponent(ref.data.publicId)}&select=references`,
      { key: SERVICE },
    );
    check(
      'No guarda referencias sin autorización del tercero',
      Array.isArray(full.data?.[0]?.references) && full.data[0].references.length === 0,
    );
  } else {
    check('No guarda referencias sin autorización del tercero', false, ref.data?.code);
  }

  /* 9. Límite por correo sin distinguir mayúsculas */
  const rateEmail = testEmail('rate');
  const first = await rpc(basePayload({ email: rateEmail }));
  if (first.data?.ok === true) createdIds.push(first.data.publicId);
  const second = await rpc(basePayload({ email: rateEmail.toUpperCase() }));
  check(
    'Límite anti-abuso ignora mayúsculas (TOO_SOON)',
    second.data?.ok === false && second.data?.code === 'TOO_SOON',
    second.data?.code,
  );

  /* 10. Llaves en el build */
  const assets = existsSync('dist/assets') ? readdirSync('dist/assets').filter((file) => file.endsWith('.js')) : [];
  const roles = new Set();
  const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
  let bundleText = '';
  for (const file of assets) {
    const text = readFileSync(path.join('dist/assets', file), 'utf8');
    bundleText += text;
    for (const token of text.match(jwtPattern) || []) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        roles.add(payload.role);
      } catch {
        /* token no decodificable */
      }
    }
  }
  check(
    'El build no contiene la llave service_role',
    !roles.has('service_role') && !bundleText.includes('SUPABASE_SERVICE_ROLE_KEY'),
    [...roles].join(', ') || 'sin JWT detectado',
    true,
  );
  check(
    'El build contiene la llave anon esperada',
    roles.has('anon'),
    [...roles].join(', ') || 'sin JWT',
  );

  /* 11. Sinks XSS en el código */
  const sinkPattern = /dangerouslySetInnerHTML|innerHTML\s*=|eval\s*\(|new Function\s*\(|document\.write\s*\(/;
  const sinkFiles = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry)) {
        const text = readFileSync(full, 'utf8');
        if (sinkPattern.test(text)) sinkFiles.push(full);
      }
    }
  }
  walk('src');
  check('Sin sinks XSS conocidos en src', sinkFiles.length === 0, sinkFiles.join(', '));

  /* 12. Service role no puede usarse desde el navegador */
  check(
    'El bundle no incluye el secreto del panel',
    !bundleText.includes('x-panel-key') || !/x-panel-key['"]?\s*:\s*['"][a-f0-9]{64}/i.test(bundleText),
  );
} catch (error) {
  check('Ejecución sin excepciones', false, error.message);
} finally {
  /* Limpieza */
  for (const id of createdIds) {
    await rest(`/cv_submissions?public_id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      key: SERVICE,
    });
  }
  for (const email of usedEmails) {
    await rest(`/cv_submission_log?email_hash=eq.${md5(email)}`, {
      method: 'DELETE',
      key: SERVICE,
    });
  }
  if (tempClientIdCl) {
    await rest(`/clientes?id_cl=eq.${encodeURIComponent(tempClientIdCl)}`, {
      method: 'DELETE',
      key: SERVICE,
    });
  }

  const failed = results.filter((item) => !item.ok);
  const critical = results.filter((item) => item.critical && !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
  if (critical.length) {
    console.log('\nHAY HALLAZGOS CRÍTICOS:');
    for (const item of critical) console.log(` - ${item.name}: ${item.detail}`);
  }
  if (failed.length) process.exitCode = 1;
}
