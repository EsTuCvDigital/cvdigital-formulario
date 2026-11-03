/**
 * Prueba real del SQL en un Postgres embebido (PGlite/WASM).
 * Valida sintaxis, RLS, la función submit_cv, el guardado en tablas hijas,
 * el rechazo de datos inválidos y la vista cv_full.
 *
 * Uso: node qa/sql-smoke.mjs
 */
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const results = [];
function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`${condition ? 'OK  ' : 'FAIL'} · ${name}${detail ? ` · ${detail}` : ''}`);
}

const migration = readFileSync(path.join('supabase', 'migrations', '0001_formulario_cv.sql'), 'utf8');
const db = new PGlite();

function payload(overrides = {}) {
  return {
    email: 'ana.gomez@correo.com',
    consent: true,
    consentVersion: 'test',
    consentText: 'Autorización de prueba.',
    truthConfirmed: true,
    fullName: 'Ana María Gómez',
    phone: '+57 300 123 4567',
    city: 'Medellín',
    region: 'Antioquia',
    country: 'Colombia',
    linkedin: 'https://linkedin.com/in/ana',
    cvLanguage: 'es',
    headline: 'Analista de datos con enfoque en salud',
    level: 'junior',
    years: 3,
    summary: 'Analista de datos con 3 años de experiencia en el sector salud y resultados medibles.',
    availability: 'inmediata',
    modalities: ['hibrido'],
    schedule: 'completo',
    noFormalExperience: false,
    experiences: [
      {
        company: 'Clínica del Norte',
        role: 'Analista de datos',
        employmentType: 'completo',
        modality: 'hibrido',
        location: 'Medellín',
        start: '2022-03',
        current: true,
        context: 'Equipo de 5 personas.',
        achievements: ['Reduje el reporte mensual de 5 días a 6 horas con SQL y Power BI.'],
        tools: 'SQL, Power BI',
      },
    ],
    noFormalEducation: false,
    education: [
      {
        level: 'pregrado',
        institution: 'Universidad de Antioquia',
        program: 'Ingeniería de Sistemas',
        field: 'Ciencia de datos',
        start: '2016-01',
        end: '2021-11',
        current: false,
      },
    ],
    technicalSkills: [
      { name: 'SQL', category: 'tecnica', level: 4, years: 3 },
      { name: 'Power BI', category: 'herramienta', level: 4, years: 2 },
      { name: 'Excel', category: 'herramienta', level: 3, years: 4 },
    ],
    softSkills: ['Comunicación', 'Trabajo en equipo', 'Organización'],
    languages: [{ name: 'Español', level: 'nativo', certification: '' }],
    credentials: [],
    projects: [],
    volunteering: [],
    referencePreference: 'solicitud',
    references: [],
    ...overrides,
  };
}

async function rpc(payloadObject) {
  const result = await db.query('select public.submit_cv($1::jsonb) as result', [
    JSON.stringify(payloadObject),
  ]);
  return result.rows[0].result;
}

