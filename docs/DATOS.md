# Modelo de datos y contrato del formulario

Todo lo que se envía desde el navegador entra por una sola función:
`public.submit_cv(payload jsonb)`. No hay acceso directo a las tablas.

```text
Formulario (React)
   │  payload JSON (camelCase)
   ▼
submit_cv(payload)  ── seguridad definer, valida y sanea ──┐
   │                                                       │
   ├─ cv_submissions (1)                                   │
   ├─ cv_experiences (0..20)                               │
   ├─ cv_education (0..15)                                 │
   ├─ cv_skills (0..80 habilidades + 0..30 blandas)        │
   ├─ cv_languages (0..15)                                 │
   ├─ cv_credentials (0..60; el formulario ya no lo pide)  │
   ├─ cv_projects (0..30)                                  │
   ├─ cv_volunteering (0..30)                              │
   ├─ cv_references (0..10, solo con consentimiento)       │
   └─ cv_submission_log (hash del correo)  ◄───────────────┘
   ▲
   └── lectura solo para service_role: vista cv_full
```

> El formulario actual envía `credentials: []`. El paso de certificaciones,
> publicaciones y premios se retiró por decisión de producto: no verificamos
> credenciales. La tabla `cv_credentials` se conserva para datos históricos o
> para reactivar publicaciones/premios en el futuro.

---

## 1. Tabla principal: `cv_submissions`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | Clave interna |
| `public_id` | text único | Folio visible (`CV-YYMM-XXXXXXXX`) |
| `created_at` / `updated_at` | timestamptz | Automáticos |
| `status` | text | `new`, `review`, `contacted`, `in_progress`, `delivered`, `archived` |
| `source` | text | `formulario_web` |
| `locale` | text | `es-CO` |
| `cv_language` | text | `es`, `en`, `both` |
| `email` | text | Único para contacto; se guarda en minúsculas |
| `full_name` | text | 2-120 |
| `phone`, `city`, `region`, `country` | text | Contacto |
| `linkedin_url`, `portfolio_url`, `github_url` | text | Solo `https?://` |
| `headline` | text | Titular (≤160) |
| `experience_level` | text | `estudiante`, `primer_empleo`, `junior`, `intermedio`, `senior`, `ejecutivo`, `cambio_carrera` |
| `years_experience` | numeric(4,1) | 0-60 |
| `summary` | text | ≤2000 |
| `job_url`, `job_description` | text | Vacante objetivo (opcional) |
| `availability` | text | `inmediata`, `15d`, `30d`, `60d`, `convenir` |
| `work_modalities` | text[] | `presencial`, `hibrido`, `remoto` |
| `work_schedule` | text | `completo`, `medio`, `horas`, `freelance` |
| `relocation`, `travel` | text | `si`, `no`, `evaluar` / `si`, `no`, `ocasional` |
| `has_formal_experience` | boolean | Se deriva de `noFormalExperience` |
| `career_gap_note` | text | Pausa laboral (opcional) |
| `has_formal_education` | boolean | Se deriva de `noFormalEducation` |
| `soft_skills_extra` | text | Habilidades blandas escritas a mano |
| `interests` | text | ≤500 |
| `reference_preference` | text | `incluir`, `solicitud`, `no` |
| `team_notes` | text | Instrucciones para el equipo |
| `consent_accepted` | boolean | CHECK: siempre `true` |
| `consent_version` | text | Hoy `2026-01` |
| `consent_text` | text | Texto exacto aceptado |
| `consent_at` | timestamptz | Fecha del consentimiento |
| `marketing_opt_in` | boolean | Separado del consentimiento |
| `truth_confirmed` | boolean | Confirmación de veracidad |
| `admin_notes` | text | Uso interno |

**Estados sugeridos:** `new` → `review` → `contacted` → `in_progress` → `delivered`.
`archived` se usa al aplicar retención/eliminación lógica.

---

## 2. Tablas hijas

Todas tienen `id uuid`, `cv_id uuid on delete cascade` y `sort_order int`.

### `cv_experiences`
`company`, `role`, `employment_type` (`completo`, `medio`, `temporal`,
`practicas`, `freelance`, `obra`, `independiente`, `otro`), `modality`,
`location`, `start_date`, `end_date`, `is_current`, `context`, `achievements text[]`, `tools`.

Reglas: si `is_current` es true, `end_date` debe ser null; `end_date >= start_date`.

### `cv_education`
`level` (`primaria`, `secundaria`, `tecnico`, `tecnologo`, `pregrado`,
`especializacion`, `maestria`, `doctorado`, `bootcamp`, `otro`), `institution`,
`program`, `field_of_study`, `start_date`, `end_date`, `is_current`, `average`, `description`.

