-- Permisos por grupo en el tablero.
-- Cada usuario tiene uno o más grupos: direccion, agricultura, ganaderia, compras.
-- direccion ve todo. Un usuario sin fila en usuarios_tablero no ve nada.
-- Lo deciden las políticas de la base (RLS), no solo el menú.

create table if not exists public.usuarios_tablero (
  email text primary key,
  nombre text not null,
  grupos text[] not null default '{}',
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  constraint usuarios_tablero_grupos_validos
    check (grupos <@ array['direccion', 'agricultura', 'ganaderia', 'compras']::text[])
);

comment on table public.usuarios_tablero is
  'Quién entra al tablero y qué grupos ve. direccion = todo; agricultura = Seal TEAM; ganaderia = Ganado floresta; compras = Pedidos de Compras y servicios.';

create or replace function public.mis_grupos()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.grupos from public.usuarios_tablero u
      where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and u.activo),
    '{}'::text[]
  );
$$;

-- true si el usuario es de direccion o de alguno de los grupos pedidos.
create or replace function public.tablero_puede(variadic grupos text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select 'direccion' = any(public.mis_grupos()) or public.mis_grupos() && grupos;
$$;

-- Pendientes que solo ve direccion: contratos, sueldos, personal y pagos de honorarios.
create or replace function public.pendiente_privado(tipo text)
returns boolean
language sql
immutable
as $$
  select coalesce(tipo, '') ~* '(personal|sueldo|contrat)' or coalesce(tipo, '') ~* '^\s*pago\s*$';
$$;

revoke all on function public.mis_grupos() from public, anon;
revoke all on function public.tablero_puede(text[]) from public, anon;
grant execute on function public.mis_grupos() to authenticated;
grant execute on function public.tablero_puede(text[]) to authenticated;
grant execute on function public.pendiente_privado(text) to authenticated;

alter table public.usuarios_tablero enable row level security;
revoke all on table public.usuarios_tablero from public, anon, authenticated;
grant select on table public.usuarios_tablero to authenticated;
drop policy if exists usuarios_tablero_select on public.usuarios_tablero;
create policy usuarios_tablero_select on public.usuarios_tablero for select to authenticated
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')) or public.tablero_puede('direccion'));

insert into public.usuarios_tablero (email, nombre, grupos, notas) values
  ('direccion1@example.com', 'Martín', array['direccion'], null),
  ('direccion2@example.com', 'Martín', array['direccion'], null),
  ('admin1@example.com', 'Jorge', array['direccion'], null),
  ('admin2@example.com', 'Jorge', array['direccion'], 'Correo personal de Jorge'),
  ('dev@example.com', 'José de las Carreras', array['direccion'], 'Desarrollador del tablero. Queda como antes hasta que Martín decida.'),
  ('agronomo@example.com', 'Agrónomo asesor', array['agricultura', 'ganaderia'], 'Agrónomo asesor. Mismos permisos que Joaquín (Martín, 19-nov-2026).')
on conflict (email) do nothing;

-- Reemplaza la política "todo autenticado ve todo" de cada tabla por una por grupo.
do $$
declare
  regla record;
begin
  for regla in
    select * from (values
      -- Solo direccion
      ('contactos', 'public.tablero_puede(''direccion'')'),
      ('hacienda_costos_ref', 'public.tablero_puede(''direccion'')'),
      ('hacienda_ventas', 'public.tablero_puede(''direccion'')'),
      ('hacienda_ventas_detalle', 'public.tablero_puede(''direccion'')'),
      -- Agricultura (Seal TEAM)
      ('labores', 'public.tablero_puede(''agricultura'')'),
      ('insumos', 'public.tablero_puede(''agricultura'')'),
      ('inspecciones', 'public.tablero_puede(''agricultura'')'),
      ('cosecha', 'public.tablero_puede(''agricultura'')'),
      ('parte_diario', 'public.tablero_puede(''agricultura'')'),
      ('suelo', 'public.tablero_puede(''agricultura'')'),
      ('tipos_labor', 'public.tablero_puede(''agricultura'')'),
      ('reporte_libre', 'public.tablero_puede(''agricultura'')'),
      ('combustible', 'public.tablero_puede(''agricultura'')'),
      -- Campo en general: agricultura y ganaderia
      ('lotes', 'public.tablero_puede(''agricultura'', ''ganaderia'')'),
      ('lluvias', 'public.tablero_puede(''agricultura'', ''ganaderia'')'),
      ('equipos', 'public.tablero_puede(''agricultura'', ''ganaderia'')'),
      ('listas', 'public.tablero_puede(''agricultura'', ''ganaderia'', ''compras'')'),
      ('incidencias', 'public.tablero_puede(''agricultura'', ''ganaderia'')'),
      -- Ganaderia (Ganado floresta). Joaquín también está en este grupo.
      ('hacienda_calendario_sanitario', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_entore', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_iatf', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_muertes', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_nacimientos', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_pendientes', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_pesadas', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_potreros', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_tacto', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_tatuajes', 'public.tablero_puede(''ganaderia'')'),
      ('hacienda_toros', 'public.tablero_puede(''ganaderia'')'),
      -- Compras: insumos y reparaciones. Jimmy ve los pedidos de ganadería y maquinaria.
      ('productos', 'public.tablero_puede(''agricultura'', ''ganaderia'', ''compras'')'),
      ('stock', 'public.tablero_puede(''agricultura'', ''ganaderia'', ''compras'')'),
      ('pedidos', 'public.tablero_puede(''agricultura'', ''compras'') or (public.tablero_puede(''ganaderia'') and coalesce(area, '''') ~* ''(ganad|hacienda|maquin|repar)'')'),
      ('pedido_items', 'exists (select 1 from public.pedidos p where p.id_pedido = pedido_items.id_pedido)'),
      ('recepciones', 'exists (select 1 from public.pedidos p where p.id_pedido = recepciones.id_pedido)'),
      -- Pendientes: los de Contactos (PEN-2, PEN-3) son pedidos de Martín a Jorge: solo direccion.
      ('pendientes', 'public.tablero_puede(''direccion'') or (id_pendiente !~* ''^PEN-[23]-'' and not public.pendiente_privado(tipo) and (public.tablero_puede(''agricultura'') and coalesce(area, '''') ~* ''(agricult|maquin)'' or public.tablero_puede(''ganaderia'') and coalesce(area, '''') ~* ''(ganad|hacienda)'' or public.tablero_puede(''compras'') and coalesce(tipo, '''') ~* ''compra''))'),
      -- Comentarios: se ven si se ve el pendiente.
      ('pendiente_comentarios', 'exists (select 1 from public.pendientes p where p.id_pendiente = pendiente_comentarios.id_pendiente) or exists (select 1 from public.hacienda_pendientes h where h.id_pendiente = pendiente_comentarios.id_pendiente)')
    ) as r(tabla, condicion)
  loop
    if to_regclass('public.' || regla.tabla) is null then
      raise notice 'No existe la tabla %, se salta', regla.tabla;
      continue;
    end if;
    execute format('drop policy if exists %I on public.%I', regla.tabla || '_authenticated_select', regla.tabla);
    execute format('drop policy if exists %I on public.%I', regla.tabla || '_por_grupo', regla.tabla);
    execute format('create policy %I on public.%I for select to authenticated using (%s)',
      regla.tabla || '_por_grupo', regla.tabla, regla.condicion);
  end loop;
end $$;
