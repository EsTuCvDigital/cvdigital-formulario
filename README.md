# CVDigital · Formulario de perfil profesional

Formulario web (React + Vite + Tailwind) que recoge toda la información necesaria
para redactar una hoja de vida y la guarda en Supabase. Funciona igual para una
persona que busca su **primer empleo** que para un **perfil senior o ejecutivo**:
el orden de los pasos y el énfasis cambian según el momento profesional.

- 8 pasos guiados, mobile-first, con ejemplos y textos de ayuda.
- Autoguardado en el navegador y recuperación del borrador.
- Validación en cliente y en servidor (Zod + función SQL).
- Consentimiento Ley 1581 / GDPR con versión, texto y fecha.
- Sin foto, cédula, edad, estado civil, religión, salud ni datos de familia.
- Escritura pública solo por una función RPC; lectura solo con `service_role`.

---

## Inicio rápido

```powershell
cd C:\Users\JACOB\cv-formulario
npm install
npm run dev
```

La base de datos se crea **una vez** ejecutando
`supabase/migrations/0001_formulario_cv.sql` en el SQL Editor de Supabase.
El detalle completo está en **[PASOS.md](PASOS.md)**.

```powershell
npm run db:verify     # migración + RLS + llaves
npm run db:smoke      # escribe, verifica y borra un CV de prueba
npm run db:list       # últimos CV
npm run db:export     # exports/cvs-AAAA-MM-DD.json / .csv
```

---

## Stack

| Pieza | Versión / decisión |
|---|---|
| React + TypeScript | 19 + 5.9, modo estricto |
| Vite | 7 |
| Tailwind CSS | 4 (tokens propios, tema claro/oscuro/sistema) |
| Formularios | React Hook Form 7 + Zod 4 |
| Base de datos | Supabase (Postgres + PostgREST) |
| Iconos | lucide-react |
| Pruebas | Vitest + Playwright (evidencia visual) |
| CLI admin | Node puro, sin dependencias |

---

## Estructura

```text
cv-formulario/
├─ src/
│  ├─ App.tsx                 flujo, navegación, autoguardado y envío
│  ├─ steps/                  los 8 pasos (contacto → revisión)
│  ├─ components/             UI, stepper, tema, privacidad
│  ├─ screens/                portada y pantalla de éxito
│  └─ lib/
│     ├─ schema.ts            validación Zod de todo el formulario
│     ├─ steps.ts             orden adaptativo y campos por paso
│     ├─ submit.ts            payload + llamada a submit_cv + errores
│     ├─ draft.ts             borrador local (90 días)
│     ├─ completeness.ts      porcentaje y secciones faltantes
│     └─ options.ts           catálogos (niveles, idiomas, etc.)
├─ supabase/
│  ├─ migrations/0001_formulario_cv.sql
│  ├─ migrations/0002_panel_access.sql
│  ├─ verify.sql
│  └─ rollback.sql
├─ scripts/cvadmin.mjs        verify / list / show / export / smoke / delete
├─ scripts/patch-panel.mjs    header x-panel-key para panel y CLI
├─ qa/visual.mjs              pruebas Playwright + capturas
├─ qa/security.mjs            auditoría real de RLS, RPC e inyecciones
├─ PASOS.md                   puesta en marcha
├─ docs/DATOS.md              modelo de datos y contrato del payload
└─ docs/SEGURIDAD.md          hallazgos, controles y riesgos residuales
```

---

## Flujo del formulario

| # | Paso | Contenido | Condición |
|---|---|---|---|
| 1 | Contacto | Nombre, correo, teléfono, ciudad, país y enlaces | Siempre |
| 2 | Perfil | Titular, nivel, años, resumen, idioma del CV, disponibilidad y vacante | Siempre |
| 3 | Experiencia | Hasta 20 roles con logros, herramientas y pausas laborales | Si no hay experiencia formal, se marca y se salta |
| 4 | Estudios | Hasta 15 estudios, promedio y logros académicos | Si no hay estudios formales, se marca y se salta |
| 5 | Habilidades | Habilidades, herramientas e idiomas (nivel 1-5) | Opcional, sin mínimos |
| 6 | Proyectos | Proyectos y voluntariado | Obligatorio si no hay experiencia formal |
| 7 | Referencias | Incluir / a solicitud / no incluir + intereses | Opcional (con consentimiento del tercero) |
| 8 | Revisión | Completitud, vista previa, consentimiento y envío | Siempre |

**Orden adaptativo:** para `estudiante` y `primer_empleo`, Estudios aparece antes
que Experiencia. El nivel elegido en el paso 2 controla el orden y los consejos.

