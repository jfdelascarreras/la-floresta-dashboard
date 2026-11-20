/** Column names match public tables in supabase/migrations/0001_initial_sheets_import.sql. */

export type DataSource = "seed" | "supabase";

type Audit = {
  created_at?: string;
  updated_at?: string;
  synced_at?: string | null;
};

export type Lote = Audit & {
  id_lote: string;
  nombre_lote: string | null;
  superficie_ha: number | null;
  cultivo_actual: string | null;
  campana: string | null;
  ubicacion: string | null;
  observaciones: string | null;
  activo: boolean | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Producto = Audit & {
  id_producto: string;
  nombre: string | null;
  tipo: string | null;
  principio_activo: string | null;
  unidad: string | null;
  cultivo: string | null;
  observaciones: string | null;
  activo: boolean | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Lista = Audit & {
  id_lista: string;
  tipo_lista: string | null;
  valor: string | null;
  activo: boolean | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type TipoLabor = Audit & {
  id_tipo_labor: string;
  nombre: string | null;
  requiere_tractor: boolean | null;
  tipo_implemento: string | null;
  unidad: string | null;
  observaciones: string | null;
};

export type Equipo = Audit & {
  id_equipo: string;
  nombre: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  horometro: number | null;
  costo_hora_bs: number | null;
  activo: boolean | null;
  foto: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Pedido = Audit & {
  id_pedido: string;
  numero: string | null;
  fecha: string | null;
  solicitante: string | null;
  area: string | null;
  equipo_motivo: string | null;
  urgencia: string | null;
  estado: string | null;
  foto: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type PedidoItem = Audit & {
  id_item: string;
  id_pedido: string | null;
  descripcion: string | null;
  cantidad: number | null;
  unidad: string | null;
  estado: string | null;
  fecha_recibido: string | null;
  proveedor: string | null;
  foto: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type ParteDiario = Audit & {
  id_parte: string;
  fecha: string | null;
  responsable: string | null;
  personal_presente: string | null;
  resumen: string | null;
  clima: string | null;
  foto: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Labor = Audit & {
  id_labor: string;
  fecha: string | null;
  id_lote: string | null;
  tipo_labor: string | null;
  hectareas: number | null;
  maquina: string | null;
  operario: string | null;
  observaciones: string | null;
  foto: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
  tractor: string | null;
  implemento: string | null;
  horas: number | null;
  litros_gasoil: number | null;
  estado: string | null;
  id_parte: string | null;
};

export type Insumo = Audit & {
  id_insumo_aplicado: string;
  fecha: string | null;
  id_lote: string | null;
  id_labor: string | null;
  producto: string | null;
  dosis: string | null;
  unidad: string | null;
  cantidad_total: number | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Inspeccion = Audit & {
  id_inspeccion: string;
  fecha: string | null;
  id_lote: string | null;
  estado_cultivo: string | null;
  plaga_enfermedad: string | null;
  severidad: string | null;
  foto: string | null;
  ubicacion: string | null;
  accion_recomendada: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
  estado_fenologico: string | null;
  tipo_inspeccion: string | null;
};

export type Cosecha = Audit & {
  id_cosecha: string;
  fecha: string | null;
  id_lote: string | null;
  hectareas_cosechadas: number | null;
  kg_totales: number | null;
  humedad_pct: number | null;
  destino: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
  patente_camion: string | null;
  toneladas_viaje: number | null;
  foto_boleta: string | null;
};

export type Lluvia = Audit & {
  id_lluvia: string;
  fecha: string | null;
  id_lote: string | null;
  milimetros: number | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
  foto: string | null;
  pluviometro: string | null;
  acumulado_mes: number | null;
};

export type Pendiente = Audit & {
  id_pendiente: string;
  fecha: string | null;
  area: string | null;
  tipo: string | null;
  tarea: string | null;
  responsable: string | null;
  pedido_por: string | null;
  urgencia: string | null;
  fecha_limite: string | null;
  estado: string | null;
  fecha_hecho: string | null;
  id_pedido: string | null;
  foto: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
  cerrado_por?: string | null;
  cambio_web_at?: string | null;
  verificado_por?: string | null;
  fecha_verificado?: string | null;
  fuente?: string | null;
};

export type Incidencia = Audit & {
  id_incidencia: string;
  fecha: string | null;
  id_equipo: string | null;
  tipo: string | null;
  descripcion: string | null;
  id_lote: string | null;
  urgencia: string | null;
  estado: string | null;
  reparado_por: string | null;
  costo_bs: number | null;
  id_pedido: string | null;
  foto: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Recepcion = Audit & {
  id_recepcion: string;
  fecha: string | null;
  id_producto: string | null;
  descripcion: string | null;
  cantidad: number | null;
  unidad: string | null;
  precio_unit_bs: number | null;
  proveedor: string | null;
  remito: string | null;
  destino: string | null;
  id_pedido: string | null;
  foto_remito: string | null;
  foto_etiqueta: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Combustible = Audit & {
  id_combustible: string;
  fecha: string | null;
  tipo: string | null;
  id_equipo: string | null;
  litros: number | null;
  saldo_tanque_lts: number | null;
  destino: string | null;
  patente: string | null;
  horometro: number | null;
  foto: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type ReporteLibre = Audit & {
  id_reporte: string;
  fecha: string | null;
  area: string | null;
  id_lote: string | null;
  texto: string | null;
  foto: string | null;
  audio: string | null;
  ubicacion: string | null;
  revisado: boolean | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Stock = Audit & {
  id_stock: string;
  tipo: string | null;
  nombre_comercial: string | null;
  principio_activo: string | null;
  unidad: string | null;
  saldo: number | null;
  vencimiento: string | null;
  asignado_a: string | null;
  observaciones: string | null;
  fecha_inventario: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type Suelo = Audit & {
  id_suelo: string;
  muestra: string | null;
  n_lab: string | null;
  lotes: string | null;
  ids_lotes: string | null;
  fecha_analisis: string | null;
  ph_cacl2: number | null;
  ph_h2o: number | null;
  mo_pct: number | null;
  n_disp_mg_kg: number | null;
  k_mg_dm3: number | null;
  ca_cmolc: number | null;
  mg_cmolc: number | null;
  p_resina_mg_dm3: number | null;
  al_cmolc: number | null;
  cice_cmolc: number | null;
  sat_bases_pct: number | null;
  s_mg_dm3: number | null;
  sat_al_pct: number | null;
  textura: string | null;
  observaciones: string | null;
  cargado_por: string | null;
  fecha_carga: string | null;
};

export type HaciendaTacto = Audit & {
  id_tacto: string;
  fecha: string | null;
  grupo: string | null;
  caravana: string | null;
  resultado: string | null;
  meses_prenez: number | null;
  parto_estimado: string | null;
  lectura_dudosa: boolean | null;
  fuente: string | null;
  nota: string | null;
};

export type HaciendaPesada = Audit & {
  id_pesada: string;
  fecha: string | null;
  categoria: string | null;
  caravana: string | null;
  peso_kg: number | null;
  nacimiento_segun_caravana: string | null;
  fuente: string | null;
  nota: string | null;
};

export type HaciendaVenta = Audit & {
  id_venta: string;
  fecha: string | null;
  categoria: string | null;
  tropa_origen: string | null;
  comprador: string | null;
  cabezas: number | null;
  kilos_totales: number | null;
  kg_promedio: number | null;
  precio_bs_kg: number | null;
  total_bs: number | null;
  tc_bcb: number | null;
  total_usd: number | null;
  valor_flujo_usd: number | null;
  guia_senasag: string | null;
  comprobante: string | null;
  fecha_cobro: string | null;
  ficha_completa: boolean | null;
  notas: string | null;
};

export type HaciendaCalendario = Audit & {
  id_cal: string;
  mes: string | null;
  categoria: string | null;
  actividad: string | null;
  fuente: string | null;
  fecha_aviso: string | null;
  hecho: boolean | null;
  fecha_hecho: string | null;
  animales_tratados: string | null;
  producto_lote: string | null;
  notas: string | null;
};

export type HaciendaIatf = Audit & {
  id_iatf: string;
  fecha_iatf: string | null;
  grupo: string | null;
  nro_lista: number | null;
  caravana: string | null;
  toro: string | null;
  nota_lista: string | null;
  resultado_tacto: string | null;
  comentario: string | null;
};

export type HaciendaEntore = Audit & {
  id_entore: string;
  grupo: string | null;
  vacas_vaquillas: number | null;
  toros: number | null;
  vacas_por_toro: number | null;
  entrada_toros: string | null;
  nota: string | null;
};

export type HaciendaPotrero = Audit & {
  id_potrero: string;
  potrero: string | null;
  campo: string | null;
  sector: string | null;
  ha_texto: string | null;
  divisiones: string | null;
  tropa_ultimo_dato: string | null;
  pastura: string | null;
  estado_pastura: string | null;
  maleza: string | null;
  alambrado_cerca: string | null;
  agua: string | null;
  ultimo_trabajo: string | null;
  plan_mantenimiento: string | null;
  recursos: string | null;
  prioridad: string | null;
  fuente_notas: string | null;
  ha_2015: string | null;
};

export type HaciendaNacimiento = Audit & {
  id_nacimientos: string;
  mes: string | null;
  nacidos: number | null;
  machos: number | null;
  hembras: number | null;
  brangus_criollo: number | null;
  nelore_brangus: number | null;
  brangus_puro: number | null;
  brangus_pardo: number | null;
  muertos: number | null;
  vivos: number | null;
  fuente: string | null;
};

export type HaciendaMuerte = Audit & {
  id_muerte: string;
  fecha: string | null;
  mes: string | null;
  caravana: string | null;
  categoria: string | null;
  sexo: string | null;
  madre: string | null;
  raza: string | null;
  tropa: string | null;
  causa: string | null;
  fuente: string | null;
};

export type HaciendaPendiente = Audit & {
  id_pendiente: string;
  codigo: string | null;
  tipo: string | null;
  fecha_pedido: string | null;
  pedido_por: string | null;
  responsable: string | null;
  item: string | null;
  cantidad: number | null;
  unidad: string | null;
  urgencia: string | null;
  estado: string | null;
  fecha_hecho: string | null;
  notas: string | null;
  fuente: string | null;
  cerrado_por?: string | null;
  cambio_web_at?: string | null;
  verificado_por?: string | null;
  fecha_verificado?: string | null;
};

export type FarmData = {
  source: DataSource;
  /** Fecha de corte en America/La_Paz (YYYY-MM-DD). */
  asOf: string;
  lotes: Lote[];
  productos: Producto[];
  listas: Lista[];
  tiposLabor: TipoLabor[];
  equipos: Equipo[];
  pedidos: Pedido[];
  pedidoItems: PedidoItem[];
  parteDiario: ParteDiario[];
  labores: Labor[];
  insumos: Insumo[];
  inspecciones: Inspeccion[];
  cosecha: Cosecha[];
  lluvias: Lluvia[];
  pendientes: Pendiente[];
  incidencias: Incidencia[];
  recepciones: Recepcion[];
  combustible: Combustible[];
  reportes: ReporteLibre[];
  stock: Stock[];
  suelo: Suelo[];
  tactos: HaciendaTacto[];
  pesadas: HaciendaPesada[];
  ventas: HaciendaVenta[];
  calendario: HaciendaCalendario[];
  iatf: HaciendaIatf[];
  entore: HaciendaEntore[];
  potreros: HaciendaPotrero[];
  nacimientos: HaciendaNacimiento[];
  muertes: HaciendaMuerte[];
  haciendaPendientes: HaciendaPendiente[];
};

/** Activity tables are sample-only in the bundled seed. Reference tables come from the sheet. */