### `cv_skills`
`kind` (`technical` | `soft`), `name`, `category`, `level` (1-5), `years`.
`technical` agrupa habilidades y herramientas (incluye oficios como cocina o
manejo de caja). **Sin mínimo**: se puede enviar con 0.
Índice único por `(cv_id, kind, lower(name))`.

### `cv_languages`
`name`, `level` (`A1`…`C2`, `nativo`), `certification`.

### `cv_credentials`
`kind` (`certification`, `publication`, `award`), `subtype`, `title`, `issuer`,
`date_issued`, `date_expires`, `hours`, `url`, `doi`, `authors`, `description`.

**El formulario ya no pide esta sección.** La tabla se conserva para datos
históricos o para reactivar publicaciones/premios. El payload actual la envía
vacía.

### `cv_projects`
`name`, `project_type` (`academico`, `personal`, `freelance`, `open_source`,
`investigacion`), `role`, `description`, `achievements text[]`, `tools`, `url`,
`start_date`, `end_date`, `is_current`.

### `cv_volunteering`
`organization`, `role`, `cause` (`educacion`, `salud`, `ambiente`, `comunidad`,
`animal`, `cultural`, `deportivo`, `otro`), `start_date`, `end_date`,
`is_current`, `achievements text[]`, `hours`.

### `cv_references`
`name`, `role`, `company`, `relationship` (`jefe`, `colega`, `cliente`,
`profesor`, `otro`), `email`, `phone`, `consent_confirmed`.
**CHECK:** `consent_confirmed = true`. La función no inserta referencias sin autorización.

### `cv_submission_log`
`email_hash` (MD5 del correo en minúsculas), `created_at`, `outcome`.
Se usa para el límite de 5 envíos/24 h y 45 s entre envíos. No guarda el correo.

---

## 3. Contrato del payload

Ejemplo abreviado (los nombres son los del formulario, camelCase):

```json
{
  "honeypot": "",
  "email": "ana@correo.com",
  "cvLanguage": "es",
  "consent": true,
  "consentVersion": "2026-01",
  "consentText": "Autorizo a CVDigital...",
  "marketingOptIn": false,
  "truthConfirmed": true,

  "fullName": "Ana María Gómez",
  "phone": "+57 300 123 4567",
  "city": "Medellín",
  "region": "Antioquia",
  "country": "Colombia",
  "linkedin": "https://linkedin.com/in/ana",
  "portfolio": "",
  "github": "",

  "headline": "Analista de datos · salud",
  "level": "junior",
  "years": 3,
  "summary": "Analista de datos con 3 años...",
  "jobUrl": "",
  "jobDescription": "",

  "availability": "inmediata",
  "modalities": ["hibrido", "remoto"],
  "schedule": "completo",
  "relocation": "evaluar",
  "travel": "",

  "noFormalExperience": false,
  "experiences": [
    {
      "company": "Clínica del Norte",
      "role": "Analista de datos",
      "employmentType": "completo",
      "modality": "hibrido",
      "location": "Medellín",
      "start": "2022-03",
      "end": null,
      "current": true,
      "context": "Equipo de 5 personas",
      "achievements": ["Reduje el reporte mensual de 5 días a 6 horas."],
      "tools": "SQL, Power BI"
    }
  ],
  "careerGap": "",

  "noFormalEducation": false,
  "education": [
    {
      "level": "pregrado",
      "institution": "Universidad de Antioquia",
      "program": "Ingeniería de Sistemas",
      "field": "Ciencia de datos",
      "start": "2016-01",
      "end": "2021-11",
      "current": false,
      "average": "",
      "description": ""
    }
  ],

  "technicalSkills": [
    { "name": "SQL", "category": "tecnica", "level": 4, "years": 3 }
  ],
  "softSkills": ["Comunicación", "Trabajo en equipo", "Organización"],
  "softSkillsOther": "",

  "languages": [
    { "name": "Español", "level": "nativo", "certification": "" }
  ],

  "credentials": [],

  "projects": [],
  "volunteering": [],

  "referencePreference": "solicitud",
  "references": [],
  "interests": "",

  "teamNotes": ""
}
```

### Mapa rápido formulario → columna

| Payload | Columna |
|---|---|
| `cvLanguage` | `cv_language` |
| `level` | `experience_level` |
| `years` | `years_experience` |
| `modalities` | `work_modalities` |
| `schedule` | `work_schedule` |
| `noFormalExperience` | `has_formal_experience = NOT` |
| `noFormalEducation` | `has_formal_education = NOT` |
| `careerGap` | `career_gap_note` |
| `linkedin` / `portfolio` / `github` | `*_url` |
| `consent` | `consent_accepted` |
| `jobUrl` / `jobDescription` | `job_url` / `job_description` |
| `softSkills` + `softSkillsOther` | filas `cv_skills` con `kind='soft'` |
| `references[].consent` | `cv_references.consent_confirmed` |

