#!/usr/bin/env node
/**
 * cvadmin — administración local de los CV guardados en Supabase.
 *
 *   node scripts/cvadmin.mjs verify
 *   node scripts/cvadmin.mjs list
 *   node scripts/cvadmin.mjs show CV-2601-ABC123
 *   node scripts/cvadmin.mjs export
 *   node scripts/cvadmin.mjs smoke
 *   node scripts/cvadmin.mjs delete CV-2601-ABC123 --yes
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para listar, ver,
 * exportar, verificar el contenido y borrar. La función pública
 * submit_cv() se prueba con la llave anon.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ----------------------------- Entorno ---------------------------------- */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(ROOT, file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
      }
    }
  }
}
loadEnv();

const URL_BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

class Stop extends Error {}

function fail(message) {
  console.error(`\n${RED}${BOLD}ERROR${RESET} ${message}\n`);
  throw new Stop('handled');
}

function ok(message) {
  console.log(`${GREEN}OK${RESET}  ${message}`);
}

function warn(message) {
  console.log(`${YELLOW}!${RESET}   ${message}`);
}

function requireConfig() {
  if (!URL_BASE || !ANON_KEY) {
    fail('Falta SUPABASE_URL o la llave anon en .env.local. Revisa PASOS.md.');
  }
}

function requireService() {
  requireConfig();
  if (!SERVICE_KEY) {
    fail(
      'Esta acción necesita la llave service_role.\n' +
        '  1. Abre Supabase → Project Settings → API.\n' +
        '  2. Copia la llave "service_role" (secreta).\n' +
        '  3. Pégala en .env.local como SUPABASE_SERVICE_ROLE_KEY=...\n' +
        '  Nunca la pongas en el navegador ni la subas a git.',
    );
  }
}

/* ----------------------------- HTTP ------------------------------------- */
async function request(pathname, { method = 'GET', body, key = ANON_KEY, prefer } = {}) {
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
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    const detail =
      (data && (data.message || data.hint || data.error_description)) ||
      (typeof data === 'string' ? data : '') ||
      response.statusText;
    const error = new Error(`Supabase ${response.status}: ${detail}`);
    error.status = response.status;
    error.code = data && data.code;
    error.data = data;
    throw error;
  }
  return data;
}

function rpc(name, payload, key = ANON_KEY) {
  return request(`/rpc/${name}`, { method: 'POST', body: payload, key });
}

/* ----------------------------- Formato ---------------------------------- */
function table(rows, columns) {
  if (!rows.length) {
    console.log(`${DIM}(sin registros)${RESET}`);
    return;
  }
  const widths = columns.map((column) =>
    Math.max(column.label.length, ...rows.map((row) => String(row[column.key] ?? '').length)),
  );
  const line = (cells) => cells.map((cell, index) => String(cell).padEnd(widths[index])).join('  ');
  console.log(`${BOLD}${line(columns.map((column) => column.label))}${RESET}`);
  console.log(`${DIM}${line(widths.map((width) => '─'.repeat(width)))}${RESET}`);
  for (const row of rows) {
    console.log(line(columns.map((column) => row[column.key] ?? '')));
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows) {
  if (!rows.length) return 'sin_registros\n';
  const columns = [
    'public_id',
    'created_at',
    'status',
    'full_name',
    'email',
    'phone',
    'city',
    'country',
    'linkedin_url',
    'headline',
    'experience_level',
    'years_experience',
    'availability',
  ];
  const header = [...columns, 'experiencias', 'estudios', 'habilidades', 'idiomas', 'credenciales'];
  const body = rows.map((row) =>
    [
      ...columns.map((column) => csvCell(row[column])),
      csvCell(Array.isArray(row.experiences) ? row.experiences.length : 0),
      csvCell(Array.isArray(row.education) ? row.education.length : 0),
      csvCell(Array.isArray(row.skills) ? row.skills.length : 0),
      csvCell(Array.isArray(row.languages) ? row.languages.length : 0),
      csvCell(Array.isArray(row.credentials) ? row.credentials.length : 0),
    ].join(','),
  );
  return `${header.join(',')}\n${body.join('\n')}\n`;
}

function fmtDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return String(value);
  }
}

