-- ============================================================================
--  CVDigital · Formulario de perfil profesional
--  Migración 0001 — esquema, seguridad (RLS) y función de envío
-- ----------------------------------------------------------------------------
--  CÓMO APLICARLA
--  1. Abre el proyecto en https://supabase.com
--  2. SQL Editor → New query
--  3. Pega TODO este archivo y pulsa Run
--  4. Ejecuta después supabase/verify.sql y revisa que todo diga OK
--
--  Es idempotente: puedes volver a ejecutarla sin romper nada.
--
--  SEGURIDAD
--  - El rol `anon` (el que viaja en el navegador) NO puede leer ni escribir
--    directamente estas tablas: RLS activo y sin políticas.
--  - El formulario escribe únicamente por la función `submit_cv(jsonb)`,
--    que valida, limita y evita duplicados.
--  - Solo `service_role` (scripts locales) puede leer los datos.
--  - NO se modifican las tablas existentes `clientes` ni `pedidos`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla principal
-- ----------------------------------------------------------------------------
create table if not exists public.cv_submissions (
  id                     uuid primary key default gen_random_uuid(),
  public_id              text not null unique
                         default ('CV-' || to_char(now(), 'YYMM') || '-' ||
                                  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  status                 text not null default 'new'
                         check (status in ('new', 'review', 'contacted', 'in_progress', 'delivered', 'archived')),
  source                 text not null default 'formulario_web',
  locale                 text not null default 'es-CO',
  cv_language            text not null default 'es' check (cv_language in ('es', 'en', 'both')),

  -- Identidad y contacto
  email                  text not null check (
                           char_length(email) <= 254
                           and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
                         ),
  full_name              text not null check (char_length(full_name) between 2 and 120),
  phone                  text check (phone is null or char_length(phone) <= 40),
  city                   text check (city is null or char_length(city) <= 80),
  region                 text check (region is null or char_length(region) <= 80),
  country                text check (country is null or char_length(country) <= 80),
  linkedin_url           text check (linkedin_url is null or (char_length(linkedin_url) <= 400 and linkedin_url ~* '^https?://')),
  portfolio_url          text check (portfolio_url is null or (char_length(portfolio_url) <= 400 and portfolio_url ~* '^https?://')),
  github_url             text check (github_url is null or (char_length(github_url) <= 400 and github_url ~* '^https?://')),

  -- Perfil profesional
  headline               text check (headline is null or char_length(headline) <= 160),
  experience_level       text not null
                         check (experience_level in ('estudiante', 'primer_empleo', 'junior', 'intermedio', 'senior', 'ejecutivo', 'cambio_carrera')),
  years_experience       numeric(4, 1) check (years_experience is null or years_experience between 0 and 60),
  summary                text check (summary is null or char_length(summary) <= 2000),
  job_url                text check (job_url is null or (char_length(job_url) <= 400 and job_url ~* '^https?://')),
  job_description        text check (job_description is null or char_length(job_description) <= 3000),

  -- Disponibilidad
  availability           text check (availability is null or availability in ('inmediata', '15d', '30d', '60d', 'convenir')),
  work_modalities        text[] not null default '{}',
  work_schedule          text check (work_schedule is null or work_schedule in ('completo', 'medio', 'horas', 'freelance')),
  relocation             text check (relocation is null or relocation in ('si', 'no', 'evaluar')),
  travel                 text check (travel is null or travel in ('si', 'no', 'ocasional')),

  -- Rutas alternativas (primer empleo / sin estudios formales)
  has_formal_experience  boolean not null default true,
  career_gap_note        text check (career_gap_note is null or char_length(career_gap_note) <= 600),
  has_formal_education   boolean not null default true,
  soft_skills_extra      text check (soft_skills_extra is null or char_length(soft_skills_extra) <= 240),

  -- Extras
  interests              text check (interests is null or char_length(interests) <= 500),
  reference_preference   text check (reference_preference is null or reference_preference in ('incluir', 'solicitud', 'no')),
  team_notes             text check (team_notes is null or char_length(team_notes) <= 1200),

  -- Consentimiento (Ley 1581 de 2012 / GDPR)
  consent_accepted       boolean not null default false,
  consent_version        text not null default '2026-01',
  consent_text           text check (consent_text is null or char_length(consent_text) <= 2000),
  consent_at             timestamptz,
  marketing_opt_in       boolean not null default false,
  truth_confirmed        boolean not null default false,

  -- Gestión interna
  admin_notes            text,
  constraint cv_submissions_consent_required check (consent_accepted = true)
);

comment on table public.cv_submissions is
  'Respuestas del formulario de perfil profesional. Escritura solo vía submit_cv(); lectura solo service_role.';

-- ----------------------------------------------------------------------------
-- 2. Tablas hijas
-- ----------------------------------------------------------------------------
create table if not exists public.cv_experiences (
  id              uuid primary key default gen_random_uuid(),
  cv_id           uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order      integer not null default 0,
  company         text not null check (char_length(company) between 1 and 160),
  role            text not null check (char_length(role) between 1 and 160),
  employment_type text check (employment_type is null or employment_type in
                    ('completo', 'medio', 'temporal', 'practicas', 'freelance', 'obra', 'independiente', 'otro')),
  modality        text check (modality is null or modality in ('presencial', 'hibrido', 'remoto')),
  location        text check (location is null or char_length(location) <= 120),
  start_date      date,
  end_date        date,
  is_current      boolean not null default false,
  context         text check (context is null or char_length(context) <= 800),
  achievements    text[] not null default '{}',
  tools           text check (tools is null or char_length(tools) <= 300),
  created_at      timestamptz not null default now(),
  constraint cv_experiences_current_has_no_end check (not is_current or end_date is null),
  constraint cv_experiences_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.cv_education (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order   integer not null default 0,
  level        text not null check (level in
                 ('primaria', 'secundaria', 'tecnico', 'tecnologo', 'pregrado',
                  'especializacion', 'maestria', 'doctorado', 'bootcamp', 'otro')),
  institution  text not null check (char_length(institution) between 1 and 160),
  program      text not null check (char_length(program) between 1 and 160),
  field_of_study text check (field_of_study is null or char_length(field_of_study) <= 120),
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  average      text check (average is null or char_length(average) <= 40),
  description  text check (description is null or char_length(description) <= 800),
  created_at   timestamptz not null default now(),
  constraint cv_education_current_has_no_end check (not is_current or end_date is null),
  constraint cv_education_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.cv_skills (
  id         uuid primary key default gen_random_uuid(),
  cv_id      uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order integer not null default 0,
  kind       text not null check (kind in ('technical', 'soft')),
  name       text not null check (char_length(name) between 1 and 100),
  category   text check (category is null or char_length(category) <= 80),
  level      integer check (level is null or level between 1 and 5),
  years      integer check (years is null or years between 0 and 50),
  created_at timestamptz not null default now()
);

create table if not exists public.cv_languages (
  id            uuid primary key default gen_random_uuid(),
  cv_id         uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order    integer not null default 0,
  name          text not null check (char_length(name) between 1 and 80),
  level         text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'nativo')),
  certification text check (certification is null or char_length(certification) <= 120),
  created_at    timestamptz not null default now()
);

create table if not exists public.cv_credentials (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order   integer not null default 0,
  kind         text not null check (kind in ('certification', 'publication', 'award')),
  subtype      text check (subtype is null or char_length(subtype) <= 80),
  title        text not null check (char_length(title) between 1 and 250),
  issuer       text check (issuer is null or char_length(issuer) <= 200),
  date_issued  date,
  date_expires date,
  hours        integer check (hours is null or hours between 1 and 10000),
  url          text check (url is null or (char_length(url) <= 400 and url ~* '^https?://')),
  doi          text check (doi is null or char_length(doi) <= 120),
  authors      text check (authors is null or char_length(authors) <= 600),
  description  text check (description is null or char_length(description) <= 800),
  created_at   timestamptz not null default now(),
  constraint cv_credentials_dates_order check (date_expires is null or date_issued is null or date_expires >= date_issued)
);

create table if not exists public.cv_projects (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order   integer not null default 0,
  name         text not null check (char_length(name) between 1 and 160),
  project_type text check (project_type is null or project_type in
                 ('academico', 'personal', 'freelance', 'open_source', 'investigacion')),
  role         text check (role is null or char_length(role) <= 120),
  description  text check (description is null or char_length(description) <= 1200),
  achievements text[] not null default '{}',
  tools        text check (tools is null or char_length(tools) <= 300),
  url          text check (url is null or (char_length(url) <= 400 and url ~* '^https?://')),
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint cv_projects_current_has_no_end check (not is_current or end_date is null),
  constraint cv_projects_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.cv_volunteering (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order   integer not null default 0,
  organization text not null check (char_length(organization) between 1 and 160),
  role         text not null check (char_length(role) between 1 and 120),
  cause        text check (cause is null or cause in
                 ('educacion', 'salud', 'ambiente', 'comunidad', 'animal', 'cultural', 'deportivo', 'otro')),
  start_date   date,
  end_date     date,
  is_current   boolean not null default false,
  achievements text[] not null default '{}',
  hours        integer check (hours is null or hours between 1 and 20000),
  created_at   timestamptz not null default now(),
  constraint cv_volunteering_current_has_no_end check (not is_current or end_date is null),
  constraint cv_volunteering_dates_order check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.cv_references (
  id         uuid primary key default gen_random_uuid(),
  cv_id      uuid not null references public.cv_submissions(id) on delete cascade,
  sort_order integer not null default 0,
  name       text not null check (char_length(name) between 1 and 160),
  role       text check (role is null or char_length(role) <= 120),
  company    text check (company is null or char_length(company) <= 160),
  relationship text check (relationship is null or relationship in ('jefe', 'colega', 'cliente', 'profesor', 'otro')),
  email      text check (email is null or (char_length(email) <= 254 and email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')),
  phone      text check (phone is null or char_length(phone) <= 40),
  consent_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint cv_references_third_party_consent check (consent_confirmed = true)
);

-- ----------------------------------------------------------------------------
-- 3. Bitácora anti-abuso (no contiene el correo en claro)
-- ----------------------------------------------------------------------------
create table if not exists public.cv_submission_log (
  id         bigint generated always as identity primary key,
  email_hash text not null,
  created_at timestamptz not null default now(),
  outcome    text not null default 'accepted'
);

create index if not exists cv_submission_log_email_idx
  on public.cv_submission_log (email_hash, created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Índices
-- ----------------------------------------------------------------------------
create index if not exists cv_submissions_created_idx on public.cv_submissions (created_at desc);
create index if not exists cv_submissions_status_idx on public.cv_submissions (status, created_at desc);
create index if not exists cv_submissions_email_idx on public.cv_submissions (lower(email));

create index if not exists cv_experiences_cv_idx on public.cv_experiences (cv_id, sort_order);
create index if not exists cv_education_cv_idx on public.cv_education (cv_id, sort_order);
create index if not exists cv_skills_cv_idx on public.cv_skills (cv_id, kind, sort_order);
create index if not exists cv_languages_cv_idx on public.cv_languages (cv_id, sort_order);
create index if not exists cv_credentials_cv_idx on public.cv_credentials (cv_id, kind, sort_order);
create index if not exists cv_projects_cv_idx on public.cv_projects (cv_id, sort_order);
create index if not exists cv_volunteering_cv_idx on public.cv_volunteering (cv_id, sort_order);
create index if not exists cv_references_cv_idx on public.cv_references (cv_id, sort_order);

create unique index if not exists cv_skills_unique_name_idx
  on public.cv_skills (cv_id, kind, lower(name));
create unique index if not exists cv_languages_unique_name_idx
  on public.cv_languages (cv_id, lower(name));

-- ----------------------------------------------------------------------------
-- 5. Seguridad: RLS activo sin políticas (nadie lee/escribe directo)
-- ----------------------------------------------------------------------------
alter table public.cv_submissions     enable row level security;
alter table public.cv_experiences     enable row level security;
alter table public.cv_education       enable row level security;
alter table public.cv_skills          enable row level security;
alter table public.cv_languages       enable row level security;
alter table public.cv_credentials     enable row level security;
alter table public.cv_projects        enable row level security;
alter table public.cv_volunteering    enable row level security;
alter table public.cv_references      enable row level security;
alter table public.cv_submission_log  enable row level security;

revoke all on table public.cv_submissions     from anon, authenticated;
revoke all on table public.cv_experiences     from anon, authenticated;
revoke all on table public.cv_education       from anon, authenticated;
revoke all on table public.cv_skills          from anon, authenticated;
revoke all on table public.cv_languages       from anon, authenticated;
revoke all on table public.cv_credentials     from anon, authenticated;
revoke all on table public.cv_projects        from anon, authenticated;
revoke all on table public.cv_volunteering    from anon, authenticated;
revoke all on table public.cv_references      from anon, authenticated;
revoke all on table public.cv_submission_log  from anon, authenticated;
revoke all on sequence public.cv_submission_log_id_seq from anon, authenticated;

grant all on table public.cv_submissions     to service_role;
grant all on table public.cv_experiences     to service_role;
grant all on table public.cv_education       to service_role;
grant all on table public.cv_skills          to service_role;
grant all on table public.cv_languages       to service_role;
grant all on table public.cv_credentials     to service_role;
grant all on table public.cv_projects        to service_role;
grant all on table public.cv_volunteering    to service_role;
grant all on table public.cv_references      to service_role;
grant all on table public.cv_submission_log  to service_role;
grant usage, select on sequence public.cv_submission_log_id_seq to service_role;

-- ----------------------------------------------------------------------------
-- 6. Funciones auxiliares de saneamiento
-- ----------------------------------------------------------------------------
create or replace function public._cv_arr(payload jsonb, k text)
returns jsonb
language sql
immutable
as $$
  select case when jsonb_typeof(payload -> k) = 'array' then payload -> k else '[]'::jsonb end;
$$;

create or replace function public._cv_txt(payload jsonb, k text, max_len integer)
returns text
language sql
immutable
as $$
  select nullif(
           left(btrim(regexp_replace(coalesce(payload ->> k, ''), '[[:space:]]+', ' ', 'g')), max_len),
           ''
         );
$$;

create or replace function public._cv_ml(payload jsonb, k text, max_len integer)
returns text
language sql
immutable
as $$
  select nullif(left(btrim(coalesce(payload ->> k, '')), max_len), '');
$$;

create or replace function public._cv_bool(payload jsonb, k text)
returns boolean
language sql
immutable
as $$
  select case lower(coalesce(payload ->> k, ''))
           when 'true' then true
           when 'false' then false
           else false
         end;
$$;

create or replace function public._cv_num(payload jsonb, k text, lo numeric, hi numeric)
returns numeric
language sql
immutable
as $$
  select case
           when coalesce(payload ->> k, '') ~ '^[0-9]{1,3}([.,][0-9]{1,2})?$'
             then least(greatest(replace(payload ->> k, ',', '.')::numeric, lo), hi)
           else null
         end;
$$;

create or replace function public._cv_int(payload jsonb, k text, lo integer, hi integer)
returns integer
language sql
immutable
as $$
  select case
           when coalesce(payload ->> k, '') ~ '^[0-9]{1,3}$'
             then least(greatest((payload ->> k)::integer, lo), hi)
           else null
         end;
$$;

create or replace function public._cv_month(payload jsonb, k text)
returns date
language plpgsql
immutable
as $$
declare
  v text := nullif(btrim(coalesce(payload ->> k, '')), '');
begin
  if v is null then
    return null;
  end if;
  if v !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' then
    raise exception 'FECHA_INVALIDA:%', k using errcode = '22007';
  end if;
  return to_date(v || '-01', 'YYYY-MM-DD');
end;
$$;

create or replace function public._cv_url(payload jsonb, k text, max_len integer)
returns text
language plpgsql
immutable
as $$
declare
  v text := nullif(btrim(coalesce(payload ->> k, '')), '');
begin
  if v is null then
    return null;
  end if;
  v := left(v, max_len);
  if v !~* '^https?://' then
    raise exception 'URL_INVALIDA:%', k using errcode = '22023';
  end if;
  return v;
end;
$$;

create or replace function public._cv_str_arr(value jsonb, max_items integer, max_len integer)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(left(btrim(s.v), max_len)), '{}')
  from (
    select v
    from jsonb_array_elements_text(
           case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end
         ) as t(v)
    where btrim(v) <> ''
    limit max_items
  ) s;
$$;

revoke all on function public._cv_arr(jsonb, text) from public, anon, authenticated;
revoke all on function public._cv_txt(jsonb, text, integer) from public, anon, authenticated;
revoke all on function public._cv_ml(jsonb, text, integer) from public, anon, authenticated;
revoke all on function public._cv_bool(jsonb, text) from public, anon, authenticated;
revoke all on function public._cv_num(jsonb, text, numeric, numeric) from public, anon, authenticated;
revoke all on function public._cv_int(jsonb, text, integer, integer) from public, anon, authenticated;
revoke all on function public._cv_month(jsonb, text) from public, anon, authenticated;
revoke all on function public._cv_url(jsonb, text, integer) from public, anon, authenticated;
revoke all on function public._cv_str_arr(jsonb, integer, integer) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. Función pública de envío
-- ----------------------------------------------------------------------------
create or replace function public.submit_cv(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id            uuid;
  v_public_id     text;
  v_email         text;
  v_email_hash    text;
  v_count         integer;
  v_last          timestamptz;
  v_item          jsonb;
  v_ord           integer;
  v_start         date;
  v_end           date;
  v_current       boolean;
  v_name          text;
  v_kind          text;
  v_company       text;
  v_role          text;
  v_title         text;
  v_level         text;
  v_country       text;
  v_modalities    text[];
begin
  -- 7.1 Forma y tamaño -------------------------------------------------------
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return jsonb_build_object('ok', false, 'code', 'FORMATO_INVALIDO');
  end if;

  if pg_column_size(payload) > 150000 then
    return jsonb_build_object('ok', false, 'code', 'PAYLOAD_GRANDE');
  end if;

  -- 7.2 Trampa anti-bots (campo oculto que una persona nunca llena) ----------
  if nullif(btrim(coalesce(payload ->> 'honeypot', '')), '') is not null then
    return jsonb_build_object('ok', true, 'publicId', 'CV-000000', 'silent', true);
  end if;

  -- 7.3 Datos mínimos --------------------------------------------------------
  v_email := lower(coalesce(public._cv_txt(payload, 'email', 254), ''));
  if v_email = '' or v_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    return jsonb_build_object('ok', false, 'code', 'EMAIL_INVALIDO');
  end if;

  if public._cv_bool(payload, 'consent') is not true then
    return jsonb_build_object('ok', false, 'code', 'SIN_CONSENTIMIENTO');
  end if;

  if public._cv_txt(payload, 'fullName', 120) is null then
    return jsonb_build_object('ok', false, 'code', 'DATOS_INCOMPLETOS', 'field', 'fullName');
  end if;

  if coalesce(public._cv_txt(payload, 'level', 40), '') not in
     ('estudiante', 'primer_empleo', 'junior', 'intermedio', 'senior', 'ejecutivo', 'cambio_carrera') then
    return jsonb_build_object('ok', false, 'code', 'DATOS_INCOMPLETOS', 'field', 'level');
  end if;

  -- 7.4 Límite de envíos por correo -----------------------------------------
  v_email_hash := md5(v_email);

  select count(*), max(created_at)
    into v_count, v_last
    from public.cv_submission_log
   where email_hash = v_email_hash
     and created_at > now() - interval '24 hours';

  if v_count >= 5 then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;

  if v_last is not null and v_last > now() - interval '45 seconds' then
    return jsonb_build_object('ok', false, 'code', 'TOO_SOON');
  end if;

  -- 7.5 País ----------------------------------------------------------------
  v_country := public._cv_txt(payload, 'country', 80);

  -- 7.6 Modalidades ----------------------------------------------------------
  select coalesce(array_agg(distinct value), '{}')
    into v_modalities
    from jsonb_array_elements_text(public._cv_arr(payload, 'modalities')) as t(value)
   where value in ('presencial', 'hibrido', 'remoto');

  -- 7.7 Insertar cabecera ----------------------------------------------------
  insert into public.cv_submissions (
    email, full_name, phone, city, region, country,
    linkedin_url, portfolio_url, github_url,
    headline, experience_level, years_experience, summary,
    job_url, job_description,
    availability, work_modalities, work_schedule, relocation, travel,
    has_formal_experience, career_gap_note, has_formal_education,
    soft_skills_extra, interests, reference_preference, team_notes,
    consent_accepted, consent_version, consent_text, consent_at,
    marketing_opt_in, truth_confirmed, cv_language
  ) values (
    v_email,
    public._cv_txt(payload, 'fullName', 120),
    public._cv_txt(payload, 'phone', 40),
    public._cv_txt(payload, 'city', 80),
    public._cv_txt(payload, 'region', 80),
    v_country,
    public._cv_url(payload, 'linkedin', 400),
    public._cv_url(payload, 'portfolio', 400),
    public._cv_url(payload, 'github', 400),
    public._cv_txt(payload, 'headline', 160),
    public._cv_txt(payload, 'level', 40),
    public._cv_num(payload, 'years', 0, 60),
    public._cv_ml(payload, 'summary', 2000),
    public._cv_url(payload, 'jobUrl', 400),
    public._cv_ml(payload, 'jobDescription', 3000),
    public._cv_txt(payload, 'availability', 20),
    v_modalities,
    public._cv_txt(payload, 'schedule', 20),
    public._cv_txt(payload, 'relocation', 20),
    public._cv_txt(payload, 'travel', 20),
    not public._cv_bool(payload, 'noFormalExperience'),
    public._cv_ml(payload, 'careerGap', 600),
    not public._cv_bool(payload, 'noFormalEducation'),
    public._cv_txt(payload, 'softSkillsOther', 240),
    public._cv_ml(payload, 'interests', 500),
    public._cv_txt(payload, 'referencePreference', 20),
    public._cv_ml(payload, 'teamNotes', 1200),
    true,
    coalesce(public._cv_txt(payload, 'consentVersion', 40), '2026-01'),
    public._cv_ml(payload, 'consentText', 2000),
    now(),
    public._cv_bool(payload, 'marketingOptIn'),
    public._cv_bool(payload, 'truthConfirmed'),
    coalesce(public._cv_txt(payload, 'cvLanguage', 10), 'es')
  )
  returning id, public_id into v_id, v_public_id;

  -- 7.8 Experiencia ----------------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'experiences'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 20;
    v_company := public._cv_txt(v_item, 'company', 160);
    v_role    := public._cv_txt(v_item, 'role', 160);
    if v_company is null or v_role is null then
      continue;
    end if;

    v_start   := public._cv_month(v_item, 'start');
    v_end     := public._cv_month(v_item, 'end');
    v_current := public._cv_bool(v_item, 'current');

    if v_current then
      v_end := null;
    end if;
    if v_end is not null and v_start is not null and v_end < v_start then
      v_end := null;
    end if;

    v_ord := v_ord + 1;
    insert into public.cv_experiences (
      cv_id, sort_order, company, role, employment_type, modality, location,
      start_date, end_date, is_current, context, achievements, tools
    ) values (
      v_id, v_ord, left(v_company, 160), left(v_role, 160),
      public._cv_txt(v_item, 'employmentType', 30),
      public._cv_txt(v_item, 'modality', 30),
      public._cv_txt(v_item, 'location', 120),
      v_start, v_end, v_current,
      public._cv_ml(v_item, 'context', 800),
      public._cv_str_arr(v_item -> 'achievements', 6, 300),
      public._cv_txt(v_item, 'tools', 300)
    );
  end loop;

  -- 7.9 Educación ------------------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'education'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 15;
    v_level := public._cv_txt(v_item, 'level', 30);
    if v_level is null or v_level not in
       ('primaria', 'secundaria', 'tecnico', 'tecnologo', 'pregrado',
        'especializacion', 'maestria', 'doctorado', 'bootcamp', 'otro') then
      continue;
    end if;

    v_start   := public._cv_month(v_item, 'start');
    v_end     := public._cv_month(v_item, 'end');
    v_current := public._cv_bool(v_item, 'current');

    if v_current then
      v_end := null;
    end if;
    if v_end is not null and v_start is not null and v_end < v_start then
      v_end := null;
    end if;

    v_ord := v_ord + 1;
    insert into public.cv_education (
      cv_id, sort_order, level, institution, program, field_of_study,
      start_date, end_date, is_current, average, description
    ) values (
      v_id, v_ord, v_level,
      coalesce(public._cv_txt(v_item, 'institution', 160), 'Sin especificar'),
      coalesce(public._cv_txt(v_item, 'program', 160), 'Sin especificar'),
      public._cv_txt(v_item, 'field', 120),
      v_start, v_end, v_current,
      public._cv_txt(v_item, 'average', 40),
      public._cv_ml(v_item, 'description', 800)
    );
  end loop;

  -- 7.10 Habilidades técnicas ------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'technicalSkills'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 80;
    v_name := public._cv_txt(v_item, 'name', 100);
    if v_name is null then
      continue;
    end if;
    v_ord := v_ord + 1;
    insert into public.cv_skills (cv_id, sort_order, kind, name, category, level, years)
    values (
      v_id, v_ord, 'technical', v_name,
      public._cv_txt(v_item, 'category', 80),
      coalesce(public._cv_int(v_item, 'level', 1, 5), 3),
      public._cv_int(v_item, 'years', 0, 50)
    )
    on conflict (cv_id, kind, lower(name)) do nothing;
  end loop;

  -- 7.11 Habilidades blandas -------------------------------------------------
  v_ord := 0;
  for v_name in
    select distinct btrim(value)
    from jsonb_array_elements_text(public._cv_arr(payload, 'softSkills')) as t(value)
    where btrim(value) <> ''
    limit 30
  loop
    v_ord := v_ord + 1;
    insert into public.cv_skills (cv_id, sort_order, kind, name, category, level, years)
    values (v_id, 100 + v_ord, 'soft', left(v_name, 100), 'blanda', null, null)
    on conflict (cv_id, kind, lower(name)) do nothing;
  end loop;

  -- 7.12 Idiomas -------------------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'languages'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 15;
    v_name  := public._cv_txt(v_item, 'name', 80);
    v_level := public._cv_txt(v_item, 'level', 10);
    if v_name is null or v_level is null or v_level not in
       ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'nativo') then
      continue;
    end if;
    v_ord := v_ord + 1;
    insert into public.cv_languages (cv_id, sort_order, name, level, certification)
    values (v_id, v_ord, v_name, v_level, public._cv_txt(v_item, 'certification', 120))
    on conflict (cv_id, lower(name)) do nothing;
  end loop;

  -- 7.13 Certificaciones, publicaciones y premios ----------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'credentials'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 60;
    v_kind  := public._cv_txt(v_item, 'kind', 30);
    v_title := public._cv_txt(v_item, 'title', 250);
    if v_title is null or v_kind is null or v_kind not in ('certification', 'publication', 'award') then
      continue;
    end if;
    v_ord := v_ord + 1;
    insert into public.cv_credentials (
      cv_id, sort_order, kind, subtype, title, issuer,
      date_issued, date_expires, hours, url, doi, authors, description
    ) values (
      v_id, v_ord, v_kind,
      public._cv_txt(v_item, 'subtype', 80),
      v_title,
      public._cv_txt(v_item, 'issuer', 200),
      public._cv_month(v_item, 'date'),
      public._cv_month(v_item, 'expires'),
      public._cv_int(v_item, 'hours', 1, 10000),
      public._cv_url(v_item, 'url', 400),
      public._cv_txt(v_item, 'doi', 120),
      public._cv_txt(v_item, 'authors', 600),
      public._cv_ml(v_item, 'description', 800)
    );
  end loop;

  -- 7.14 Proyectos -----------------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'projects'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 30;
    v_title := public._cv_txt(v_item, 'name', 160);
    if v_title is null then
      continue;
    end if;

    v_start   := public._cv_month(v_item, 'start');
    v_end     := public._cv_month(v_item, 'end');
    v_current := public._cv_bool(v_item, 'current');

    if v_current then
      v_end := null;
    end if;
    if v_end is not null and v_start is not null and v_end < v_start then
      v_end := null;
    end if;

    v_ord := v_ord + 1;
    insert into public.cv_projects (
      cv_id, sort_order, name, project_type, role, description,
      achievements, tools, url, start_date, end_date, is_current
    ) values (
      v_id, v_ord, v_title,
      public._cv_txt(v_item, 'type', 30),
      public._cv_txt(v_item, 'role', 120),
      public._cv_ml(v_item, 'description', 1200),
      public._cv_str_arr(v_item -> 'achievements', 4, 300),
      public._cv_txt(v_item, 'tools', 300),
      public._cv_url(v_item, 'url', 400),
      v_start, v_end, v_current
    );
  end loop;

  -- 7.15 Voluntariado --------------------------------------------------------
  v_ord := 0;
  for v_item in
    select value
    from jsonb_array_elements(public._cv_arr(payload, 'volunteering'))
    with ordinality as t(value, ord)
    order by ord
  loop
    exit when v_ord >= 30;
    v_company := public._cv_txt(v_item, 'organization', 160);
    v_role    := public._cv_txt(v_item, 'role', 120);
    if v_company is null or v_role is null then
      continue;
    end if;

    v_start   := public._cv_month(v_item, 'start');
    v_end     := public._cv_month(v_item, 'end');
    v_current := public._cv_bool(v_item, 'current');

    if v_current then
      v_end := null;
    end if;
    if v_end is not null and v_start is not null and v_end < v_start then
      v_end := null;
    end if;

    v_ord := v_ord + 1;
    insert into public.cv_volunteering (
      cv_id, sort_order, organization, role, cause,
      start_date, end_date, is_current, achievements, hours
    ) values (
      v_id, v_ord, v_company, v_role,
      public._cv_txt(v_item, 'cause', 30),
      v_start, v_end, v_current,
      public._cv_str_arr(v_item -> 'achievements', 4, 300),
      public._cv_int(v_item, 'hours', 1, 20000)
    );
  end loop;

  -- 7.16 Referencias (solo con autorización del tercero) ---------------------
  if public._cv_txt(payload, 'referencePreference', 20) = 'incluir' then
    v_ord := 0;
    for v_item in
      select value
      from jsonb_array_elements(public._cv_arr(payload, 'references'))
      with ordinality as t(value, ord)
      order by ord
    loop
      exit when v_ord >= 10;
      v_name := public._cv_txt(v_item, 'name', 160);
      if v_name is null or public._cv_bool(v_item, 'consent') is not true then
        continue;
      end if;
      v_ord := v_ord + 1;
      insert into public.cv_references (
        cv_id, sort_order, name, role, company, relationship, email, phone, consent_confirmed
      ) values (
        v_id, v_ord, v_name,
        public._cv_txt(v_item, 'role', 120),
        public._cv_txt(v_item, 'company', 160),
        public._cv_txt(v_item, 'relationship', 30),
        public._cv_txt(v_item, 'email', 254),
        public._cv_txt(v_item, 'phone', 40),
        true
      );
    end loop;
  end if;

  -- 7.17 Bitácora ------------------------------------------------------------
  insert into public.cv_submission_log (email_hash, outcome) values (v_email_hash, 'accepted');

  return jsonb_build_object('ok', true, 'publicId', v_public_id);
end;
$$;

revoke all on function public.submit_cv(jsonb) from public;
grant execute on function public.submit_cv(jsonb) to anon, authenticated, service_role;

comment on function public.submit_cv(jsonb) is
  'Único punto de escritura del formulario público. Valida, sanea, limita duplicados y guarda el CV completo de forma atómica.';

-- ----------------------------------------------------------------------------
-- 8. Vista de lectura (solo service_role)
-- ----------------------------------------------------------------------------
create or replace view public.cv_full
with (security_invoker = true)
as
select
  s.*,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'company', e.company, 'role', e.role, 'employmentType', e.employment_type,
      'modality', e.modality, 'location', e.location,
      'start', to_char(e.start_date, 'YYYY-MM'), 'end', to_char(e.end_date, 'YYYY-MM'),
      'current', e.is_current, 'context', e.context,
      'achievements', to_jsonb(e.achievements), 'tools', e.tools
    ) order by e.sort_order)
    from public.cv_experiences e where e.cv_id = s.id
  ), '[]'::jsonb) as experiences,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'level', d.level, 'institution', d.institution, 'program', d.program,
      'field', d.field_of_study,
      'start', to_char(d.start_date, 'YYYY-MM'), 'end', to_char(d.end_date, 'YYYY-MM'),
      'current', d.is_current, 'average', d.average, 'description', d.description
    ) order by d.sort_order)
    from public.cv_education d where d.cv_id = s.id
  ), '[]'::jsonb) as education,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'kind', k.kind, 'name', k.name, 'category', k.category,
      'level', k.level, 'years', k.years
    ) order by k.sort_order)
    from public.cv_skills k where k.cv_id = s.id
  ), '[]'::jsonb) as skills,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', l.name, 'level', l.level, 'certification', l.certification
    ) order by l.sort_order)
    from public.cv_languages l where l.cv_id = s.id
  ), '[]'::jsonb) as languages,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'kind', c.kind, 'subtype', c.subtype, 'title', c.title, 'issuer', c.issuer,
      'date', to_char(c.date_issued, 'YYYY-MM'), 'expires', to_char(c.date_expires, 'YYYY-MM'),
      'hours', c.hours, 'url', c.url, 'doi', c.doi, 'authors', c.authors,
      'description', c.description
    ) order by c.sort_order)
    from public.cv_credentials c where c.cv_id = s.id
  ), '[]'::jsonb) as credentials,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', p.name, 'type', p.project_type, 'role', p.role,
      'description', p.description, 'achievements', to_jsonb(p.achievements),
      'tools', p.tools, 'url', p.url,
      'start', to_char(p.start_date, 'YYYY-MM'), 'end', to_char(p.end_date, 'YYYY-MM'),
      'current', p.is_current
    ) order by p.sort_order)
    from public.cv_projects p where p.cv_id = s.id
  ), '[]'::jsonb) as projects,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'organization', v.organization, 'role', v.role, 'cause', v.cause,
      'start', to_char(v.start_date, 'YYYY-MM'), 'end', to_char(v.end_date, 'YYYY-MM'),
      'current', v.is_current, 'achievements', to_jsonb(v.achievements), 'hours', v.hours
    ) order by v.sort_order)
    from public.cv_volunteering v where v.cv_id = s.id
  ), '[]'::jsonb) as volunteering,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', r.name, 'role', r.role, 'company', r.company,
      'relationship', r.relationship, 'email', r.email, 'phone', r.phone,
      'consentConfirmed', r.consent_confirmed
    ) order by r.sort_order)
    from public.cv_references r where r.cv_id = s.id
  ), '[]'::jsonb) as "references"
from public.cv_submissions s;

revoke all on table public.cv_full from anon, authenticated;
grant select on table public.cv_full to service_role;

comment on view public.cv_full is
  'CV completo en una sola fila (cabecera + secciones en JSON). Solo service_role.';

-- ----------------------------------------------------------------------------
-- 9. Actualización automática de updated_at
-- ----------------------------------------------------------------------------
create or replace function public.cv_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists cv_submissions_touch on public.cv_submissions;
create trigger cv_submissions_touch
  before update on public.cv_submissions
  for each row execute function public.cv_touch_updated_at();

-- ----------------------------------------------------------------------------
-- 10. Resumen
-- ----------------------------------------------------------------------------
do $$
begin
  raise notice 'OK · Formulario CV instalado: 10 tablas, 1 función (submit_cv), 1 vista (cv_full).';
end;
$$;

-- Fuerza a PostgREST a recargar el esquema para que la función y las tablas
-- estén disponibles de inmediato en la API.
notify pgrst, 'reload schema';
