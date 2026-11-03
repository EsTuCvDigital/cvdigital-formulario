# Puesta en marcha (paso a paso)

Esta guía deja el formulario funcionando y guardando en tu proyecto de Supabase.
Tiempo estimado: **15 minutos**.

---

## 0. Estado de esta instalación

- Formulario completo en `C:\Users\JACOB\cv-formulario`.
- `.env.local` con la URL, la llave **anon** y la **service_role** de tu proyecto
  Supabase (`ptdpeuiuxikdjvizhgrx`).
- **0001 ya ejecutada**: las tablas `cv_*` existen y la base tiene tu CV.
- **0002 aplicada**: `clientes`/`pedidos` tienen RLS y el panel/CLI usan
  `x-panel-key`. La auditoría da 22/22.

> Si instalas desde cero: ejecuta `0001` y después `0002` (paso 1b).

---

## 1. Crear las tablas en Supabase (una sola vez)

> **Importante:** `cd`, `Get-Content` y `Set-Clipboard` son comandos de la
> **terminal de Windows (PowerShell)**. En el **SQL Editor de Supabase** solo se
> pega el contenido del archivo `.sql`. Si pegas `cd ...` allí, verás el error
> `syntax error at or near "cd"`. Borra eso y pega solo el SQL.

1. Abre **PowerShell** (no el SQL Editor) y copia el SQL al portapapeles:

   ```powershell
   cd C:\Users\JACOB\cv-formulario
   Get-Content .\supabase\migrations\0001_formulario_cv.sql -Raw | Set-Clipboard
   start https://supabase.com/dashboard/project/ptdpeuiuxikdjvizhgrx/sql/new
   ```

2. En el SQL Editor, pega con **Ctrl+V**.
3. Pulsa **Run**. Debe terminar sin errores y mostrar:
   `OK · Formulario CV instalado`.
5. Crea otra consulta, pega `supabase/verify.sql` y pulsa **Run**.
   Todas las filas deben decir **OK**.

El script es idempotente: si lo ejecutas dos veces, no rompe nada.
**0001 no modifica** `clientes` ni `pedidos`; la 0002 las protege sin borrar datos.

> Alternativa por terminal (opcional): si tienes `psql`, usa la cadena de
> conexión que aparece en Supabase → **Connect** y ejecuta:
> `psql "TU_CADENA_DE_CONEXION" -f supabase/migrations/0001_formulario_cv.sql`
> El SQL Editor es más sencillo y evita problemas de red.

### 1b. Proteger `clientes` y `pedidos` (0002)

La llave `anon` del formulario no debe poder tocar los datos del negocio.

1. Copia el SQL al portapapeles (si falla, abre el archivo con Notepad y copia):

   ```powershell
   Get-Content .\supabase\migrations\0002_panel_access.sql -Raw | Set-Clipboard
   start https://supabase.com/dashboard/project/ptdpeuiuxikdjvizhgrx/sql/new
   ```

2. Pega en el SQL Editor y pulsa **Run**. Debe salir:
   `OK · clientes/pedidos protegidos`.
3. Ajusta el panel y el CLI para que envíen el header privado:

   ```powershell
   node scripts/patch-panel.mjs
   ```

4. Comprueba la seguridad:

   ```powershell
   npm run test:security
   ```

   Antes de 0002 marca **CRÍTICO** (anon podía escribir en `clientes`).
   Después debe dar **22/22 OK**.

---

## 2. Añadir la llave service_role (solo para tu equipo)

