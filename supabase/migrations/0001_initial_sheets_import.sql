-- La Floresta — initial schema imported from Google Sheet
-- 'La Floresta - Agro' (TU_GOOGLE_SHEET_ID)
-- Migration: initial_sheets_import
-- Source of truth remains the Sheet; text primary keys match AppSheet IDs.
-- fecha_carga is stored as timestamptz at midnight America/Buenos_Aires.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- Source tab: Lotes
create table public.lotes (
  id_lote text primary key,
  nombre_lote text,
  superficie_ha numeric,
  cultivo_actual text,
  campana text,
  ubicacion text,
  observaciones text,
  activo boolean,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger lotes_set_updated_at before update on public.lotes for each row execute function public.set_updated_at();
comment on table public.lotes is 'Imported from Google Sheet tab Lotes.';

-- Source tab: Productos
create table public.productos (
  id_producto text primary key,
  nombre text,
  tipo text,
  principio_activo text,
  unidad text,
  cultivo text,
  observaciones text,
  activo boolean,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger productos_set_updated_at before update on public.productos for each row execute function public.set_updated_at();
comment on table public.productos is 'Imported from Google Sheet tab Productos.';

-- Source tab: Listas
create table public.listas (
  id_lista text primary key,
  tipo_lista text,
  valor text,
  activo boolean,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger listas_set_updated_at before update on public.listas for each row execute function public.set_updated_at();
comment on table public.listas is 'Imported from Google Sheet tab Listas.';

-- Source tab: Tipos_labor
create table public.tipos_labor (
  id_tipo_labor text primary key,
  nombre text,
  requiere_tractor boolean,
  tipo_implemento text,
  unidad text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger tipos_labor_set_updated_at before update on public.tipos_labor for each row execute function public.set_updated_at();
comment on table public.tipos_labor is 'Imported from Google Sheet tab Tipos_labor.';

-- Source tab: Equipos
create table public.equipos (
  id_equipo text primary key,
  nombre text,
  tipo text,
  marca text,
  modelo text,
  anio integer,
  horometro numeric,
  costo_hora_bs numeric,
  activo boolean,
  foto text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger equipos_set_updated_at before update on public.equipos for each row execute function public.set_updated_at();
comment on table public.equipos is 'Imported from Google Sheet tab Equipos.';

-- Source tab: Pedidos
create table public.pedidos (
  id_pedido text primary key,
  numero text,
  fecha date,
  solicitante text,
  area text,
  equipo_motivo text,
  urgencia text,
  estado text,
  foto text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger pedidos_set_updated_at before update on public.pedidos for each row execute function public.set_updated_at();
comment on table public.pedidos is 'Imported from Google Sheet tab Pedidos.';

-- Source tab: Parte_diario
create table public.parte_diario (
  id_parte text primary key,
  fecha date,
  responsable text,
  personal_presente text,
  resumen text,
  clima text,
  foto text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger parte_diario_set_updated_at before update on public.parte_diario for each row execute function public.set_updated_at();
comment on table public.parte_diario is 'Imported from Google Sheet tab Parte_diario.';

-- Source tab: Labores
create table public.labores (
  id_labor text primary key,
  fecha date,
  id_lote text,
  tipo_labor text,
  hectareas numeric,
  maquina text,
  operario text,
  observaciones text,
  foto text,
  cargado_por text,
  fecha_carga timestamptz,
  tractor text,
  implemento text,
  horas numeric,
  litros_gasoil numeric,
  estado text,
  id_parte text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger labores_set_updated_at before update on public.labores for each row execute function public.set_updated_at();
comment on table public.labores is 'Imported from Google Sheet tab Labores.';

-- Source tab: Insumos
create table public.insumos (
  id_insumo_aplicado text primary key,
  fecha date,
  id_lote text,
  id_labor text,
  producto text,
  dosis text,
  unidad text,
  cantidad_total numeric,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger insumos_set_updated_at before update on public.insumos for each row execute function public.set_updated_at();
comment on table public.insumos is 'Imported from Google Sheet tab Insumos.';

-- Source tab: Inspecciones
create table public.inspecciones (
  id_inspeccion text primary key,
  fecha date,
  id_lote text,
  estado_cultivo text,
  plaga_enfermedad text,
  severidad text,
  foto text,
  ubicacion text,
  accion_recomendada text,
  cargado_por text,
  fecha_carga timestamptz,
  estado_fenologico text,
  tipo_inspeccion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger inspecciones_set_updated_at before update on public.inspecciones for each row execute function public.set_updated_at();
comment on table public.inspecciones is 'Imported from Google Sheet tab Inspecciones.';

-- Source tab: Cosecha
create table public.cosecha (
  id_cosecha text primary key,
  fecha date,
  id_lote text,
  hectareas_cosechadas numeric,
  kg_totales numeric,
  humedad_pct numeric,
  destino text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  patente_camion text,
  toneladas_viaje numeric,
  foto_boleta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger cosecha_set_updated_at before update on public.cosecha for each row execute function public.set_updated_at();
comment on table public.cosecha is 'Imported from Google Sheet tab Cosecha.';

-- Source tab: Lluvias
create table public.lluvias (
  id_lluvia text primary key,
  fecha date,
  id_lote text,
  milimetros numeric,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  foto text,
  pluviometro text,
  acumulado_mes numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger lluvias_set_updated_at before update on public.lluvias for each row execute function public.set_updated_at();
comment on table public.lluvias is 'Imported from Google Sheet tab Lluvias.';

-- Source tab: Pendientes
create table public.pendientes (
  id_pendiente text primary key,
  fecha date,
  area text,
  tipo text,
  tarea text,
  responsable text,
  pedido_por text,
  urgencia text,
  fecha_limite date,
  estado text,
  fecha_hecho date,
  id_pedido text,
  foto text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger pendientes_set_updated_at before update on public.pendientes for each row execute function public.set_updated_at();
comment on table public.pendientes is 'Imported from Google Sheet tab Pendientes.';

-- Source tab: Pedido_items
create table public.pedido_items (
  id_item text primary key,
  id_pedido text,
  descripcion text,
  cantidad numeric,
  unidad text,
  estado text,
  fecha_recibido date,
  proveedor text,
  foto text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger pedido_items_set_updated_at before update on public.pedido_items for each row execute function public.set_updated_at();
comment on table public.pedido_items is 'Imported from Google Sheet tab Pedido_items.';

-- Source tab: Incidencias
create table public.incidencias (
  id_incidencia text primary key,
  fecha date,
  id_equipo text,
  tipo text,
  descripcion text,
  id_lote text,
  urgencia text,
  estado text,
  reparado_por text,
  costo_bs numeric,
  id_pedido text,
  foto text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger incidencias_set_updated_at before update on public.incidencias for each row execute function public.set_updated_at();
comment on table public.incidencias is 'Imported from Google Sheet tab Incidencias.';

-- Source tab: Recepciones
create table public.recepciones (
  id_recepcion text primary key,
  fecha date,
  id_producto text,
  descripcion text,
  cantidad numeric,
  unidad text,
  precio_unit_bs numeric,
  proveedor text,
  remito text,
  destino text,
  id_pedido text,
  foto_remito text,
  foto_etiqueta text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger recepciones_set_updated_at before update on public.recepciones for each row execute function public.set_updated_at();
comment on table public.recepciones is 'Imported from Google Sheet tab Recepciones.';

-- Source tab: Combustible
create table public.combustible (
  id_combustible text primary key,
  fecha date,
  tipo text,
  id_equipo text,
  litros numeric,
  saldo_tanque_lts numeric,
  destino text,
  patente text,
  horometro numeric,
  foto text,
  observaciones text,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger combustible_set_updated_at before update on public.combustible for each row execute function public.set_updated_at();
comment on table public.combustible is 'Imported from Google Sheet tab Combustible.';

-- Source tab: Reporte_libre
create table public.reporte_libre (
  id_reporte text primary key,
  fecha date,
  area text,
  id_lote text,
  texto text,
  foto text,
  audio text,
  ubicacion text,
  revisado boolean,
  cargado_por text,
  fecha_carga timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  synced_at timestamptz
);

create trigger reporte_libre_set_updated_at before update on public.reporte_libre for each row execute function public.set_updated_at();
comment on table public.reporte_libre is 'Imported from Google Sheet tab Reporte_libre.';

-- Foreign keys (only where current data cannot violate them;
-- child operational tables are empty in this first import).
alter table public.lluvias add constraint lluvias_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index lluvias_id_lote_idx on public.lluvias (id_lote);
alter table public.labores add constraint labores_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index labores_id_lote_idx on public.labores (id_lote);
alter table public.labores add constraint labores_id_parte_fkey foreign key (id_parte) references public.parte_diario(id_parte) on update cascade on delete restrict;
create index labores_id_parte_idx on public.labores (id_parte);
alter table public.insumos add constraint insumos_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index insumos_id_lote_idx on public.insumos (id_lote);
alter table public.insumos add constraint insumos_id_labor_fkey foreign key (id_labor) references public.labores(id_labor) on update cascade on delete restrict;
create index insumos_id_labor_idx on public.insumos (id_labor);
alter table public.inspecciones add constraint inspecciones_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index inspecciones_id_lote_idx on public.inspecciones (id_lote);
alter table public.cosecha add constraint cosecha_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index cosecha_id_lote_idx on public.cosecha (id_lote);
alter table public.pendientes add constraint pendientes_id_pedido_fkey foreign key (id_pedido) references public.pedidos(id_pedido) on update cascade on delete restrict;
create index pendientes_id_pedido_idx on public.pendientes (id_pedido);
alter table public.pedido_items add constraint pedido_items_id_pedido_fkey foreign key (id_pedido) references public.pedidos(id_pedido) on update cascade on delete restrict;
create index pedido_items_id_pedido_idx on public.pedido_items (id_pedido);
alter table public.incidencias add constraint incidencias_id_equipo_fkey foreign key (id_equipo) references public.equipos(id_equipo) on update cascade on delete restrict;
create index incidencias_id_equipo_idx on public.incidencias (id_equipo);
alter table public.incidencias add constraint incidencias_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index incidencias_id_lote_idx on public.incidencias (id_lote);
alter table public.incidencias add constraint incidencias_id_pedido_fkey foreign key (id_pedido) references public.pedidos(id_pedido) on update cascade on delete restrict;
create index incidencias_id_pedido_idx on public.incidencias (id_pedido);
alter table public.recepciones add constraint recepciones_id_producto_fkey foreign key (id_producto) references public.productos(id_producto) on update cascade on delete restrict;
create index recepciones_id_producto_idx on public.recepciones (id_producto);
alter table public.recepciones add constraint recepciones_id_pedido_fkey foreign key (id_pedido) references public.pedidos(id_pedido) on update cascade on delete restrict;
create index recepciones_id_pedido_idx on public.recepciones (id_pedido);
alter table public.combustible add constraint combustible_id_equipo_fkey foreign key (id_equipo) references public.equipos(id_equipo) on update cascade on delete restrict;
create index combustible_id_equipo_idx on public.combustible (id_equipo);
alter table public.reporte_libre add constraint reporte_libre_id_lote_fkey foreign key (id_lote) references public.lotes(id_lote) on update cascade on delete restrict;
create index reporte_libre_id_lote_idx on public.reporte_libre (id_lote);

-- Helpful lookup indexes
create index listas_tipo_lista_idx on public.listas (tipo_lista);
create index lotes_campana_idx on public.lotes (campana);
create index productos_tipo_idx on public.productos (tipo);

-- Row Level Security: authenticated can read; no anon access; no writes.
alter table public.lotes enable row level security;
revoke all on table public.lotes from public, anon, authenticated;
grant select on table public.lotes to authenticated;
create policy lotes_authenticated_select on public.lotes for select to authenticated using (true);

alter table public.productos enable row level security;
revoke all on table public.productos from public, anon, authenticated;
grant select on table public.productos to authenticated;
create policy productos_authenticated_select on public.productos for select to authenticated using (true);

alter table public.listas enable row level security;
revoke all on table public.listas from public, anon, authenticated;
grant select on table public.listas to authenticated;
create policy listas_authenticated_select on public.listas for select to authenticated using (true);

alter table public.tipos_labor enable row level security;
revoke all on table public.tipos_labor from public, anon, authenticated;
grant select on table public.tipos_labor to authenticated;
create policy tipos_labor_authenticated_select on public.tipos_labor for select to authenticated using (true);

alter table public.equipos enable row level security;
revoke all on table public.equipos from public, anon, authenticated;
grant select on table public.equipos to authenticated;
create policy equipos_authenticated_select on public.equipos for select to authenticated using (true);

alter table public.pedidos enable row level security;
revoke all on table public.pedidos from public, anon, authenticated;
grant select on table public.pedidos to authenticated;
create policy pedidos_authenticated_select on public.pedidos for select to authenticated using (true);

alter table public.parte_diario enable row level security;
revoke all on table public.parte_diario from public, anon, authenticated;
grant select on table public.parte_diario to authenticated;
create policy parte_diario_authenticated_select on public.parte_diario for select to authenticated using (true);

alter table public.labores enable row level security;
revoke all on table public.labores from public, anon, authenticated;
grant select on table public.labores to authenticated;
create policy labores_authenticated_select on public.labores for select to authenticated using (true);

alter table public.insumos enable row level security;
revoke all on table public.insumos from public, anon, authenticated;
grant select on table public.insumos to authenticated;
create policy insumos_authenticated_select on public.insumos for select to authenticated using (true);

alter table public.inspecciones enable row level security;
revoke all on table public.inspecciones from public, anon, authenticated;
grant select on table public.inspecciones to authenticated;
create policy inspecciones_authenticated_select on public.inspecciones for select to authenticated using (true);

alter table public.cosecha enable row level security;
revoke all on table public.cosecha from public, anon, authenticated;
grant select on table public.cosecha to authenticated;
create policy cosecha_authenticated_select on public.cosecha for select to authenticated using (true);

alter table public.lluvias enable row level security;
revoke all on table public.lluvias from public, anon, authenticated;
grant select on table public.lluvias to authenticated;
create policy lluvias_authenticated_select on public.lluvias for select to authenticated using (true);

alter table public.pendientes enable row level security;
revoke all on table public.pendientes from public, anon, authenticated;
grant select on table public.pendientes to authenticated;
create policy pendientes_authenticated_select on public.pendientes for select to authenticated using (true);

alter table public.pedido_items enable row level security;
revoke all on table public.pedido_items from public, anon, authenticated;
grant select on table public.pedido_items to authenticated;
create policy pedido_items_authenticated_select on public.pedido_items for select to authenticated using (true);

alter table public.incidencias enable row level security;
revoke all on table public.incidencias from public, anon, authenticated;
grant select on table public.incidencias to authenticated;
create policy incidencias_authenticated_select on public.incidencias for select to authenticated using (true);

alter table public.recepciones enable row level security;
revoke all on table public.recepciones from public, anon, authenticated;
grant select on table public.recepciones to authenticated;
create policy recepciones_authenticated_select on public.recepciones for select to authenticated using (true);

alter table public.combustible enable row level security;
revoke all on table public.combustible from public, anon, authenticated;
grant select on table public.combustible to authenticated;
create policy combustible_authenticated_select on public.combustible for select to authenticated using (true);

alter table public.reporte_libre enable row level security;
revoke all on table public.reporte_libre from public, anon, authenticated;
grant select on table public.reporte_libre to authenticated;
create policy reporte_libre_authenticated_select on public.reporte_libre for select to authenticated using (true);

