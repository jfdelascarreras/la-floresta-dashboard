// Carga cada hora los pendientes de Control Agrícola y Control Ganadero al tablero.
// Va en el mismo proyecto que sincronizarPendientes (Contactos) y usa sus propiedades.
//
// Agricultura  -> tabla pendientes,          id "PEN-" + código   (ej. PEN-PA12)
// Ganadería    -> tabla hacienda_pendientes, id "HPE-" + código   (ej. HPE-PL45)
// Son los mismos ids de la importación inicial, así se conservan las marcas de Hecho y Verificado.
//
// Regla de estado: una fila nueva entra con el estado de la planilla. En una fila que ya existe
// el estado no se pisa, salvo que la planilla diga Hecho y el tablero no: ahí se marca Hecho.

const PLANILLA_AGRICOLA = "TU_GOOGLE_SHEET_ID";
const PLANILLA_GANADERA = "TU_GOOGLE_SHEET_ID";

function sincronizarPlanillas() {
  const db = conexion();
  subirAgricola(db);
  subirGanadero(db);
}

function subirAgricola(db) {
  const filas = leerPendientes(PLANILLA_AGRICOLA).map(function (f) {
    return {
      id_pendiente: "PEN-" + f.codigo,
      tarea: f.tarea,
      fecha: f.fecha,
      area: "Agricultura",
      tipo: f.tipo,
      responsable: f.responsable,
      pedido_por: f.pedido_por,
      urgencia: f.urgencia,
      fecha_limite: f.fecha_limite,
      observaciones: f.notas,
      fuente: "Google Sheets",
      estado: f.estado,
      fecha_hecho: f.fecha_hecho,
    };
  });
  subir(db, "pendientes", filas);
}

function subirGanadero(db) {
  const filas = leerPendientes(PLANILLA_GANADERA).map(function (f) {
    return {
      id_pendiente: "HPE-" + f.codigo,
      codigo: f.codigo,
      tipo: f.tipo,
      fecha_pedido: f.fecha,
      pedido_por: f.pedido_por,
      responsable: f.responsable,
      item: f.tarea,
      cantidad: numero(f.cantidad),
      unidad: f.unidad,
      urgencia: f.urgencia,
      notas: f.notas,
      fuente: "Control Ganadero / Pendientes",
      estado: f.estado,
      fecha_hecho: f.fecha_hecho,
    };
  });
  subir(db, "hacienda_pendientes", filas);
}

// Separa en tandas con las mismas columnas: PostgREST rellena con null las que faltan.
function subir(db, tabla, filas) {
  const actuales = estados(db, tabla);
  const nuevas = [];
  const conocidas = [];
  const cerrar = [];
  filas.forEach(function (fila) {
    const actual = actuales[fila.id_pendiente];
    if (actual === undefined) {
      nuevas.push(fila);
      return;
    }
    const contenido = Object.assign({}, fila);
    delete contenido.estado;
    delete contenido.fecha_hecho;
    if (esHecho(fila.estado) && !esHecho(actual)) {
      contenido.estado = "Hecho";
      contenido.fecha_hecho = fila.fecha_hecho;
      cerrar.push(contenido);
    } else {
      conocidas.push(contenido);
    }
  });
  [nuevas, conocidas, cerrar].forEach(function (tanda) { upsert(db, tabla, tanda); });
  return { nuevas: nuevas.length, conocidas: conocidas.length, cerradas: cerrar.length };
}

function leerPendientes(planillaId) {
  const hoja = SpreadsheetApp.openById(planillaId).getSheetByName("Pendientes");
  if (!hoja) throw new Error("No encontré la pestaña Pendientes en " + planillaId);
  const valores = hoja.getDataRange().getValues();
  const enc = valores[0].map(normalizar);
  const col = {
    codigo: buscar(enc, "#"),
    marca: buscarMarca(enc),
    tipo: buscar(enc, "tipo"),
    fecha: buscar(enc, "fecha alta") ?? buscar(enc, "fecha pedido"),
    pedido_por: buscar(enc, "pedido por"),
    responsable: buscar(enc, "responsable"),
    tarea: buscar(enc, "tarea") ?? buscar(enc, "ítem") ?? buscar(enc, "item"),
    cantidad: buscar(enc, "cantidad"),
    unidad: buscar(enc, "unidad"),
    fecha_limite: buscar(enc, "fecha límite"),
    urgencia: buscar(enc, "urgencia"),
    estado: buscar(enc, "estado"),
    fecha_hecho: buscar(enc, "fecha hecho") ?? buscar(enc, "fecha recibido"),
    notas: buscar(enc, "notas"),
  };
  if (col.codigo == null || col.tarea == null) {
    throw new Error(hoja.getName() + ": faltan las columnas # o Tarea. Encabezados: " + enc.join(" | "));
  }
  const filas = [];
  for (let i = 1; i < valores.length; i++) {
    const linea = valores[i];
    const codigo = texto(linea[col.codigo]);
    const tarea = texto(linea[col.tarea]);
    if (!tarea || !/^[A-Za-z]+\d+$/.test(codigo)) continue;
    filas.push({
      codigo: codigo,
      tarea: tarea,
      tipo: valor(linea, col.tipo),
      fecha: valor(linea, col.fecha),
      pedido_por: valor(linea, col.pedido_por),
      responsable: valor(linea, col.responsable),
      cantidad: valor(linea, col.cantidad),
      unidad: valor(linea, col.unidad),
      fecha_limite: valor(linea, col.fecha_limite),
      urgencia: valor(linea, col.urgencia),
      notas: valor(linea, col.notas),
      estado: estadoDeFila(linea, col),
      fecha_hecho: valor(linea, col.fecha_hecho),
    });
  }
  return filas;
}