1. Supabase → **Project Settings → API**.
2. En “Project API keys” copia la llave **service_role** (la secreta).
3. Abre `.env.local` y déjala así:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu_llave...
```

> 🔒 Esta llave **salta las reglas de seguridad (RLS)**. Úsala solo en tu
> computador o en scripts locales. Nunca la pongas en el navegador, en un
> repositorio público ni la compartas por chat.

La llave **anon** que ya está en `.env.local` sí puede viajar al navegador:
solo puede ejecutar la función `submit_cv`, no leer los CV.

---

## 3. Ejecutar el formulario

```powershell
cd C:\Users\JACOB\cv-formulario
npm install
npm run dev
```

Abre <http://localhost:5173>. Para probar la versión de producción:

```powershell
npm run build
npm run preview
```

---

## 4. Verificar la base de datos

```powershell
npm run db:verify
```

Debe mostrar algo como:

```text
OK  Función submit_cv disponible (rechazo controlado: EMAIL_INVALIDO).
OK  La llave anon no puede leer cv_submissions (RLS activo).
OK  service_role puede leer cv_full (0 CV).
OK  Vista cv_full y tablas hijas accesibles.
```

Si dice **“La migración no está aplicada”**, repite el paso 1.

---

## 5. Prueba real de guardado (recomendado)

```powershell
npm run db:smoke
```

Crea un CV de prueba, comprueba que se guardaron la cabecera, la experiencia,
las habilidades y el consentimiento, y luego lo borra. No deja residuos.

Resultado esperado:

```text
OK  Insertado con folio CV-...
OK  Contenido verificado: cabecera, experiencia, habilidades y consentimiento.
OK  Registro de prueba eliminado (sin residuos).
```

---

## 6. Consultar y exportar los CV

```powershell
npm run db:list                          # últimos 100, en tabla
npm run db:show -- CV-2601-ABC123        # un CV completo en JSON
npm run db:export                        # exports/cvs-AAAA-MM-DD.json + .csv
```

También puedes consultarlos en Supabase → **Table Editor → cv_submissions**
o en **SQL Editor**:

```sql
select public_id, full_name, email, created_at
from public.cv_submissions
order by created_at desc;
```

Para ver el CV completo en una fila:

```sql
select * from public.cv_full where public_id = 'CV-2601-ABC123';
```

---

## 7. Publicar en GitHub Pages

El repositorio ya está creado con el workflow de GitHub Actions:

- Código: <https://github.com/EsTuCvDigital/cvdigital-formulario>
- Web: <https://estucvdigital.github.io/cvdigital-formulario/>
- Secretos del repo: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Pasos:

1. Aplica **0002** (paso 1b). Sin eso no se publica.
2. Dispara el workflow:

   ```powershell
   gh workflow run deploy.yml --repo EsTuCvDigital/cvdigital-formulario
   gh run list --repo EsTuCvDigital/cvdigital-formulario --limit 3
   ```

3. Cuando el run termine en verde, abre
   <https://estucvdigital.github.io/cvdigital-formulario/>.

El workflow `.github/workflows/deploy.yml` se ejecuta en cada `push` a `main`
(o a mano), compila con `VITE_BASE=/cvdigital-formulario/`, inyecta las variables
desde los secretos y publica `dist/` como artefacto de Pages. **Nunca** pone
`service_role` en el frontend.

Alternativa Vercel/Netlify: build `npm run build`, publish `dist`, con las
mismas variables `VITE_*`.

Antes de publicar:

- Cambia el correo de privacidad en `src/lib/constants.ts` (`PRIVACY_CONTACT`).
- Revisa el texto de consentimiento con tu responsable legal.

---

## 8. Si más adelante quieres otra base

1. Crea un proyecto nuevo en Supabase.
2. Ejecuta allí `0001_formulario_cv.sql`.
3. Cambia en `.env.local`:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
4. Reinicia `npm run dev`.

No hay que tocar el código.

---

## 9. Problemas comunes

| Síntoma | Causa | Solución |
|---|---|---|
| “La base de datos todavía no tiene el formulario instalado” | Falta el SQL | Ejecuta `supabase/migrations/0001_formulario_cv.sql` |
| `Supabase 401` al listar | Llave incorrecta o falta service_role | Revisa `.env.local` |
| `permission denied for table cv_submissions` con anon | Es correcto: RLS bloquea la lectura | Usa `service_role` solo en scripts |
| El panel o `cvdb.mjs` da 401/403 después de 0002 | Falta el header `x-panel-key` | Ejecuta `node scripts/patch-panel.mjs` |
| `qa/security.mjs` marca CRÍTICO en `clientes` | Falta ejecutar 0002 | Ejecuta `0002_panel_access.sql` en Supabase |
| El formulario dice “Modo local sin Supabase” | Faltan `VITE_*` o el servidor no se reinició | Completa `.env.local` y reinicia `npm run dev` |
| “Ya recibimos varios envíos con este correo hoy” | Límite anti-abuso (5 al día) | Espera 24 h o borra la fila de `cv_submission_log` de ese correo (solo guarda un hash) |
| El enlace de LinkedIn se guarda sin `https://` | No saliste del campo | El formulario lo completa al salir; también se normaliza al enviar |
| `createHash` / error al ejecutar scripts | Node < 20 | Actualiza Node (probado con Node 24) |
| `email rate limit exceeded` en Supabase | No aplica: no usamos correos de Auth | — |

---

## 10. Comandos de referencia

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor local con recarga |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve `dist/` en :4173 |
| `npm run typecheck` | Revisa TypeScript |
| `npm test` | Pruebas unitarias del formulario (Vitest) |
| `npm run test:sql` | Prueba el SQL en un Postgres embebido (PGlite) |
| `npm run test:security` | Auditoría real de RLS, RPC e inyecciones |
| `npm run qa` | Pruebas visuales con Playwright (requiere `npm run preview`) |
| `npm run db:verify` | Comprueba migración, RLS y llaves |
| `npm run db:list` | Lista los CV |
| `npm run db:show -- <folio>` | Muestra un CV completo |
| `npm run db:export` | Exporta JSON + CSV |
| `npm run db:smoke` | Prueba real de escritura y limpieza |

Para borrar un CV concreto (irreversible):

```powershell
node scripts/cvadmin.mjs delete CV-2601-ABC123 --yes
```
