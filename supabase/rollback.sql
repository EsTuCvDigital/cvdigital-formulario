-- ============================================================================
--  ROLLBACK de la migración 0001
--  ¡BORRA TODOS LOS CV RECIBIDOS! Úsalo solo en pruebas o si necesitas
--  reinstalar desde cero. No toca `clientes` ni `pedidos`.
-- ============================================================================

drop view if exists public.cv_full;

drop function if exists public.submit_cv(jsonb);
drop function if exists public._cv_arr(jsonb, text);
drop function if exists public._cv_txt(jsonb, text, integer);
drop function if exists public._cv_ml(jsonb, text, integer);
drop function if exists public._cv_bool(jsonb, text);
drop function if exists public._cv_num(jsonb, text, numeric, numeric);
drop function if exists public._cv_int(jsonb, text, integer, integer);
drop function if exists public._cv_month(jsonb, text);
drop function if exists public._cv_url(jsonb, text, integer);
drop function if exists public._cv_str_arr(jsonb, integer, integer);
drop function if exists public.cv_touch_updated_at();

drop table if exists public.cv_references;
drop table if exists public.cv_volunteering;
drop table if exists public.cv_projects;
drop table if exists public.cv_credentials;
drop table if exists public.cv_languages;
drop table if exists public.cv_skills;
drop table if exists public.cv_education;
drop table if exists public.cv_experiences;
drop table if exists public.cv_submission_log;
drop table if exists public.cv_submissions;