/* ----------------------------- Comandos --------------------------------- */
async function verify() {
  requireConfig();

  console.log(`\n${BOLD}Verificación${RESET} ${DIM}${URL_BASE}${RESET}\n`);

  // 1. La función pública existe y rechaza un envío vacío sin escribir nada.
  try {
    const result = await rpc('submit_cv', { payload: {} });
    if (result && result.ok === false && (result.code === 'EMAIL_INVALIDO' || result.code === 'SIN_CONSENTIMIENTO')) {
      ok(`Función submit_cv disponible (rechazo controlado: ${result.code}).`);
    } else {
      fail(`submit_cv respondió algo inesperado: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    if (error.status === 404 || error.code === 'PGRST202') {
      fail(
        'La migración no está aplicada: falta la función submit_cv.\n' +
          '  Ejecuta supabase/migrations/0001_formulario_cv.sql en el SQL Editor de Supabase.',
      );
    }
    fail(`No se pudo llamar submit_cv: ${error.message}`);
  }

  // 2. El rol anónimo NO debe poder leer las tablas.
  try {
    await request('/cv_submissions?select=id&limit=1');
    fail('SEGURIDAD: la llave anon pudo leer cv_submissions. Revisa RLS y los GRANT.');
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      ok('La llave anon no puede leer cv_submissions (RLS activo).');
    } else if (error.status === 404 || error.code === 'PGRST205') {
      fail('No existe cv_submissions. Ejecuta la migración.');
    } else {
      warn(`No se pudo comprobar el bloqueo de lectura anon: ${error.message}`);
    }
  }

  if (!SERVICE_KEY) {
    warn('Sin SUPABASE_SERVICE_ROLE_KEY no puedo contar ni exportar los CV.');
    warn('Agrégala en .env.local (Project Settings → API → service_role).');
    console.log('');
    return;
  }

  const rows = await request('/cv_full?select=public_id,created_at&order=created_at.desc', { key: SERVICE_KEY });
  ok(`service_role puede leer cv_full (${rows.length} CV).`);
  ok(`Vista cv_full y tablas hijas accesibles.`);
  if (rows[0]) console.log(`   Último CV: ${rows[0].public_id} · ${fmtDate(rows[0].created_at)}`);
  console.log('');
}

async function list() {
  requireService();
  const rows = await request(
    '/cv_full?select=public_id,created_at,status,full_name,email,headline,experience_level&order=created_at.desc&limit=100',
    { key: SERVICE_KEY },
  );
  console.log(`\n${BOLD}${rows.length} CV${rows.length === 1 ? '' : 's'}${RESET}\n`);
  table(rows, [
    { key: 'public_id', label: 'FOLIO' },
    { key: 'created_at', label: 'RECIBIDO' },
    { key: 'full_name', label: 'NOMBRE' },
    { key: 'email', label: 'CORREO' },
    { key: 'experience_level', label: 'NIVEL' },
    { key: 'status', label: 'ESTADO' },
  ]);
  console.log('');
}

async function show(id) {
  if (!id) fail('Uso: node scripts/cvadmin.mjs show CV-2601-ABC123');
  requireService();
  const rows = await request(`/cv_full?public_id=eq.${encodeURIComponent(id)}&select=*`, { key: SERVICE_KEY });
  if (!rows.length) fail(`No existe un CV con folio ${id}.`);
  console.log(JSON.stringify(rows[0], null, 2));
}

async function exportAll() {
  requireService();
  const all = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const page = await request(`/cv_full?select=*&order=created_at.asc&offset=${offset}&limit=${pageSize}`, {
      key: SERVICE_KEY,
    });
    all.push(...page);
    if (page.length < pageSize) break;
  }

  const dir = path.join(ROOT, 'exports');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(dir, `cvs-${stamp}.json`);
  const csvPath = path.join(dir, `cvs-${stamp}.csv`);
  writeFileSync(jsonPath, JSON.stringify(all, null, 2), 'utf8');
  writeFileSync(csvPath, toCsv(all), 'utf8');

  ok(`${all.length} CV exportados.`);
  console.log(`   ${jsonPath}`);
  console.log(`   ${csvPath}\n`);
}

function testPayload() {
  const email = `prueba.${Date.now()}@cvdigital.test`;
  return {
    email,
    consent: true,
    consentVersion: 'smoke',
    consentText: 'Prueba automática de cvadmin. No es una persona real.',
    truthConfirmed: true,
    fullName: 'Prueba Automática',
    phone: '+57 300 000 0000',
    city: 'Medellín',
    region: 'Antioquia',
    country: 'Colombia',
    cvLanguage: 'es',
    headline: 'Prueba de integración del formulario',
    level: 'junior',
    years: 1,
    summary:
      'Registro creado por scripts/cvadmin.mjs para verificar que la función submit_cv guarda correctamente el CV completo y que las tablas hijas responden.',
    availability: 'inmediata',
    modalities: ['remoto'],
    schedule: 'completo',
    noFormalExperience: false,
    experiences: [
      {
        company: 'Empresa de prueba',
        role: 'Analista de prueba',
        employmentType: 'completo',
        modality: 'remoto',
        location: 'Remoto',
        start: '2024-01',
        current: true,
        context: 'Contexto de prueba.',
        achievements: ['Validé el flujo completo de guardado de extremo a extremo con datos controlados.'],
        tools: 'SQL, Excel',
      },
    ],
    noFormalEducation: false,
    education: [
      {
        level: 'pregrado',
        institution: 'Universidad de prueba',
        program: 'Programa de prueba',
        field: 'Pruebas',
        start: '2018-01',
        end: '2022-12',
        current: false,
        average: '',
        description: '',
      },
    ],
    technicalSkills: [
      { name: 'SQL', category: 'tecnica', level: 4, years: 3 },
      { name: 'Excel', category: 'herramienta', level: 4, years: 4 },
      { name: 'Pruebas de software', category: 'metodologia', level: 3, years: 2 },
    ],
    softSkills: ['Comunicación', 'Trabajo en equipo', 'Organización'],
    softSkillsOther: '',
    languages: [{ name: 'Español', level: 'nativo', certification: '' }],
    credentials: [],
    projects: [],
    volunteering: [],
    referencePreference: 'solicitud',
    references: [],
    interests: '',
    teamNotes: 'Registro de prueba, eliminar.',
    honeypot: '',
  };
}

async function smoke() {
  requireConfig();
  const payload = testPayload();
  console.log(`\n${BOLD}Prueba end-to-end${RESET} ${DIM}${payload.email}${RESET}\n`);

  const result = await rpc('submit_cv', { payload });
  if (!result || result.ok !== true || !result.publicId) {
    fail(`submit_cv no confirmó el guardado: ${JSON.stringify(result)}`);
  }
  ok(`Insertado con folio ${result.publicId}.`);

  if (!SERVICE_KEY) {
    warn('Sin service_role no puedo verificar el contenido ni borrar la prueba.');
    warn(`Borra el registro ${result.publicId} desde el panel de Supabase.`);
    return;
  }

  const rows = await request(`/cv_full?public_id=eq.${result.publicId}&select=*`, { key: SERVICE_KEY });
  if (!rows.length) fail('El CV se insertó pero no se puede leer con service_role.');
  const cv = rows[0];
  if (cv.full_name !== payload.fullName) fail('El nombre guardado no coincide.');
  if (!Array.isArray(cv.experiences) || cv.experiences.length !== 1) fail('La experiencia no se guardó completa.');
  if (!Array.isArray(cv.skills) || cv.skills.length < 6) fail('Las habilidades no se guardaron completas.');
  if (!cv.consent_accepted) fail('No se registró el consentimiento.');
  ok('Contenido verificado: cabecera, experiencia, habilidades y consentimiento.');

  await request(`/cv_submissions?id=eq.${cv.id}`, { method: 'DELETE', key: SERVICE_KEY });
  await request(`/cv_submission_log?email_hash=eq.${createHash('md5').update(payload.email.toLowerCase()).digest('hex')}`, {
    method: 'DELETE',
    key: SERVICE_KEY,
  });
  ok('Registro de prueba eliminado (sin residuos).');
  console.log('');
}

async function remove(id, flags) {
  if (!id) fail('Uso: node scripts/cvadmin.mjs delete CV-2601-ABC123 --yes');
  if (!flags.includes('--yes')) {
    fail('Borrar un CV es irreversible. Repite el comando con --yes si estás seguro.');
  }
  requireService();
  const rows = await request(`/cv_submissions?public_id=eq.${encodeURIComponent(id)}&select=id,full_name,email`, {
    key: SERVICE_KEY,
  });
  if (!rows.length) fail(`No existe un CV con folio ${id}.`);
  await request(`/cv_submissions?id=eq.${rows[0].id}`, { method: 'DELETE', key: SERVICE_KEY });
  ok(`CV ${id} (${rows[0].full_name}) eliminado.`);
}

function help() {
  console.log(`
${BOLD}cvadmin${RESET} — administración de los CV de CVDigital

${BOLD}Comandos${RESET}
  verify                     Comprueba migración, RLS y llaves
  list                       Lista los últimos 100 CV
  show <folio>               Muestra un CV completo en JSON
  export                     Exporta todos los CV a exports/*.json y *.csv
  smoke                      Crea, verifica y borra un CV de prueba
  delete <folio> --yes       Elimina un CV y sus secciones

${BOLD}Configuración${RESET}
  .env.local con VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y
  SUPABASE_SERVICE_ROLE_KEY (solo para uso local).

${BOLD}Seguridad${RESET}
  La llave service_role salta RLS. No la uses en el navegador,
  no la subas a git y no la compartas por chat.
`);
}

/* ----------------------------- Main ------------------------------------- */
const [command, ...rest] = process.argv.slice(2);
const argument = rest.find((item) => !item.startsWith('--'));
const flags = rest.filter((item) => item.startsWith('--'));

try {
  switch (command) {
    case 'verify':
      await verify();
      break;
    case 'list':
      await list();
      break;
    case 'show':
      await show(argument);
      break;
    case 'export':
      await exportAll();
      break;
    case 'smoke':
      await smoke();
      break;
    case 'delete':
      await remove(argument, flags);
      break;
    case 'help':
    case undefined:
      help();
      break;
    default:
      fail(`Comando desconocido: ${command}. Usa "node scripts/cvadmin.mjs help".`);
  }
} catch (error) {
  if (error instanceof Stop) {
    process.exitCode = 1;
  } else if (error.status === 404 || error.code === 'PGRST205') {
    console.error(
      `\n${RED}${BOLD}ERROR${RESET} Falta la migración. Ejecuta supabase/migrations/0001_formulario_cv.sql en Supabase.\n`,
    );
    process.exitCode = 1;
  } else if (error.status === 401 || error.status === 403) {
    console.error(
      `\n${RED}${BOLD}ERROR${RESET} ${error.message}\n  Revisa las llaves de .env.local. Para leer datos se necesita service_role.\n`,
    );
    process.exitCode = 1;
  } else {
    console.error(`\n${RED}${BOLD}ERROR${RESET} ${error.message}\n`);
    process.exitCode = 1;
  }
}
