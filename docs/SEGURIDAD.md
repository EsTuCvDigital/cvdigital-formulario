# Auditoría de seguridad

Fecha: 2026-11-03 · Proyecto: `ptdpeuiuxikdjvizhgrx`

## Hallazgos

| # | Severidad | Hallazgo | Estado |
|---|---|---|---|
| 1 | **Crítica** | La llave `anon` podía **insertar** en `clientes` (probado: HTTP 201) y leer/escribir `pedidos`. Al publicar el formulario, cualquiera podía alterar datos del negocio. | **Corregido con `0002_panel_access.sql`**: RLS + header `x-panel-key`. |
| 2 | Alta | La llave `anon` viaja en el bundle (es pública por diseño). | Mitigado: RLS en `cv_*`, solo `submit_cv`, y `0002` para `clientes`/`pedidos`. |
| 3 | Media | El panel admin tiene la contraseña en el HTML y vive en OneDrive. | Residual. Recomendación: moverlo fuera de OneDrive y usar Supabase Auth. |
| 4 | Media | Sin límite por IP ni CAPTCHA; solo 5 envíos/24 h por correo. | Residual. Añadir Turnstile + Edge Function si el tráfico crece. |
| 5 | Baja | GitHub Pages no permite headers HTTP personalizados. | Se añadió CSP por `<meta>`; `frame-ancestors` no es aplicable en meta. |
| 6 | Baja | `service_role` en `.env.local`. | Mitigado: gitignore, nunca en `VITE_*`, solo scripts locales. |

## Controles implementados

- **RLS activo** en las 10 tablas `cv_*`; `anon` no puede leer ni escribir directo.
- **Única escritura pública:** `submit_cv(jsonb)`, con validación, límites de tamaño y arrays, consentimiento obligatorio, fechas/URLs validadas, rollback atómico y límite por correo.
- **Honeypot** y límite de 150 KB.
- **Referencias de terceros** solo si `consent=true`.
- **`0002`**: `panel_config` privado + `panel_authorized()` + políticas RLS en `clientes`/`pedidos` para `anon` con `x-panel-key`.
- **CSP de producción** (inyectada en el build): `script-src 'self'`, sin scripts inline; `connect-src` limitado a Supabase.
- **Sin `service_role` en el build** (comprobado decodificando los JWT del bundle).
- **Sin sinks XSS** (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write`) en `src`.
- **Sin inyección SQL**: los valores se guardan como parámetros; el intento `DROP TABLE` quedó como texto y la tabla sobrevivió.

## Evidencia

```text
node qa/security.mjs
```

- Antes de `0002`: **CRÍTICO** en `anon NO puede escribir clientes`.
- Después de `0002`: **22/22 OK**, incluida la escritura bloqueada.

Otros:

```text
npm test             13/13
npm run test:sql     27/27
npm run qa           15/15, 0 errores de consola
npm run typecheck    OK
npm run build        OK
```

## Despliegue seguro

1. Ejecutar `0002_panel_access.sql`.
2. `node scripts/patch-panel.mjs` (agrega el header al panel y `PANEL_KEY` al CLI).
3. Verificar el panel y `node qa/security.mjs` (22/22).
4. Publicar en GitHub Pages con `workflow_dispatch` (el workflow inyecta las variables desde secrets).

## Riesgos residuales

- El formulario público no tiene CAPTCHA: un bot con correos rotativos puede llenar la base. Monitorear y añadir Turnstile + límite por IP en una Edge Function.
- El panel local sigue usando contraseña en el HTML. Mover a Supabase Auth.
- La retención de 12 meses es una política declarada, no un job automático.
- La llave `anon` es pública; la seguridad depende de RLS y de no activar políticas permisivas por error.