### Respuesta de `submit_cv`

```json
{ "ok": true, "publicId": "CV-2601-ABC123" }
```

Errores controlados (sin excepción):

| `code` | Significado |
|---|---|
| `EMAIL_INVALIDO` | Correo vacío o con formato inválido |
| `SIN_CONSENTIMIENTO` | No se aceptó la autorización |
| `DATOS_INCOMPLETOS` | Falta nombre o nivel (incluye `field`) |
| `RATE_LIMITED` | 5 envíos en 24 h con el mismo correo |
| `TOO_SOON` | Menos de 45 s desde el envío anterior |
| `PAYLOAD_GRANDE` | Más de 150 KB |
| `FORMATO_INVALIDO` | El payload no es un objeto JSON |

Las fechas inválidas o URLs mal formadas lanzan una excepción SQL y **toda la
transacción se revierte** (no quedan cabeceras huérfanas). El cliente las muestra
como `FECHA_INVALIDA` / `URL_INVALIDA`.

---

## 4. Vista `cv_full`

Devuelve una fila por CV con las secciones ya agregadas en JSON:
`experiences`, `education`, `skills`, `languages`, `credentials`, `projects`,
`volunteering`, `references`.

```sql
select public_id, full_name, email, experiences, skills
from public.cv_full
order by created_at desc
limit 20;
```

La vista tiene `security_invoker = true` y está revocada para `anon`: solo
`service_role` puede leerla.

---

## 5. Consultas útiles

```sql
-- Por nivel y mes
select date_trunc('month', created_at) as mes, experience_level, count(*)
from public.cv_submissions
group by 1, 2
order by 1 desc;

-- Sin experiencia formal
select public_id, full_name, email
from public.cv_submissions
where has_formal_experience = false;

-- Con consentimiento de marketing (separado del consentimiento legal)
select public_id, email, consent_at
from public.cv_submissions
where marketing_opt_in = true;

-- Referencias incluidas
select s.public_id, s.full_name, r.name, r.company, r.consent_confirmed
from public.cv_submissions s
join public.cv_references r on r.cv_id = s.id;
```

### Eliminar un CV

```sql
delete from public.cv_submissions where public_id = 'CV-2601-ABC123';
```

Borra en cascada experiencias, estudios, habilidades, idiomas, credenciales,
proyectos, voluntariado y referencias. El registro de la bitácora anti-abuso
queda (solo contiene un hash) y puede borrarse aparte.

Por CLI (con `service_role`):

```powershell
node scripts/cvadmin.mjs delete CV-2601-ABC123 --yes
```

---

## 6. Cómo añadir o cambiar una pregunta

1. **SQL**: crea `supabase/migrations/0002_mi_campo.sql` con
   `alter table public.cv_submissions add column if not exists mi_campo text;`
   y actualiza `submit_cv` para leerlo. Nunca edites `0001` una vez aplicada.
2. **Tipos**: agrega el campo a `cvSchema` y a `createEmptyValues()` en
   `src/lib/schema.ts`.
3. **UI**: añade el control en el paso correspondiente (`src/steps/…`).
4. **Envío**: agrega la propiedad al payload de `buildPayload` en
   `src/lib/submit.ts`.
5. **Lista de pasos**: si es un campo obligatorio, inclúyelo en
   `STEP_FIELDS` (`src/lib/steps.ts`).
6. **Exportación**: si vive en una tabla hija, agrégalo a la vista `cv_full`.
7. **Pruebas**: `npm run typecheck`, `npm test`, `npm run db:smoke`.

### Límites actuales

| Dato | Máximo |
|---|---|
| Payload | 150 KB |
| Experiencias | 20 |
| Estudios | 15 |
| Habilidades y herramientas | 80 |
| Habilidades blandas | 30 (8 desde la UI) |
| Idiomas | 15 |
| Credenciales | 60 (la API lo soporta; el formulario no lo pide) |
| Proyectos | 30 |
| Voluntariados | 30 |
| Referencias | 10 |
| Envíos por correo | 5 / 24 h |

---

## 7. Retención y privacidad

La interfaz declara:

- Datos activos: hasta **12 meses** después de la última interacción.
- Borradores locales: **90 días**.
- Alojamiento en Supabase, cifrado en tránsito.

**Importante:** la retención es una política, no un proceso automático. Para
cumplirla hay que programar un job (por ejemplo `pg_cron`) que anonimice o borre
`cv_submissions` antiguos. No se incluye en esta entrega porque requiere decidir
la regla exacta (¿12 meses desde `created_at` o desde `updated_at`? ¿borrar o
anonimizar?).

El consentimiento se guarda con el texto exacto y la versión `2026-01`. Si
cambias el texto, sube `CONSENT_VERSION` para poder distinguir autorizaciones
antiguas y nuevas.