function estadoDeFila(linea, col) {
  const marca = col.marca == null ? "" : texto(linea[col.marca]);
  if (marca.indexOf("✅") !== -1 || marca.indexOf("✔") !== -1 || marca.indexOf("✓") !== -1) return "Hecho";
  const escrito = col.estado == null ? "" : texto(linea[col.estado]);
  return esHecho(escrito) ? "Hecho" : escrito || null;
}

// La columna cantidad es numérica en la base: lo que no es un número va vacío.
function numero(valorCelda) {
  if (valorCelda == null || valorCelda === "") return null;
  const n = Number(String(valorCelda).replace(",", "."));
  return isNaN(n) ? null : n;
}

function esHecho(estado) {
  const e = String(estado || "").trim().toLowerCase();
  return e === "hecho" || e === "cerrado" || e === "cerrada" || e === "recibido";
}

// ---- Limpieza única de los duplicados que dejó la carga manual del 19-nov ----

// Primero correr con simular = true (por defecto) y mirar el registro; después limpiarDuplicadosDeVerdad().
function limpiarDuplicados(simular) {
  if (simular === undefined) simular = true;
  const db = conexion();
  const pend = todas(db, "pendientes");
  const ids = {};
  pend.forEach(function (r) { ids[r.id_pendiente] = r; });

  const borrar = [];
  const marcas = [];
  pend.forEach(function (r) {
    const id = r.id_pendiente;
    if (/^PEN-AGR-/.test(id) || /^PEN-GAN-/.test(id) || /^PEN-3-Tanda/i.test(id)) {
      borrar.push(id);
      return;
    }
    // PEN-PG1..5 de la importación inicial: el pendiente general vivo es PEN-2-PGn.
    const pg = /^PEN-(PG\d+)$/.exec(id);
    if (pg && ids["PEN-2-" + pg[1]]) {
      const vivo = ids["PEN-2-" + pg[1]];
      if (esHecho(r.estado) && !esHecho(vivo.estado)) {
        marcas.push({
          id_pendiente: vivo.id_pendiente,
          estado: "Hecho",
          fecha_hecho: r.fecha_hecho,
          cerrado_por: r.cerrado_por,
          cambio_web_at: r.cambio_web_at,
          verificado_por: r.verificado_por || vivo.verificado_por,
          fecha_verificado: r.fecha_verificado || vivo.fecha_verificado,
        });
      }
      borrar.push(id);
    }
  });

  Logger.log("Se pasan marcas de Hecho a: " + marcas.map(function (m) { return m.id_pendiente; }).join(", "));
  Logger.log("Se borran " + borrar.length + ": " + borrar.join(", "));
  if (simular) return { marcas: marcas.length, borrar: borrar.length };

  marcas.forEach(function (m) {
    const id = m.id_pendiente;
    const cambios = Object.assign({}, m);
    delete cambios.id_pendiente;
    pedir(db, "patch", "pendientes?id_pendiente=eq." + encodeURIComponent(id), cambios);
  });
  for (let i = 0; i < borrar.length; i += 50) {
    const lote = borrar.slice(i, i + 50).map(function (id) { return '"' + id.replace(/"/g, '\\"') + '"'; });
    pedir(db, "delete", "pendientes?id_pendiente=in.(" + encodeURIComponent(lote.join(",")) + ")");
  }
  return { marcas: marcas.length, borrar: borrar.length };
}

function limpiarDuplicadosDeVerdad() {
  return limpiarDuplicados(false);
}

// ---- Acceso a Supabase ----

function conexion() {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty("SUPABASE_URL") || "").replace(/\/$/, "");
  const key = props.getProperty("SUPABASE_SERVICE_ROLE");
  if (!url || !key) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE.");
  return { url: url, key: key };
}

function pedir(db, metodo, ruta, cuerpo, extra) {
  const opciones = {
    method: metodo,
    contentType: "application/json",
    headers: Object.assign({ apikey: db.key, Authorization: "Bearer " + db.key, Prefer: "return=minimal" }, extra || {}),
    muteHttpExceptions: true,
  };
  if (cuerpo !== undefined) opciones.payload = JSON.stringify(cuerpo);
  const respuesta = UrlFetchApp.fetch(db.url + "/rest/v1/" + ruta, opciones);
  if (respuesta.getResponseCode() >= 300) throw new Error(ruta + ": " + respuesta.getContentText());
  return respuesta.getContentText();
}

function upsert(db, tabla, filas) {
  for (let i = 0; i < filas.length; i += 200) {
    const lote = filas.slice(i, i + 200);
    if (lote.length === 0) continue;
    pedir(db, "post", tabla + "?on_conflict=id_pendiente", lote, {
      Prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
}

function todas(db, tabla) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const lote = JSON.parse(pedir(db, "get", tabla + "?select=*", undefined, {
      Range: desde + "-" + (desde + 999),
      Prefer: "count=none",
    }));
    Array.prototype.push.apply(filas, lote);
    if (lote.length < 1000) break;
  }
  return filas;
}

function estados(db, tabla) {
  const out = {};
  todas(db, tabla).forEach(function (r) { out[r.id_pendiente] = r.estado || null; });
  return out;
}