**Rutas sin fricción:** si no hay experiencia, se exige al menos un proyecto o
voluntariado y el formulario muestra alternativas (prácticas, freelance, negocio
familiar, trabajo informal). Si no hay estudios formales, se prioriza la
experiencia, los proyectos y las habilidades. El formulario **no pide ni verifica
certificaciones**: recolecta información y la empresa contratante comprueba lo
que necesite.

---

## Modelo de datos

| Tabla | Contenido |
|---|---|
| `cv_submissions` | Cabecera: contacto, perfil, disponibilidad, consentimiento y estado |
| `cv_experiences` | Roles, fechas, modalidad, logros (`text[]`) y herramientas |
| `cv_education` | Nivel, institución, programa, fechas, promedio y logros |
| `cv_skills` | Habilidades y herramientas (nivel 1-5, años) y blandas |
| `cv_languages` | Idioma + nivel MCER + certificación |
| `cv_credentials` | Tabla conservada; el paso de certificaciones se retiró del formulario |
| `cv_projects` | Proyectos académicos, personales, freelance, open source o investigación |
| `cv_volunteering` | Organización, rol, causa, fechas, logros y horas |
| `cv_references` | Terceros **solo con autorización** |
| `cv_submission_log` | Hash del correo para límite anti-abuso (sin correo en claro) |
| `cv_full` (vista) | CV completo en una fila: cabecera + secciones en JSON |

Detalle del contrato y cómo añadir campos: **[docs/DATOS.md](docs/DATOS.md)**.

---

## Seguridad

- **RLS activo sin políticas** en las 10 tablas `cv_*`: `anon` y `authenticated`
  no pueden leer ni escribir directamente. `clientes`/`pedidos` también tienen
  RLS desde 0002 y solo aceptan `anon` con `x-panel-key`.
- La única escritura pública es `submit_cv(jsonb)` (`security definer`), que:
  valida forma y tamaño (150 KB), normaliza textos, limita longitudes,
  comprueba email/consentimiento/fechas/URLs, evita duplicados y aplica
  anti-abuso (máx. 5 envíos por correo/día y 45 s entre envíos).
- **Honeypot** oculto: si un bot lo llena, responde éxito sin guardar nada.
- `service_role` solo se usa en `scripts/cvadmin.mjs`; nunca en el navegador.
- La vista `cv_full` usa `security_invoker` y está revocada para `anon`.
- Consentimiento guardado con **versión, texto exacto y fecha**.
- Los datos de referencias no se guardan si no hay autorización del tercero.
- El formulario no pide datos sensibles ni foto (decisión deliberada por ATS y
  privacidad).

### Riesgo heredado corregido (migración 0002)

La llave `anon` podía escribir en `clientes` y `pedidos`. Se comprobó con un
INSERT controlado (HTTP 201) y se borró la fila. La migración
`supabase/migrations/0002_panel_access.sql` activa RLS y exige el header
`x-panel-key` para `anon`; el secreto se genera en la base y no está en el repo.
El panel admin y el CLI de CVDigital se actualizan con
`node scripts/patch-panel.mjs`. La llave pública del formulario queda limitada a
`submit_cv`.

Evidencia: `qa/security.mjs` marca el riesgo como **CRÍTICO** antes de 0002 y
pasa **22/22** después. Ver [docs/SEGURIDAD.md](docs/SEGURIDAD.md).

---

## Evidencia de calidad

- `npm run build` ✅ (TypeScript estricto + Vite).
- `npm run typecheck` ✅.
- `npm test` ✅ **13/13** pruebas unitarias del esquema Zod (rutas de primer
  empleo, sin experiencia, sin estudios, fechas, referencias y consentimiento).
- `npm run test:sql` ✅ **27/27** comprobaciones del SQL en un Postgres real
  embebido (PGlite): sintaxis, 10 tablas, vista, RLS, permisos de `anon`,
  `submit_cv`, tablas hijas, límite anti-abuso, rollback de URL/fecha inválida
  y lectura con `service_role`.
- `npm run test:security` ✅ **22/22** comprobaciones de seguridad: RLS,
  permisos de `anon`, inyección SQL/XSS, límites, consentimiento, referencias,
  llaves en el build y sinks XSS. Antes de 0002 marca **CRÍTICO** porque `anon`
  podía escribir en `clientes`. Requiere `service_role` en `.env.local`.
