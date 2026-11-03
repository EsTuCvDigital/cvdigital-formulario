#!/usr/bin/env node
/**
 * Después de ejecutar 0002_panel_access.sql:
 *  - lee el secreto de panel_config (con service_role),
 *  - lo agrega al panel admin como header x-panel-key,
 *  - agrega PANEL_KEY al .env del CLI de CVDigital,
 *  - enseña al CLI a enviar el header.
 *
 * Uso: node scripts/patch-panel.mjs
 * No imprime el secreto.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PANEL =
  process.env.PANEL_PATH || 'C:\\Users\\JACOB\\OneDrive\\Desktop\\administrador.html';
const CVDIGITAL = process.env.CVDIGITAL_PATH || 'C:\\Users\\JACOB\\CVDigital';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
      }
    }
  }
}
loadEnv();

const URL_BASE = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!URL_BASE || !SERVICE_KEY) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  process.exit(1);
}

if (!fs.existsSync(PANEL)) {
  console.error(`No existe el panel: ${PANEL}`);
  process.exit(1);
}

const response = await fetch(
  `${URL_BASE}/rest/v1/panel_config?key=eq.panel_key&select=value`,
  {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  },
);

if (!response.ok) {
  const text = await response.text();
  console.error(`No se pudo leer panel_config: ${response.status} ${text}`);
  process.exit(1);
}

const rows = await response.json();
const secret = rows[0]?.value;
if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
  console.error('panel_config no tiene un secreto válido. ¿Ejecutaste 0002?');
  process.exit(1);
}

/* ----------------------------- Panel admin ------------------------------ */
const original = fs.readFileSync(PANEL, 'latin1');
const backup = `${PANEL}.bak-${Date.now()}`;
fs.writeFileSync(backup, original, 'latin1');

const blockPattern = /const HEADERS = \{([\s\S]*?)\n\s*\};/;
const match = original.match(blockPattern);
if (!match) {
  console.error('No encontré el objeto HEADERS en el panel.');
  process.exit(1);
}

let body = match[1];
if (/'x-panel-key'\s*:/.test(body)) {
  body = body.replace(/'x-panel-key'\s*:\s*'[^']*'/, `'x-panel-key': '${secret}'`);
} else {
  if (!/'Authorization'/.test(body)) {
    console.error('El HEADERS del panel no tiene Authorization; no lo toco.');
    process.exit(1);
  }
  body = body.replace(
    /(\n(\s*)'Authorization'\s*:\s*`Bearer \$\{SUPABASE_KEY\}`,)/,
    `$1\n$2'x-panel-key': '${secret}',`,
  );
}

const updated = original.replace(blockPattern, `const HEADERS = {${body}\n    };`);
fs.writeFileSync(PANEL, updated, 'latin1');
console.log(`OK · header x-panel-key agregado al panel (copia: ${backup})`);

/* ----------------------------- CLI CVDigital ---------------------------- */
const envPath = path.join(CVDIGITAL, '.env');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  const next = /^PANEL_KEY=/m.test(env)
    ? env.replace(/^PANEL_KEY=.*$/m, `PANEL_KEY=${secret}`)
    : `${env.replace(/\s*$/, '')}\nPANEL_KEY=${secret}\n`;
  fs.writeFileSync(envPath, next, 'utf8');
  console.log('OK · PANEL_KEY agregado a CVDigital/.env');
} else {
  console.log('!   No encontré CVDigital/.env; agrega PANEL_KEY manualmente.');
}

const libPath = path.join(CVDIGITAL, 'lib', 'supabase.mjs');
if (fs.existsSync(libPath)) {
  const lib = fs.readFileSync(libPath, 'utf8');
  if (!/x-panel-key/.test(lib)) {
    const next = lib.replace(
      /(['"]Content-Type['"]\s*:\s*['"]application\/json['"],)/,
      `$1\n  ...(process.env.PANEL_KEY ? { 'x-panel-key': process.env.PANEL_KEY } : {}),`,
    );
    fs.writeFileSync(libPath, next, 'utf8');
    console.log('OK · el CLI ahora envía x-panel-key cuando PANEL_KEY está definido.');
  } else {
    console.log('OK · el CLI ya tenía el header.');
  }
} else {
  console.log('!   No encontré CVDigital/lib/supabase.mjs.');
}

console.log('\nListo. Abre el panel y verifica que carguen los clientes.');
