-- ============================================================================
--  CVDigital · Migración 0002 — proteger clientes y pedidos
-- ----------------------------------------------------------------------------
--  PROBLEMA
--  La llave `anon` del proyecto (la que viaja al navegador) podía leer y
--  escribir `clientes` y `pedidos`. Al publicar el formulario en internet, esa
--  llave quedaría visible para cualquiera.
--
--  SOLUCIÓN
--  1. Se genera un secreto aleatorio en `panel_config` (no está en el repo).
--  2. `clientes` y `pedidos` activan RLS.
--  3. `anon` solo puede usarlas si envía el header `x-panel-key` con ese secreto.
--  4. El formulario público NO usa estas tablas: solo ejecuta `submit_cv`.
--
--  DESPUÉS DE EJECUTAR
--  - El panel admin debe enviar `x-panel-key` (scripts/patch-panel.mjs lo hace).
--  - El CLI de CVDigital debe llevar `PANEL_KEY` en su .env.
--  - Si algo falla, el panel/CLI mostrarán 401/403 hasta aplicar el header.
--
--  Es idempotente: puedes volver a ejecutarla sin cambiar el secreto.
-- ============================================================================

create table if not exists public.panel_config (
  key   text primary key,
  value text not null
);

comment on table public.panel_config is
  'Configuración privada del panel. RLS activo y sin políticas: solo service_role y panel_authorized() pueden leerla.';

alter table public.panel_config enable row level security;
revoke all on table public.panel_config from anon, authenticated;
grant all on table public.panel_config to service_role;

-- Secreto de 64 caracteres hexadecimales. `on conflict do nothing` conserva el
-- secreto si la migración se ejecuta de nuevo.
insert into public.panel_config (key, value)
values (
  'panel_key',
  replace(gen_random_uuid()::text, '-', '') ||
  replace(gen_random_uuid()::text, '-', '')
)
on conflict (key) do nothing;

create or replace function public.panel_authorized()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (current_setting('request.headers', true)::json ->> 'x-panel-key') =
      (select value from public.panel_config where key = 'panel_key'),
    false
  );
$$;

comment on function public.panel_authorized() is
  'Devuelve true solo si el header x-panel-key coincide con el secreto del panel.';

revoke all on function public.panel_authorized() from public;
grant execute on function public.panel_authorized() to anon, authenticated, service_role;

-- Elimina políticas antiguas que dejaban entrar a anon sin restricción.
do $$
declare
  p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('clientes', 'pedidos')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end;
$$;

alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;

create policy clientes_panel_all
  on public.clientes
  for all
  to anon
  using (public.panel_authorized())
  with check (public.panel_authorized());

create policy pedidos_panel_all
  on public.pedidos
  for all
  to anon
  using (public.panel_authorized())
  with check (public.panel_authorized());

-- service_role conserva acceso total (scripts locales).
grant select, insert, update, delete on table public.clientes to service_role;
grant select, insert, update, delete on table public.pedidos to service_role;

notify pgrst, 'reload schema';

do $$
begin
  raise notice 'OK · clientes/pedidos protegidos. Usa x-panel-key en el panel y PANEL_KEY en el CLI.';
end;
$$;