- `npm run qa` ✅ **15/15** pruebas Playwright, **0 errores de consola**:
  portada, tema oscuro, validación, normalización de URLs, los 8 pasos,
  consentimiento obligatorio (sin llamada RPC cuando falta), envío, móvil y
  recuperación de borrador tras recargar. Incluye dos regresiones específicas:
  no debe haber errores de consentimiento ni avisos de envío **antes** de pulsar
  “Enviar” (un bug real de envío implícito que se detectó y corrigió).
- Capturas en `qa/screenshots/` (claro, oscuro y móvil) y `qa/report.json`.
- La prueba contra **tu** Supabase es `npm run db:smoke` (requiere service_role):
  inserta, verifica cabecera + hijas + consentimiento y limpia.

> La respuesta del servidor en las pruebas visuales está simulada con Playwright
> para no ensuciar la base. El camino real se prueba con `db:smoke`.

---

## Decisiones y supuestos

1. **Se usa el proyecto Supabase existente** (`ptdpeuiuxikdjvizhgrx`), no se crea
   uno nuevo. Cambiar de proyecto solo requiere editar `.env.local`.
2. **8 pasos**: se integró el correo en “Contacto” y el consentimiento en
   “Revisión” para no pedir autorización antes de que la persona vea el
   formulario. Se retiró el paso de certificaciones/publicaciones/premios:
   recolectamos información, no verificamos credenciales; si el candidato
   miente, la empresa contratante lo comprueba. La tabla `cv_credentials` se
   conserva por si se decide reactivar publicaciones o premios.
3. **Borrador local** (localStorage, 90 días), no “enlace mágico” por correo:
   no hay servicio de email configurado. El borrador no sale del dispositivo
   hasta que se envía.
4. **Sin generación de PDF ni publicación del CV** en esta fase: el alcance es
   recolectar y guardar la información. La publicación debe tener su propio
   flujo y autorización.
5. **La retención es una política declarada, no automatizada.** Para cumplirla
   hay que programar un borrado/anonimización a los 12 meses (y 90 días para
   borradores locales). Ver “Pendientes”.
6. El correo de privacidad (`src/lib/constants.ts`) es un **placeholder**:
   cámbialo por el canal real antes de publicar.
7. La llave `service_role` la debes pegar tú en `.env.local`; el formulario
   funciona sin ella, pero el CLI no puede listar/exportar.
8. **No se crean clientes automáticamente** en `clientes`: cada envío queda en
   `cv_submissions`. Vincular el CV con el cliente del panel es una decisión de
   negocio y se puede añadir después con un campo `client_id` y un flujo de
   aprobación.
9. **Habilidades sin mínimos**: se puede enviar el formulario sin habilidades
   ni idiomas. Las sugerencias incluyen oficios y herramientas generales
   (caja, cocina, inventario, atención al cliente) además de tecnología.
10. **Sin verificación de credenciales**: no se piden certificaciones. Si el
    negocio las necesita para cierto perfil, se pueden reactivar como un paso
    opcional; hoy se prioriza no bloquear a personas sin experiencia formal.

---

## Publicación

- Repositorio: <https://github.com/EsTuCvDigital/cvdigital-formulario>
- GitHub Pages: <https://estucvdigital.github.io/cvdigital-formulario/>
- Workflow: `.github/workflows/deploy.yml` (manual hasta aplicar 0002; después
  se puede activar en cada `push`).
- Secretos del repo: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (los inyecta
  el workflow; el `service_role` nunca va al frontend).

---

## Pendientes recomendados

- [ ] Ejecutar `0001` y `0002` en Supabase, luego `npm run db:smoke` y
      `npm run test:security`.
- [ ] Reemplazar `PRIVACY_CONTACT` por el correo real.
- [ ] Revisar el consentimiento con el responsable de privacidad.
- [ ] Programar la retención (12 meses) con `pg_cron` o un job externo.
- [ ] Añadir un flujo de “solicitar eliminación” con verificación de identidad.
- [ ] Panel interno de revisión (hoy se usa `db:list` / `db:show`).
- [ ] Generación de PDF/DOCX y publicación de la hoja de vida web.
- [ ] Correos transaccionales (confirmación y enlace de borrador).
- [ ] Mover el panel admin a Supabase Auth (hoy tiene contraseña en el HTML).
- [ ] Rotar el `x-panel-key` si el panel o `.env` del CLI se filtran.
- [ ] Si el formulario se hace público a gran escala: CAPTCHA (Turnstile/hCaptcha)
      y límite por IP en una Edge Function. Hoy hay honeypot y límite por correo.
- [ ] Code-splitting del bundle (hoy 214 KB gzip; aceptable para un formulario).

---

## Licencia

Uso privado de CVDigital. No redistribuir sin autorización.