async function expectPermissionDenied(sql) {
  try {
    await db.query(sql);
    return false;
  } catch (error) {
    return /permission denied|no tienes permiso/i.test(error.message);
  }
}

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
  `);
  check('Roles de Supabase creados en el Postgres de prueba', true);

  await db.exec(migration);
  check('Migración 0001 ejecutada sin errores de sintaxis', true);

  const tables = await db.query(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name like 'cv_%'
    order by table_name
  `);
  check('Tablas cv_* creadas', tables.rows.length === 10, `${tables.rows.length} tablas`);

  const view = await db.query(`
    select table_name from information_schema.views
    where table_schema = 'public' and table_name = 'cv_full'
  `);
  check('Vista cv_full creada', view.rows.length === 1);

  /* ---- Permisos del rol anónimo ---- */
  await db.exec('set role anon');
  const anonRead = await expectPermissionDenied('select * from public.cv_submissions limit 1');
  check('anon no puede leer cv_submissions', anonRead);

  const anonView = await expectPermissionDenied('select * from public.cv_full limit 1');
  check('anon no puede leer cv_full', anonView);

  const anonInsert = await expectPermissionDenied(
    "insert into public.cv_submissions (email, full_name, experience_level) values ('x@y.com','X','junior')",
  );
  check('anon no puede insertar directamente', anonInsert);

  const execute = await db.query(
    "select has_function_privilege('anon', 'public.submit_cv(jsonb)', 'execute') as can",
  );
  check('anon puede ejecutar submit_cv', execute.rows[0].can === true);

  /* ---- Envío válido ---- */
  const first = await rpc(payload());
  check('submit_cv acepta un envío válido', first.ok === true, JSON.stringify(first));
  check('Folio con formato CV-YYMM-XXXXXXXX', /^CV-\d{4}-[A-F0-9]{8}$/.test(first.publicId || ''), first.publicId);

  /* ---- Límite anti-abuso ---- */
  const second = await rpc(payload());
  check('Segundo envío inmediato bloqueado (TOO_SOON)', second.code === 'TOO_SOON', second.code);

  /* ---- Datos inválidos ---- */
  const badEmail = await rpc(payload({ email: 'no-es-correo' }));
  check('Email inválido rechazado', badEmail.code === 'EMAIL_INVALIDO');

  const noConsent = await rpc(payload({ email: 'otra@correo.com', consent: false }));
  check('Sin consentimiento rechazado', noConsent.code === 'SIN_CONSENTIMIENTO');

  let badUrl = false;
  try {
    await rpc(payload({ email: 'url@correo.com', portfolio: 'behance.net/sin-protocolo' }));
  } catch (error) {
    badUrl = /URL_INVALIDA/.test(error.message);
  }
  check('URL sin https rechazada y transacción revertida', badUrl);

  await db.exec('reset role');
  const noOrphans = await db.query('select count(*)::int as n from public.cv_submissions');
  check('No quedaron cabeceras huérfanas', noOrphans.rows[0].n === 1, `${noOrphans.rows[0].n} CV`);

  /* ---- Contenido guardado ---- */
  const counts = await db.query(`
    select
      (select count(*)::int from public.cv_experiences) as experiences,
      (select count(*)::int from public.cv_education) as education,
      (select count(*)::int from public.cv_skills where kind = 'technical') as technical,
      (select count(*)::int from public.cv_skills where kind = 'soft') as soft,
      (select count(*)::int from public.cv_languages) as languages
  `);
  const row = counts.rows[0];
  check('Experiencia guardada', row.experiences === 1);
  check('Estudios guardados', row.education === 1);
  check('3 habilidades técnicas guardadas', row.technical === 3);
  check('3 habilidades blandas guardadas', row.soft === 3);
  check('Idioma guardado', row.languages === 1);

  const consent = await db.query(
    'select consent_accepted, consent_version, consent_text, truth_confirmed from public.cv_submissions limit 1',
  );
  check(
    'Consentimiento guardado con versión y texto',
    consent.rows[0].consent_accepted === true &&
      consent.rows[0].consent_version === 'test' &&
      consent.rows[0].consent_text === 'Autorización de prueba.',
  );
  check('Veracidad confirmada', consent.rows[0].truth_confirmed === true);

  /* ---- Lectura con service_role ---- */
  await db.exec('set role service_role');
  const full = await db.query('select public_id, full_name, experiences, skills from public.cv_full');
  check('service_role lee cv_full', full.rows.length === 1);
  check('cv_full agrega experiencias', full.rows[0].experiences?.length === 1);
  check('cv_full agrega habilidades', full.rows[0].skills?.length === 6);

  /* ---- Fechas inválidas por la vía real (submit_cv) ---- */
  await db.exec('set role anon');
  const badDatePayload = payload({ email: 'fecha@correo.com' });
  badDatePayload.experiences[0].start = '2021-13';
  let badDate = false;
  try {
    await rpc(badDatePayload);
  } catch (error) {
    badDate = /FECHA_INVALIDA/.test(error.message);
  }
  check('Mes inválido rechazado por submit_cv', badDate);

  await db.exec('reset role');
  const stillOne = await db.query('select count(*)::int as n from public.cv_submissions');
  check('Transacción con fecha inválida revertida', stillOne.rows[0].n === 1);
} catch (error) {
  check('Ejecución sin excepciones', false, error.message);
  console.error(error);
} finally {
  await db.close();
  const failed = results.filter((item) => !item.ok);
  console.log(`\n${results.length - failed.length}/${results.length} comprobaciones OK`);
  if (failed.length) process.exitCode = 1;
}
