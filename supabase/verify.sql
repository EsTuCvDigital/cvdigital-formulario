-- ============================================================================
--  Verificación de la migración 0001
--  Ejecuta TODO este archivo en el SQL Editor después de la migración.
--  Todo debe salir "OK" en la columna estado.
-- ============================================================================

with checks as (
  select 'tabla cv_submissions' as revision,
         to_regclass('public.cv_submissions') is not null as ok
  union all
  select 'tabla cv_experiences', to_regclass('public.cv_experiences') is not null
  union all
  select 'tabla cv_education', to_regclass('public.cv_education') is not null
  union all
  select 'tabla cv_skills', to_regclass('public.cv_skills') is not null
  union all
  select 'tabla cv_languages', to_regclass('public.cv_languages') is not null
  union all
  select 'tabla cv_credentials', to_regclass('public.cv_credentials') is not null
  union all
  select 'tabla cv_projects', to_regclass('public.cv_projects') is not null
  union all
  select 'tabla cv_volunteering', to_regclass('public.cv_volunteering') is not null
  union all
  select 'tabla cv_references', to_regclass('public.cv_references') is not null
  union all
  select 'tabla cv_submission_log', to_regclass('public.cv_submission_log') is not null
  union all
  select 'vista cv_full', to_regclass('public.cv_full') is not null
  union all
  select 'función submit_cv', to_regprocedure('public.submit_cv(jsonb)') is not null
  union all
  select 'RLS activo en cv_submissions',
         coalesce((select relrowsecurity from pg_class where oid = 'public.cv_submissions'::regclass), false)
  union all
  select 'RLS activo en cv_references',
         coalesce((select relrowsecurity from pg_class where oid = 'public.cv_references'::regclass), false)
  union all
  select 'anon SIN permiso de lectura en cv_submissions',
         not has_table_privilege('anon', 'public.cv_submissions', 'select')
  union all
  select 'anon SIN permiso de escritura en cv_submissions',
         not has_table_privilege('anon', 'public.cv_submissions', 'insert')
  union all
  select 'anon PUEDE ejecutar submit_cv',
         has_function_privilege('anon', 'public.submit_cv(jsonb)', 'execute')
  union all
  select 'anon NO puede leer la vista cv_full',
         not has_table_privilege('anon', 'public.cv_full', 'select')
  union all
  select 'políticas RLS creadas (deben ser 0)',
         (select count(*) from pg_policies where schemaname = 'public' and tablename like 'cv_%') = 0
)
select revision, case when ok then 'OK' else 'REVISAR' end as estado
from checks
order by ok, revision;

-- Prueba de rechazo: un envío vacío NO debe crear filas.
select public.submit_cv('{}'::jsonb) as prueba_envio_vacio;

-- Conteos (deben existir las columnas y empezar en 0).
select
  (select count(*) from public.cv_submissions) as cvs,
  (select count(*) from public.cv_experiences) as experiencias,
  (select count(*) from public.cv_education) as estudios,
  (select count(*) from public.cv_skills) as habilidades;

-- Verifica que la vista arroja el JSON completo.
select public_id, full_name, experiences, skills
from public.cv_full
limit 1;
